-- 定期購入対応のためのテーブル/カラム追加
-- 実行: Supabase ダッシュボード > SQL Editor で実行

-- orders に定期購入関連カラム
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS stripe_subscription_id text,
  ADD COLUMN IF NOT EXISTS stripe_customer_id text,
  ADD COLUMN IF NOT EXISTS subscription_interval text;

CREATE INDEX IF NOT EXISTS orders_stripe_subscription_id_idx ON orders(stripe_subscription_id);

-- order_items にも定期購入区分カラム
ALTER TABLE order_items
  ADD COLUMN IF NOT EXISTS is_subscription boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS subscription_interval text,
  ADD COLUMN IF NOT EXISTS subscription_discount_percent integer;

-- 定期購入マスタテーブル（Stripe Subscriptionとの対応関係を保持）
CREATE TABLE IF NOT EXISTS subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_subscription_id text NOT NULL UNIQUE,
  stripe_customer_id text NOT NULL,
  auth_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  email text NOT NULL,
  status text NOT NULL DEFAULT 'incomplete', -- Stripe Subscription Status
  interval text NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  next_billing_at timestamptz,
  canceled_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS subscriptions_auth_user_id_idx ON subscriptions(auth_user_id);
CREATE INDEX IF NOT EXISTS subscriptions_email_idx ON subscriptions(email);
CREATE INDEX IF NOT EXISTS subscriptions_status_idx ON subscriptions(status);

-- RLS: ユーザーは自分の subscription のみ参照可能
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own subscriptions" ON subscriptions;
CREATE POLICY "Users can read own subscriptions"
  ON subscriptions FOR SELECT
  USING (auth.uid() = auth_user_id);

DROP POLICY IF EXISTS "Service role full access subscriptions" ON subscriptions;
CREATE POLICY "Service role full access subscriptions"
  ON subscriptions FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

COMMENT ON TABLE subscriptions IS '定期購入レコード (Stripe Subscriptionと1:1)';
