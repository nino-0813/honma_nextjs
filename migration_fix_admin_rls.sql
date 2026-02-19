-- ==========================================
-- 管理画面用 RLS ポリシー修正
-- ==========================================
-- 目的: product_shipping_methods にポリシーがない、shipping_methods のポリシーが
--       管理者専用でないなど、管理画面の保存が失敗する問題を修正する
--
-- 実行方法: Supabase ダッシュボード > SQL Editor でこのファイルの内容を実行

-- ------------------------------------------
-- 1. 管理者権限チェック関数（未作成の場合は作成）
-- ------------------------------------------
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

-- ------------------------------------------
-- 2. product_shipping_methods のポリシー追加
-- ------------------------------------------
-- RLS は有効だがポリシーがない場合、全操作が拒否される
-- 閲覧: 誰でも可 / 変更: 管理者のみ

DROP POLICY IF EXISTS "Anyone can view product shipping methods" ON public.product_shipping_methods;
CREATE POLICY "Anyone can view product shipping methods"
  ON public.product_shipping_methods
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Admins can manage product shipping methods" ON public.product_shipping_methods;
CREATE POLICY "Admins can manage product shipping methods"
  ON public.product_shipping_methods
  FOR ALL
  USING (public.is_admin());

-- ------------------------------------------
-- 3. shipping_methods のポリシー統一
-- ------------------------------------------
-- 「authenticated 全員」ではなく「管理者のみ変更可」に統一

-- 既存の別名ポリシーを削除（Supabase UI で作成した場合など）
DROP POLICY IF EXISTS "authenticated can read shipping_methods" ON public.shipping_methods;
DROP POLICY IF EXISTS "authenticated full access shipping_methods" ON public.shipping_methods;

DROP POLICY IF EXISTS "Anyone can view shipping methods" ON public.shipping_methods;
CREATE POLICY "Anyone can view shipping methods"
  ON public.shipping_methods
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Admins can manage shipping methods" ON public.shipping_methods;
CREATE POLICY "Admins can manage shipping methods"
  ON public.shipping_methods
  FOR ALL
  USING (public.is_admin());

-- ------------------------------------------
-- 4. 管理者権限の確認用（任意）
-- ------------------------------------------
-- 以下の SQL で管理者アカウントを確認・設定できます
-- UPDATE profiles SET is_admin = true WHERE email = '管理者のメールアドレス@example.com';
