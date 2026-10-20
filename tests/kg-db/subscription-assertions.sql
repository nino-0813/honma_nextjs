\set ON_ERROR_STOP on
SET test.uid='00000000-0000-0000-0000-000000000001';
SELECT test_assert((SELECT count(*)>0 FROM kg_item_snapshots WHERE accounting_version=1),'old snapshots not converted');
SELECT test_assert((SELECT count(*)=0 FROM kg_raw_baselines),'old balances not converted');
INSERT INTO inventory_seasons(id,harvest_year,label,starts_on,ends_on) VALUES('40000000-0000-0000-0000-000000000090',2090,'fixture only','2090-10-01','2091-09-30');
UPDATE kg_product_specs SET components='[{"season_id":"40000000-0000-0000-0000-000000000090","variety_key":"koshihikari","unit_kg":5,"milling":"white"}]' WHERE product_id='10000000-0000-0000-0000-000000000001';
INSERT INTO products VALUES('10000000-0000-0000-0000-000000000003','fixture alternative');
INSERT INTO kg_product_specs(product_id,options,components,note) VALUES('10000000-0000-0000-0000-000000000003','{"milling":"partial"}','[{"season_id":"40000000-0000-0000-0000-000000000090","variety_key":"nikomaru","unit_kg":10,"milling":"partial"}]','fixture');
INSERT INTO subscriptions(id,stripe_subscription_id,status,interval,next_billing_at) VALUES('60000000-0000-0000-0000-000000000001','sub_fixture','active','bimonthly','2091-02-09T20:00:00Z');
SELECT kg_save_plan('60000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001','{}',1,'2090-12-15','verified fixture') AS plan \gset
SELECT test_assert((SELECT issue IS NOT NULL FROM kg_contract_plans WHERE id=:'plan'),'missing cutoff unresolved');
SELECT test_assert((SELECT count(*)=0 FROM kg_delivery_slots),'no guessed cutoff');
SELECT kg_save_harvest_rule('40000000-0000-0000-0000-000000000090','koshihikari','2091-09-01','fixture cutoff, not production setting');
SELECT test_assert((SELECT count(*)=5 FROM kg_delivery_slots WHERE plan_id=:'plan'),'December bimonthly to September five deliveries');
SELECT test_assert((SELECT sum(held_kg)=27.5 FROM kg_movements WHERE accounting_version=2),'white rice future raw kg');
CREATE TEMP TABLE before_repeat AS SELECT count(*) n FROM kg_movements;
UPDATE subscriptions SET status='active' WHERE id='60000000-0000-0000-0000-000000000001';
SELECT test_assert((SELECT count(*) FROM kg_movements)=(SELECT n FROM before_repeat),'duplicate subscription notification creates no deltas');
INSERT INTO orders(id,order_number,payment_status,order_status,stripe_subscription_id) VALUES('20000000-0000-0000-0000-000000000090','sub cycle','paid','processing','sub_fixture');
INSERT INTO order_items(id,order_id,product_id,quantity,is_subscription) VALUES('30000000-0000-0000-0000-000000000090','20000000-0000-0000-0000-000000000090','10000000-0000-0000-0000-000000000001',1,true);
SELECT test_assert((SELECT count(*)=0 FROM kg_item_snapshots WHERE item_id='30000000-0000-0000-0000-000000000090'),'unlinked subscription order not also debited');
SELECT id AS slot FROM kg_delivery_slots WHERE plan_id=:'plan' AND shipping_date='2090-12-15' \gset
SELECT kg_link_delivery(:'slot','30000000-0000-0000-0000-000000000090','verified invoice and shipping cycle');
SELECT test_assert((SELECT sum(held_kg)=27.5 AND sum(used_kg)=0 FROM kg_movements WHERE accounting_version=2),'paid order replaces forecast without double hold');
UPDATE order_items SET shipping_status='shipped' WHERE id='30000000-0000-0000-0000-000000000090';
SELECT test_assert((SELECT sum(used_kg)=5.5 AND sum(held_kg)=22 FROM kg_movements WHERE accounting_version=2),'shipment replaces order hold');
SELECT kg_save_harvest_rule('40000000-0000-0000-0000-000000000090','nikomaru','2091-10-01','fixture cutoff');
UPDATE subscriptions SET metadata='{"pause_collection":null,"pending_changes":{"product":{"product_id":"10000000-0000-0000-0000-000000000003","milling_option_id":"partial","effective_shipping_date":"2091-02-14T15:00:00Z"}}}' WHERE id='60000000-0000-0000-0000-000000000001';
SELECT test_assert((SELECT sum(held_kg)=52.5 FROM kg_movements WHERE accounting_version=2 AND variety_key='nikomaru'),'scheduled change applies five future partial-rice shipments through October');
SELECT test_assert((SELECT sum(used_kg)=5.5 AND sum(held_kg)=0 FROM kg_movements WHERE accounting_version=2 AND variety_key='koshihikari'),'shipped original variety remains fixed');
SELECT test_assert((SELECT components->0->>'milling'='white' FROM kg_item_snapshots WHERE item_id='30000000-0000-0000-0000-000000000090'),'shipped milling snapshot immutable');
UPDATE subscriptions SET metadata='{"pause_collection":null,"current_product":{"product_id":"10000000-0000-0000-0000-000000000003","selected_options":{"milling":"partial"},"quantity":1}}' WHERE id='60000000-0000-0000-0000-000000000001';
INSERT INTO orders(id,order_number,payment_status,order_status,stripe_subscription_id) VALUES('20000000-0000-0000-0000-000000000091','paid unshipped','paid','processing','sub_fixture');
INSERT INTO order_items(id,order_id,product_id,selected_options,quantity,is_subscription) VALUES('30000000-0000-0000-0000-000000000091','20000000-0000-0000-0000-000000000091','10000000-0000-0000-0000-000000000003','{"milling":"partial"}',1,true);
SELECT id AS second FROM kg_delivery_slots WHERE plan_id=:'plan' AND shipping_date='2091-02-15' \gset
SELECT kg_link_delivery(:'second','30000000-0000-0000-0000-000000000091','verified second order');
UPDATE subscriptions SET status='canceled' WHERE id='60000000-0000-0000-0000-000000000001';
SELECT test_assert((SELECT sum(held_kg)=10.5 AND sum(used_kg)=5.5 FROM kg_movements WHERE accounting_version=2),'contract cancellation releases only uncreated future, retains paid order and shipped history');
UPDATE orders SET payment_status='refunded',order_status='cancelled' WHERE order_number IN ('sub cycle','paid unshipped');
SELECT test_assert((SELECT sum(held_kg)=0 AND sum(used_kg)=5.5 FROM kg_movements WHERE accounting_version=2),'unshipped refund releases, shipped refund never restocks');
-- Standard one-time orders also use milling and hold until shipped.
INSERT INTO orders(id,order_number,payment_status,order_status) VALUES('20000000-0000-0000-0000-000000000092','ordinary','pending','pending');
INSERT INTO order_items(id,order_id,product_id,quantity) VALUES('30000000-0000-0000-0000-000000000092','20000000-0000-0000-0000-000000000092','10000000-0000-0000-0000-000000000001',2);
SELECT test_assert((SELECT sum(held_kg)=11 FROM kg_movements WHERE item_id='30000000-0000-0000-0000-000000000092'),'ordinary order raw weight and quantity');
UPDATE orders SET payment_status='paid' WHERE order_number='ordinary';
SELECT test_assert((SELECT sum(held_kg)=11 AND sum(used_kg)=0 FROM kg_movements WHERE item_id='30000000-0000-0000-0000-000000000092'),'pending to paid is same hold');
SELECT test_assert(kg_raw_components('[{"season_id":"40000000-0000-0000-0000-000000000090","variety_key":"nikomaru","unit_kg":0.001,"milling":"partial"}]')->0->>'raw_unit_kg'='0.00105','milligram precision');
SELECT kg_confirm_raw_baseline('40000000-0000-0000-0000-000000000090','koshihikari',100,2,0,'explicit raw total, external use only');
SET ROLE authenticated;
SELECT test_assert((kg_report()->>'accounting_version')::integer=2,'admin v2 report');
SET test.uid='00000000-0000-0000-0000-000000000002';
SELECT test_assert(kg_report() IS NULL,'non-admin report refused');
RESET ROLE;
SELECT 'subscription kg integration passed' AS result;
SET test.uid='00000000-0000-0000-0000-000000000001';
INSERT INTO subscriptions(id,stripe_subscription_id,status,interval,next_billing_at) VALUES('60000000-0000-0000-0000-000000000002','sub_skip','active','quarterly','2091-02-09T20:00:00Z');
SELECT kg_save_plan('60000000-0000-0000-0000-000000000002','10000000-0000-0000-0000-000000000003','{"milling":"partial"}',1,'2090-11-15','verified skip fixture') AS skip_plan \gset
SELECT test_assert((SELECT count(*)=4 FROM kg_delivery_slots WHERE plan_id=:'skip_plan' AND NOT canceled),'quarterly November through October has four slots');
-- Existing skip rule is one month later regardless of the quarterly interval.
UPDATE subscriptions SET next_billing_at='2091-03-09T20:00:00Z',metadata=metadata||'{"skipped_until":"fixture-one-month-later"}' WHERE id='60000000-0000-0000-0000-000000000002';
SELECT test_assert((SELECT array_agg(shipping_date ORDER BY shipping_date)=ARRAY['2091-03-15'::date,'2091-06-15'::date,'2091-09-15'::date] FROM kg_delivery_slots WHERE plan_id=:'skip_plan' AND NOT canceled),'skip reanchors by one month, not one quarter');
UPDATE subscriptions SET interval='bimonthly' WHERE id='60000000-0000-0000-0000-000000000002';
SELECT test_assert((SELECT count(*)=4 FROM kg_delivery_slots WHERE plan_id=:'skip_plan' AND NOT canceled),'interval change recalculates from next verified anchor');
CREATE TEMP TABLE before_pause AS SELECT sum(held_kg) held FROM kg_movements WHERE accounting_version=2;
UPDATE subscriptions SET metadata=metadata||'{"pause_collection":{"behavior":"void"}}' WHERE id='60000000-0000-0000-0000-000000000002';
SELECT test_assert((SELECT issue IS NOT NULL FROM kg_contract_plans WHERE id=:'skip_plan'),'pause becomes explicit unresolved');
SELECT test_assert((SELECT sum(held_kg) FROM kg_movements WHERE accounting_version=2)=(SELECT held FROM before_pause),'unknown pause does not silently release holds');
UPDATE subscriptions SET metadata=(metadata-'pause_collection') WHERE id='60000000-0000-0000-0000-000000000002';
SELECT test_assert((SELECT issue LIKE '%未確認%' FROM kg_contract_plans WHERE id=:'skip_plan'),'missing pause snapshot unresolved');
UPDATE subscriptions SET metadata=metadata||'{"pause_collection":null,"current_product":{"product_id":"10000000-0000-0000-0000-000000000003","selected_options":{"milling":"partial"},"quantity":2}}' WHERE id='60000000-0000-0000-0000-000000000002';
SELECT test_assert((SELECT sum(quantity)=8 FROM kg_delivery_slots WHERE plan_id=:'skip_plan' AND NOT canceled),'future quantity change recalculates');
UPDATE subscriptions SET metadata=metadata||'{"cancel_at_period_end":true}' WHERE id='60000000-0000-0000-0000-000000000002';
SELECT test_assert((SELECT count(*)=0 FROM kg_delivery_slots WHERE plan_id=:'skip_plan' AND NOT canceled),'period cancellation releases uncreated predictions');
SELECT 'subscription skip / pause / interval assertions passed' AS result;
DO $$ BEGIN
 BEGIN
  PERFORM kg_link_delivery((SELECT id FROM kg_delivery_slots WHERE item_id='30000000-0000-0000-0000-000000000090'),'30000000-0000-0000-0000-000000000090','duplicate link');
  RAISE EXCEPTION 'FAIL: duplicate link accepted';
 EXCEPTION WHEN raise_exception THEN IF SQLERRM <> 'Delivery already linked or absent' THEN RAISE; END IF; END;
END $$;
INSERT INTO subscriptions(id,stripe_subscription_id,status,interval) VALUES('60000000-0000-0000-0000-000000000003','sub_multi','active','monthly');
INSERT INTO orders(id,order_number,payment_status,order_status,stripe_subscription_id) VALUES('20000000-0000-0000-0000-000000000093','multi','paid','processing','sub_multi');
INSERT INTO order_items(id,order_id,product_id,quantity,is_subscription) VALUES
 ('30000000-0000-0000-0000-000000000093','20000000-0000-0000-0000-000000000093','10000000-0000-0000-0000-000000000001',1,true),
 ('30000000-0000-0000-0000-000000000094','20000000-0000-0000-0000-000000000093','10000000-0000-0000-0000-000000000003',1,true);
DO $$ BEGIN
 BEGIN
  PERFORM kg_save_plan('60000000-0000-0000-0000-000000000003','10000000-0000-0000-0000-000000000001','{}',1,'2090-12-15','ambiguous contract');
  RAISE EXCEPTION 'FAIL: multiple contract items guessed';
 EXCEPTION WHEN raise_exception THEN IF SQLERRM NOT LIKE 'Multiple subscription items%' THEN RAISE; END IF; END;
END $$;
SELECT 'all v2 assertions passed' AS result;
