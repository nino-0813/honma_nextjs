BEGIN;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS coupon_usage_recorded boolean NOT NULL DEFAULT false;
-- Preserve historical counters. This is not a historical-count recalculation.
UPDATE public.orders SET coupon_usage_recorded=true
 WHERE coupon_id IS NOT NULL AND (paid_at IS NOT NULL OR payment_status IN ('paid','refunded'))
 AND NOT coupon_usage_recorded;
CREATE OR REPLACE FUNCTION public.record_order_coupon_usage(p_order_id uuid)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE o public.orders;
BEGIN
 SELECT * INTO o FROM public.orders WHERE id=p_order_id FOR UPDATE;
 IF NOT FOUND OR o.coupon_id IS NULL OR o.coupon_usage_recorded
   OR NOT (o.paid_at IS NOT NULL OR o.payment_status IN ('paid','refunded')) THEN RETURN false; END IF;
 UPDATE public.coupons SET usage_count=coalesce(usage_count,0)+1,updated_at=now() WHERE id=o.coupon_id;
 IF NOT FOUND THEN RAISE EXCEPTION 'Coupon not found'; END IF;
 UPDATE public.orders SET coupon_usage_recorded=true WHERE id=o.id;
 RETURN true;
END;
$$;
REVOKE ALL ON FUNCTION public.record_order_coupon_usage(uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.record_order_coupon_usage(uuid) TO service_role;
COMMIT;
