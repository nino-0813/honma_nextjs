-- マイグレーション: order_itemsに商品ごとの発送ステータス・配送会社・伝票番号を追加
-- Supabase SQL Editorで実行してください
-- orders.order_status（支払い/キャンセル等の注文全体のライフサイクル）はそのまま残す。
-- こちらは商品明細ごとの発送状況を個別管理するための追加カラム。

ALTER TABLE public.order_items
ADD COLUMN IF NOT EXISTS shipping_status TEXT NOT NULL DEFAULT 'before_shipping'
  CHECK (shipping_status IN ('before_shipping', 'shipped'));

ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS shipping_carrier TEXT;
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS tracking_number TEXT;
