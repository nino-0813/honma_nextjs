-- 配送先情報（氏名・電話番号）を保存するためのカラムを追加
-- 購入者情報と配送先情報が異なる場合に使用

ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS shipping_first_name TEXT,
ADD COLUMN IF NOT EXISTS shipping_last_name TEXT,
ADD COLUMN IF NOT EXISTS shipping_phone TEXT;

-- コメントを追加（オプション）
COMMENT ON COLUMN public.orders.shipping_first_name IS '配送先の名（購入者情報と異なる場合）';
COMMENT ON COLUMN public.orders.shipping_last_name IS '配送先の姓（購入者情報と異なる場合）';
COMMENT ON COLUMN public.orders.shipping_phone IS '配送先の電話番号（購入者情報と異なる場合）';

