-- マイグレーション: 商品ごとの税率（8% または 10%）を追加
-- Supabase SQL Editorで実行してください
-- order_items.tax_rate は注文時点の税率スナップショット（商品の税率を後で変更しても過去の注文には影響しない）

ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS tax_rate INTEGER NOT NULL DEFAULT 10;

ALTER TABLE public.order_items
ADD COLUMN IF NOT EXISTS tax_rate INTEGER NOT NULL DEFAULT 10;
