-- Staging only: no stock, EC orders, customer data or commission balances are changed.
BEGIN;
CREATE TABLE IF NOT EXISTS public.external_sheet_snapshots (
  source text PRIMARY KEY CHECK (source IN ('rice_tabechoku','rice_satofuru','rice_furusatodo','shiitake_yorankasha','shiitake_other')),
  captured_at timestamptz NOT NULL,
  content_hash text NOT NULL CHECK (content_hash ~ '^[a-f0-9]{64}$'),
  payload jsonb NOT NULL CHECK (jsonb_typeof(payload)='object'),
  revision bigint NOT NULL DEFAULT 1,
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.external_sheet_snapshot_history (
  source text NOT NULL REFERENCES public.external_sheet_snapshots(source),
  revision bigint NOT NULL,
  captured_at timestamptz NOT NULL,
  content_hash text NOT NULL,
  payload jsonb NOT NULL,
  received_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (source,revision)
);
ALTER TABLE public.external_sheet_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.external_sheet_snapshot_history ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.external_sheet_snapshots,public.external_sheet_snapshot_history FROM PUBLIC,anon,authenticated;
GRANT SELECT ON public.external_sheet_snapshots,public.external_sheet_snapshot_history TO authenticated;
DROP POLICY IF EXISTS external_sheet_admin_read ON public.external_sheet_snapshots;
CREATE POLICY external_sheet_admin_read ON public.external_sheet_snapshots FOR SELECT TO authenticated
 USING (EXISTS(SELECT 1 FROM public.profiles WHERE id=auth.uid() AND is_admin));
DROP POLICY IF EXISTS external_sheet_history_admin_read ON public.external_sheet_snapshot_history;
CREATE POLICY external_sheet_history_admin_read ON public.external_sheet_snapshot_history FOR SELECT TO authenticated
 USING (EXISTS(SELECT 1 FROM public.profiles WHERE id=auth.uid() AND is_admin));

CREATE OR REPLACE FUNCTION public.ingest_external_sheet_snapshot(
 p_source text,p_captured_at timestamptz,p_hash text,p_payload jsonb
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE previous public.external_sheet_snapshots; next_revision bigint;
BEGIN
 IF p_source IS NULL OR p_source NOT IN ('rice_tabechoku','rice_satofuru','rice_furusatodo','shiitake_yorankasha','shiitake_other')
 OR p_captured_at IS NULL OR p_captured_at > now()+interval '5 minutes' OR p_captured_at < now()-interval '15 minutes'
 OR p_hash IS NULL OR p_hash !~ '^[a-f0-9]{64}$' OR p_payload IS NULL
 OR jsonb_typeof(p_payload) IS DISTINCT FROM 'object' OR octet_length(p_payload::text)>2500000
 OR jsonb_typeof(p_payload->'lines') IS DISTINCT FROM 'array' THEN
   RAISE EXCEPTION 'Invalid snapshot' USING ERRCODE='22023';
 END IF;
 IF jsonb_array_length(p_payload->'lines')>5000 THEN RAISE EXCEPTION 'Too many lines' USING ERRCODE='22023'; END IF;
 -- Serializes both first insert and updates per source, including concurrent sends.
 PERFORM pg_advisory_xact_lock(hashtextextended('external_sheet:'||p_source,0));
 SELECT * INTO previous FROM public.external_sheet_snapshots WHERE source=p_source FOR UPDATE;
 IF FOUND THEN
   IF p_captured_at < previous.captured_at OR (p_captured_at=previous.captured_at AND p_hash<>previous.content_hash) THEN
     RAISE EXCEPTION 'Stale snapshot' USING ERRCODE='22023';
   END IF;
   IF previous.content_hash=p_hash THEN
     UPDATE public.external_sheet_snapshots SET captured_at=p_captured_at,updated_at=now() WHERE source=p_source;
     RETURN jsonb_build_object('revision',previous.revision,'duplicate',true);
   END IF;
 END IF;
 next_revision := coalesce(previous.revision,0)+1;
 INSERT INTO public.external_sheet_snapshots(source,captured_at,content_hash,payload,revision)
 VALUES(p_source,p_captured_at,p_hash,p_payload,next_revision)
 ON CONFLICT(source) DO UPDATE SET captured_at=excluded.captured_at,content_hash=excluded.content_hash,
 payload=excluded.payload,revision=excluded.revision,updated_at=now();
 INSERT INTO public.external_sheet_snapshot_history(source,revision,captured_at,content_hash,payload)
 VALUES(p_source,next_revision,p_captured_at,p_hash,p_payload);
 RETURN jsonb_build_object('revision',next_revision,'duplicate',false);
END;
$$;
REVOKE ALL ON FUNCTION public.ingest_external_sheet_snapshot(text,timestamptz,text,jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.ingest_external_sheet_snapshot(text,timestamptz,text,jsonb) TO service_role;
COMMIT;
