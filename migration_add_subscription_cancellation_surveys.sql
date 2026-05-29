-- 定期購入キャンセル時のアンケート結果を保存するテーブル
-- マイページで定期購入をキャンセルする際に、理由を任意で複数選択してもらう
--
-- カラム:
--  - stripe_subscription_id: 対象のサブスクID
--  - auth_user_id: ユーザー（ログアウト後に消えないよう SET NULL）
--  - email: 送信時のメール（あとから集計しやすいよう冗長に保存）
--  - reasons: 選択した理由の配列（例: ['price_high','frequency_too_often']）
--  - other_text: 「その他」を選んだ場合の自由記述
--  - created_at: アンケート送信時刻

CREATE TABLE IF NOT EXISTS public.subscription_cancellation_surveys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_subscription_id TEXT NOT NULL,
  auth_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  email TEXT,
  reasons JSONB NOT NULL DEFAULT '[]'::jsonb,
  other_text TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_subscription_cancellation_surveys_sub
  ON public.subscription_cancellation_surveys(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscription_cancellation_surveys_created
  ON public.subscription_cancellation_surveys(created_at DESC);

COMMENT ON TABLE public.subscription_cancellation_surveys IS
  '定期購入キャンセル時のアンケート回答。任意（未回答でもキャンセル自体は実行される）';

-- RLS: ユーザーは自分のものだけ INSERT 可能。SELECT は service role 経由のみ。
ALTER TABLE public.subscription_cancellation_surveys ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users can insert own cancellation survey"
  ON public.subscription_cancellation_surveys;
CREATE POLICY "users can insert own cancellation survey"
  ON public.subscription_cancellation_surveys
  FOR INSERT
  WITH CHECK (auth.uid() = auth_user_id);

DROP POLICY IF EXISTS "users can read own cancellation surveys"
  ON public.subscription_cancellation_surveys;
CREATE POLICY "users can read own cancellation surveys"
  ON public.subscription_cancellation_surveys
  FOR SELECT
  USING (auth.uid() = auth_user_id);
