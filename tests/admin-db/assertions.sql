\set ON_ERROR_STOP on
DO $$ BEGIN
 IF (SELECT usage_count FROM coupons LIMIT 1)<>7 THEN RAISE EXCEPTION 'Historical counter changed'; END IF;
 IF public.record_order_coupon_usage('20000000-0000-0000-0000-000000000001') THEN RAISE EXCEPTION 'Historical order counted twice'; END IF;
END $$;
INSERT INTO orders VALUES('20000000-0000-0000-0000-000000000002','10000000-0000-0000-0000-000000000001',null,'pending',false);
DO $$ BEGIN
 IF public.record_order_coupon_usage('20000000-0000-0000-0000-000000000002') THEN RAISE EXCEPTION 'Unpaid order counted'; END IF;
END $$;
UPDATE orders SET paid_at=now(),payment_status='paid' WHERE id='20000000-0000-0000-0000-000000000002';
SET ROLE service_role;
SELECT public.record_order_coupon_usage('20000000-0000-0000-0000-000000000002');
SELECT public.record_order_coupon_usage('20000000-0000-0000-0000-000000000002');
RESET ROLE;
UPDATE orders SET payment_status='refunded' WHERE id='20000000-0000-0000-0000-000000000002';
SELECT public.record_order_coupon_usage('20000000-0000-0000-0000-000000000002');
DO $$ BEGIN
 IF (SELECT usage_count FROM coupons LIMIT 1)<>8 THEN RAISE EXCEPTION 'Coupon did not count exactly once'; END IF;
 IF has_function_privilege('anon','public.record_order_coupon_usage(uuid)','EXECUTE') OR has_function_privilege('authenticated','public.record_order_coupon_usage(uuid)','EXECUTE') THEN RAISE EXCEPTION 'Public caller can increment coupons'; END IF;
END $$;
INSERT INTO products(id) VALUES('30000000-0000-0000-0000-000000000001');
DO $$ BEGIN
 IF (SELECT bank_transfer_disabled FROM products LIMIT 1) THEN RAISE EXCEPTION 'Default bank setting changed'; END IF;
END $$;
SELECT 'admin improvement SQL checks passed';
