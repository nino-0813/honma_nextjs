-- 読み取り専用。v1適用済み（または02実行後）の追加仕様準備確認。
BEGIN TRANSACTION READ ONLY;
DO $$ DECLARE r record; actual text; BEGIN
 IF to_regclass('public.kg_movements') IS NULL THEN RAISE EXCEPTION 'STOP: v1 migration missing'; END IF;
 FOR r IN SELECT * FROM (VALUES
 ('subscriptions','id','uuid'),('subscriptions','stripe_subscription_id','text'),('subscriptions','status','text'),
 ('subscriptions','interval','text'),('subscriptions','metadata','jsonb'),('subscriptions','next_billing_at','timestamptz'),
 ('orders','stripe_subscription_id','text'),('order_items','is_subscription','bool')
 ) t(tbl,col,typ) LOOP
  SELECT t.typname INTO actual FROM pg_attribute a JOIN pg_type t ON t.oid=a.atttypid WHERE a.attrelid=to_regclass('public.'||r.tbl) AND a.attname=r.col AND NOT a.attisdropped;
  IF actual IS DISTINCT FROM r.typ THEN RAISE EXCEPTION 'STOP: %.% expected %, actual %',r.tbl,r.col,r.typ,actual; END IF;
 END LOOP;
 IF NOT EXISTS(SELECT 1 FROM pg_class WHERE oid=to_regclass('public.subscriptions') AND relrowsecurity) THEN RAISE EXCEPTION 'STOP: existing subscription RLS missing'; END IF;
 IF to_regclass('public.kg_contract_plans') IS NOT NULL OR EXISTS(SELECT 1 FROM pg_attribute WHERE attrelid='public.kg_movements'::regclass AND attname='accounting_version') THEN RAISE EXCEPTION 'STOP: v2 already exists; no repeat'; END IF;
END $$;
SELECT column_name,data_type,is_nullable FROM information_schema.columns WHERE table_schema='public' AND table_name='subscriptions' ORDER BY ordinal_position;
SELECT policyname,roles,cmd,md5(coalesce(qual,'')) AS using_hash FROM pg_policies WHERE schemaname='public' AND tablename='subscriptions';
SELECT grantee,privilege_type FROM information_schema.role_table_grants WHERE table_schema='public' AND table_name='subscriptions';
SELECT tgname,tgenabled,tgfoid::regprocedure FROM pg_trigger WHERE tgrelid='public.subscriptions'::regclass AND NOT tgisinternal;
COMMIT;
