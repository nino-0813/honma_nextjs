-- 定期購入の「新米切り替わり月」設定用カラム追加
-- 商品ごとに 10月 / 11月 / 未設定 を選べるようにする
-- 値: '10' | '11' | NULL (非表示)

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS subscription_rice_season text;

COMMENT ON COLUMN public.products.subscription_rice_season IS
  '定期購入ポップアップに表示する新米切り替わり月。値は ''10'' / ''11'' / NULL(非表示)。';
