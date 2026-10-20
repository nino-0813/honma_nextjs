ALTER TABLE orders ADD COLUMN stripe_subscription_id text;
CREATE TABLE subscriptions(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),stripe_subscription_id text UNIQUE NOT NULL,status text NOT NULL,interval text NOT NULL,metadata jsonb DEFAULT '{"pause_collection":null}',next_billing_at timestamptz);
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON subscriptions TO authenticated;
CREATE POLICY fixture_subscription_admin ON subscriptions FOR SELECT TO authenticated USING(EXISTS(SELECT 1 FROM profiles WHERE id=auth.uid() AND is_admin));
