\set ON_ERROR_STOP on
CREATE ROLE anon;
CREATE ROLE authenticated;
CREATE ROLE service_role;
CREATE TABLE public.products(id uuid PRIMARY KEY);
CREATE TABLE public.coupons(id uuid PRIMARY KEY,usage_count integer NOT NULL DEFAULT 0,updated_at timestamptz);
CREATE TABLE public.orders(id uuid PRIMARY KEY,coupon_id uuid REFERENCES coupons,paid_at timestamptz,payment_status text);
INSERT INTO coupons VALUES('10000000-0000-0000-0000-000000000001',7,null);
INSERT INTO orders VALUES('20000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001',now(),'paid');
