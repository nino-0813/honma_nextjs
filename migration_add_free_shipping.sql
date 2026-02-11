-- マイグレーション: productsテーブルにis_free_shippingカラムを追加
-- このマイグレーションは、既存のproductsテーブルにis_free_shippingカラムが存在しない場合に実行してください

-- is_free_shippingカラムを追加（送料無料フラグ）
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS is_free_shipping BOOLEAN DEFAULT false;

-- 既存のデータがある場合、デフォルトでfalse（送料有料）に設定
UPDATE public.products 
SET is_free_shipping = false
WHERE is_free_shipping IS NULL;

