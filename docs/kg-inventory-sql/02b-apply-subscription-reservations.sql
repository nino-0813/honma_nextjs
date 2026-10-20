-- ローカル検証版。本番適用は保留。締切年・玄米基準の初期値・既存注文との照合・本番スキーマを確認するまで適用 SQL は実行しない
-- LOCAL REVIEW CANDIDATE. Apply after migration_add_kg_inventory.sql only after approval.
-- No harvest deadline, old balance conversion, or customer data backfill is supplied.
BEGIN;
ALTER TABLE kg_item_snapshots ADD COLUMN accounting_version integer NOT NULL DEFAULT 1;
ALTER TABLE kg_movements ADD COLUMN accounting_version integer NOT NULL DEFAULT 1;
ALTER TABLE kg_movements ALTER COLUMN incoming_kg TYPE numeric(18,6), ALTER COLUMN used_kg TYPE numeric(18,6), ALTER COLUMN held_kg TYPE numeric(18,6);
CREATE TABLE kg_harvest_rules (
 season_id uuid REFERENCES inventory_seasons(id), variety_key text CHECK(variety_key IN ('koshihikari','nikomaru','kamenoo')),
 end_month date NOT NULL CHECK(extract(day FROM end_month)=1), reason text NOT NULL CHECK(length(trim(reason))>0), PRIMARY KEY(season_id,variety_key)
);
CREATE TABLE kg_raw_baselines (
 season_id uuid REFERENCES inventory_seasons(id), variety_key text CHECK(variety_key IN ('koshihikari','nikomaru','kamenoo')),
 incoming_kg numeric(18,6) NOT NULL CHECK(incoming_kg>=0), external_used_kg numeric(18,6) NOT NULL CHECK(external_used_kg>=0), external_held_kg numeric(18,6) NOT NULL CHECK(external_held_kg>=0),
 reason text NOT NULL CHECK(length(trim(reason))>0), PRIMARY KEY(season_id,variety_key)
);
CREATE TABLE kg_contract_plans (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), subscription_id uuid UNIQUE NOT NULL REFERENCES subscriptions(id),
 product_id uuid NOT NULL REFERENCES products(id), options jsonb NOT NULL DEFAULT '{}', quantity integer NOT NULL CHECK(quantity>0),
 anchor_date date NOT NULL, source_interval text NOT NULL, source_skip text,
 issue text, reason text NOT NULL CHECK(length(trim(reason))>0), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE kg_delivery_slots (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), plan_id uuid NOT NULL REFERENCES kg_contract_plans(id),
 shipping_date date NOT NULL, components jsonb NOT NULL, quantity integer NOT NULL CHECK(quantity>0),
 item_id uuid UNIQUE, canceled boolean NOT NULL DEFAULT false, created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(plan_id,shipping_date)
);
ALTER TABLE kg_movements ADD COLUMN slot_id uuid REFERENCES kg_delivery_slots(id);
CREATE INDEX ON kg_delivery_slots(plan_id);
DO $$ DECLARE t text; BEGIN
 FOREACH t IN ARRAY ARRAY['kg_harvest_rules','kg_raw_baselines','kg_contract_plans','kg_delivery_slots'] LOOP
  EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY',t);
  EXECUTE format('REVOKE ALL ON public.%I FROM anon,authenticated',t);
  EXECUTE format('GRANT SELECT ON public.%I TO authenticated',t);
  EXECUTE format('CREATE POLICY kg_admin_read ON public.%I FOR SELECT TO authenticated USING(EXISTS(SELECT 1 FROM public.profiles WHERE id=auth.uid() AND is_admin))',t);
 END LOOP;
END $$;
CREATE FUNCTION kg_require_admin() RETURNS void LANGUAGE plpgsql SET search_path=public,pg_temp AS $$
BEGIN IF NOT EXISTS(SELECT 1 FROM profiles WHERE id=auth.uid() AND is_admin) THEN RAISE EXCEPTION 'admin required'; END IF; END $$;
CREATE FUNCTION kg_raw_components(c jsonb) RETURNS jsonb LANGUAGE plpgsql SET search_path=public,pg_temp AS $$
DECLARE x jsonb; result jsonb:='[]'; factor numeric;
BEGIN
 PERFORM kg_validate_components(c,false);
 FOR x IN SELECT * FROM jsonb_array_elements(c) LOOP
  factor:=CASE x->>'milling' WHEN 'white' THEN 1.1 WHEN 'partial' THEN 1.05 WHEN 'brown' THEN 1 ELSE NULL END;
  IF factor IS NULL THEN RAISE EXCEPTION 'Explicit milling required: white / partial / brown'; END IF;
  result:=result||jsonb_build_array(x||jsonb_build_object('milling_factor',factor,'raw_unit_kg',(x->>'unit_kg')::numeric*factor));
 END LOOP;
 RETURN result;
END $$;
-- Preserve v1 snapshots and ledger without interpreting their old weight basis.
CREATE OR REPLACE FUNCTION kg_sync_item(i uuid) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE s kg_item_snapshots; o orders; it order_items; c jsonb; u numeric:=0; h numeric:=0; shipped_now boolean; unit numeric;
BEGIN
 SELECT * INTO s FROM kg_item_snapshots WHERE item_id=i;
 IF NOT FOUND THEN RETURN; END IF;
 SELECT * INTO o FROM orders WHERE id=s.order_id FOR UPDATE;
 SELECT * INTO s FROM kg_item_snapshots WHERE item_id=i FOR UPDATE;
 SELECT * INTO it FROM order_items WHERE id=i;
 shipped_now:=s.shipped OR coalesce(it.shipping_status='shipped',false) OR coalesce(o.order_status IN ('shipped','delivered'),false);
 IF shipped_now THEN u:=s.quantity;
 ELSIF it.id IS NULL OR o.id IS NULL OR o.order_status='cancelled' OR o.payment_status IN ('failed','refunded') THEN NULL;
 ELSIF s.accounting_version=1 AND o.payment_status='paid' THEN u:=s.quantity;
 ELSE h:=s.quantity;
 END IF;
 IF NOT s.excluded AND (s.used_quantity<>u OR s.held_quantity<>h) THEN
  FOR c IN SELECT * FROM jsonb_array_elements(s.components) LOOP
   unit:=CASE WHEN s.accounting_version=2 THEN (c->>'raw_unit_kg')::numeric ELSE (c->>'unit_kg')::numeric END;
   INSERT INTO kg_movements(season_id,variety_key,kind,used_kg,held_kg,item_id,order_id,reason,accounting_version)
   VALUES((c->>'season_id')::uuid,c->>'variety_key','ec',(u-s.used_quantity)*unit,(h-s.held_quantity)*unit,i,s.order_id,
    coalesce(o.payment_status,'deleted')||' / '||coalesce(o.order_status,'deleted'),s.accounting_version);
  END LOOP;
 END IF;
 UPDATE kg_item_snapshots SET used_quantity=u,held_quantity=h,shipped=shipped_now WHERE item_id=i;
END $$;
CREATE OR REPLACE FUNCTION kg_capture_item() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE spec kg_product_specs; c jsonb;
BEGIN
 IF TG_OP='INSERT' THEN
  -- Subscription orders need an explicit delivery-slot link, so the prediction is never also debited as an order.
  IF NOT coalesce((to_jsonb(NEW)->>'is_subscription')::boolean,false)
    AND NOT EXISTS(SELECT 1 FROM orders WHERE id=NEW.order_id AND stripe_subscription_id IS NOT NULL) THEN
   SELECT * INTO spec FROM kg_product_specs WHERE product_id=NEW.product_id AND options=coalesce(NEW.selected_options,'{}'::jsonb);
   IF FOUND AND NEW.quantity>0 THEN
    IF spec.excluded THEN c:='[]';
    ELSIF NOT EXISTS(SELECT 1 FROM jsonb_array_elements(spec.components) x WHERE coalesce(x->>'milling','') NOT IN ('white','partial','brown')) THEN c:=kg_raw_components(spec.components);
    ELSE RETURN NULL; -- old mappings stay unresolved, never infer milling
    END IF;
    INSERT INTO kg_item_snapshots(item_id,order_id,components,excluded,reason,quantity,accounting_version)
    VALUES(NEW.id,NEW.order_id,c,spec.excluded,'purchase snapshot: '||spec.note,NEW.quantity,2);
   END IF;
  END IF;
 ELSIF TG_OP='UPDATE' THEN
  IF (OLD.product_id,OLD.selected_options,OLD.quantity,OLD.order_id) IS DISTINCT FROM (NEW.product_id,NEW.selected_options,NEW.quantity,NEW.order_id) THEN
   UPDATE kg_item_snapshots SET reason='REVIEW: order item changed after snapshot' WHERE item_id=NEW.id;
  END IF;
 END IF;
 PERFORM kg_sync_item(CASE WHEN TG_OP='DELETE' THEN OLD.id ELSE NEW.id END);
 RETURN NULL;
END $$;
CREATE OR REPLACE FUNCTION kg_resolve_item(item uuid, components jsonb, excluded boolean, reason text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE it order_items; c jsonb;
BEGIN
 PERFORM kg_require_admin();
 IF reason IS NULL OR length(trim(reason))=0 THEN RAISE EXCEPTION 'Reason required'; END IF;
 SELECT * INTO it FROM order_items WHERE id=item;
 IF NOT FOUND OR it.quantity<=0 THEN RAISE EXCEPTION 'Invalid item'; END IF;
 IF it.is_subscription THEN RAISE EXCEPTION 'Link subscription item to a verified delivery slot'; END IF;
 PERFORM kg_validate_components(components,excluded);
 c:=CASE WHEN excluded THEN '[]'::jsonb ELSE kg_raw_components(components) END;
 PERFORM 1 FROM orders WHERE id=it.order_id FOR UPDATE;
 IF NOT excluded AND it.shipping_status<>'shipped' AND EXISTS(SELECT 1 FROM orders WHERE id=it.order_id AND (payment_status='refunded' OR order_status='cancelled')) THEN RAISE EXCEPTION 'Historical shipment evidence required'; END IF;
 INSERT INTO kg_item_snapshots(item_id,order_id,components,excluded,reason,quantity,accounting_version)
 VALUES(it.id,it.order_id,c,excluded,reason,it.quantity,2);
 PERFORM kg_sync_item(item);
END $$;
CREATE OR REPLACE FUNCTION kg_record_movement(request uuid, season uuid, variety text, kind text, kg numeric, reason text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
BEGIN
 PERFORM kg_require_admin();
 IF kind NOT IN ('receipt','direct','wholesale','gift','home_use','adjustment') OR kg=0 OR kg<>round(kg,6) OR (kind<>'adjustment' AND kg<0) THEN RAISE EXCEPTION 'Invalid raw-rice movement'; END IF;
 INSERT INTO kg_movements(request_id,season_id,variety_key,kind,incoming_kg,used_kg,reason,accounting_version)
 VALUES(request,season,variety,kind,CASE WHEN kind IN ('receipt','adjustment') THEN kg ELSE 0 END,CASE WHEN kind IN ('direct','wholesale','gift','home_use') THEN kg ELSE 0 END,reason,2)
 ON CONFLICT(request_id) DO NOTHING;
END $$;
-- All mutation of a forecast is serialized under its plan. Linked slots remain immutable.
CREATE FUNCTION kg_forecast_delta(slot uuid, direction integer, why text) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE s kg_delivery_slots; c jsonb;
BEGIN
 SELECT * INTO s FROM kg_delivery_slots WHERE id=slot;
 IF s.canceled OR s.item_id IS NOT NULL THEN RETURN; END IF;
 FOR c IN SELECT * FROM jsonb_array_elements(s.components) LOOP
  INSERT INTO kg_movements(season_id,variety_key,kind,held_kg,slot_id,reason,accounting_version)
  VALUES((c->>'season_id')::uuid,c->>'variety_key','forecast',direction*s.quantity*(c->>'raw_unit_kg')::numeric,s.id,why,2);
 END LOOP;
END $$;
CREATE FUNCTION kg_rebuild_plan(plan uuid) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE p kg_contract_plans; sub subscriptions; spec kg_product_specs; c jsonb; pending jsonb; next_c jsonb;
 desired_dates date[]:=ARRAY[]::date[]; target_c jsonb; target_qty integer; effective date; matches integer; anchor date; day date; end_date date; months integer; step integer:=0; qty integer; next_qty integer; sid uuid; old kg_delivery_slots; cutoff date;
BEGIN
 SELECT * INTO p FROM kg_contract_plans WHERE id=plan FOR UPDATE;
 SELECT * INTO sub FROM subscriptions WHERE id=p.subscription_id;
 IF sub.status='canceled' OR coalesce((sub.metadata->>'cancel_at_period_end')::boolean,false) THEN
  FOR old IN SELECT * FROM kg_delivery_slots WHERE plan_id=plan AND item_id IS NULL AND NOT canceled LOOP
   PERFORM kg_forecast_delta(old.id,-1,'contract canceled / no further uncreated deliveries');
   UPDATE kg_delivery_slots SET canceled=true WHERE id=old.id;
  END LOOP;
  UPDATE kg_contract_plans SET issue=NULL,updated_at=now() WHERE id=plan; RETURN;
 END IF;
 IF NOT (sub.metadata ? 'pause_collection') THEN
  UPDATE kg_contract_plans SET issue='休止状態の同期が未確認（旧予測は保持）' WHERE id=plan; RETURN;
 END IF;
 IF sub.status NOT IN ('active','trialing') OR coalesce(sub.metadata->'pause_collection','null'::jsonb)<>'null'::jsonb THEN
  UPDATE kg_contract_plans SET issue='契約の休止・課金状態を確認してください（旧予測は保持）' WHERE id=plan; RETURN;
 END IF;
 months:=CASE sub.interval WHEN 'monthly' THEN 1 WHEN 'bimonthly' THEN 2 WHEN 'quarterly' THEN 3 WHEN 'semiannual' THEN 6 WHEN 'annual' THEN 12 ELSE NULL END;
 IF months IS NULL THEN UPDATE kg_contract_plans SET issue='月次以外の実発送アンカー未確認' WHERE id=plan; RETURN; END IF;
 anchor:=p.anchor_date;
 IF sub.interval IS DISTINCT FROM p.source_interval OR sub.metadata->>'skipped_until' IS DISTINCT FROM p.source_skip THEN
  IF sub.next_billing_at IS NULL THEN UPDATE kg_contract_plans SET issue='変更後の次回請求日が不明' WHERE id=plan; RETURN; END IF;
  anchor:=date_trunc('month',sub.next_billing_at AT TIME ZONE 'Asia/Tokyo')::date+14;
 END IF;
 IF sub.metadata->'current_product'->>'product_id' IS NOT NULL THEN
  p.product_id:=(sub.metadata->'current_product'->>'product_id')::uuid;
  p.options:=coalesce(sub.metadata->'current_product'->'selected_options','{}'::jsonb);
  p.quantity:=coalesce((sub.metadata->'current_product'->>'quantity')::integer,p.quantity);
 END IF;
 SELECT * INTO spec FROM kg_product_specs WHERE product_id=p.product_id AND options=p.options;
 IF NOT FOUND OR spec.excluded THEN UPDATE kg_contract_plans SET issue='契約商品の原料構成が未設定' WHERE id=plan; RETURN; END IF;
 IF EXISTS(SELECT 1 FROM jsonb_array_elements(spec.components) x WHERE coalesce(x->>'milling','') NOT IN ('white','partial','brown')) THEN UPDATE kg_contract_plans SET issue='契約商品の精米区分未設定' WHERE id=plan; RETURN; END IF;
 c:=kg_raw_components(spec.components); qty:=p.quantity;
 pending:=sub.metadata->'pending_changes'->'product'; next_c:=NULL; next_qty:=qty;
 IF pending IS NOT NULL THEN
  SELECT count(*) INTO matches FROM kg_product_specs sp WHERE sp.product_id=(pending->>'product_id')::uuid AND NOT sp.excluded
    AND EXISTS(SELECT 1 FROM jsonb_each_text(sp.options) o WHERE o.value=pending->>'milling_option_id')
    AND sp.options = p.options || (SELECT jsonb_object_agg(o.key,o.value) FROM jsonb_each_text(sp.options) o WHERE o.value=pending->>'milling_option_id');
  IF matches<>1 OR pending->>'effective_shipping_date' IS NULL THEN
   UPDATE kg_contract_plans SET issue='予約変更の選択肢組合せ・適用回を一意に確認できません' WHERE id=plan; RETURN;
  END IF;
  SELECT * INTO spec FROM kg_product_specs sp WHERE sp.product_id=(pending->>'product_id')::uuid AND NOT sp.excluded
    AND EXISTS(SELECT 1 FROM jsonb_each_text(sp.options) o WHERE o.value=pending->>'milling_option_id')
    AND sp.options = p.options || (SELECT jsonb_object_agg(o.key,o.value) FROM jsonb_each_text(sp.options) o WHERE o.value=pending->>'milling_option_id');
  IF EXISTS(SELECT 1 FROM jsonb_array_elements(spec.components) x WHERE coalesce(x->>'milling','') NOT IN ('white','partial','brown')) THEN
   UPDATE kg_contract_plans SET issue='予約変更商品の精米設定が未確認' WHERE id=plan; RETURN;
  END IF;
  next_c:=kg_raw_components(spec.components);
  effective:=((pending->>'effective_shipping_date')::timestamptz AT TIME ZONE 'Asia/Tokyo')::date;
 END IF;
 IF qty<=0 THEN UPDATE kg_contract_plans SET issue='契約数量が不正' WHERE id=plan; RETURN; END IF;
 IF EXISTS(SELECT 1 FROM jsonb_array_elements(c||coalesce(next_c,'[]'::jsonb)) x WHERE NOT EXISTS(SELECT 1 FROM kg_harvest_rules r WHERE r.season_id=(x->>'season_id')::uuid AND r.variety_key=x->>'variety_key')) THEN
  UPDATE kg_contract_plans SET issue='銘柄・年産の期限月が未設定' WHERE id=plan; RETURN;
 END IF;
 SELECT max((r.end_month+interval '1 month - 1 day')::date) INTO end_date FROM jsonb_array_elements(c||coalesce(next_c,'[]'::jsonb)) x JOIN kg_harvest_rules r ON r.season_id=(x->>'season_id')::uuid AND r.variety_key=x->>'variety_key';
 IF end_date>anchor+interval '3 years' THEN UPDATE kg_contract_plans SET issue='期限が3年を超えています' WHERE id=plan; RETURN; END IF;
 day:=anchor;
 WHILE day<=end_date LOOP
  target_c:=CASE WHEN next_c IS NOT NULL AND day>=effective THEN next_c ELSE c END;
  target_qty:=CASE WHEN next_c IS NOT NULL AND day>=effective THEN next_qty ELSE qty END;
  SELECT min((r.end_month+interval '1 month - 1 day')::date) INTO cutoff FROM jsonb_array_elements(target_c) x JOIN kg_harvest_rules r ON r.season_id=(x->>'season_id')::uuid AND r.variety_key=x->>'variety_key';
  IF EXISTS(SELECT 1 FROM jsonb_array_elements(target_c) x JOIN kg_harvest_rules r ON r.season_id=(x->>'season_id')::uuid AND r.variety_key=x->>'variety_key' WHERE (r.end_month+interval '1 month - 1 day')::date<>cutoff) THEN
   RAISE EXCEPTION 'Mixed set deadlines differ; verify next season components';
  END IF;
  IF day<=cutoff THEN
   desired_dates:=array_append(desired_dates,day);
   SELECT * INTO old FROM kg_delivery_slots WHERE plan_id=plan AND shipping_date=day;
   IF NOT FOUND THEN
    INSERT INTO kg_delivery_slots(plan_id,shipping_date,components,quantity) VALUES(plan,day,target_c,target_qty) RETURNING id INTO sid;
    PERFORM kg_forecast_delta(sid,1,'future raw-rice reservation');
   ELSIF old.item_id IS NULL AND (old.canceled OR old.components<>target_c OR old.quantity<>target_qty)
     AND day >= (now() AT TIME ZONE 'Asia/Tokyo')::date THEN
    PERFORM kg_forecast_delta(old.id,-1,'forecast revision');
    UPDATE kg_delivery_slots SET components=target_c,quantity=target_qty,canceled=false WHERE id=old.id;
    PERFORM kg_forecast_delta(old.id,1,'revised future reservation');
   END IF;
  END IF;
  step:=step+1; day:=(anchor+make_interval(months=>step*months))::date;
 END LOOP;
 -- Never discard an overdue unlinked shipment merely because time passed.
 FOR old IN SELECT * FROM kg_delivery_slots WHERE plan_id=plan AND item_id IS NULL AND NOT canceled AND shipping_date >= (now() AT TIME ZONE 'Asia/Tokyo')::date AND NOT(shipping_date=ANY(desired_dates)) LOOP
  PERFORM kg_forecast_delta(old.id,-1,'future schedule canceled/reanchored'); UPDATE kg_delivery_slots SET canceled=true WHERE id=old.id;
 END LOOP;
 UPDATE kg_contract_plans SET product_id=p.product_id,options=p.options,quantity=qty,anchor_date=anchor,source_interval=sub.interval,source_skip=sub.metadata->>'skipped_until',issue=NULL,updated_at=now() WHERE id=plan;
END $$;
CREATE FUNCTION kg_subscription_changed() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE p uuid;
BEGIN
 SELECT id INTO p FROM kg_contract_plans WHERE subscription_id=NEW.id;
 IF p IS NOT NULL THEN
  -- A projection error must not reject a subscription/payment update. Keep the old holds and expose the failure.
  BEGIN PERFORM kg_rebuild_plan(p);
  EXCEPTION WHEN OTHERS THEN UPDATE kg_contract_plans SET issue='契約更新の予測再計算失敗。設定と履歴を要確認' WHERE id=p; END;
 END IF;
 RETURN NULL;
END $$;
CREATE TRIGGER kg_subscription_changed AFTER UPDATE OF status,interval,metadata,next_billing_at ON subscriptions FOR EACH ROW EXECUTE FUNCTION kg_subscription_changed();
CREATE FUNCTION kg_spec_changed() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE p uuid;
BEGIN
 FOR p IN SELECT id FROM kg_contract_plans ORDER BY id LOOP
  BEGIN PERFORM kg_rebuild_plan(p);
  EXCEPTION WHEN OTHERS THEN UPDATE kg_contract_plans SET issue='商品設定変更後の予測再計算失敗。要確認' WHERE id=p; END;
 END LOOP;
 RETURN NULL;
END $$;
CREATE TRIGGER kg_spec_changed AFTER INSERT OR UPDATE ON kg_product_specs FOR EACH ROW EXECUTE FUNCTION kg_spec_changed();
REVOKE ALL ON FUNCTION kg_spec_changed() FROM PUBLIC,anon,authenticated;
CREATE FUNCTION kg_save_plan(subscription uuid, product uuid, options jsonb, quantity integer, first_shipping date, reason text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE s subscriptions; pid uuid;
BEGIN
 PERFORM kg_require_admin();
 SELECT * INTO s FROM subscriptions WHERE id=subscription FOR UPDATE;
 IF NOT FOUND OR first_shipping IS NULL THEN RAISE EXCEPTION 'Contract and verified first shipping date required'; END IF;
 IF EXISTS(SELECT 1 FROM orders o JOIN order_items i ON i.order_id=o.id WHERE o.stripe_subscription_id=s.stripe_subscription_id AND i.is_subscription GROUP BY o.id HAVING count(*)>1) THEN
  RAISE EXCEPTION 'Multiple subscription items require a per-contract-item plan; leave unresolved';
 END IF;
 INSERT INTO kg_contract_plans(subscription_id,product_id,options,quantity,anchor_date,source_interval,source_skip,reason)
 VALUES(subscription,product,options,quantity,first_shipping,s.interval,s.metadata->>'skipped_until',reason)
 ON CONFLICT(subscription_id) DO UPDATE SET product_id=excluded.product_id,options=excluded.options,quantity=excluded.quantity,anchor_date=excluded.anchor_date,reason=excluded.reason
 RETURNING id INTO pid;
 PERFORM kg_rebuild_plan(pid); RETURN pid;
END $$;
CREATE FUNCTION kg_save_harvest_rule(season uuid,variety text,last_month date,reason text) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE p uuid;
BEGIN
 PERFORM kg_require_admin();
 INSERT INTO kg_harvest_rules VALUES(season,variety,last_month,reason) ON CONFLICT(season_id,variety_key) DO UPDATE SET end_month=excluded.end_month,reason=excluded.reason;
 FOR p IN SELECT id FROM kg_contract_plans ORDER BY id LOOP PERFORM kg_rebuild_plan(p); END LOOP;
END $$;
CREATE FUNCTION kg_confirm_raw_baseline(season uuid,variety text,incoming numeric,external_used numeric,external_held numeric,reason text) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
BEGIN
 PERFORM kg_require_admin();
 -- Once confirmed, corrections use the append-only raw movements. Never automatically reinterpret legacy balances.
 INSERT INTO kg_raw_baselines VALUES(season,variety,incoming,external_used,external_held,reason);
END $$;
CREATE FUNCTION kg_link_delivery(slot uuid,item uuid,reason text) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE d kg_delivery_slots; p kg_contract_plans; it order_items; o orders; spec kg_product_specs; c jsonb;
BEGIN
 PERFORM kg_require_admin();
 IF reason IS NULL OR length(trim(reason))=0 THEN RAISE EXCEPTION 'Evidence required'; END IF;
 SELECT * INTO d FROM kg_delivery_slots WHERE id=slot;
 SELECT * INTO p FROM kg_contract_plans WHERE id=d.plan_id FOR UPDATE;
 SELECT * INTO d FROM kg_delivery_slots WHERE id=slot FOR UPDATE;
 IF d.id IS NULL OR d.item_id IS NOT NULL THEN RAISE EXCEPTION 'Delivery already linked or absent'; END IF;
 SELECT * INTO it FROM order_items WHERE id=item;
 SELECT * INTO o FROM orders WHERE id=it.order_id FOR UPDATE;
 IF NOT coalesce(it.is_subscription,false) OR o.stripe_subscription_id IS DISTINCT FROM (SELECT stripe_subscription_id FROM subscriptions WHERE id=p.subscription_id) THEN RAISE EXCEPTION 'Contract does not match'; END IF;
 IF EXISTS(SELECT 1 FROM kg_item_snapshots WHERE item_id=item) THEN RAISE EXCEPTION 'Existing snapshot must not be reinterpreted'; END IF;
 SELECT * INTO spec FROM kg_product_specs WHERE product_id=it.product_id AND options=coalesce(it.selected_options,'{}'::jsonb);
 IF NOT FOUND OR spec.excluded THEN RAISE EXCEPTION 'Verify the actual order component mapping first'; END IF;
 c:=kg_raw_components(spec.components);
 PERFORM kg_forecast_delta(slot,-1,'forecast replaced by verified order: '||reason);
 UPDATE kg_delivery_slots SET item_id=item WHERE id=slot;
 INSERT INTO kg_item_snapshots(item_id,order_id,components,excluded,reason,quantity,accounting_version)
 VALUES(it.id,it.order_id,c,false,'verified delivery: '||reason,it.quantity,2);
 PERFORM kg_sync_item(item);
END $$;
-- Public access is not broadened; new management functions require existing is_admin.
REVOKE ALL ON FUNCTION kg_require_admin(),kg_raw_components(jsonb),kg_forecast_delta(uuid,integer,text),kg_rebuild_plan(uuid),kg_subscription_changed(),kg_save_plan(uuid,uuid,jsonb,integer,date,text),kg_save_harvest_rule(uuid,text,date,text),kg_confirm_raw_baseline(uuid,text,numeric,numeric,numeric,text),kg_link_delivery(uuid,uuid,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION kg_save_plan(uuid,uuid,jsonb,integer,date,text),kg_save_harvest_rule(uuid,text,date,text),kg_confirm_raw_baseline(uuid,text,numeric,numeric,numeric,text),kg_link_delivery(uuid,uuid,text) TO authenticated;
CREATE OR REPLACE FUNCTION public.kg_report() RETURNS jsonb LANGUAGE sql STABLE SECURITY INVOKER SET search_path=public,pg_temp AS $$
 SELECT jsonb_build_object(
  'accounting_version',2,
  'accounting_paused',EXISTS(SELECT 1 FROM pg_trigger WHERE tgname IN ('kg_capture_item','kg_order_changed','kg_subscription_changed','kg_spec_changed') AND tgenabled<>'O'),
  'harvest_rules',coalesce((SELECT jsonb_agg(to_jsonb(r)) FROM kg_harvest_rules r),'[]'),
  'raw_baselines',coalesce((SELECT jsonb_agg(to_jsonb(r)) FROM kg_raw_baselines r),'[]'),
  'plans',coalesce((SELECT jsonb_agg(to_jsonb(r)) FROM kg_contract_plans r),'[]'),
  'slots',coalesce((SELECT jsonb_agg(to_jsonb(r)) FROM kg_delivery_slots r),'[]'),
  'subscriptions',coalesce((SELECT jsonb_agg(jsonb_build_object('id',id,'stripe_subscription_id',stripe_subscription_id,'status',status,'interval',interval,'next_billing_at',next_billing_at)) FROM subscriptions),'[]'),
  'reviews',coalesce((SELECT jsonb_agg(to_jsonb(r)) FROM kg_legacy_reviews r),'[]'),
  'seasons',coalesce((SELECT jsonb_agg(to_jsonb(s) ORDER BY harvest_year DESC) FROM inventory_seasons s),'[]'),
  'products',coalesce((SELECT jsonb_agg(jsonb_build_object('id',id,'title',title)) FROM products),'[]'),
  'specs',coalesce((SELECT jsonb_agg(to_jsonb(s)) FROM kg_product_specs s),'[]'),
  'movements',coalesce((SELECT jsonb_agg(to_jsonb(s)) FROM kg_movements s),'[]'),
  'snapshots',coalesce((SELECT jsonb_agg(to_jsonb(s)) FROM kg_item_snapshots s),'[]'),
  'stocks',coalesce((SELECT jsonb_agg(to_jsonb(s)) FROM inventory_varieties s),'[]'),
  'sales',coalesce((SELECT jsonb_agg(to_jsonb(s)) FROM inventory_external_sales s),'[]'),
  'orders',coalesce((SELECT jsonb_agg(jsonb_build_object('id',o.id,'order_number',o.order_number,
    'stripe_subscription_id',o.stripe_subscription_id,'payment_status',o.payment_status,'order_status',o.order_status,'order_items',coalesce((
      SELECT jsonb_agg(jsonb_build_object('id',i.id,'order_id',i.order_id,'product_title',i.product_title,
        'product_id',i.product_id,'is_subscription',i.is_subscription,'quantity',i.quantity,'selected_options',i.selected_options)) FROM order_items i WHERE i.order_id=o.id),'[]')))
    FROM orders o),'[]'))
 WHERE EXISTS(SELECT 1 FROM profiles WHERE id=auth.uid() AND is_admin);
$$;

COMMIT;
