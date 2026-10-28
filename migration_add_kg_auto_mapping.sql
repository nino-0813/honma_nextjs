-- Install only: no backfill, trigger, order, product or inventory changes.
-- Requires kg inventory v2. Preview, review and explicitly apply in a separate step.
BEGIN;

CREATE OR REPLACE FUNCTION public.kg_auto_mapping_admin() RETURNS void
LANGUAGE plpgsql SET search_path=public,pg_temp AS $$
BEGIN
 IF EXISTS(SELECT 1 FROM profiles WHERE id=auth.uid() AND is_admin) THEN RETURN; END IF;
 -- Permit an explicit SQL Editor operation by the database administrator, not
 -- PostgREST's authenticator or a SET ROLE authenticated/anon session.
 IF auth.uid() IS NULL AND session_user IN ('postgres','supabase_admin')
    AND current_setting('role') IN ('none','postgres','supabase_admin') THEN RETURN; END IF;
 RAISE EXCEPTION 'Admin required' USING ERRCODE='42501';
END $$;

CREATE OR REPLACE FUNCTION public.kg_auto_milling(label text) RETURNS text
LANGUAGE sql IMMUTABLE SET search_path=public,pg_temp AS $$
 SELECT CASE
 WHEN label IN ('玄米','玄米（3個セット）','玄米(3個セット)','brown') THEN 'brown'
 WHEN label IN ('白米','白米（3個セット）','白米(3個セット)','white') THEN 'white'
 WHEN label IN ('分づき','partial') THEN 'partial' END;
$$;

CREATE OR REPLACE FUNCTION public.kg_auto_mapping_candidate(p_item uuid) RETURNS jsonb
LANGUAGE plpgsql SET search_path=public,pg_temp AS $$
DECLARE
 it order_items; ord orders; prod products; title text; status text:='review'; why text;
 years integer[]; weights numeric[]; keys text[]; sid uuid; season_rows jsonb;
 maps text[]; milling text; piece text; parsed text[]; breakdown_qty integer:=0;
 breakdown_mills text[]:='{}'; quantity_keys integer; unit numeric; trial boolean;
 components jsonb:='[]'; fingerprint text; evidence jsonb;
BEGIN
 SELECT * INTO it FROM order_items WHERE id=p_item;
 IF NOT FOUND THEN RETURN jsonb_build_object('item_id',p_item,'status','review','reason','明細なし'); END IF;
 SELECT * INTO ord FROM orders WHERE id=it.order_id;
 SELECT * INTO prod FROM products WHERE id=it.product_id;
 title:=lower(translate(coalesce(it.product_title,''),'０１２３４５６７８９ＫＧｋｇ','0123456789KGkg'));
 SELECT array_agg(DISTINCT y ORDER BY y) INTO years FROM (
   SELECT 2018+m[1]::integer y FROM regexp_matches(title,'令和([0-9]{1,2})年産','g') m
   UNION SELECT m[1]::integer FROM regexp_matches(title,'(20[0-9]{2})年産','g') m
 ) yr;
 SELECT coalesce(jsonb_agg(to_jsonb(s) ORDER BY s.id),'[]') INTO season_rows
 FROM inventory_seasons s WHERE harvest_year=ANY(coalesce(years,'{}'));
 evidence:=jsonb_build_object('version',1,'item',to_jsonb(it),'order',jsonb_build_object(
   'id',ord.id,'payment_status',ord.payment_status,'order_status',ord.order_status,
   'stripe_subscription_id',ord.stripe_subscription_id),'product_id',prod.id,
   'product_title',prod.title,'variants_config',prod.variants_config,'seasons',season_rows);
 fingerprint:=md5(evidence::text);

 <<classify>> BEGIN
  IF EXISTS(SELECT 1 FROM pg_trigger WHERE NOT tgisinternal
      AND tgname IN ('kg_capture_item','kg_order_changed','kg_subscription_changed','kg_spec_changed') AND tgenabled<>'O') THEN
   why:='在庫台帳の自動更新が停止中'; EXIT classify;
  END IF;
  IF EXISTS(SELECT 1 FROM kg_item_snapshots WHERE item_id=it.id) THEN
   why:='既存スナップショットあり（上書きしません）'; EXIT classify;
  END IF;
  IF EXISTS(SELECT 1 FROM kg_movements WHERE item_id=it.id) THEN
   why:='既存の在庫履歴あり'; EXIT classify;
  END IF;
  IF it.quantity IS NULL OR it.quantity<=0 OR it.quantity>10000 THEN
   why:='数量不明・範囲外'; EXIT classify;
  END IF;
  IF ord.id IS NULL OR it.is_subscription IS DISTINCT FROM false OR ord.stripe_subscription_id IS NOT NULL
     OR title ~ '(年間契約|定期|全[0-9]+回発送)' THEN
   why:='定期便・年間契約は発送予定との照合が必要'; EXIT classify;
  END IF;
  -- Narrow purchased-title allowlist; never treat an unknown product as non-rice.
  IF title !~ '(米|ごはん|ご飯|合|ライス|食べ比べ|コシヒカリ|亀の尾|にこまる)'
     AND title ~ '(crescentmoon|cookie|クッキー|野菜セット|チケット|天然ひじき|原木乾しいたけ)' THEN
   status:='exclude'; why:='購入時商品名によるお米以外の候補'; EXIT classify;
  END IF;
  IF title ~ '^【お米保存の決定版】プロガード ライスキープ$' THEN
   status:='exclude'; why:='お米保存袋（お米の重量在庫対象外）'; EXIT classify;
  END IF;
  IF ord.payment_status IS NULL OR ord.order_status IS NULL OR ord.payment_status IN ('failed','refunded')
     OR ord.order_status='cancelled' THEN
   why:='取消・返金・注文状態を要確認'; EXIT classify;
  END IF;
  IF cardinality(years) IS DISTINCT FROM 1 OR jsonb_array_length(season_rows)<>1 THEN
   why:='購入時の年産なし・矛盾・年産マスター未登録'; EXIT classify;
  END IF;
  sid:=(season_rows->0->>'id')::uuid;
  -- Current mappings are explicitly reviewed by the operator before apply.
  IF prod.id IS NULL OR it.product_title IS DISTINCT FROM prod.title THEN
   why:='購入時と現在の商品名が異なる・商品情報なし'; EXIT classify;
  END IF;
  IF jsonb_typeof(it.selected_options) IS DISTINCT FROM 'object' THEN
   why:='購入時の選択肢なし'; EXIT classify;
  END IF;
  SELECT count(*) INTO quantity_keys FROM jsonb_object_keys(it.selected_options) k
   WHERE k<>'legacy_variant_breakdown';
  IF quantity_keys<>1 THEN why:='選択肢が複数・不明'; EXIT classify; END IF;
  SELECT array_agg(kg_auto_milling(opt->>'value')) INTO maps
  FROM jsonb_array_elements(CASE WHEN jsonb_typeof(prod.variants_config)='array' THEN prod.variants_config ELSE '[]'::jsonb END) g
  CROSS JOIN LATERAL jsonb_array_elements(CASE WHEN jsonb_typeof(g->'options')='array' THEN g->'options' ELSE '[]'::jsonb END) opt
  WHERE it.selected_options->>(g->>'id')=opt->>'id';
  IF cardinality(maps) IS DISTINCT FROM 1 OR maps[1] IS NULL THEN
   why:='選択肢IDと精米区分の対応なし・重複'; EXIT classify;
  END IF;
  milling:=maps[1];
  IF it.selected_options ? 'legacy_variant_breakdown' THEN
   IF jsonb_typeof(it.selected_options->'legacy_variant_breakdown') IS DISTINCT FROM 'array'
      OR jsonb_array_length(it.selected_options->'legacy_variant_breakdown') NOT BETWEEN 1 AND 100 THEN
    why:='移行内訳の形式不明'; EXIT classify;
   END IF;
   FOR piece IN SELECT jsonb_array_elements_text(it.selected_options->'legacy_variant_breakdown') LOOP
    parsed:=regexp_match(piece,'^(玄米|白米|分づき)[×x]([1-9][0-9]{0,3})$');
    IF parsed IS NULL THEN why:='移行内訳を読み取れません'; EXIT classify; END IF;
    breakdown_qty:=breakdown_qty+parsed[2]::integer;
    breakdown_mills:=array_append(breakdown_mills,kg_auto_milling(parsed[1]));
   END LOOP;
   IF breakdown_qty<>it.quantity THEN why:='移行内訳の合計と注文数量が不一致'; EXIT classify; END IF;
   IF EXISTS(SELECT 1 FROM unnest(breakdown_mills) m WHERE m IS DISTINCT FROM milling) THEN
    why:='複数精米区分の混在・選択肢と内訳の不一致'; EXIT classify;
   END IF;
  END IF;
  trial:=title ~ '^3品種お試しセット';
  SELECT array_agg(m[1]::numeric) INTO weights
    FROM regexp_matches(title,'([0-9]+(?:\.[0-9]+)?)\s*kg','g') m;
  IF trial THEN
   IF weights IS NOT NULL THEN why:='お試しセットの重量表記を要確認'; EXIT classify; END IF;
   -- Confirmed 2026-10-28: each variety 300g; never assume a harvest year.
   components:=jsonb_build_array(
    jsonb_build_object('season_id',sid,'variety_key','koshihikari','unit_kg',0.3,'milling',milling),
    jsonb_build_object('season_id',sid,'variety_key','nikomaru','unit_kg',0.3,'milling',milling),
    jsonb_build_object('season_id',sid,'variety_key','kamenoo','unit_kg',0.3,'milling',milling));
  ELSE
   IF title ~ '(合|セット|食べ比べ)' THEN why:='セット構成・実重量を要確認'; EXIT classify; END IF;
   SELECT array_agg(v) INTO keys FROM unnest(ARRAY['koshihikari','nikomaru','kamenoo']) v
    WHERE CASE v WHEN 'koshihikari' THEN strpos(title,'コシヒカリ')>0
     WHEN 'nikomaru' THEN strpos(title,'にこまる')>0 ELSE strpos(title,'亀の尾')>0 END;
   IF cardinality(keys) IS DISTINCT FROM 1 OR cardinality(weights) IS DISTINCT FROM 1 THEN
    why:='品種・kg重量が一意でない'; EXIT classify;
   END IF;
   unit:=weights[1];
   IF unit<=0 OR unit>1000 OR unit<>round(unit,3) THEN why:='商品重量が範囲外'; EXIT classify; END IF;
   components:=jsonb_build_array(jsonb_build_object('season_id',sid,'variety_key',keys[1],'unit_kg',unit,'milling',milling));
  END IF;
  PERFORM kg_validate_components(components,false);
  status:='ready'; why:='購入時の年産・重量と現在の選択肢対応表による候補';
 END classify;
 RETURN jsonb_build_object('item_id',it.id,'order_number',ord.order_number,'title',it.product_title,
  'status',status,'reason',why,'fingerprint',fingerprint,'quantity',it.quantity,
  'harvest_year',CASE WHEN cardinality(years)=1 THEN years[1] END,
  'components',components,'excluded',status='exclude');
END $$;

CREATE OR REPLACE FUNCTION public.kg_auto_mapping_preview() RETURNS SETOF jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE r record;
BEGIN
 PERFORM kg_auto_mapping_admin();
 FOR r IN SELECT i.id FROM order_items i WHERE NOT EXISTS(
   SELECT 1 FROM kg_item_snapshots s WHERE s.item_id=i.id) ORDER BY i.id LOOP
  RETURN NEXT kg_auto_mapping_candidate(r.id);
 END LOOP;
END $$;

CREATE OR REPLACE FUNCTION public.kg_auto_mapping_apply(p_candidates jsonb,p_reason text,p_no_manual_overlap boolean)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE row jsonb; candidate jsonb; it order_items; n integer:=0; skipped integer:=0; actor text;
BEGIN
 PERFORM kg_auto_mapping_admin();
 IF p_reason IS NULL OR length(btrim(p_reason)) NOT BETWEEN 1 AND 200
   OR p_no_manual_overlap IS DISTINCT FROM true THEN
  RAISE EXCEPTION 'Review reason and confirmation of no manual/baseline overlap required';
 END IF;
 IF jsonb_typeof(p_candidates) IS DISTINCT FROM 'array' THEN RAISE EXCEPTION 'Expected preview array'; END IF;
 IF jsonb_array_length(p_candidates) NOT BETWEEN 1 AND 100 THEN RAISE EXCEPTION 'Choose 1 to 100 items per batch'; END IF;
 IF (SELECT count(DISTINCT x->>'item_id') FROM jsonb_array_elements(p_candidates) x)<>jsonb_array_length(p_candidates) THEN
  RAISE EXCEPTION 'Duplicate or missing item ID';
 END IF;
 actor:=coalesce(auth.uid()::text,session_user);
 FOR row IN SELECT x FROM jsonb_array_elements(p_candidates) x ORDER BY x->>'item_id' LOOP
  -- Same serialization order as the ledger. NOWAIT avoids update-trigger deadlocks.
  PERFORM 1 FROM orders WHERE id=(SELECT order_id FROM order_items WHERE id=(row->>'item_id')::uuid) FOR UPDATE NOWAIT;
  SELECT * INTO it FROM order_items WHERE id=(row->>'item_id')::uuid FOR UPDATE NOWAIT;
  IF NOT FOUND THEN RAISE EXCEPTION 'Order item disappeared. Preview again'; END IF;
  IF EXISTS(SELECT 1 FROM kg_item_snapshots WHERE item_id=it.id) THEN skipped:=skipped+1; CONTINUE; END IF;
  PERFORM 1 FROM products WHERE id=it.product_id FOR SHARE NOWAIT;
  candidate:=kg_auto_mapping_candidate(it.id);
  IF candidate->>'status' NOT IN ('ready','exclude') OR row->>'fingerprint' IS NULL
    OR candidate->>'fingerprint' IS DISTINCT FROM row->>'fingerprint' THEN
   RAISE EXCEPTION 'Source changed or needs review. Preview again: %',it.id USING ERRCODE='40001';
  END IF;
  PERFORM 1 FROM inventory_seasons WHERE id IN (
    SELECT (c->>'season_id')::uuid FROM jsonb_array_elements(candidate->'components') c) FOR SHARE NOWAIT;
  -- Re-check after locking season data as well.
  IF kg_auto_mapping_candidate(it.id)->>'fingerprint' IS DISTINCT FROM row->>'fingerprint' THEN
   RAISE EXCEPTION 'Season changed. Preview again' USING ERRCODE='40001';
  END IF;
  INSERT INTO kg_item_snapshots(item_id,order_id,components,excluded,reason,quantity,accounting_version)
  VALUES(it.id,it.order_id,CASE WHEN (candidate->>'excluded')::boolean THEN '[]'::jsonb
    ELSE kg_raw_components(candidate->'components') END,(candidate->>'excluded')::boolean,
    'auto mapping v1; actor='||actor||'; preview='||(row->>'fingerprint')||'; '||btrim(p_reason),it.quantity,2);
  PERFORM kg_sync_item(it.id);
  n:=n+1;
 END LOOP;
 RETURN jsonb_build_object('applied',n,'already_recorded',skipped);
END $$;

-- Frozen previews let an operator approve a batch without copying hundreds of
-- fingerprints. Preparing a batch changes only this audit table, not stock.
CREATE TABLE IF NOT EXISTS public.kg_auto_mapping_batches (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 created_at timestamptz NOT NULL DEFAULT now(),
 created_by text NOT NULL,
 harvest_year integer,
 candidates jsonb NOT NULL CHECK(jsonb_typeof(candidates)='array'),
 processed integer NOT NULL DEFAULT 0 CHECK(processed>=0),
 last_applied_at timestamptz
);
ALTER TABLE public.kg_auto_mapping_batches ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.kg_auto_mapping_batches FROM PUBLIC,anon,authenticated;
GRANT SELECT ON public.kg_auto_mapping_batches TO authenticated;
DROP POLICY IF EXISTS kg_auto_batch_admin_read ON public.kg_auto_mapping_batches;
CREATE POLICY kg_auto_batch_admin_read ON public.kg_auto_mapping_batches FOR SELECT TO authenticated
 USING(EXISTS(SELECT 1 FROM public.profiles WHERE id=auth.uid() AND is_admin));

CREATE OR REPLACE FUNCTION public.kg_auto_mapping_prepare(p_year integer DEFAULT NULL) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE all_rows jsonb; selected jsonb; batch uuid; counts jsonb;
BEGIN
 PERFORM kg_auto_mapping_admin();
 IF p_year IS NOT NULL AND NOT EXISTS(SELECT 1 FROM inventory_seasons WHERE harvest_year=p_year) THEN
  RAISE EXCEPTION 'Harvest year is not registered';
 END IF;
 SELECT coalesce(jsonb_agg(x ORDER BY x->>'item_id'),'[]') INTO all_rows FROM kg_auto_mapping_preview() x;
 SELECT coalesce(jsonb_agg(x ORDER BY x->>'item_id'),'[]') INTO selected FROM jsonb_array_elements(all_rows) x
 WHERE x->>'status'='exclude' OR (x->>'status'='ready' AND (p_year IS NULL OR (x->>'harvest_year')::integer=p_year));
 INSERT INTO kg_auto_mapping_batches(created_by,harvest_year,candidates)
 VALUES(coalesce(auth.uid()::text,session_user),p_year,selected) RETURNING id INTO batch;
 SELECT coalesce(jsonb_agg(to_jsonb(c)),'[]') INTO counts FROM (
  SELECT x->>'status' status,x->>'reason' reason,x->>'harvest_year' harvest_year,count(*) items
  FROM jsonb_array_elements(all_rows) x GROUP BY 1,2,3 ORDER BY 1,2,3) c;
 RETURN jsonb_build_object('batch_id',batch,'eligible_items',jsonb_array_length(selected),
   'all_unmapped_items',jsonb_array_length(all_rows),'summary',counts,'inventory_changed',false);
END $$;

CREATE OR REPLACE FUNCTION public.kg_auto_mapping_apply_batch(p_batch uuid,p_reason text,p_no_manual_overlap boolean,p_limit integer DEFAULT 100)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE batch kg_auto_mapping_batches; selected jsonb; result jsonb; next_position integer;
BEGIN
 PERFORM kg_auto_mapping_admin();
 IF p_limit IS NULL OR p_limit NOT BETWEEN 1 AND 100 THEN RAISE EXCEPTION 'Batch size must be 1 to 100'; END IF;
 SELECT * INTO batch FROM kg_auto_mapping_batches WHERE id=p_batch FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Unknown preview batch'; END IF;
 SELECT coalesce(jsonb_agg(x ORDER BY n),'[]') INTO selected
 FROM jsonb_array_elements(batch.candidates) WITH ORDINALITY r(x,n)
 WHERE n>batch.processed AND n<=batch.processed+p_limit;
 IF jsonb_array_length(selected)=0 THEN RETURN jsonb_build_object('applied',0,'remaining',0); END IF;
 result:=kg_auto_mapping_apply(selected,p_reason,p_no_manual_overlap);
 next_position:=batch.processed+jsonb_array_length(selected);
 UPDATE kg_auto_mapping_batches SET processed=next_position,last_applied_at=now() WHERE id=p_batch;
 RETURN result||jsonb_build_object('batch_id',p_batch,'processed',next_position,
   'remaining',jsonb_array_length(batch.candidates)-next_position);
END $$;

REVOKE ALL ON FUNCTION public.kg_auto_mapping_admin(),public.kg_auto_milling(text),public.kg_auto_mapping_candidate(uuid),
 public.kg_auto_mapping_preview(),public.kg_auto_mapping_apply(jsonb,text,boolean),
 public.kg_auto_mapping_prepare(integer),public.kg_auto_mapping_apply_batch(uuid,text,boolean,integer) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.kg_auto_mapping_preview(),public.kg_auto_mapping_apply(jsonb,text,boolean),
 public.kg_auto_mapping_prepare(integer),public.kg_auto_mapping_apply_batch(uuid,text,boolean,integer) TO authenticated;
COMMIT;
