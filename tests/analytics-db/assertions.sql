\set ON_ERROR_STOP on
SET ROLE authenticated;
SELECT set_config('test.uid','00000000-0000-0000-0000-000000000001',false);
INSERT INTO public.analytics_yearly_targets VALUES(2026,1000000,NULL);
UPDATE public.analytics_yearly_targets SET revenue_target=2000000 WHERE year=2026;
DO $$ BEGIN
 IF (SELECT revenue_target FROM public.analytics_yearly_targets WHERE year=2026) <> 2000000 THEN RAISE EXCEPTION 'admin save/read failed'; END IF;
 BEGIN INSERT INTO public.analytics_yearly_targets VALUES(2027,-1,NULL); RAISE EXCEPTION 'negative target accepted'; EXCEPTION WHEN check_violation THEN NULL; END;
 BEGIN DELETE FROM public.analytics_yearly_targets WHERE year=2026; RAISE EXCEPTION 'admin delete accepted'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $$;
SELECT set_config('test.uid','00000000-0000-0000-0000-000000000002',false);
DO $$ DECLARE changed integer; BEGIN
 IF EXISTS(SELECT 1 FROM public.analytics_yearly_targets) THEN RAISE EXCEPTION 'non-admin can read'; END IF;
 BEGIN INSERT INTO public.analytics_yearly_targets VALUES(2028,1000,NULL); RAISE EXCEPTION 'non-admin insert accepted'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
 UPDATE public.analytics_yearly_targets SET revenue_target=1 WHERE year=2026;
 GET DIAGNOSTICS changed=ROW_COUNT;
 IF changed<>0 THEN RAISE EXCEPTION 'non-admin update accepted'; END IF;
END $$;
RESET ROLE;
SET ROLE anon;
DO $$ BEGIN
 BEGIN PERFORM count(*) FROM public.analytics_yearly_targets; RAISE EXCEPTION 'anon read accepted'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $$;
RESET ROLE;
SELECT 'analytics target admin/non-admin/anon checks passed' AS result;
