-- マイグレーション: クーポンに「その他（特典プレゼント）」タイプを追加
-- Supabase SQL Editorで実行してください

-- discount_type に 'other' を追加
ALTER TABLE public.coupons DROP CONSTRAINT IF EXISTS coupons_discount_type_check;
ALTER TABLE public.coupons ADD CONSTRAINT coupons_discount_type_check
  CHECK (discount_type IN ('percentage', 'fixed', 'other'));

-- 特典内容の自由記述欄
ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS note TEXT;

-- get_coupon_by_code に note を追加（チェックアウト側で参照するため再定義）
-- 戻り値の列構成が変わるため、先に既存の関数を削除してから作り直す
DROP FUNCTION IF EXISTS public.get_coupon_by_code(TEXT);
CREATE OR REPLACE FUNCTION public.get_coupon_by_code(p_code TEXT)
RETURNS TABLE (
  id UUID, name TEXT, code TEXT, discount_type TEXT, discount_value INTEGER,
  note TEXT, is_active BOOLEAN, starts_at TIMESTAMP WITH TIME ZONE, ends_at TIMESTAMP WITH TIME ZONE,
  usage_count INTEGER, usage_limit INTEGER, min_order_amount INTEGER,
  once_per_user BOOLEAN, applies_to_all BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE, updated_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  SELECT c.id, c.name, c.code, c.discount_type, c.discount_value, c.note,
         c.is_active, c.starts_at, c.ends_at, c.usage_count, c.usage_limit,
         c.min_order_amount, c.once_per_user, c.applies_to_all, c.created_at, c.updated_at
  FROM public.coupons c
  WHERE LOWER(c.code) = LOWER(p_code) AND c.is_active = true
  LIMIT 1;
END;
$$;
