-- マイグレーション: 顧客リスト（CRM台帳）機能の追加
-- Supabase SQL Editorで実行してください
-- 既存の「顧客管理」（orders/profilesから自動集計）とは別に、
-- 自社サイト・他プラットフォーム(BASE等)のお客様を手動で一元管理するための台帳。

CREATE TABLE IF NOT EXISTS public.customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  last_name TEXT NOT NULL,
  first_name TEXT,
  email TEXT,
  platform TEXT DEFAULT 'website', -- 'website' | 'base' | 'other'
  birth_year INTEGER,
  gender TEXT, -- '男性' | '女性' | 'その他' | '未回答'
  target_categories TEXT[] DEFAULT '{}',
  first_purchase_rice_date DATE,
  first_purchase_shiitake_date DATE,
  latest_purchase_rice_date DATE,
  latest_purchase_shiitake_date DATE,
  newsletter_opt_in BOOLEAN DEFAULT false,
  referrer_name TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.customer_sns_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  sns_type TEXT NOT NULL,
  account_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_sns_accounts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage customers" ON public.customers;
CREATE POLICY "Admins can manage customers"
  ON public.customers
  FOR ALL
  USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can manage customer_sns_accounts" ON public.customer_sns_accounts;
CREATE POLICY "Admins can manage customer_sns_accounts"
  ON public.customer_sns_accounts
  FOR ALL
  USING (public.is_admin());

CREATE INDEX IF NOT EXISTS idx_customers_email ON public.customers(email);
CREATE INDEX IF NOT EXISTS idx_customer_sns_accounts_customer_id ON public.customer_sns_accounts(customer_id);
