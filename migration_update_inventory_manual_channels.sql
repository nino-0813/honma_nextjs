-- 在庫の手入力項目をWebプラットフォーム別から、用途カテゴリー＋自由記載の販売先へ変更する。
-- Supabase Dashboard > SQL Editor で一度実行してください。

ALTER TABLE public.inventory_external_sales
  ADD COLUMN IF NOT EXISTS sales_destination text;

ALTER TABLE public.inventory_external_sales
  DROP CONSTRAINT IF EXISTS inventory_external_sales_channel_check;

-- 既存の外部プラットフォーム値は履歴保全のため削除せず、カテゴリーを直販へ移行する。
UPDATE public.inventory_external_sales
SET
  sales_destination = COALESCE(
    sales_destination,
    CASE channel
      WHEN 'tabechoku' THEN '食べチョク'
      WHEN 'satofull' THEN 'さとふる'
      WHEN 'furupo' THEN 'ふるぽ'
      WHEN 'other' THEN '旧その他'
      ELSE NULL
    END
  ),
  channel = 'direct'
WHERE channel IN ('tabechoku', 'satofull', 'furupo', 'other');

ALTER TABLE public.inventory_external_sales
  ADD CONSTRAINT inventory_external_sales_channel_check
  CHECK (channel IN ('direct', 'wholesale', 'gift', 'home_use'));

COMMENT ON COLUMN public.inventory_external_sales.channel IS 'direct=直販個人、wholesale=卸し、gift=プレゼント、home_use=自家用';
COMMENT ON COLUMN public.inventory_external_sales.sales_destination IS '取引先名・個人名・使用先などの自由記載';
