-- order_items が増殖する不具合対策:
-- Checkout の「明細を作り直す」処理で order_items の DELETE が必要。
-- しかし現状は INSERT/SELECT しか許可していないため、DELETE がRLSで失敗し、
-- INSERTだけが繰り返されて同一注文の明細が大量に増えます。
--
-- このSQLを Supabase SQL Editor で実行してください。

ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- 既存のポリシーは維持しつつ、UPDATE/DELETE を追加
DROP POLICY IF EXISTS "Users can update own order items" ON public.order_items;
CREATE POLICY "Users can update own order items"
  ON public.order_items
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE public.orders.id = public.order_items.order_id
        AND (public.orders.auth_user_id = auth.uid() OR public.is_admin())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE public.orders.id = public.order_items.order_id
        AND (public.orders.auth_user_id = auth.uid() OR public.is_admin())
    )
  );

DROP POLICY IF EXISTS "Users can delete own order items" ON public.order_items;
CREATE POLICY "Users can delete own order items"
  ON public.order_items
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE public.orders.id = public.order_items.order_id
        AND (public.orders.auth_user_id = auth.uid() OR public.is_admin())
    )
  );


