-- 本番では通常実行しない。別途承認された緊急停止時だけ。
-- 完全なロールバックではない。履歴保持、停止時刻記録、停止期間の再照合が必須。
-- 以下の承認文字列を意図的に変更するまで何も変更せず停止する。
BEGIN;
SET LOCAL lock_timeout='5s';
DO $$ BEGIN
 IF 'NOT_APPROVED' <> 'STOP_KG_ORDER_TRIGGERS' THEN
  RAISE EXCEPTION 'STOP: read README, obtain approval, and replace NOT_APPROVED with STOP_KG_ORDER_TRIGGERS';
 END IF;
END $$;
ALTER TABLE public.order_items DISABLE TRIGGER kg_capture_item;
ALTER TABLE public.orders DISABLE TRIGGER kg_order_changed;
SELECT now() AS stopped_at, tgrelid::regclass AS table_name,tgname,tgenabled
FROM pg_trigger WHERE tgname IN ('kg_capture_item','kg_order_changed');
COMMIT;
