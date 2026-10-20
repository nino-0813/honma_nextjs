\set ON_ERROR_STOP on
CREATE ROLE anon; CREATE ROLE authenticated;
CREATE SCHEMA auth;
CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$ SELECT nullif(current_setting('test.uid',true),'')::uuid $$;
CREATE TABLE profiles(id uuid PRIMARY KEY,is_admin boolean);
INSERT INTO profiles VALUES('00000000-0000-0000-0000-000000000001',true),('00000000-0000-0000-0000-000000000002',false);
GRANT USAGE ON SCHEMA auth TO authenticated;
GRANT SELECT ON profiles TO authenticated;
CREATE TABLE products(id uuid PRIMARY KEY,title text);
CREATE TABLE orders(id uuid PRIMARY KEY,order_number text,payment_status text,order_status text);
CREATE TABLE order_items(id uuid PRIMARY KEY,order_id uuid REFERENCES orders ON DELETE CASCADE,product_id uuid REFERENCES products,product_title text,selected_options jsonb,quantity integer,shipping_status text DEFAULT 'before_shipping',is_subscription boolean DEFAULT false);
INSERT INTO products VALUES('10000000-0000-0000-0000-000000000001','Rice'),('10000000-0000-0000-0000-000000000002','Ricekeep');
INSERT INTO orders VALUES('20000000-0000-0000-0000-000000000001','legacy','paid','processing');
INSERT INTO order_items(id,order_id,product_id,product_title,quantity) VALUES('30000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001','コシヒカリ5kg',2);
