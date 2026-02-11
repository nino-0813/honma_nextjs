-- ==========================================
-- IKEVEGE Supabase Database Schema
-- ==========================================

-- 1. 拡張機能の有効化
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. 列挙型の定義
DO $$ BEGIN
    CREATE TYPE order_status AS ENUM ('pending', 'processing', 'shipped', 'delivered', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE payment_status AS ENUM ('pending', 'paid', 'failed', 'refunded');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ==========================================
-- テーブル定義
-- ==========================================

-- 3. profiles テーブル (ユーザー情報)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  postal_code TEXT,
  prefecture TEXT,
  address TEXT,
  city TEXT,
  building TEXT,
  country TEXT DEFAULT 'JP',
  is_admin BOOLEAN DEFAULT false, -- 管理者フラグ
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. products テーブル (商品情報)
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  handle TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  price INTEGER NOT NULL,
  image TEXT, -- メイン画像URL (互換性のため維持)
  images TEXT[] DEFAULT '{}', -- 複数画像URL
  category TEXT NOT NULL,
  subcategory TEXT, -- サブカテゴリー (コシヒカリ等)
  categories TEXT[] DEFAULT '{}', -- カテゴリー（複数選択対応）
  subcategories TEXT[] DEFAULT '{}', -- サブカテゴリー（複数選択対応）
  stock INTEGER DEFAULT 0, -- 在庫数
  sku TEXT, -- 商品番号
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'draft', 'archived')), -- 公開ステータス
  has_variants BOOLEAN DEFAULT false, -- バリエーション有無
  variants TEXT[] DEFAULT '{}', -- 旧形式バリエーション（互換性のため維持）
  variants_config JSONB DEFAULT '[]'::jsonb, -- 新形式バリエーション設定（在庫/価格調整など）
  is_active BOOLEAN DEFAULT true, -- 公開状態
  sold_out BOOLEAN DEFAULT false, -- 在庫切れフラグ (互換性のため維持、基本はstockで判断)
  display_order INTEGER DEFAULT 0, -- 表示順序（小さい順に表示）
  is_visible BOOLEAN DEFAULT true, -- 表示/非表示フラグ
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4-1. products: 既存環境向けに不足カラムを追加（安全に実行可能）
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS has_variants BOOLEAN DEFAULT false;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS variants TEXT[] DEFAULT '{}';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS variants_config JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS categories TEXT[] DEFAULT '{}';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS subcategories TEXT[] DEFAULT '{}';

-- products: 互換性のために status の値制約を付与（既にある場合は上書きしない）
DO $$ BEGIN
  ALTER TABLE public.products
    ADD CONSTRAINT products_status_check
    CHECK (status IN ('active', 'draft', 'archived'));
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- products: SKU検索のためのインデックス
CREATE INDEX IF NOT EXISTS idx_products_sku ON public.products(sku);

-- 5. orders テーブル (注文情報)
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number TEXT UNIQUE, -- 自動生成される注文番号 (ORD-YYMMDD-XXXX)
  auth_user_id UUID REFERENCES auth.users(id), -- ログインユーザーの場合
  email TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  phone TEXT,
  shipping_address TEXT,
  shipping_city TEXT,
  shipping_postal_code TEXT,
  shipping_country TEXT DEFAULT 'JP',
  shipping_method TEXT,
  subtotal INTEGER NOT NULL,
  shipping_cost INTEGER NOT NULL,
  total INTEGER NOT NULL,
  payment_status TEXT DEFAULT 'pending',
  payment_intent_id TEXT,
  payment_method TEXT,
  paid_at TIMESTAMP WITH TIME ZONE,
  order_status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. order_items テーブル (注文明細)
CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id),
  product_title TEXT NOT NULL,
  product_price INTEGER NOT NULL,
  product_image TEXT,
  variant TEXT,
  selected_options JSONB,
  quantity INTEGER NOT NULL,
  line_total INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- orders/order_items: 既存環境向けに不足カラムを追加
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS paid_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS discount_amount INTEGER DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS coupon_id UUID REFERENCES public.coupons(id) ON DELETE SET NULL;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivery_time_slot TEXT; -- 配送時間希望
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS notes TEXT; -- 備考
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS variant TEXT;
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS selected_options JSONB;

-- payment_intent_id はWebhook/重複防止に使うためユニーク化（NULLは複数OK）
-- NOTE: PostgREST の upsert(on_conflict=payment_intent_id) は「UNIQUE制約/インデックス」を要求するが、
--       部分インデックス（WHERE ...）だと認識されず 42P10 になる場合があるため、UNIQUE制約を付与する。
DO $$ BEGIN
  ALTER TABLE public.orders
    ADD CONSTRAINT orders_payment_intent_id_key UNIQUE (payment_intent_id);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Stripe webhook idempotency
CREATE TABLE IF NOT EXISTS public.stripe_webhook_events (
  event_id TEXT PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. inquiries テーブル (お問い合わせ)
CREATE TABLE IF NOT EXISTS public.inquiries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  company_name TEXT,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'unread', -- 'unread', 'read', 'replied'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- inquiries: 既存環境向けに不足カラムを追加（安全に実行可能）
ALTER TABLE public.inquiries ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.inquiries ADD COLUMN IF NOT EXISTS company_name TEXT;

-- ==========================================
-- 追加機能テーブル（統合版）
-- ==========================================

-- 8. shipping_methods テーブル (発送方法)
CREATE TABLE IF NOT EXISTS public.shipping_methods (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL, -- 発送方法名（例：通常料金/クール便料金）
  box_size INTEGER, -- 互換性のため残す（将来的に不使用でもOK）
  max_weight_kg NUMERIC(5, 2),
  max_items_per_box INTEGER,
  fee_type TEXT NOT NULL DEFAULT 'uniform', -- 'uniform' / 'area' / 'size'
  area_fees JSONB DEFAULT '{}'::jsonb,
  size_fees JSONB DEFAULT '{}'::jsonb,
  uniform_fee INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. product_shipping_methods テーブル (商品×発送方法)
CREATE TABLE IF NOT EXISTS public.product_shipping_methods (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  shipping_method_id UUID NOT NULL REFERENCES public.shipping_methods(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(product_id, shipping_method_id)
);

CREATE INDEX IF NOT EXISTS idx_product_shipping_methods_product_id ON public.product_shipping_methods(product_id);
CREATE INDEX IF NOT EXISTS idx_product_shipping_methods_shipping_method_id ON public.product_shipping_methods(shipping_method_id);

-- 10. blog_articles テーブル（ブログ/Note連携）
CREATE TABLE IF NOT EXISTS public.blog_articles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  excerpt TEXT,
  image_url TEXT,
  note_url TEXT UNIQUE,
  published_at TIMESTAMP WITH TIME ZONE,
  is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_blog_articles_published_at ON public.blog_articles(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_blog_articles_is_published ON public.blog_articles(is_published);

-- ==========================================
-- クーポン（割引コード）管理
-- ==========================================
CREATE TABLE IF NOT EXISTS public.coupons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  discount_type TEXT NOT NULL DEFAULT 'percentage' CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value INTEGER NOT NULL DEFAULT 0, -- percentage: 1-100, fixed: 円
  is_active BOOLEAN NOT NULL DEFAULT true,
  starts_at TIMESTAMP WITH TIME ZONE,
  ends_at TIMESTAMP WITH TIME ZONE,
  usage_count INTEGER NOT NULL DEFAULT 0,
  usage_limit INTEGER, -- 発行/使用上限（任意）
  min_order_amount INTEGER, -- 最低購入金額（任意）
  once_per_user BOOLEAN NOT NULL DEFAULT false, -- 1人1回制限
  applies_to_all BOOLEAN NOT NULL DEFAULT true, -- 対象商品: 全商品
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 既存環境向けに不足カラムを追加（安全に実行可能）
ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS code TEXT;
ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS discount_type TEXT DEFAULT 'percentage';
ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS discount_value INTEGER DEFAULT 0;
ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS starts_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS ends_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS usage_count INTEGER DEFAULT 0;
ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS usage_limit INTEGER;
ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS min_order_amount INTEGER;
ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS once_per_user BOOLEAN DEFAULT false;
ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS applies_to_all BOOLEAN DEFAULT true;

-- 対象商品（クーポン×商品）
CREATE TABLE IF NOT EXISTS public.coupon_products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  coupon_id UUID NOT NULL REFERENCES public.coupons(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(coupon_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_coupon_products_coupon_id ON public.coupon_products(coupon_id);
CREATE INDEX IF NOT EXISTS idx_coupon_products_product_id ON public.coupon_products(product_id);

-- updated_at トリガー（coupons）
DROP TRIGGER IF EXISTS update_coupons_updated_at ON public.coupons;
CREATE TRIGGER update_coupons_updated_at
  BEFORE UPDATE ON public.coupons
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX IF NOT EXISTS idx_blog_articles_note_url ON public.blog_articles(note_url);

-- ==========================================
-- 関数とトリガー
-- ==========================================

-- updated_at を自動更新する関数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- トリガーの適用 (存在しない場合のみ作成するロジックが必要だが、CREATE TRIGGER IF NOT EXISTSはPostgresでサポートされていないためDROPして作成)
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_products_updated_at ON products;
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_orders_updated_at ON orders;
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_shipping_methods_updated_at ON shipping_methods;
CREATE TRIGGER update_shipping_methods_updated_at BEFORE UPDATE ON shipping_methods FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_blog_articles_updated_at ON blog_articles;
CREATE TRIGGER update_blog_articles_updated_at BEFORE UPDATE ON blog_articles FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- 新規ユーザー登録時にプロフィールを自動作成する関数
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ユーザー作成トリガー
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 注文番号を自動生成する関数
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS trigger AS $$
BEGIN
  -- ORD-YYMMDD-XXXX (ランダム4桁)
  NEW.order_number := 'ORD-' || to_char(now(), 'YYMMDD') || '-' || floor(random() * 9000 + 1000);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 注文番号生成トリガー
DROP TRIGGER IF EXISTS set_order_number ON orders;
CREATE TRIGGER set_order_number
  BEFORE INSERT ON orders
  FOR EACH ROW
  WHEN (NEW.order_number IS NULL)
  EXECUTE FUNCTION generate_order_number();

-- 管理者権限チェック関数 (RLSで使用)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid()
    AND is_admin = true
  );
END;
$$;

-- ==========================================
-- RLS (Row Level Security) ポリシー
-- ==========================================

-- RLSの有効化
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipping_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_shipping_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe_webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupon_products ENABLE ROW LEVEL SECURITY;

-- Profiles ポリシー
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
CREATE POLICY "Users can read own profile" ON profiles FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Admins can read all profiles" ON profiles;
CREATE POLICY "Admins can read all profiles" ON profiles FOR SELECT USING (public.is_admin());

-- Products ポリシー
DROP POLICY IF EXISTS "Public can view active products" ON products;
-- 公開条件はDB側で強制（漏洩防止）
CREATE POLICY "Public can view active products"
  ON products
  FOR SELECT
  USING (
    is_active = true
    AND (is_visible IS NULL OR is_visible = true)
    AND (status IS NULL OR status = 'active')
  );

DROP POLICY IF EXISTS "Admins can manage products" ON products;
CREATE POLICY "Admins can manage products" ON products FOR ALL USING (public.is_admin());

-- Orders ポリシー
DROP POLICY IF EXISTS "Users can read own orders" ON orders;
CREATE POLICY "Users can read own orders" ON orders FOR SELECT USING (auth_user_id = auth.uid());

DROP POLICY IF EXISTS "Users can create orders" ON orders;
-- 注文作成はログイン必須 + 自分のauth_user_idのみ許可（Checkoutがログイン必須のため）
CREATE POLICY "Users can create orders"
  ON orders
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND auth_user_id = auth.uid()
    AND email IS NOT NULL
    AND length(email) > 3
    AND first_name IS NOT NULL
    AND length(first_name) > 0
    AND last_name IS NOT NULL
    AND length(last_name) > 0
    AND subtotal IS NOT NULL
    AND subtotal >= 0
    AND shipping_cost IS NOT NULL
    AND shipping_cost >= 0
    AND total IS NOT NULL
    AND total > 0
  );

DROP POLICY IF EXISTS "Admins can manage orders" ON orders;
CREATE POLICY "Admins can manage orders" ON orders FOR ALL USING (public.is_admin());

-- Order Items ポリシー
DROP POLICY IF EXISTS "Users can read own order items" ON order_items;
CREATE POLICY "Users can read own order items" ON order_items FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM orders
    WHERE orders.id = order_items.order_id
    AND (orders.auth_user_id = auth.uid() OR public.is_admin())
  )
);

DROP POLICY IF EXISTS "Users can create order items" ON order_items;
-- 注文明細の作成は「自分の注文」に紐づく場合のみ許可
CREATE POLICY "Users can create order items"
  ON order_items
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
        AND (orders.auth_user_id = auth.uid() OR public.is_admin())
    )
  );

-- Inquiries ポリシー
DROP POLICY IF EXISTS "Admins can read inquiries" ON inquiries;
CREATE POLICY "Admins can read inquiries" ON inquiries FOR SELECT USING (public.is_admin());

DROP POLICY IF EXISTS "Public can create inquiries" ON inquiries;
CREATE POLICY "Public can create inquiries" ON inquiries FOR INSERT WITH CHECK (true);

-- Stripe webhook events: 管理者のみ閲覧/管理
DROP POLICY IF EXISTS "Admins can manage stripe webhook events" ON stripe_webhook_events;
CREATE POLICY "Admins can manage stripe webhook events"
  ON stripe_webhook_events
  FOR ALL
  USING (public.is_admin());

-- Shipping Methods ポリシー（閲覧: 公開 / 変更: 管理者のみ）
DROP POLICY IF EXISTS "Anyone can view shipping methods" ON shipping_methods;
CREATE POLICY "Anyone can view shipping methods"
  ON shipping_methods
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Admins can manage shipping methods" ON shipping_methods;
CREATE POLICY "Admins can manage shipping methods"
  ON shipping_methods
  FOR ALL
  USING (public.is_admin());

-- coupons / coupon_products: 管理者のみ操作可能
DROP POLICY IF EXISTS "Admins can manage coupons" ON public.coupons;
CREATE POLICY "Admins can manage coupons"
  ON public.coupons
  FOR ALL
  USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can manage coupon products" ON public.coupon_products;
CREATE POLICY "Admins can manage coupon products"
  ON public.coupon_products
  FOR ALL
  USING (public.is_admin());

-- ProductShippingMethods ポリシー（閲覧: 公開 / 変更: 管理者のみ）
DROP POLICY IF EXISTS "Anyone can view product shipping methods" ON product_shipping_methods;
CREATE POLICY "Anyone can view product shipping methods"
  ON product_shipping_methods
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Admins can manage product shipping methods" ON product_shipping_methods;
CREATE POLICY "Admins can manage product shipping methods"
  ON product_shipping_methods
  FOR ALL
  USING (public.is_admin());

-- Blog Articles ポリシー（公開記事: 誰でも / 全管理: 管理者のみ）
DROP POLICY IF EXISTS "Anyone can view published articles" ON blog_articles;
CREATE POLICY "Anyone can view published articles"
  ON blog_articles
  FOR SELECT
  USING (is_published = true);

DROP POLICY IF EXISTS "Admins can view all articles" ON blog_articles;
CREATE POLICY "Admins can view all articles"
  ON blog_articles
  FOR SELECT
  USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can insert articles" ON blog_articles;
CREATE POLICY "Admins can insert articles"
  ON blog_articles
  FOR INSERT
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins can update articles" ON blog_articles;
CREATE POLICY "Admins can update articles"
  ON blog_articles
  FOR UPDATE
  USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can delete articles" ON blog_articles;
CREATE POLICY "Admins can delete articles"
  ON blog_articles
  FOR DELETE
  USING (public.is_admin());

-- ==========================================
-- 在庫の確定減算（Webhook用）
-- ==========================================
-- 決済成功後（Webhook）に、在庫を安全に減算するための関数
-- - バリエーション無し: products.stock を減算
-- - バリエーション有り: variants_config の sharedStock / option stock を減算（存在する場合のみ）
-- - 在庫が足りない場合は例外を投げる（負の在庫を防止）

CREATE OR REPLACE FUNCTION public.decrement_product_stock(
  p_product_id UUID,
  p_selected_options JSONB,
  p_qty INTEGER
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  cfg JSONB;
  new_cfg JSONB := '[]'::jsonb;
  t JSONB;
  opts JSONB;
  new_opts JSONB;
  opt JSONB;
  i INTEGER;
  j INTEGER;
  type_id TEXT;
  sm TEXT;
  selected_opt_id TEXT;
  shared_val INTEGER;
  stock_val INTEGER;
  has_cfg BOOLEAN;
BEGIN
  IF p_qty IS NULL OR p_qty <= 0 THEN
    RETURN;
  END IF;

  -- Lock the product row
  SELECT variants_config INTO cfg
  FROM public.products
  WHERE id = p_product_id
  FOR UPDATE;

  has_cfg := cfg IS NOT NULL AND jsonb_typeof(cfg) = 'array' AND jsonb_array_length(cfg) > 0;

  IF NOT has_cfg THEN
    -- Simple stock decrement for non-variant products
    UPDATE public.products
    SET stock = stock - p_qty
    WHERE id = p_product_id
      AND (stock IS NULL OR stock >= p_qty);

    IF NOT FOUND THEN
      RAISE EXCEPTION 'insufficient_stock';
    END IF;
    RETURN;
  END IF;

  FOR i IN 0..jsonb_array_length(cfg)-1 LOOP
    t := cfg -> i;
    sm := COALESCE(t->>'stockManagement', 'individual');

    IF sm = 'none' THEN
      new_cfg := new_cfg || t;
      CONTINUE;
    END IF;

    -- sharedStock takes precedence if present
    IF (t ? 'sharedStock') AND (t->'sharedStock') IS NOT NULL AND (t->'sharedStock') <> 'null'::jsonb THEN
      shared_val := (t->>'sharedStock')::INTEGER;
      IF shared_val < p_qty THEN
        RAISE EXCEPTION 'insufficient_stock';
      END IF;
      t := jsonb_set(t, '{sharedStock}', to_jsonb(shared_val - p_qty), true);
      new_cfg := new_cfg || t;
      CONTINUE;
    END IF;

    -- individual option stock decrement (if option stock exists)
    type_id := t->>'id';
    selected_opt_id := NULL;
    IF p_selected_options IS NOT NULL AND jsonb_typeof(p_selected_options) = 'object' THEN
      selected_opt_id := p_selected_options ->> type_id;
    END IF;

    IF selected_opt_id IS NULL THEN
      -- No selection for this type: cannot decrement; keep as-is
      new_cfg := new_cfg || t;
      CONTINUE;
    END IF;

    opts := t->'options';
    IF opts IS NULL OR jsonb_typeof(opts) <> 'array' THEN
      new_cfg := new_cfg || t;
      CONTINUE;
    END IF;

    new_opts := '[]'::jsonb;
    FOR j IN 0..jsonb_array_length(opts)-1 LOOP
      opt := opts -> j;
      IF (opt->>'id') = selected_opt_id THEN
        IF (opt ? 'stock') AND (opt->'stock') IS NOT NULL AND (opt->'stock') <> 'null'::jsonb THEN
          stock_val := (opt->>'stock')::INTEGER;
          IF stock_val < p_qty THEN
            RAISE EXCEPTION 'insufficient_stock';
          END IF;
          opt := jsonb_set(opt, '{stock}', to_jsonb(stock_val - p_qty), true);
        END IF;
      END IF;
      new_opts := new_opts || opt;
    END LOOP;

    t := jsonb_set(t, '{options}', new_opts, true);
    new_cfg := new_cfg || t;
  END LOOP;

  UPDATE public.products
  SET variants_config = new_cfg
  WHERE id = p_product_id;
END;
$$;

-- クーポン使用回数を増やす関数（Webhookで使用）
CREATE OR REPLACE FUNCTION public.increment_coupon_usage(
  p_coupon_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.coupons
  SET usage_count = usage_count + 1,
      updated_at = NOW()
  WHERE id = p_coupon_id;
END;
$$;

-- クーポンコードで大文字・小文字を区別しない検索を行う関数
CREATE OR REPLACE FUNCTION public.get_coupon_by_code(
  p_code TEXT
) RETURNS TABLE (
  id UUID,
  name TEXT,
  code TEXT,
  discount_type TEXT,
  discount_value INTEGER,
  is_active BOOLEAN,
  starts_at TIMESTAMP WITH TIME ZONE,
  ends_at TIMESTAMP WITH TIME ZONE,
  usage_count INTEGER,
  usage_limit INTEGER,
  min_order_amount INTEGER,
  once_per_user BOOLEAN,
  applies_to_all BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.name,
    c.code,
    c.discount_type,
    c.discount_value,
    c.is_active,
    c.starts_at,
    c.ends_at,
    c.usage_count,
    c.usage_limit,
    c.min_order_amount,
    c.once_per_user,
    c.applies_to_all,
    c.created_at,
    c.updated_at
  FROM public.coupons c
  WHERE LOWER(c.code) = LOWER(p_code)
    AND c.is_active = true
  LIMIT 1;
END;
$$;

-- ==========================================
-- reviews テーブル (お客様の声/レビュー)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  role TEXT, -- 「年間契約のお客様」「3回目の注文」など
  comment TEXT NOT NULL,
  rating DECIMAL(2,1) NOT NULL CHECK (rating >= 0 AND rating <= 5),
  date DATE NOT NULL,
  product_name TEXT, -- 購入商品名（例: "約5kg"）
  images TEXT[] DEFAULT '{}', -- 投稿画像URL
  status TEXT DEFAULT 'published' CHECK (status IN ('draft', 'published', 'archived')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- reviews テーブルのインデックス
CREATE INDEX IF NOT EXISTS idx_reviews_status ON public.reviews(status);
CREATE INDEX IF NOT EXISTS idx_reviews_date ON public.reviews(date DESC);

-- reviews テーブルのRLS
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- 全員が公開されたレビューを閲覧可能
CREATE POLICY "Anyone can view published reviews"
  ON public.reviews
  FOR SELECT
  USING (status = 'published');

-- 管理者のみが全レビューを管理可能
CREATE POLICY "Admins can manage all reviews"
  ON public.reviews
  FOR ALL
  USING (public.is_admin());

-- reviews テーブルの更新日時自動更新トリガー
CREATE OR REPLACE FUNCTION update_reviews_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_reviews_updated_at
  BEFORE UPDATE ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_reviews_updated_at();

-- ==========================================
-- email_logs テーブル (メール送信履歴)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.email_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recipients TEXT[] NOT NULL, -- 送信先メールアドレスの配列
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  status TEXT DEFAULT 'sent' CHECK (status IN ('sent', 'failed', 'pending')),
  sent_by UUID REFERENCES auth.users(id), -- 送信者（管理者）
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- email_logs テーブルのインデックス
CREATE INDEX IF NOT EXISTS idx_email_logs_created_at ON public.email_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_logs_sent_by ON public.email_logs(sent_by);

-- email_logs テーブルのRLS
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;

-- 管理者のみがメール送信履歴を閲覧・作成可能
CREATE POLICY "Admins can manage email logs"
  ON public.email_logs
  FOR ALL
  USING (public.is_admin());


