-- 定期購入の「初回発送日（オーバーライド指定）」追加
-- 用途: 年間契約米のように「新米が出る10/15から発送開始」を一律にしたい場合に使う
--
-- 動作:
--   - first_shipping_override_date が未指定 → 既存の15日ルール（10日まで→当月15日 / 11日以降→翌月15日）
--   - first_shipping_override_date が未来日   → 全ユーザーがその日が初回発送
--   - first_shipping_override_date が過去日   → 15日ルールにフォールバック（過ぎたら自動的に通常運用）
--
-- 注意: 初回決済はチェックアウト時に通常通り行われる。Stripeの2回目以降の請求は
--       「初回発送月 + interval月後の10日 05:00 JST」になる。
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS first_shipping_override_date date;

COMMENT ON COLUMN public.products.first_shipping_override_date IS
  '定期購入の初回発送日を指定する(YYYY-MM-DD)。空 = 15日ルール / 未来日 = 全ユーザーこの日に初回発送 / 過去日 = 15日ルールに自動フォールバック。';
