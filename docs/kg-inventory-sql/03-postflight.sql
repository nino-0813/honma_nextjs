-- ローカル検証版。本番適用は保留。締切年・玄米基準の初期値・既存注文との照合・本番スキーマを確認するまで適用 SQL は実行しない
-- 読み取り専用。新規構造・権限・トリガーを検証。実注文やメールは作らない。
BEGIN TRANSACTION READ ONLY;
DO $$
DECLARE name text; table_name text;
BEGIN
 FOREACH name IN ARRAY ARRAY['kg_product_specs','kg_item_snapshots','kg_movements','kg_legacy_reviews','kg_harvest_rules','kg_raw_baselines','kg_contract_plans','kg_delivery_slots'] LOOP
  IF NOT EXISTS(SELECT 1 FROM pg_class WHERE oid=to_regclass('public.'||name) AND relrowsecurity) THEN
   RAISE EXCEPTION 'STOP: missing kg table / RLS: %',name; END IF;
  IF has_table_privilege('anon','public.'||name,'SELECT,INSERT,UPDATE,DELETE') THEN RAISE EXCEPTION 'STOP: anon privilege on %',name; END IF;
 END LOOP;
 FOREACH name IN ARRAY ARRAY['kg_item_snapshots','kg_movements','kg_legacy_reviews'] LOOP
  IF has_table_privilege('authenticated','public.'||name,'INSERT,UPDATE,DELETE') THEN RAISE EXCEPTION 'STOP: direct ledger mutation allowed: %',name; END IF;
 END LOOP;
 FOR name,table_name IN SELECT * FROM (VALUES ('kg_capture_item','order_items'),('kg_order_changed','orders'),('kg_validate_spec','kg_product_specs'),('kg_subscription_changed','subscriptions'),('kg_spec_changed','kg_product_specs')) t(n,r) LOOP
  IF NOT EXISTS(SELECT 1 FROM pg_trigger WHERE tgrelid=to_regclass('public.'||table_name) AND tgname=name AND tgenabled='O') THEN
   RAISE EXCEPTION 'STOP: missing/disabled trigger %.%',table_name,name; END IF;
 END LOOP;
 IF to_regprocedure('public.kg_report()') IS NULL THEN RAISE EXCEPTION 'STOP: report missing'; END IF;
 IF has_function_privilege('anon','public.kg_report()','EXECUTE') OR has_function_privilege('anon','public.kg_sync_item(uuid)','EXECUTE')
 OR has_function_privilege('authenticated','public.kg_sync_item(uuid)','EXECUTE') THEN RAISE EXCEPTION 'STOP: unexpected function access'; END IF;
END $$;
SELECT c.relname,c.relrowsecurity,c.relforcerowsecurity FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
WHERE n.nspname='public' AND c.relname IN ('kg_product_specs','kg_item_snapshots','kg_movements','kg_legacy_reviews','kg_harvest_rules','kg_raw_baselines','kg_contract_plans','kg_delivery_slots');
SELECT tgrelid::regclass AS table_name,tgname,tgenabled,tgfoid::regprocedure AS function,tgtype AS event_flags
FROM pg_trigger WHERE NOT tgisinternal AND tgname IN ('kg_capture_item','kg_order_changed','kg_validate_spec','kg_subscription_changed','kg_spec_changed');
SELECT tablename,policyname,roles,cmd,md5(coalesce(qual,'')) AS using_expression_hash,md5(coalesce(with_check,'')) AS check_expression_hash FROM pg_policies WHERE schemaname='public' AND tablename IN ('kg_product_specs','kg_item_snapshots','kg_movements','kg_legacy_reviews','kg_harvest_rules','kg_raw_baselines','kg_contract_plans','kg_delivery_slots');
SELECT p.oid::regprocedure AS function,p.prosecdef AS security_definer,p.proconfig,p.proacl
FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public' AND p.proname IN ('kg_report','kg_sync_item','kg_capture_item','kg_order_changed','kg_validate_components','kg_validate_spec','kg_record_movement','kg_resolve_item','kg_review_legacy','kg_raw_components','kg_rebuild_plan','kg_forecast_delta','kg_save_plan','kg_link_delivery','kg_confirm_raw_baseline','kg_save_harvest_rule');
SELECT table_name,grantee,privilege_type FROM information_schema.role_table_grants WHERE table_schema='public' AND table_name IN ('kg_product_specs','kg_item_snapshots','kg_movements','kg_legacy_reviews','kg_harvest_rules','kg_raw_baselines','kg_contract_plans','kg_delivery_slots');
SELECT 'Postflight structural checks passed. Test administrator and non-administrator access in staging; this does not certify production compatibility.' AS result;
COMMIT;
