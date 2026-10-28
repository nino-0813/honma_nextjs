\set ON_ERROR_STOP on
DO $$ BEGIN
 IF EXISTS(SELECT 1 FROM shiitake_stock_baselines) THEN RAISE EXCEPTION 'Migration seeded stock'; END IF;
END $$;
SET ROLE service_role;
SELECT public.save_shiitake_stock_baseline('2026-10-20','before_open',18,'初回登録',0,'00000000-0000-0000-0000-000000000001');
DO $$ BEGIN
 BEGIN
  PERFORM public.save_shiitake_stock_baseline('2026-10-21','before_open',5,'古い画面からの保存',0,'00000000-0000-0000-0000-000000000001');
  RAISE EXCEPTION 'Lost update allowed';
 EXCEPTION WHEN serialization_failure THEN NULL; END;
 BEGIN
  PERFORM public.save_shiitake_stock_baseline('2026-10-20','before_open',1,'不正操作',1,'00000000-0000-0000-0000-000000000002');
  RAISE EXCEPTION 'Non-admin actor accepted';
 EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $$;
SELECT public.save_shiitake_stock_baseline('2026-10-21','after_close',0,'実数と日付を訂正',1,'00000000-0000-0000-0000-000000000001');
RESET ROLE;
DO $$ BEGIN
 IF (SELECT count(*) FROM shiitake_stock_baseline_history)<>2 THEN RAISE EXCEPTION 'History not preserved'; END IF;
 IF NOT EXISTS(SELECT 1 FROM shiitake_stock_baselines WHERE quantity=0 AND phase='after_close' AND baseline_date='2026-10-21' AND revision=2) THEN RAISE EXCEPTION 'Correction failed'; END IF;
 IF NOT EXISTS(SELECT 1 FROM shiitake_stock_baseline_history WHERE quantity=18 AND phase='before_open' AND baseline_date='2026-10-20' AND revision=1) THEN RAISE EXCEPTION 'Initial audit lost'; END IF;
 IF has_function_privilege('authenticated','public.save_shiitake_stock_baseline(date,text,integer,text,integer,uuid)','EXECUTE') OR
 has_function_privilege('anon','public.save_shiitake_stock_baseline(date,text,integer,text,integer,uuid)','EXECUTE') THEN RAISE EXCEPTION 'RPC exposed'; END IF;
END $$;
SET ROLE authenticated;
SET fixture.uid='00000000-0000-0000-0000-000000000002';
DO $$ BEGIN IF EXISTS(SELECT 1 FROM shiitake_stock_baselines) THEN RAISE EXCEPTION 'Non-admin can read baseline'; END IF; END $$;
SET fixture.uid='00000000-0000-0000-0000-000000000001';
DO $$ BEGIN IF (SELECT count(*) FROM shiitake_stock_baseline_history)<>2 THEN RAISE EXCEPTION 'Admin audit missing'; END IF; END $$;
RESET ROLE;
