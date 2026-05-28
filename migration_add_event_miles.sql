-- ============================================================
-- イベントマイル機能 マイグレーション
-- ============================================================
-- 1. products テーブルに マイル設定カラム追加
-- 2. profiles テーブルに マイル残高カラム追加
-- 3. event_mile_transactions テーブル作成（マイル取引履歴）
-- ============================================================

-- 1. products: マイル付与率 / イベントチケット商品フラグ
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS mile_earn_rate INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_event_ticket BOOLEAN NOT NULL DEFAULT FALSE;

COMMENT ON COLUMN public.products.mile_earn_rate IS
  'イベントマイル付与率（%）。0=付与しない。送料込み総額に対して適用される。';
COMMENT ON COLUMN public.products.is_event_ticket IS
  'true ならイベントチケット商品。チェックアウト時にイベントマイルで支払可能になる。';

-- 念のための範囲制約（0〜100）
ALTER TABLE public.products
  DROP CONSTRAINT IF EXISTS products_mile_earn_rate_range;
ALTER TABLE public.products
  ADD CONSTRAINT products_mile_earn_rate_range
    CHECK (mile_earn_rate >= 0 AND mile_earn_rate <= 100);

-- 2. profiles: 現在のマイル残高
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS event_mile_balance INTEGER NOT NULL DEFAULT 0;

COMMENT ON COLUMN public.profiles.event_mile_balance IS
  'イベントマイル残高（1マイル=1円）。負数にならないようロジック側で制御。';

-- 2.5 orders: この注文で利用したマイル数（チェックアウトで指定 → webhookで残高引き落とし）
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS event_miles_used INTEGER NOT NULL DEFAULT 0;
COMMENT ON COLUMN public.orders.event_miles_used IS
  'この注文で利用したイベントマイル数。0=未使用。決済額は (subtotal + shipping_cost - event_miles_used) になる。';

-- 3. マイル取引履歴
CREATE TABLE IF NOT EXISTS public.event_mile_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN ('earn', 'use', 'expire', 'adjust')),
  amount INTEGER NOT NULL, -- 正=増加(+) / 負=減少(-)
  balance_after INTEGER NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_event_mile_transactions_user
  ON public.event_mile_transactions(auth_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_event_mile_transactions_order
  ON public.event_mile_transactions(order_id);

COMMENT ON TABLE public.event_mile_transactions IS
  'イベントマイル取引履歴。type=earn(取得) / use(利用) / expire(失効) / adjust(管理者調整)。';

-- RLS: 自分の履歴のみ参照可能（書き込みは service role からのみ）
ALTER TABLE public.event_mile_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users can read own mile history"
  ON public.event_mile_transactions;
CREATE POLICY "users can read own mile history"
  ON public.event_mile_transactions
  FOR SELECT
  USING (auth.uid() = auth_user_id);
