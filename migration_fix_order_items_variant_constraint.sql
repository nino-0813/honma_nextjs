-- 目的:
-- - 同一注文内で「同じ商品IDの別種類（例: 玄米/白米）」を別行で保存できるようにする
-- - 旧制約 UNIQUE(order_id, product_id) が残っている環境で insert 失敗する問題を解消

BEGIN;

-- 1) 旧ユニーク制約を削除（名前が環境で異なる可能性に備えて複数パターンを実施）
ALTER TABLE public.order_items DROP CONSTRAINT IF EXISTS order_items_order_id_product_id_key;
ALTER TABLE public.order_items DROP CONSTRAINT IF EXISTS order_items_order_product_unique;

-- 2) 旧ユニークインデックスを削除（存在する場合のみ）
DROP INDEX IF EXISTS public.order_items_order_id_product_id_key;
DROP INDEX IF EXISTS public.order_items_order_product_unique_idx;

-- 3) 新しいユニーク制約を追加
--    NULL を含む variant でも重複を防げるよう expression index で管理
--    ※ 同一商品・同一種類の重複行を防ぎつつ、種類違いは別行で保持
CREATE UNIQUE INDEX IF NOT EXISTS order_items_order_product_variant_uq
  ON public.order_items (order_id, product_id, COALESCE(variant, ''));

COMMIT;
