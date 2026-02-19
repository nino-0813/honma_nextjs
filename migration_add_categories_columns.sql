-- マイグレーション: productsテーブルにcategoriesとsubcategoriesカラムを追加
-- このマイグレーションは、既存のproductsテーブルにcategoriesとsubcategoriesカラムが存在しない場合に実行してください

-- categoriesカラムを追加（複数選択対応）
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS categories TEXT[] DEFAULT '{}';

-- subcategoriesカラムを追加（複数選択対応）
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS subcategories TEXT[] DEFAULT '{}';

-- 既存のデータがある場合、categoryカラムの値をcategories配列に移行
-- （既存のcategoryがnullでない場合のみ）
UPDATE public.products 
SET categories = ARRAY[category]::TEXT[]
WHERE categories = '{}'::TEXT[] 
  AND category IS NOT NULL 
  AND category != '';

-- 既存のデータがある場合、subcategoryカラムの値をsubcategories配列に移行
-- （既存のsubcategoryがnullでない場合のみ）
UPDATE public.products 
SET subcategories = ARRAY[subcategory]::TEXT[]
WHERE subcategories = '{}'::TEXT[] 
  AND subcategory IS NOT NULL 
  AND subcategory != '';

-- 確認用クエリ（実行後、このクエリでカラムが追加されたことを確認できます）
-- SELECT column_name, data_type, is_nullable, column_default
-- FROM information_schema.columns
-- WHERE table_name = 'products' 
--   AND column_name IN ('categories', 'subcategories');

