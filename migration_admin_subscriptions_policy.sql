-- 管理者(profiles.is_admin=true)が subscriptions を全件参照できるようにする
-- 実行: Supabase ダッシュボード > SQL Editor で実行

DROP POLICY IF EXISTS "Admins can read all subscriptions" ON subscriptions;
CREATE POLICY "Admins can read all subscriptions"
  ON subscriptions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.is_admin = true
    )
  );
