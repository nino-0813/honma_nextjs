-- マイグレーション: 紹介者を確実に紐付けるための参照列を追加
-- Supabase SQL Editorで実行してください
-- referrer_name（表示用の氏名文字列）だけだと同姓同名等で誤集計されるため、
-- 紹介者のcustomers.idそのものを保存し、紹介実績の集計に使う。

ALTER TABLE public.customers
ADD COLUMN IF NOT EXISTS referred_by_customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_customers_referred_by ON public.customers(referred_by_customer_id);
