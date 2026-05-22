-- 定期購入設定カラムを products テーブルに追加
-- 実行: Supabase ダッシュボード > SQL Editor で実行

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS subscription_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS subscription_discount_percent integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS subscription_intervals jsonb NOT NULL DEFAULT '[]'::jsonb;

COMMENT ON COLUMN products.subscription_enabled IS '定期購入を有効にするか';
COMMENT ON COLUMN products.subscription_discount_percent IS '定期購入時の割引率(%)';
COMMENT ON COLUMN products.subscription_intervals IS '提供する配送間隔の配列。例: ["monthly","bimonthly","quarterly"]';
