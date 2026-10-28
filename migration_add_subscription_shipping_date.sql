-- Exact recurring-cycle shipping dates. No historical dates are inferred/backfilled.
BEGIN;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS subscription_shipping_date date;
CREATE INDEX IF NOT EXISTS orders_subscription_shipping_date_idx ON public.orders(stripe_subscription_id,subscription_shipping_date);
COMMIT;
