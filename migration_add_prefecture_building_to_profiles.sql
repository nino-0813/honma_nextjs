-- profilesテーブルにprefectureとbuildingカラムを追加（既存環境との互換性のため）
-- 既に存在する場合はエラーにならないようにIF NOT EXISTSを使用

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS prefecture TEXT,
ADD COLUMN IF NOT EXISTS building TEXT;

-- コメントを追加（オプション）
COMMENT ON COLUMN public.profiles.prefecture IS '都道府県';
COMMENT ON COLUMN public.profiles.building IS '建物名・部屋番号';

