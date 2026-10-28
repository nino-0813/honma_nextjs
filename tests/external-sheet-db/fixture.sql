\set ON_ERROR_STOP on
CREATE ROLE anon;
CREATE ROLE authenticated;
CREATE ROLE service_role;
CREATE SCHEMA auth;
CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$ SELECT nullif(current_setting('fixture.uid',true),'')::uuid $$;
GRANT USAGE ON SCHEMA auth TO authenticated;
CREATE TABLE public.profiles(id uuid PRIMARY KEY,is_admin boolean);
GRANT SELECT ON public.profiles TO authenticated;
INSERT INTO profiles VALUES ('00000000-0000-0000-0000-000000000001',true),('00000000-0000-0000-0000-000000000002',false);
CREATE TABLE public.customers(id uuid PRIMARY KEY);
INSERT INTO customers VALUES('00000000-0000-0000-0000-000000000003');
CREATE TABLE public.orders(id uuid PRIMARY KEY,stripe_subscription_id text);
