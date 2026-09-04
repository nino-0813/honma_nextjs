-- 顧客の正確な生年とは別に、推定年代と推定生年範囲を保存する。
-- Supabase Dashboard > SQL Editor で一度実行してください。

ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS age_decade INTEGER;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS birth_year_from INTEGER;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS birth_year_to INTEGER;

DO $$ BEGIN
  ALTER TABLE public.customers
    ADD CONSTRAINT customers_age_decade_check
    CHECK (age_decade IS NULL OR age_decade IN (20, 30, 40, 50, 60, 70, 80));
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.customers
    ADD CONSTRAINT customers_birth_year_source_check
    CHECK (
      birth_year IS NULL
      OR (age_decade IS NULL AND birth_year_from IS NULL AND birth_year_to IS NULL)
    );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

COMMENT ON COLUMN public.customers.age_decade IS '生年不明時の推定年代（30=30代）';
COMMENT ON COLUMN public.customers.birth_year_from IS '年代選択時点で算出した推定生年の下限';
COMMENT ON COLUMN public.customers.birth_year_to IS '年代選択時点で算出した推定生年の上限';
