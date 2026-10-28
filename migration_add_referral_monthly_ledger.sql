BEGIN;
CREATE TABLE IF NOT EXISTS public.referral_manual_sales (
 id uuid PRIMARY KEY,customer_id uuid NOT NULL REFERENCES public.customers(id),sold_on date NOT NULL,
 merchandise_yen bigint NOT NULL CHECK(merchandise_yen BETWEEN 0 AND 1000000000),
 reference text NOT NULL UNIQUE CHECK(length(btrim(reference)) BETWEEN 1 AND 200),reason text NOT NULL CHECK(length(btrim(reason)) BETWEEN 1 AND 200),
 created_by uuid NOT NULL,created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.referral_refunds (
 id uuid PRIMARY KEY,sale_key text NOT NULL,refunded_on date NOT NULL,
 merchandise_yen bigint NOT NULL CHECK(merchandise_yen BETWEEN 1 AND 1000000000),
 external_reference text NOT NULL UNIQUE CHECK(length(btrim(external_reference)) BETWEEN 1 AND 200),
 reason text NOT NULL CHECK(length(btrim(reason)) BETWEEN 1 AND 200),created_by uuid NOT NULL,created_at timestamptz NOT NULL DEFAULT now()
);
DO $$ DECLARE t text; BEGIN
 FOREACH t IN ARRAY ARRAY['referral_manual_sales','referral_refunds'] LOOP
  EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY',t);
  EXECUTE format('REVOKE ALL ON public.%I FROM PUBLIC,anon,authenticated',t);
  EXECUTE format('GRANT SELECT ON public.%I TO authenticated,service_role',t);
  EXECUTE format('DROP POLICY IF EXISTS admin_read ON public.%I',t);
  EXECUTE format('CREATE POLICY admin_read ON public.%I FOR SELECT TO authenticated USING(EXISTS(SELECT 1 FROM public.profiles WHERE id=auth.uid() AND is_admin))',t);
 END LOOP;
END $$;
CREATE OR REPLACE FUNCTION public.record_referral_sale_or_refund(
 p_id uuid,p_kind text,p_customer uuid,p_date date,p_amount bigint,p_reference text,p_reason text,p_actor uuid,p_sale_key text DEFAULT NULL,p_sale_basis bigint DEFAULT NULL
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE existing public.referral_refunds;
BEGIN
 IF NOT EXISTS(SELECT 1 FROM profiles WHERE id=p_actor AND is_admin) THEN RAISE EXCEPTION 'Admin required' USING ERRCODE='42501'; END IF;
 IF p_id IS NULL OR p_date IS NULL OR p_amount IS NULL OR p_reference IS NULL OR p_reason IS NULL THEN RAISE EXCEPTION 'Missing input'; END IF;
 IF p_kind='direct' THEN
  INSERT INTO referral_manual_sales(id,customer_id,sold_on,merchandise_yen,reference,reason,created_by)
  VALUES(p_id,p_customer,p_date,p_amount,btrim(p_reference),btrim(p_reason),p_actor) ON CONFLICT(id) DO NOTHING;
  IF NOT EXISTS(SELECT 1 FROM referral_manual_sales WHERE id=p_id AND customer_id=p_customer AND sold_on=p_date AND merchandise_yen=p_amount AND reference=btrim(p_reference) AND reason=btrim(p_reason)) THEN RAISE EXCEPTION 'Request conflict'; END IF;
 ELSIF p_kind='refund' THEN
  IF p_sale_key IS NULL OR p_sale_basis IS NULL OR p_sale_basis<0 THEN RAISE EXCEPTION 'Verified sale required'; END IF;
  PERFORM pg_advisory_xact_lock(hashtextextended('referral_refund:'||p_sale_key,0));
  SELECT * INTO existing FROM referral_refunds WHERE id=p_id;
  IF FOUND THEN
   IF existing.sale_key=p_sale_key AND existing.refunded_on=p_date AND existing.merchandise_yen=p_amount AND existing.external_reference=btrim(p_reference) AND existing.reason=btrim(p_reason) THEN RETURN; END IF;
   RAISE EXCEPTION 'Request conflict';
  END IF;
  IF coalesce((SELECT sum(merchandise_yen) FROM referral_refunds WHERE sale_key=p_sale_key),0)+p_amount>p_sale_basis THEN RAISE EXCEPTION 'Refund exceeds merchandise amount'; END IF;
  INSERT INTO referral_refunds(id,sale_key,refunded_on,merchandise_yen,external_reference,reason,created_by)
  VALUES(p_id,p_sale_key,p_date,p_amount,btrim(p_reference),btrim(p_reason),p_actor);
 ELSE RAISE EXCEPTION 'Unknown entry'; END IF;
END $$;
REVOKE ALL ON FUNCTION public.record_referral_sale_or_refund(uuid,text,uuid,date,bigint,text,text,uuid,text,bigint) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.record_referral_sale_or_refund(uuid,text,uuid,date,bigint,text,text,uuid,text,bigint) TO service_role;
COMMIT;
