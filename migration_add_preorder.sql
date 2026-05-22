-- 予約販売機能のためのカラム追加
-- 実行: Supabase ダッシュボード > SQL Editor で実行

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS scheduled_shipping_date date;

COMMENT ON COLUMN products.scheduled_shipping_date IS '発送開始予定日。販売開始日時 <= 今 < この日 の場合、予約商品として扱う。';
