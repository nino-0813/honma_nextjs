-- ordersテーブルに購入者情報（請求先住所）のカラムを追加
-- チェックアウトページの購入者情報を保存するため

ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS billing_postal_code TEXT,
ADD COLUMN IF NOT EXISTS billing_prefecture TEXT,
ADD COLUMN IF NOT EXISTS billing_city TEXT,
ADD COLUMN IF NOT EXISTS billing_address TEXT,
ADD COLUMN IF NOT EXISTS billing_building TEXT,
ADD COLUMN IF NOT EXISTS billing_country TEXT DEFAULT 'JP';

-- コメントを追加（オプション）
COMMENT ON COLUMN public.orders.billing_postal_code IS '購入者情報の郵便番号（請求先住所）';
COMMENT ON COLUMN public.orders.billing_prefecture IS '購入者情報の都道府県（請求先住所）';
COMMENT ON COLUMN public.orders.billing_city IS '購入者情報の市区町村（請求先住所）';
COMMENT ON COLUMN public.orders.billing_address IS '購入者情報の町名・番地（請求先住所）';
COMMENT ON COLUMN public.orders.billing_building IS '購入者情報の建物名・部屋番号（請求先住所）';
COMMENT ON COLUMN public.orders.billing_country IS '購入者情報の国（請求先住所）';

