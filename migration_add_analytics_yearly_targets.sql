-- ストア分析の目標のみ追加。既存の注文・在庫・契約は変更しません。
BEGIN;
CREATE TABLE public.analytics_yearly_targets (
  year integer PRIMARY KEY CHECK (year BETWEEN 1900 AND 2200),
  revenue_target numeric(18,2) CHECK (revenue_target IS NULL OR revenue_target > 0),
  gross_profit_target numeric(18,2) CHECK (gross_profit_target IS NULL OR gross_profit_target > 0)
);
ALTER TABLE public.analytics_yearly_targets ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.analytics_yearly_targets FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON public.analytics_yearly_targets TO authenticated;
CREATE POLICY analytics_targets_admin_read ON public.analytics_yearly_targets FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.profiles WHERE id=auth.uid() AND is_admin=true));
CREATE POLICY analytics_targets_admin_insert ON public.analytics_yearly_targets FOR INSERT TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id=auth.uid() AND is_admin=true));
CREATE POLICY analytics_targets_admin_update ON public.analytics_yearly_targets FOR UPDATE TO authenticated
USING (EXISTS (SELECT 1 FROM public.profiles WHERE id=auth.uid() AND is_admin=true))
WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id=auth.uid() AND is_admin=true));
COMMENT ON TABLE public.analytics_yearly_targets IS 'ストア全体の暦年目標。原価未登録の粗利益実績は別途算出が必要。';
COMMIT;
