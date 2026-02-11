-- 目的: payment_intent_id をキーに orders が重複作成される不具合の根本対策
-- 1) 重複が既にある場合は「最新(created_atが最大)」を残して他を削除
-- 2) orders.payment_intent_id に UNIQUE 制約を追加（upsert(on_conflict=payment_intent_id) を有効化）
--
-- 注意:
-- - 削除される重複注文に紐づく order_items は先に削除します。
-- - 本番適用前に必ずバックアップ/検証を推奨します。

-- 1) 重複注文の検出・削除（payment_intent_id が同一で複数行ある場合）
WITH dup_groups AS (
  SELECT payment_intent_id
  FROM public.orders
  WHERE payment_intent_id IS NOT NULL
  GROUP BY payment_intent_id
  HAVING COUNT(*) > 1
),
keepers AS (
  -- 各 payment_intent_id で最新の注文を keeper とする
  SELECT DISTINCT ON (o.payment_intent_id)
    o.payment_intent_id,
    o.id AS keeper_id
  FROM public.orders o
  JOIN dup_groups d ON d.payment_intent_id = o.payment_intent_id
  ORDER BY o.payment_intent_id, o.created_at DESC
),
to_delete AS (
  SELECT o.id
  FROM public.orders o
  JOIN dup_groups d ON d.payment_intent_id = o.payment_intent_id
  JOIN keepers k ON k.payment_intent_id = o.payment_intent_id
  WHERE o.id <> k.keeper_id
)
DELETE FROM public.order_items
WHERE order_id IN (SELECT id FROM to_delete);

WITH dup_groups AS (
  SELECT payment_intent_id
  FROM public.orders
  WHERE payment_intent_id IS NOT NULL
  GROUP BY payment_intent_id
  HAVING COUNT(*) > 1
),
keepers AS (
  SELECT DISTINCT ON (o.payment_intent_id)
    o.payment_intent_id,
    o.id AS keeper_id
  FROM public.orders o
  JOIN dup_groups d ON d.payment_intent_id = o.payment_intent_id
  ORDER BY o.payment_intent_id, o.created_at DESC
)
DELETE FROM public.orders o
USING dup_groups d, keepers k
WHERE o.payment_intent_id = d.payment_intent_id
  AND k.payment_intent_id = o.payment_intent_id
  AND o.id <> k.keeper_id;

-- 2) UNIQUE 制約を追加（upsertのonConflictが正しく機能するために必須）
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'orders_payment_intent_id_key'
      AND conrelid = 'public.orders'::regclass
  ) THEN
    ALTER TABLE public.orders
      ADD CONSTRAINT orders_payment_intent_id_key UNIQUE (payment_intent_id);
  END IF;
END $$;


