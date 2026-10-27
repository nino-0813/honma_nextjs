BEGIN;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS bank_transfer_disabled boolean NOT NULL DEFAULT false;
COMMENT ON COLUMN public.products.bank_transfer_disabled IS 'True: card-only product. A mixed cart must use cards for the entire checkout.';
COMMIT;
