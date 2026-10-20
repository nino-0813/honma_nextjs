-- 読み取り専用。既存SupabaseのSQL Editorで構造のみ確認する。
-- エラー・差異があれば中止。顧客行、秘密情報、関数本文は取得しない。
BEGIN TRANSACTION READ ONLY;
DO $$
DECLARE r record; actual text;
BEGIN
 FOR r IN SELECT * FROM (VALUES
  ('profiles','id','uuid'),('profiles','is_admin','boolean'),
  ('products','id','uuid'),('products','title','text'),
  ('orders','id','uuid'),('orders','order_number','text'),('orders','payment_status','text'),('orders','order_status','text'),
  ('order_items','id','uuid'),('order_items','order_id','uuid'),('order_items','product_id','uuid'),
  ('order_items','product_title','text'),('order_items','selected_options','jsonb'),('order_items','quantity','integer'),
  ('order_items','shipping_status','text'),('order_items','is_subscription','boolean'),
  ('inventory_seasons','id','uuid'),('inventory_seasons','harvest_year','integer'),('inventory_seasons','label','text'),
  ('inventory_seasons','starts_on','date'),('inventory_seasons','ends_on','date'),
  ('inventory_varieties','season_id','uuid'),('inventory_varieties','variety_key','text'),
  ('inventory_varieties','harvested_kg','numeric'),('inventory_varieties','reserved_kg','numeric'),
  ('inventory_external_sales','season_id','uuid'),('inventory_external_sales','variety_key','text'),
  ('inventory_external_sales','quantity_kg','numeric')
 ) AS expected(table_name,column_name,type_name) LOOP
  SELECT t.typname INTO actual FROM pg_attribute a JOIN pg_type t ON t.oid=a.atttypid
  WHERE a.attrelid=to_regclass('public.'||r.table_name) AND a.attname=r.column_name AND NOT a.attisdropped;
  IF actual IS DISTINCT FROM (CASE r.type_name WHEN 'boolean' THEN 'bool' WHEN 'integer' THEN 'int4' ELSE r.type_name END) THEN
   RAISE EXCEPTION 'STOP: %.% expected %, actual %',r.table_name,r.column_name,r.type_name,actual;
  END IF;
 END LOOP;
 IF to_regprocedure('auth.uid()') IS NULL THEN RAISE EXCEPTION 'STOP: auth.uid() absent'; END IF;
 IF NOT EXISTS(SELECT 1 FROM pg_roles WHERE rolname='authenticated') OR NOT EXISTS(SELECT 1 FROM pg_roles WHERE rolname='anon') THEN
  RAISE EXCEPTION 'STOP: Supabase roles absent'; END IF;
 IF EXISTS(SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
   WHERE n.nspname='public' AND c.relname IN ('profiles','products','orders','order_items','inventory_seasons','inventory_varieties','inventory_external_sales') AND NOT c.relrowsecurity)
 THEN RAISE EXCEPTION 'STOP: expected existing RLS is disabled; do not change policies automatically'; END IF;
 IF EXISTS(SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND c.relname IN ('kg_product_specs','kg_item_snapshots','kg_movements','kg_legacy_reviews'))
 OR EXISTS(SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public' AND p.proname IN ('kg_report','kg_sync_item','kg_capture_item','kg_order_changed','kg_validate_components','kg_validate_spec','kg_record_movement','kg_resolve_item','kg_review_legacy'))
 THEN RAISE EXCEPTION 'STOP: kg objects already exist; migration is not rerunnable'; END IF;
END $$;
SELECT c.relname AS table_name,a.attname AS column_name,format_type(a.atttypid,a.atttypmod) AS type,a.attnotnull AS not_null
FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace JOIN pg_attribute a ON a.attrelid=c.oid
WHERE n.nspname='public' AND c.relname IN ('profiles','products','orders','order_items','inventory_seasons','inventory_varieties','inventory_external_sales') AND a.attnum>0 AND NOT a.attisdropped
ORDER BY c.relname,a.attnum;
SELECT conrelid::regclass AS table_name,conname,contype,pg_get_constraintdef(oid) AS definition
FROM pg_constraint WHERE conrelid IN (to_regclass('public.profiles'),to_regclass('public.products'),to_regclass('public.orders'),to_regclass('public.order_items'),to_regclass('public.inventory_seasons'),to_regclass('public.inventory_varieties'),to_regclass('public.inventory_external_sales')) ORDER BY 1,2;
SELECT tgrelid::regclass AS table_name,tgname,tgenabled,tgfoid::regprocedure AS function,tgtype AS event_flags
FROM pg_trigger WHERE NOT tgisinternal AND tgrelid IN (to_regclass('public.orders'),to_regclass('public.order_items')) ORDER BY 1,2;
SELECT c.relname,c.relrowsecurity,c.relforcerowsecurity FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
WHERE n.nspname='public' AND c.relname IN ('profiles','products','orders','order_items','inventory_seasons','inventory_varieties','inventory_external_sales');
SELECT schemaname,tablename,policyname,roles,cmd,md5(coalesce(qual,'')) AS using_expression_hash,md5(coalesce(with_check,'')) AS check_expression_hash FROM pg_policies
WHERE schemaname='public' AND tablename IN ('profiles','products','orders','order_items','inventory_seasons','inventory_varieties','inventory_external_sales');
SELECT table_name,grantee,privilege_type FROM information_schema.role_table_grants
WHERE table_schema='public' AND table_name IN ('profiles','products','orders','order_items','inventory_seasons','inventory_varieties','inventory_external_sales') ORDER BY 1,2,3;
SELECT 'Structural checks passed. Manual review of constraints, triggers, RLS and staging tests is still required.' AS result;
COMMIT;
