-- ローカル検証版。本番適用は保留。締切年・玄米基準の初期値・既存注文との照合・本番スキーマを確認するまで適用 SQL は実行しない
-- 通常実行しない。停止期間の明細・出荷証拠・確保差分を照合した後、別途承認して再開。
-- ENABLEだけでは停止期間のイベントは再生されない。READMEを必ず読む。
BEGIN;
SET LOCAL lock_timeout='5s';
DO $$ BEGIN
 IF 'NOT_APPROVED' <> 'RESUME_KG_AFTER_RECONCILIATION' THEN
  RAISE EXCEPTION 'STOP: reconcile the stopped interval, obtain approval, and replace NOT_APPROVED with RESUME_KG_AFTER_RECONCILIATION';
 END IF;
END $$;
ALTER TABLE public.order_items ENABLE TRIGGER kg_capture_item;
ALTER TABLE public.orders ENABLE TRIGGER kg_order_changed;
ALTER TABLE public.subscriptions ENABLE TRIGGER kg_subscription_changed;
ALTER TABLE public.kg_product_specs ENABLE TRIGGER kg_spec_changed;
SELECT now() AS resumed_at,tgrelid::regclass AS table_name,tgname,tgenabled
FROM pg_trigger WHERE tgname IN ('kg_capture_item','kg_order_changed','kg_subscription_changed','kg_spec_changed');
COMMIT;
