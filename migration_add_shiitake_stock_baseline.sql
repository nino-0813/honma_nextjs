-- Editable starting stock, independent of shelf target (18) and EC/SKU stock.
-- No seed: confirmed conversation values are prefilled in the form, then saved by an admin.
BEGIN;
CREATE TABLE IF NOT EXISTS public.shiitake_stock_baselines (
 source text PRIMARY KEY CHECK(source='shiitake_yorankasha'),
 baseline_date date NOT NULL CHECK(baseline_date BETWEEN '2000-01-01' AND '2099-12-31'),
 phase text NOT NULL CHECK(phase IN ('before_open','after_close')),
 quantity integer NOT NULL CHECK(quantity BETWEEN 0 AND 9999),
 revision integer NOT NULL CHECK(revision>0), reason text NOT NULL CHECK(length(btrim(reason)) BETWEEN 1 AND 200),
 updated_by uuid NOT NULL REFERENCES public.profiles(id), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.shiitake_stock_baseline_history (
 LIKE public.shiitake_stock_baselines INCLUDING CONSTRAINTS INCLUDING DEFAULTS,
 PRIMARY KEY(source,revision)
);
ALTER TABLE public.shiitake_stock_baselines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shiitake_stock_baseline_history ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.shiitake_stock_baselines,public.shiitake_stock_baseline_history FROM PUBLIC,anon,authenticated;
GRANT SELECT ON public.shiitake_stock_baselines,public.shiitake_stock_baseline_history TO authenticated,service_role;
DROP POLICY IF EXISTS shiitake_baseline_admin_read ON public.shiitake_stock_baselines;
CREATE POLICY shiitake_baseline_admin_read ON public.shiitake_stock_baselines FOR SELECT TO authenticated
 USING(EXISTS(SELECT 1 FROM public.profiles WHERE id=auth.uid() AND is_admin));
DROP POLICY IF EXISTS shiitake_baseline_history_admin_read ON public.shiitake_stock_baseline_history;
CREATE POLICY shiitake_baseline_history_admin_read ON public.shiitake_stock_baseline_history FOR SELECT TO authenticated
 USING(EXISTS(SELECT 1 FROM public.profiles WHERE id=auth.uid() AND is_admin));
CREATE OR REPLACE FUNCTION public.save_shiitake_stock_baseline(
 p_date date,p_phase text,p_quantity integer,p_reason text,p_expected_revision integer,p_actor uuid
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE previous public.shiitake_stock_baselines; saved public.shiitake_stock_baselines;
BEGIN
 IF NOT EXISTS(SELECT 1 FROM public.profiles WHERE id=p_actor AND is_admin) THEN RAISE EXCEPTION 'Admin required' USING ERRCODE='42501'; END IF;
 IF p_date IS NULL OR p_phase IS NULL OR p_quantity IS NULL OR p_reason IS NULL OR p_expected_revision IS NULL OR p_expected_revision<0 THEN
  RAISE EXCEPTION 'Missing input' USING ERRCODE='22023';
 END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended('shiitake_baseline:yorankasha',0));
 SELECT * INTO previous FROM public.shiitake_stock_baselines WHERE source='shiitake_yorankasha' FOR UPDATE;
 IF coalesce(previous.revision,0)<>p_expected_revision THEN RAISE EXCEPTION 'Baseline changed' USING ERRCODE='40001'; END IF;
 INSERT INTO public.shiitake_stock_baselines(source,baseline_date,phase,quantity,revision,reason,updated_by)
 VALUES('shiitake_yorankasha',p_date,p_phase,p_quantity,p_expected_revision+1,btrim(p_reason),p_actor)
 ON CONFLICT(source) DO UPDATE SET baseline_date=excluded.baseline_date,phase=excluded.phase,
 quantity=excluded.quantity,revision=excluded.revision,reason=excluded.reason,updated_by=excluded.updated_by,updated_at=now()
 RETURNING * INTO saved;
 INSERT INTO public.shiitake_stock_baseline_history SELECT saved.*;
 RETURN to_jsonb(saved)-'updated_by'-'source';
END;
$$;
REVOKE ALL ON FUNCTION public.save_shiitake_stock_baseline(date,text,integer,text,integer,uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.save_shiitake_stock_baseline(date,text,integer,text,integer,uuid) TO service_role;
COMMIT;
