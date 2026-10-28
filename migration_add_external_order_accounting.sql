-- Apply after external_sheet_staging and shiitake_stock_baseline migrations.
-- No existing orders or inventory rows are changed. Initial inventory inclusion requires admin reconciliation.
BEGIN;
CREATE TABLE IF NOT EXISTS public.external_order_records (
 source_key text PRIMARY KEY, source text NOT NULL REFERENCES external_sheet_snapshots(source),
 revision bigint NOT NULL, payload jsonb NOT NULL, accountable jsonb,
 source_missing boolean NOT NULL DEFAULT false,
 inventory_enabled boolean NOT NULL DEFAULT false,
 customer_id uuid REFERENCES public.customers(id),
 merchandise_yen bigint CHECK(merchandise_yen BETWEEN 0 AND 1000000000),
 finance_payload jsonb, reason text,
 updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.external_order_approval_history (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),source_key text NOT NULL,
 snapshot jsonb NOT NULL,actor uuid NOT NULL,reason text NOT NULL,created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.shiitake_stock_entries (
 id uuid PRIMARY KEY,entry_date date NOT NULL,quantity integer NOT NULL CHECK(quantity BETWEEN -9999 AND 9999 AND quantity<>0),
 reason text NOT NULL CHECK(length(btrim(reason)) BETWEEN 1 AND 200),created_by uuid NOT NULL,created_at timestamptz NOT NULL DEFAULT now()
);
DO $$ DECLARE t text; BEGIN
 FOREACH t IN ARRAY ARRAY['external_order_records','external_order_approval_history','shiitake_stock_entries'] LOOP
  EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY',t);
  EXECUTE format('REVOKE ALL ON public.%I FROM PUBLIC,anon,authenticated',t);
  EXECUTE format('GRANT SELECT ON public.%I TO authenticated,service_role',t);
  EXECUTE format('DROP POLICY IF EXISTS admin_read ON public.%I',t);
  EXECUTE format('CREATE POLICY admin_read ON public.%I FOR SELECT TO authenticated USING(EXISTS(SELECT 1 FROM public.profiles WHERE id=auth.uid() AND is_admin))',t);
 END LOOP;
END $$;
CREATE OR REPLACE FUNCTION public.materialize_external_sheet() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE line jsonb; k text; valid boolean;
BEGIN
 UPDATE external_order_records SET source_missing=true WHERE source=NEW.source;
 FOR line IN SELECT value FROM jsonb_array_elements(NEW.payload->'lines') LOOP
  k:=line->>'sourceKey';
  IF k IS NULL THEN CONTINUE; END IF;
  -- Never use a row number as identity or collapse two duplicate rows.
  valid:=coalesce((line->>'inventoryReady')::boolean,false) AND line->>'sourceKeyBasis'='explicit_line_id';
  INSERT INTO external_order_records(source_key,source,revision,payload,accountable,source_missing)
   VALUES(k,NEW.source,NEW.revision,line,CASE WHEN valid THEN line ELSE NULL END,false)
  ON CONFLICT(source_key) DO UPDATE SET revision=NEW.revision,payload=line,source_missing=false,
   accountable=CASE WHEN valid THEN line ELSE external_order_records.accountable END,updated_at=now();
 END LOOP;
 -- Deletion/invalid edits retain the last accountable value. They are review items, not cancellations.
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.materialize_external_sheet() FROM PUBLIC,anon,authenticated;
DROP TRIGGER IF EXISTS materialize_external_sheet ON public.external_sheet_snapshots;
CREATE TRIGGER materialize_external_sheet AFTER INSERT OR UPDATE OF payload ON public.external_sheet_snapshots
 FOR EACH ROW EXECUTE FUNCTION public.materialize_external_sheet();

CREATE OR REPLACE FUNCTION public.approve_external_order(
 p_key text,p_revision bigint,p_inventory boolean,p_customer uuid,p_merchandise bigint,p_reason text
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE r public.external_order_records;
BEGIN
 IF NOT EXISTS(SELECT 1 FROM profiles WHERE id=auth.uid() AND is_admin) THEN RAISE EXCEPTION 'Admin required' USING ERRCODE='42501'; END IF;
 IF p_reason IS NULL OR length(btrim(p_reason)) NOT BETWEEN 1 AND 200 OR p_inventory IS NULL THEN RAISE EXCEPTION 'Reason required'; END IF;
 -- Lock source before record in the same order as the sync trigger.
 PERFORM 1 FROM external_sheet_snapshots WHERE source=(SELECT source FROM external_order_records WHERE source_key=p_key) FOR UPDATE;
 SELECT * INTO r FROM external_order_records WHERE source_key=p_key FOR UPDATE;
 IF NOT FOUND OR r.revision<>p_revision THEN RAISE EXCEPTION 'Reload before approval' USING ERRCODE='40001'; END IF;
 IF (r.source_missing OR r.payload->>'sourceKeyBasis'<>'explicit_line_id' OR NOT coalesce((r.payload->>'inventoryReady')::boolean,false)) AND (p_inventory OR p_customer IS NOT NULL OR p_merchandise IS NOT NULL) THEN RAISE EXCEPTION 'Resolve source data before approval'; END IF;
 IF p_inventory AND EXISTS(SELECT 1 FROM external_order_records x WHERE x.source=r.source AND x.source_key<>p_key AND x.source_missing AND x.inventory_enabled
  AND x.accountable->>'date'=r.payload->>'date' AND x.accountable->>'product'=r.payload->>'product') THEN
  RAISE EXCEPTION 'Previously counted missing line exists. Reconcile it before enabling a replacement';
 END IF;
 UPDATE external_order_records SET inventory_enabled=p_inventory,customer_id=p_customer,merchandise_yen=p_merchandise,
  finance_payload=CASE WHEN p_merchandise IS NULL THEN NULL WHEN r.payload->>'status'='cancelled' AND r.finance_payload->>'status'='active' THEN r.finance_payload ELSE r.payload END,reason=btrim(p_reason),updated_at=now() WHERE source_key=p_key;
 INSERT INTO external_order_approval_history(source_key,snapshot,actor,reason)
  SELECT p_key,to_jsonb(x),auth.uid(),btrim(p_reason) FROM external_order_records x WHERE source_key=p_key;
END $$;
REVOKE ALL ON FUNCTION public.approve_external_order(text,bigint,boolean,uuid,bigint,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.approve_external_order(text,bigint,boolean,uuid,bigint,text) TO authenticated;

CREATE OR REPLACE FUNCTION public.record_shiitake_stock_entry(p_id uuid,p_date date,p_quantity integer,p_reason text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
BEGIN
 IF NOT EXISTS(SELECT 1 FROM profiles WHERE id=auth.uid() AND is_admin) THEN RAISE EXCEPTION 'Admin required' USING ERRCODE='42501'; END IF;
 IF p_id IS NULL OR p_date IS NULL OR p_quantity IS NULL OR p_reason IS NULL THEN RAISE EXCEPTION 'Missing input'; END IF;
 INSERT INTO shiitake_stock_entries(id,entry_date,quantity,reason,created_by) VALUES(p_id,p_date,p_quantity,btrim(p_reason),auth.uid()) ON CONFLICT(id) DO NOTHING;
 IF NOT EXISTS(SELECT 1 FROM shiitake_stock_entries WHERE id=p_id AND entry_date=p_date AND quantity=p_quantity AND reason=btrim(p_reason)) THEN RAISE EXCEPTION 'Request ID conflict' USING ERRCODE='40001'; END IF;
END $$;
REVOKE ALL ON FUNCTION public.record_shiitake_stock_entry(uuid,date,integer,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.record_shiitake_stock_entry(uuid,date,integer,text) TO authenticated;
-- Materialize already-staged snapshots; no record is inventory-enabled automatically.
UPDATE public.external_sheet_snapshots SET payload=payload;
COMMIT;
