\set ON_ERROR_STOP on
ALTER TABLE products ADD COLUMN variants_config jsonb;
CREATE OR REPLACE FUNCTION test_assert(ok boolean,msg text) RETURNS void LANGUAGE plpgsql AS $$
BEGIN IF ok IS DISTINCT FROM true THEN RAISE EXCEPTION 'FAIL: %',msg; END IF; END $$;
INSERT INTO inventory_seasons(harvest_year,label,starts_on,ends_on)
 VALUES(2025,'2025','2025-10-01','2026-09-30'),(2026,'2026','2026-10-01','2027-09-30');
CREATE FUNCTION test_auto_item(title text,opts jsonb,qty integer DEFAULT 1) RETURNS uuid LANGUAGE plpgsql AS $$
DECLARE p uuid:=gen_random_uuid(); o uuid:=gen_random_uuid(); i uuid:=gen_random_uuid();
BEGIN
 INSERT INTO products(id,title,variants_config) VALUES(p,title,
  '[{"id":"legacy_migration","options":[{"id":"b","value":"玄米"},{"id":"w","value":"白米"},{"id":"p","value":"分づき"}]}]');
 INSERT INTO orders(id,order_number,payment_status,order_status) VALUES(o,'test','paid','processing');
 INSERT INTO order_items(id,order_id,product_id,product_title,selected_options,quantity,is_subscription)
 VALUES(i,o,p,title,opts,qty,false);
 RETURN i;
END $$;
SELECT test_auto_item('3品種お試しセット 令和8年産','{"legacy_migration":"w"}',2) AS white \gset
SELECT test_auto_item('3品種お試しセット 令和8年産','{"legacy_migration":"b"}',1) AS brown \gset
SELECT test_auto_item('3品種お試しセット','{"legacy_migration":"w"}',1) AS noyear \gset
SELECT test_auto_item('亀の尾 5kg 令和7年産','{"legacy_migration":"p"}',2) AS oldyear \gset
SELECT test_auto_item('コシヒカリ 5kg 令和8年産','{"legacy_migration":"w","legacy_variant_breakdown":["白米×2"]}',2) AS homogeneous \gset
SELECT test_auto_item('コシヒカリ 5kg 令和8年産','{"legacy_migration":"b","legacy_variant_breakdown":["玄米×1","白米×1"]}',2) AS mixed \gset
SELECT test_auto_item('コシヒカリ 5kg 令和8年産','{"legacy_migration":"b","legacy_variant_breakdown":["玄米×3"]}',2) AS mismatch \gset
SELECT test_auto_item('コシヒカリ 2合×5個セット 令和8年産','{"legacy_migration":"b"}') AS pack5 \gset
SELECT test_auto_item('【Crescentmoon】cookie box','{}') AS cookie \gset
SELECT test_auto_item('【お米保存の決定版】プロガード ライスキープ','{}') AS bag \gset
SELECT test_auto_item('謎の商品','{}') AS unknown \gset
SELECT test_auto_item('にこまる 5kg 令和8年産','{"legacy_migration":"b"}') AS subscription \gset
UPDATE orders SET stripe_subscription_id='sub_test' WHERE id=(SELECT order_id FROM order_items WHERE id=:'subscription');
SELECT test_auto_item('コシヒカリ 5kg 令和8年産','{"legacy_migration":"w"}') AS annual \gset
UPDATE order_items SET product_title='年間契約 全3回発送 コシヒカリ 5kg 令和8年産' WHERE id=:'annual';
SELECT test_auto_item('にこまる 5kg 令和8年産','{"legacy_migration":"b"}') AS cancelled \gset
UPDATE orders SET order_status='cancelled' WHERE id=(SELECT order_id FROM order_items WHERE id=:'cancelled');
SELECT test_auto_item('亀の尾 5kg 令和8年産','{"legacy_migration":"unknown"}') AS unmapped \gset
SELECT test_auto_item('亀の尾 5kg 令和8年産','{"legacy_migration":"p"}') AS renamed \gset
UPDATE products SET title='亀の尾 10kg 令和8年産' WHERE id=(SELECT product_id FROM order_items WHERE id=:'renamed');

SELECT test_assert(kg_auto_mapping_candidate(:'white')->>'status'='ready','trial white ready');
SELECT test_assert(jsonb_array_length(kg_auto_mapping_candidate(:'white')->'components')=3,'three independent varieties');
SELECT test_assert((SELECT sum((c->>'unit_kg')::numeric)=0.9 FROM jsonb_array_elements(kg_auto_mapping_candidate(:'white')->'components') c),'trial is 900g, not 1500g');
SELECT test_assert(kg_auto_mapping_candidate(:'noyear')->>'status'='review','never infer year from current date');
SELECT test_assert(kg_auto_mapping_candidate(:'oldyear')->>'harvest_year'='2025','purchase year preserved');
SELECT test_assert(kg_auto_mapping_candidate(:'homogeneous')->>'status'='ready','verified homogeneous quantity breakdown');
SELECT test_assert(kg_auto_mapping_candidate(:'mixed')->>'status'='review','mixed milling never flattened');
SELECT test_assert(kg_auto_mapping_candidate(:'mismatch')->>'status'='review','quantity discrepancy rejected');
SELECT test_assert(kg_auto_mapping_candidate(:'pack5')->>'status'='review','five pack not confused with trial');
SELECT test_assert(kg_auto_mapping_candidate(:'cookie')->>'status'='exclude','known non-rice exclusion');
SELECT test_assert(kg_auto_mapping_candidate(:'bag')->>'status'='exclude','bag is not rice');
SELECT test_assert(kg_auto_mapping_candidate(:'unknown')->>'status'='review','unknown product is not auto-excluded');
SELECT test_assert(kg_auto_mapping_candidate(:'subscription')->>'status'='review','subscription parent prevents double debit');
SELECT test_assert(kg_auto_mapping_candidate(:'annual')->>'status'='review','annual title despite false subscription flag');
SELECT test_assert(kg_auto_mapping_candidate(:'cancelled')->>'status'='review','cancelled needs shipment evidence');
SELECT test_assert(kg_auto_mapping_candidate(:'unmapped')->>'status'='review','missing option never defaulted');
SELECT test_assert(kg_auto_mapping_candidate(:'renamed')->>'status'='review','current product cannot rewrite historical name');

CREATE TEMP TABLE previews AS SELECT kg_auto_mapping_candidate(id) candidate FROM order_items WHERE id IN (:'white',:'brown',:'oldyear',:'cookie',:'bag');
SELECT test_assert((SELECT count(*)=0 FROM kg_item_snapshots),'preview makes no snapshots');
SELECT test_assert((SELECT count(*)=0 FROM kg_movements),'preview makes no movements');
SET ROLE authenticated;
SET test.uid='00000000-0000-0000-0000-000000000001';
SELECT test_assert((SELECT count(*)>0 FROM kg_auto_mapping_preview()),'admin preview permitted');
RESET ROLE;
SELECT kg_auto_mapping_apply((SELECT jsonb_agg(candidate) FROM previews),'verified fixture mappings; no prior manual overlap',true);
SELECT test_assert((SELECT sum(held_kg)=1.98 FROM kg_movements WHERE item_id=:'white'),'two white trials use 1.98kg raw');
SELECT test_assert((SELECT count(*)=3 AND min(held_kg)=0.66 FROM kg_movements WHERE item_id=:'white'),'each white variety 0.66kg');
SELECT test_assert((SELECT sum(held_kg)=0.9 FROM kg_movements WHERE item_id=:'brown'),'brown trial uses 0.9kg');
SELECT test_assert((SELECT sum(held_kg)=10.5 FROM kg_movements WHERE item_id=:'oldyear'),'partial factor and quantity');
SELECT test_assert((SELECT bool_and(s.harvest_year=2025) FROM kg_movements m JOIN inventory_seasons s ON s.id=m.season_id WHERE m.item_id=:'oldyear'),'old year stays separate');
SELECT test_assert((SELECT count(*)=0 FROM kg_movements WHERE item_id IN (:'cookie',:'bag')),'exclusions consume no rice');
CREATE TEMP TABLE movement_before AS SELECT count(*) n FROM kg_movements;
SELECT kg_auto_mapping_apply((SELECT jsonb_agg(candidate) FROM previews),'retry',true);
SELECT test_assert((SELECT count(*) FROM kg_movements)=(SELECT n FROM movement_before),'retry does not double debit');
UPDATE order_items SET shipping_status='shipped' WHERE id=:'white';
SELECT test_assert((SELECT sum(used_kg)=1.98 AND sum(held_kg)=0 FROM kg_movements WHERE item_id=:'white'),'shipment transfers hold to used');
UPDATE orders SET payment_status='refunded',order_status='cancelled' WHERE id=(SELECT order_id FROM order_items WHERE id=:'white');
SELECT test_assert((SELECT sum(used_kg)=1.98 FROM kg_movements WHERE item_id=:'white'),'shipped refund never automatically restocks');

-- A stale preview is refused atomically. Earlier writes in its batch roll back.
CREATE TEMP TABLE stale_preview AS SELECT kg_auto_mapping_candidate(id) candidate FROM order_items WHERE id IN (:'homogeneous',:'unmapped');
UPDATE order_items SET quantity=3 WHERE id=:'homogeneous';
DO $$ BEGIN
 BEGIN
  PERFORM kg_auto_mapping_apply((SELECT jsonb_agg(candidate) FROM stale_preview),'stale test',true);
  RAISE EXCEPTION 'FAIL stale preview accepted';
 EXCEPTION WHEN serialization_failure THEN NULL; END;
END $$;
SELECT test_assert((SELECT count(*)=5 FROM kg_item_snapshots),'stale batch created no extra snapshots');
SET ROLE authenticated;
SET test.uid='00000000-0000-0000-0000-000000000002';
DO $$ BEGIN
 BEGIN PERFORM kg_auto_mapping_preview(); RAISE EXCEPTION 'FAIL non-admin preview';
 EXCEPTION WHEN insufficient_privilege THEN NULL; END;
 BEGIN PERFORM kg_auto_mapping_apply('[]','forbidden',true); RAISE EXCEPTION 'FAIL non-admin apply';
 EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $$;
RESET ROLE;
SELECT test_assert(NOT has_function_privilege('anon','kg_auto_mapping_preview()','EXECUTE'),'anon has no preview RPC');
SELECT test_assert(NOT has_function_privilege('authenticated','kg_auto_mapping_candidate(uuid)','EXECUTE'),'internal classifier not exposed');
SET test.uid='00000000-0000-0000-0000-000000000001';
SELECT test_auto_item('にこまる 5kg 令和8年産','{"legacy_migration":"b"}') AS bulk1 \gset
SELECT test_auto_item('亀の尾 10kg 令和8年産','{"legacy_migration":"w"}') AS bulk2 \gset
SELECT test_auto_item('コシヒカリ 5kg 令和8年産','{"legacy_migration":"p"}') AS bulk3 \gset
CREATE TEMP TABLE before_prepare AS SELECT count(*) n FROM kg_movements;
SELECT kg_auto_mapping_prepare(2026)->>'batch_id' AS batch \gset
SELECT test_assert((SELECT count(*) FROM kg_movements)=(SELECT n FROM before_prepare),'prepare saves only review, not ledger');
SELECT test_assert((SELECT jsonb_array_length(candidates)=3 AND processed=0 FROM kg_auto_mapping_batches WHERE id=:'batch'),'only eligible selected-year rows frozen');
SELECT test_assert(kg_auto_mapping_apply_batch(:'batch','verified fixtures, no manual duplication',true,2)->>'remaining'='1','bounded bulk applies first two');
SELECT test_assert(kg_auto_mapping_apply_batch(:'batch','verified fixtures, no manual duplication',true,2)->>'remaining'='0','bulk resumes remaining row');
SELECT test_assert(kg_auto_mapping_apply_batch(:'batch','retry',true)->>'applied'='0','completed batch does not repeat');
SELECT test_assert((SELECT count(*)=3 FROM kg_item_snapshots WHERE item_id IN (:'bulk1',:'bulk2',:'bulk3')),'all bulk rows mapped');
SELECT test_auto_item('亀の尾 5kg 令和8年産','{"legacy_migration":"w"}') AS authbulk \gset
SET ROLE authenticated;
SET test.uid='00000000-0000-0000-0000-000000000001';
SELECT kg_auto_mapping_prepare(2026)->>'batch_id' AS authbatch \gset
SELECT test_assert((SELECT count(*)=1 FROM kg_auto_mapping_batches WHERE id=:'authbatch'),'authenticated admin reads its saved review');
SELECT test_assert(kg_auto_mapping_apply_batch(:'authbatch','authenticated admin verified input',true)->>'remaining'='0','authenticated admin apply succeeds');
SELECT test_assert((SELECT sum(held_kg)=5.5 FROM kg_movements WHERE item_id=:'authbulk'),'authenticated admin sees posted ledger');
RESET ROLE;
SET ROLE authenticated;
SET test.uid='00000000-0000-0000-0000-000000000002';
SELECT test_assert((SELECT count(*)=0 FROM kg_auto_mapping_batches),'non-admin cannot read saved batches');
DO $$ BEGIN
 BEGIN PERFORM kg_auto_mapping_prepare(2026); RAISE EXCEPTION 'FAIL non-admin prepare';
 EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $$;
RESET ROLE;
SELECT 'auto mapping integration passed' AS result;
