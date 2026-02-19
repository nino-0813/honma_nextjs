-- ==========================================
-- RLS強化: products / orders / order_items
-- ==========================================
-- 目的:
-- - products: 公開条件をDB側で強制（非公開/下書きが漏れない）
-- - orders/order_items: INSERTをログイン必須にし、スパム/汚染を防ぐ
--
-- 前提:
-- - 管理画面/購入フローはSupabase Authでログインして利用する（Checkoutはログイン必須）
-- - 管理者権限は public.profiles.is_admin で管理し、public.is_admin() で判定する

-- 念のためRLSを有効化（既に有効でもOK）
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------
-- products: 公開商品のみ閲覧可能
-- ------------------------------------------
-- 既存の「公開」ポリシーを置換（現在は USING(true) の可能性があるため）
DROP POLICY IF EXISTS "Public can view active products" ON public.products;
DROP POLICY IF EXISTS "Anyone can view active products" ON public.products;

-- 公開条件:
-- - is_active = true（販売中）
-- - is_visible = true（表示）
-- ※ status カラムの有無に依存しないよう、ここでは is_active / is_visible で判定
CREATE POLICY "Public can view active products"
  ON public.products
  FOR SELECT
  USING (
    is_active = true
    AND (is_visible IS NULL OR is_visible = true)
  );

-- 管理者は全商品を閲覧・管理可能（既存のポリシーがあればそのまま）
-- ※ 既に存在する場合が多いので、ここでは作成しない（supabase_schema.sql側に定義済み想定）

-- ------------------------------------------
-- orders: INSERTをログイン必須にする
-- ------------------------------------------
DROP POLICY IF EXISTS "Users can create orders" ON public.orders;
DROP POLICY IF EXISTS "Anyone can create orders" ON public.orders;

-- 注文作成はログイン必須 + 自分のauth_user_idのみ許可
CREATE POLICY "Users can create orders"
  ON public.orders
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

-- 既存ポリシー（閲覧/管理）は維持:
-- - Users can read own orders (auth_user_id = auth.uid())
-- - Admins can manage orders (public.is_admin())

-- ------------------------------------------
-- order_items: INSERTを「自分の注文」に限定
-- ------------------------------------------
DROP POLICY IF EXISTS "Users can create order items" ON public.order_items;
DROP POLICY IF EXISTS "Anyone can create order items" ON public.order_items;

CREATE POLICY "Users can create order items"
  ON public.order_items
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1
      FROM public.orders o
      WHERE o.id = order_items.order_id
        AND (o.auth_user_id = auth.uid() OR public.is_admin())
    )
  );

-- 既存ポリシー（閲覧）は維持:
-- - Users can read own order items (orders.auth_user_id = auth.uid() OR admin)


