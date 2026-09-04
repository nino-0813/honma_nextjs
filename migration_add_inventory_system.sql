-- イケベジ 年間収穫量・販売チャネル横断の在庫管理
-- Supabase Dashboard > SQL Editor で実行してください。

CREATE TABLE IF NOT EXISTS public.inventory_seasons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  harvest_year integer NOT NULL UNIQUE,
  label text NOT NULL,
  starts_on date NOT NULL,
  ends_on date NOT NULL,
  capacity_unit_kg numeric(10,2) NOT NULL DEFAULT 5 CHECK (capacity_unit_kg > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.inventory_varieties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  season_id uuid NOT NULL REFERENCES public.inventory_seasons(id) ON DELETE CASCADE,
  variety_key text NOT NULL CHECK (variety_key IN ('koshihikari', 'nikomaru', 'kamenoo')),
  harvested_kg numeric(12,2) NOT NULL DEFAULT 0 CHECK (harvested_kg >= 0),
  reserved_kg numeric(12,2) NOT NULL DEFAULT 0 CHECK (reserved_kg >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (season_id, variety_key)
);

CREATE TABLE IF NOT EXISTS public.inventory_external_sales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  season_id uuid NOT NULL REFERENCES public.inventory_seasons(id) ON DELETE CASCADE,
  variety_key text NOT NULL CHECK (variety_key IN ('koshihikari', 'nikomaru', 'kamenoo')),
  channel text NOT NULL CHECK (channel IN ('direct', 'wholesale', 'gift', 'home_use')),
  sales_destination text,
  quantity_kg numeric(12,2) NOT NULL CHECK (quantity_kg > 0),
  sold_on date NOT NULL DEFAULT current_date,
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS inventory_varieties_season_idx ON public.inventory_varieties(season_id);
CREATE INDEX IF NOT EXISTS inventory_external_sales_season_date_idx ON public.inventory_external_sales(season_id, sold_on);

ALTER TABLE public.inventory_seasons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_varieties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_external_sales ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage inventory seasons" ON public.inventory_seasons;
CREATE POLICY "Admins manage inventory seasons" ON public.inventory_seasons FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin = true))
WITH CHECK (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin = true));

DROP POLICY IF EXISTS "Admins manage inventory varieties" ON public.inventory_varieties;
CREATE POLICY "Admins manage inventory varieties" ON public.inventory_varieties FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin = true))
WITH CHECK (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin = true));

DROP POLICY IF EXISTS "Admins manage external inventory sales" ON public.inventory_external_sales;
CREATE POLICY "Admins manage external inventory sales" ON public.inventory_external_sales FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin = true))
WITH CHECK (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin = true));

COMMENT ON TABLE public.inventory_seasons IS '収穫年度ごとの在庫管理期間';
COMMENT ON TABLE public.inventory_varieties IS '品種別の年間収穫量と確保分';
COMMENT ON TABLE public.inventory_external_sales IS 'Web以外の直販・卸し・プレゼント・自家用の販売使用実績';
