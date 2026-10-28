\set ON_ERROR_STOP on
SET ROLE service_role;
SELECT public.ingest_external_sheet_snapshot('rice_tabechoku',now()-interval '3 minutes',repeat('a',64),'{"lines":[]}');
SELECT public.ingest_external_sheet_snapshot('rice_tabechoku',now()-interval '2 minutes',repeat('a',64),'{"lines":[]}');
SELECT public.ingest_external_sheet_snapshot('rice_tabechoku',now()-interval '1 minute',repeat('b',64),'{"lines":[{"status":"cancelled"}]}');
DO $$ BEGIN
 BEGIN
  PERFORM public.ingest_external_sheet_snapshot('rice_tabechoku',now()-interval '3 minutes',repeat('a',64),'{"lines":[]}');
  RAISE EXCEPTION 'Stale overwrite was allowed';
 EXCEPTION WHEN invalid_parameter_value THEN NULL; END;
 BEGIN
  PERFORM public.ingest_external_sheet_snapshot('unknown',now(),repeat('a',64),'{"lines":[]}');
  RAISE EXCEPTION 'Unknown source allowed';
 EXCEPTION WHEN invalid_parameter_value THEN NULL; END;
END $$;
RESET ROLE;
DO $$ BEGIN
 IF (SELECT count(*) FROM external_sheet_snapshot_history)<>2 THEN RAISE EXCEPTION 'Retry duplicated history'; END IF;
 IF (SELECT revision FROM external_sheet_snapshots WHERE source='rice_tabechoku')<>2 THEN RAISE EXCEPTION 'Revision mismatch'; END IF;
 IF (SELECT payload->'lines'->0->>'status' FROM external_sheet_snapshots WHERE source='rice_tabechoku')<>'cancelled' THEN RAISE EXCEPTION 'Cancel not stored'; END IF;
 IF has_function_privilege('anon','public.ingest_external_sheet_snapshot(text,timestamptz,text,jsonb)','EXECUTE') OR
 has_function_privilege('authenticated','public.ingest_external_sheet_snapshot(text,timestamptz,text,jsonb)','EXECUTE') THEN RAISE EXCEPTION 'RPC exposed'; END IF;
 IF has_table_privilege('authenticated','external_sheet_snapshots','UPDATE') OR has_table_privilege('anon','external_sheet_snapshots','SELECT') THEN RAISE EXCEPTION 'Table exposed'; END IF;
END $$;
SET ROLE authenticated;
SET fixture.uid='00000000-0000-0000-0000-000000000002';
DO $$ BEGIN IF (SELECT count(*) FROM external_sheet_snapshots)<>0 THEN RAISE EXCEPTION 'Non-admin can read'; END IF; END $$;
SET fixture.uid='00000000-0000-0000-0000-000000000001';
DO $$ BEGIN IF (SELECT count(*) FROM external_sheet_snapshots)<>1 THEN RAISE EXCEPTION 'Admin cannot read'; END IF; END $$;
RESET ROLE;
