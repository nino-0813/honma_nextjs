-- Additive kg accounting. Run only after the migration review described in docs/kg-inventory.md.
BEGIN;
CREATE TABLE public.kg_product_specs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id),
  options jsonb NOT NULL DEFAULT '{}' CHECK (jsonb_typeof(options) = 'object'),
  excluded boolean NOT NULL DEFAULT false,
  components jsonb NOT NULL DEFAULT '[]',
  note text NOT NULL CHECK (length(trim(note)) > 0),
  UNIQUE(product_id, options)
);
CREATE TABLE public.kg_item_snapshots (
  item_id uuid PRIMARY KEY, -- deliberately survives order/item deletion
  order_id uuid NOT NULL,
  components jsonb NOT NULL,
  excluded boolean NOT NULL DEFAULT false,
  reason text NOT NULL,
  quantity integer NOT NULL,
  used_quantity numeric NOT NULL DEFAULT 0,
  held_quantity numeric NOT NULL DEFAULT 0,
  shipped boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.kg_movements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid UNIQUE NOT NULL DEFAULT gen_random_uuid(),
  season_id uuid NOT NULL REFERENCES public.inventory_seasons(id),
  variety_key text NOT NULL CHECK (variety_key IN ('koshihikari','nikomaru','kamenoo')),
  kind text NOT NULL,
  incoming_kg numeric(12,3) NOT NULL DEFAULT 0,
  used_kg numeric(12,3) NOT NULL DEFAULT 0,
  held_kg numeric(12,3) NOT NULL DEFAULT 0,
  item_id uuid,
  order_id uuid,
  reason text NOT NULL CHECK(length(trim(reason)) > 0),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON public.kg_movements(season_id);
CREATE INDEX ON public.kg_item_snapshots(order_id);
ALTER TABLE public.kg_product_specs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kg_item_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kg_movements ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.kg_product_specs, public.kg_item_snapshots, public.kg_movements FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.kg_product_specs TO authenticated;
GRANT SELECT ON public.kg_item_snapshots, public.kg_movements TO authenticated;
CREATE POLICY kg_specs_admin ON public.kg_product_specs FOR ALL TO authenticated
 USING (EXISTS(SELECT 1 FROM public.profiles WHERE id=auth.uid() AND is_admin))
 WITH CHECK (EXISTS(SELECT 1 FROM public.profiles WHERE id=auth.uid() AND is_admin));
CREATE POLICY kg_snapshots_admin ON public.kg_item_snapshots FOR SELECT TO authenticated
 USING (EXISTS(SELECT 1 FROM public.profiles WHERE id=auth.uid() AND is_admin));
CREATE POLICY kg_movements_admin ON public.kg_movements FOR SELECT TO authenticated
 USING (EXISTS(SELECT 1 FROM public.profiles WHERE id=auth.uid() AND is_admin));

CREATE FUNCTION public.kg_validate_components(c jsonb, excluded boolean) RETURNS void
LANGUAGE plpgsql SET search_path = public, pg_temp AS $$
DECLARE x jsonb;
BEGIN
 IF jsonb_typeof(c) <> 'array' OR (excluded AND jsonb_array_length(c) <> 0) OR (NOT excluded AND jsonb_array_length(c)=0) THEN
  RAISE EXCEPTION 'Specify components, or explicitly exclude a non-rice product';
 END IF;
 FOR x IN SELECT * FROM jsonb_array_elements(c) LOOP
  IF x->>'variety_key' IS NULL OR x->>'variety_key' NOT IN ('koshihikari','nikomaru','kamenoo')
    OR x->>'unit_kg' IS NULL OR (x->>'unit_kg')::numeric <= 0
    OR (x->>'unit_kg')::numeric > 100000 OR (x->>'unit_kg')::numeric <> round((x->>'unit_kg')::numeric,3)
    OR NOT EXISTS(SELECT 1 FROM inventory_seasons WHERE id=(x->>'season_id')::uuid) THEN
   RAISE EXCEPTION 'Invalid variety, season or kg (maximum 3 decimals)';
  END IF;
 END LOOP;
END $$;
CREATE FUNCTION public.kg_validate_spec() RETURNS trigger LANGUAGE plpgsql SET search_path=public,pg_temp AS $$
BEGIN PERFORM kg_validate_components(NEW.components, NEW.excluded); RETURN NEW; END $$;
CREATE TRIGGER kg_validate_spec BEFORE INSERT OR UPDATE ON public.kg_product_specs FOR EACH ROW EXECUTE FUNCTION public.kg_validate_spec();

-- Serialize on the order row before evaluating the current state. Repeated notifications produce no delta.
CREATE FUNCTION public.kg_sync_item(i uuid) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE s kg_item_snapshots; o orders; it order_items; c jsonb; u numeric:=0; h numeric:=0; shipped_now boolean;
BEGIN
 SELECT * INTO s FROM kg_item_snapshots WHERE item_id=i;
 IF NOT FOUND THEN RETURN; END IF;
 SELECT * INTO o FROM orders WHERE id=s.order_id FOR UPDATE;
 SELECT * INTO s FROM kg_item_snapshots WHERE item_id=i FOR UPDATE;
 SELECT * INTO it FROM order_items WHERE id=i;
 shipped_now := s.shipped OR coalesce(it.shipping_status='shipped',false) OR coalesce(o.order_status IN ('shipped','delivered'),false);
 IF shipped_now THEN u:=s.quantity;
 ELSIF it.id IS NULL OR o.id IS NULL OR o.order_status='cancelled' OR o.payment_status IN ('failed','refunded') THEN u:=0;
 ELSIF o.payment_status='paid' THEN u:=s.quantity;
 ELSIF o.payment_status='pending' THEN h:=s.quantity;
 ELSE h:=s.quantity; -- unknown state is conservatively held
 END IF;
 -- Column names refer to quantities here; each component converts to kg in the immutable ledger.
 IF NOT s.excluded AND (s.used_quantity<>u OR s.held_quantity<>h) THEN
  FOR c IN SELECT * FROM jsonb_array_elements(s.components) LOOP
   INSERT INTO kg_movements(season_id,variety_key,kind,used_kg,held_kg,item_id,order_id,reason)
   VALUES((c->>'season_id')::uuid,c->>'variety_key','ec',
    (u-s.used_quantity)*(c->>'unit_kg')::numeric,(h-s.held_quantity)*(c->>'unit_kg')::numeric,i,s.order_id,
    coalesce(o.payment_status,'deleted')||' / '||coalesce(o.order_status,'deleted'));
  END LOOP;
 END IF;
 UPDATE kg_item_snapshots SET used_quantity=u,held_quantity=h,shipped=shipped_now WHERE item_id=i;
END $$;
CREATE FUNCTION public.kg_capture_item() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE spec kg_product_specs;
BEGIN
 IF TG_OP='INSERT' THEN
  -- Created subscription orders require individual review: original contract metadata may be stale.
  IF NOT coalesce((to_jsonb(NEW)->>'is_subscription')::boolean,false) THEN
   SELECT * INTO spec FROM kg_product_specs WHERE product_id=NEW.product_id AND options=coalesce(NEW.selected_options,'{}'::jsonb);
   IF FOUND AND NEW.quantity>0 THEN
    INSERT INTO kg_item_snapshots(item_id,order_id,components,excluded,reason,quantity)
    VALUES(NEW.id,NEW.order_id,spec.components,spec.excluded,'purchase snapshot: '||spec.note,NEW.quantity);
   END IF;
  END IF;
 ELSIF TG_OP='UPDATE' THEN
  -- Changing product/options/quantity invalidates accounting certainty; never silently reinterpret a purchase.
  IF (OLD.product_id,OLD.selected_options,OLD.quantity,OLD.order_id) IS DISTINCT FROM (NEW.product_id,NEW.selected_options,NEW.quantity,NEW.order_id) THEN
   UPDATE kg_item_snapshots SET reason='REVIEW: order item changed after snapshot' WHERE item_id=NEW.id;
  END IF;
 END IF;
 PERFORM kg_sync_item(CASE WHEN TG_OP='DELETE' THEN OLD.id ELSE NEW.id END);
 RETURN NULL;
END $$;
CREATE TRIGGER kg_capture_item AFTER INSERT OR UPDATE OR DELETE ON public.order_items FOR EACH ROW EXECUTE FUNCTION public.kg_capture_item();
CREATE FUNCTION public.kg_order_changed() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE i uuid;
BEGIN
 FOR i IN SELECT item_id FROM kg_item_snapshots WHERE order_id=NEW.id ORDER BY item_id LOOP PERFORM kg_sync_item(i); END LOOP;
 RETURN NULL;
END $$;
CREATE TRIGGER kg_order_changed AFTER UPDATE OF payment_status,order_status ON public.orders FOR EACH ROW EXECUTE FUNCTION public.kg_order_changed();

CREATE FUNCTION public.kg_record_movement(request uuid, season uuid, variety text, kind text, kg numeric, reason text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
BEGIN
 IF NOT EXISTS(SELECT 1 FROM profiles WHERE id=auth.uid() AND is_admin) THEN RAISE EXCEPTION 'admin required'; END IF;
 IF kind NOT IN ('receipt','direct','wholesale','gift','home_use','adjustment') OR kg=0 OR kg<>round(kg,3)
 OR (kind<>'adjustment' AND kg<0) THEN RAISE EXCEPTION 'Invalid movement'; END IF;
 INSERT INTO kg_movements(request_id,season_id,variety_key,kind,incoming_kg,used_kg,reason)
 VALUES(request,season,variety,kind,CASE WHEN kind IN ('receipt','adjustment') THEN kg ELSE 0 END,
 CASE WHEN kind IN ('direct','wholesale','gift','home_use') THEN kg ELSE 0 END,reason)
 ON CONFLICT(request_id) DO NOTHING;
END $$;
CREATE FUNCTION public.kg_resolve_item(item uuid, components jsonb, excluded boolean, reason text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE it order_items;
BEGIN
 IF NOT EXISTS(SELECT 1 FROM profiles WHERE id=auth.uid() AND is_admin) THEN RAISE EXCEPTION 'admin required'; END IF;
 IF length(trim(reason))=0 OR reason IS NULL THEN RAISE EXCEPTION 'Reason required'; END IF;
 PERFORM kg_validate_components(components,excluded);
 SELECT * INTO it FROM order_items WHERE id=item;
 IF NOT FOUND OR it.quantity<=0 THEN RAISE EXCEPTION 'Invalid item'; END IF;
 PERFORM 1 FROM orders WHERE id=it.order_id FOR UPDATE;
 IF NOT excluded AND it.shipping_status <> 'shipped' AND EXISTS(
   SELECT 1 FROM orders WHERE id=it.order_id AND (payment_status='refunded' OR order_status='cancelled')
 ) THEN RAISE EXCEPTION 'Historical cancelled/refunded item needs shipment evidence; leave unresolved'; END IF;
 INSERT INTO kg_item_snapshots(item_id,order_id,components,excluded,reason,quantity)
 VALUES(it.id,it.order_id,components,excluded,reason,it.quantity); -- never overwrite an existing purchase snapshot
 PERFORM kg_sync_item(item);
END $$;
REVOKE ALL ON FUNCTION public.kg_sync_item(uuid),public.kg_capture_item(),public.kg_order_changed(),public.kg_validate_spec(),public.kg_validate_components(jsonb,boolean),public.kg_record_movement(uuid,uuid,text,text,numeric,text),public.kg_resolve_item(uuid,jsonb,boolean,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.kg_record_movement(uuid,uuid,text,text,numeric,text),public.kg_resolve_item(uuid,jsonb,boolean,text),public.kg_validate_components(jsonb,boolean) TO authenticated;
-- Preserve old manual reservations; explicitly identify the portion unrelated to EC.
CREATE TABLE public.kg_legacy_reviews (
 season_id uuid NOT NULL REFERENCES inventory_seasons(id), variety_key text NOT NULL,
 original_kg numeric NOT NULL, external_kg numeric NOT NULL CHECK(external_kg>=0),
 reason text NOT NULL, reviewed_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(season_id,variety_key)
);
ALTER TABLE public.kg_legacy_reviews ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.kg_legacy_reviews FROM anon,authenticated;
GRANT SELECT ON public.kg_legacy_reviews TO authenticated;
CREATE POLICY kg_legacy_admin ON public.kg_legacy_reviews FOR SELECT TO authenticated
 USING(EXISTS(SELECT 1 FROM profiles WHERE id=auth.uid() AND is_admin));
CREATE FUNCTION public.kg_review_legacy(season uuid,variety text,external_kg numeric,reason text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE old_kg numeric; previous_kg numeric:=0;
BEGIN
 IF NOT EXISTS(SELECT 1 FROM profiles WHERE id=auth.uid() AND is_admin) THEN RAISE EXCEPTION 'admin required'; END IF;
 SELECT reserved_kg INTO old_kg FROM inventory_varieties WHERE season_id=season AND variety_key=variety FOR UPDATE;
 IF NOT FOUND OR external_kg IS NULL OR external_kg<0 OR external_kg>old_kg OR external_kg<>round(external_kg,3)
 OR reason IS NULL OR length(trim(reason))=0 THEN RAISE EXCEPTION 'Invalid legacy review'; END IF;
 SELECT r.external_kg INTO previous_kg FROM kg_legacy_reviews r WHERE season_id=season AND variety_key=variety;
 INSERT INTO kg_movements(season_id,variety_key,kind,held_kg,reason)
 VALUES(season,variety,'legacy_review',external_kg-coalesce(previous_kg,0),reason);
 INSERT INTO kg_legacy_reviews VALUES(season,variety,old_kg,external_kg,reason,now())
 ON CONFLICT(season_id,variety_key) DO UPDATE SET original_kg=excluded.original_kg,external_kg=excluded.external_kg,reason=excluded.reason,reviewed_at=now();
END $$;
REVOKE ALL ON FUNCTION public.kg_review_legacy(uuid,text,numeric,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.kg_review_legacy(uuid,text,numeric,text) TO authenticated;

-- One statement gives the admin a consistent database snapshot, without PostgREST row caps.
CREATE FUNCTION public.kg_report() RETURNS jsonb LANGUAGE sql STABLE SECURITY INVOKER SET search_path=public,pg_temp AS $$
 SELECT jsonb_build_object(
  'reviews',coalesce((SELECT jsonb_agg(to_jsonb(r)) FROM kg_legacy_reviews r),'[]'),
  'seasons',coalesce((SELECT jsonb_agg(to_jsonb(s) ORDER BY harvest_year DESC) FROM inventory_seasons s),'[]'),
  'products',coalesce((SELECT jsonb_agg(jsonb_build_object('id',id,'title',title)) FROM products),'[]'),
  'specs',coalesce((SELECT jsonb_agg(to_jsonb(s)) FROM kg_product_specs s),'[]'),
  'movements',coalesce((SELECT jsonb_agg(to_jsonb(s)) FROM kg_movements s),'[]'),
  'snapshots',coalesce((SELECT jsonb_agg(to_jsonb(s)) FROM kg_item_snapshots s),'[]'),
  'stocks',coalesce((SELECT jsonb_agg(to_jsonb(s)) FROM inventory_varieties s),'[]'),
  'sales',coalesce((SELECT jsonb_agg(to_jsonb(s)) FROM inventory_external_sales s),'[]'),
  'orders',coalesce((SELECT jsonb_agg(jsonb_build_object('id',o.id,'order_number',o.order_number,
    'payment_status',o.payment_status,'order_status',o.order_status,'order_items',coalesce((
      SELECT jsonb_agg(jsonb_build_object('id',i.id,'order_id',i.order_id,'product_title',i.product_title,
        'quantity',i.quantity,'selected_options',i.selected_options)) FROM order_items i WHERE i.order_id=o.id),'[]')))
    FROM orders o),'[]'))
 WHERE EXISTS(SELECT 1 FROM profiles WHERE id=auth.uid() AND is_admin);
$$;
REVOKE ALL ON FUNCTION public.kg_report() FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.kg_report() TO authenticated;
COMMIT;
