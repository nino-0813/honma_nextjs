-- 販売期間（sale_start_at, sale_end_at）を products テーブルに追加
-- 期間内のみ注文可能にする機能用

ALTER TABLE public.products ADD COLUMN IF NOT EXISTS sale_start_at TIMESTAMPTZ;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS sale_end_at TIMESTAMPTZ;
