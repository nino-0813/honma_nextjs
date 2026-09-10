-- 通常購入の銀行振込（Stripe customer_balance / jp_bank_transfer）対応
-- Supabase Dashboard > SQL Editor で、本番公開前に実行してください。

ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS inventory_reserved_at timestamptz;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS inventory_released_at timestamptz;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_due_at timestamptz;

CREATE OR REPLACE FUNCTION public.increment_product_stock(
  p_product_id uuid,
  p_selected_options jsonb,
  p_qty integer
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  cfg jsonb;
  new_cfg jsonb := '[]'::jsonb;
  t jsonb;
  opts jsonb;
  new_opts jsonb;
  opt jsonb;
  i integer;
  j integer;
  type_id text;
  sm text;
  selected_opt_id text;
BEGIN
  IF p_qty IS NULL OR p_qty <= 0 THEN RETURN; END IF;

  SELECT variants_config INTO cfg FROM public.products WHERE id = p_product_id FOR UPDATE;
  IF cfg IS NULL OR jsonb_typeof(cfg) <> 'array' OR jsonb_array_length(cfg) = 0 THEN
    UPDATE public.products SET stock = CASE WHEN stock IS NULL THEN NULL ELSE stock + p_qty END WHERE id = p_product_id;
    RETURN;
  END IF;

  FOR i IN 0..jsonb_array_length(cfg)-1 LOOP
    t := cfg -> i;
    sm := COALESCE(t->>'stockManagement', 'individual');
    IF sm = 'none' THEN new_cfg := new_cfg || t; CONTINUE; END IF;

    IF (t ? 'sharedStock') AND (t->'sharedStock') IS NOT NULL AND (t->'sharedStock') <> 'null'::jsonb THEN
      t := jsonb_set(t, '{sharedStock}', to_jsonb(COALESCE((t->>'sharedStock')::integer, 0) + p_qty), true);
      new_cfg := new_cfg || t;
      CONTINUE;
    END IF;

    type_id := t->>'id';
    selected_opt_id := CASE WHEN p_selected_options IS NOT NULL AND jsonb_typeof(p_selected_options) = 'object'
      THEN p_selected_options ->> type_id ELSE NULL END;
    opts := t->'options';
    IF selected_opt_id IS NULL OR opts IS NULL OR jsonb_typeof(opts) <> 'array' THEN
      new_cfg := new_cfg || t; CONTINUE;
    END IF;

    new_opts := '[]'::jsonb;
    FOR j IN 0..jsonb_array_length(opts)-1 LOOP
      opt := opts -> j;
      IF (opt->>'id') = selected_opt_id AND (opt ? 'stock') AND (opt->'stock') IS NOT NULL AND (opt->'stock') <> 'null'::jsonb THEN
        opt := jsonb_set(opt, '{stock}', to_jsonb(COALESCE((opt->>'stock')::integer, 0) + p_qty), true);
      END IF;
      new_opts := new_opts || opt;
    END LOOP;
    new_cfg := new_cfg || jsonb_set(t, '{options}', new_opts, true);
  END LOOP;

  UPDATE public.products SET variants_config = new_cfg WHERE id = p_product_id;
END;
$$;

-- 1回のDBトランザクション内で注文全体を確保。二重実行も防止します。
CREATE OR REPLACE FUNCTION public.reserve_bank_transfer_order(p_order_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE item record;
BEGIN
  PERFORM 1 FROM public.orders WHERE id = p_order_id FOR UPDATE;
  IF EXISTS (SELECT 1 FROM public.orders WHERE id = p_order_id AND inventory_reserved_at IS NOT NULL) THEN RETURN false; END IF;

  FOR item IN SELECT product_id, selected_options, quantity FROM public.order_items WHERE order_id = p_order_id LOOP
    PERFORM public.decrement_product_stock(item.product_id, item.selected_options, item.quantity);
  END LOOP;

  UPDATE public.orders SET inventory_reserved_at = now(), inventory_released_at = NULL,
    payment_due_at = COALESCE(payment_due_at, now() + interval '7 days'),
    payment_method = 'bank_transfer', updated_at = now()
  WHERE id = p_order_id;
  RETURN true;
END;
$$;

CREATE OR REPLACE FUNCTION public.release_bank_transfer_order(p_order_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE item record;
BEGIN
  PERFORM 1 FROM public.orders WHERE id = p_order_id FOR UPDATE;
  IF NOT EXISTS (
    SELECT 1 FROM public.orders WHERE id = p_order_id
      AND inventory_reserved_at IS NOT NULL AND inventory_released_at IS NULL
  ) THEN RETURN false; END IF;

  FOR item IN SELECT product_id, selected_options, quantity FROM public.order_items WHERE order_id = p_order_id LOOP
    PERFORM public.increment_product_stock(item.product_id, item.selected_options, item.quantity);
  END LOOP;

  UPDATE public.orders SET inventory_released_at = now(), updated_at = now() WHERE id = p_order_id;
  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.reserve_bank_transfer_order(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.release_bank_transfer_order(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.reserve_bank_transfer_order(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.release_bank_transfer_order(uuid) TO service_role;
