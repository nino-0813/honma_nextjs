-- マイグレーション: 顧客ごとの紹介コード（紹介URL発行用）を追加
-- Supabase SQL Editorで実行してください

ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS referral_code TEXT;

CREATE OR REPLACE FUNCTION generate_customer_referral_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.referral_code IS NULL THEN
    NEW.referral_code := substr(replace(uuid_generate_v4()::text, '-', ''), 1, 8);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_customer_referral_code ON public.customers;
CREATE TRIGGER set_customer_referral_code
  BEFORE INSERT ON public.customers
  FOR EACH ROW
  EXECUTE FUNCTION generate_customer_referral_code();

-- 既存行にもコードを発行
UPDATE public.customers SET referral_code = substr(replace(uuid_generate_v4()::text, '-', ''), 1, 8)
WHERE referral_code IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_customers_referral_code ON public.customers(referral_code);
