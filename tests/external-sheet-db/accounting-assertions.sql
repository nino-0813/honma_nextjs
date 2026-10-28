\set ON_ERROR_STOP on
INSERT INTO external_sheet_snapshots(source,captured_at,content_hash,payload)
VALUES('rice_satofuru',now(),repeat('a',64),'{"lines":[{"sourceKey":"rice_satofuru:line:a","sourceKeyBasis":"explicit_line_id","inventoryReady":true,"status":"active","quantity":2}]}');
SET ROLE authenticated;
SET fixture.uid='00000000-0000-0000-0000-000000000001';
SELECT approve_external_order('rice_satofuru:line:a',1,true,'00000000-0000-0000-0000-000000000003',10000,'手動分と照合済み');
SELECT record_shiitake_stock_entry('00000000-0000-0000-0000-000000000010','2026-10-21',3,'補充');
SELECT record_shiitake_stock_entry('00000000-0000-0000-0000-000000000010','2026-10-21',3,'補充');
RESET ROLE;
UPDATE external_sheet_snapshots SET revision=2,payload='{"lines":[{"sourceKey":"rice_satofuru:line:a","sourceKeyBasis":"explicit_line_id","inventoryReady":true,"status":"cancelled","quantity":2}]}' WHERE source='rice_satofuru';
DO $$ BEGIN
 IF (SELECT accountable->>'status' FROM external_order_records WHERE source_key='rice_satofuru:line:a')<>'cancelled' THEN RAISE EXCEPTION 'Cancel did not propagate'; END IF;
 IF (SELECT count(*) FROM shiitake_stock_entries)<>1 THEN RAISE EXCEPTION 'Restock duplicate'; END IF;
END $$;
UPDATE external_sheet_snapshots SET revision=3,payload='{"lines":[{"sourceKey":"rice_satofuru:line:a","sourceKeyBasis":"explicit_line_id","inventoryReady":false,"status":"unconfirmed","quantity":999}]}' WHERE source='rice_satofuru';
DO $$ BEGIN
 IF (SELECT accountable->>'quantity' FROM external_order_records WHERE source_key='rice_satofuru:line:a')<>'2' THEN RAISE EXCEPTION 'Invalid edit changed accounting'; END IF;
END $$;
UPDATE external_sheet_snapshots SET revision=4,payload='{"lines":[]}' WHERE source='rice_satofuru';
DO $$ BEGIN
 IF NOT (SELECT source_missing FROM external_order_records WHERE source_key='rice_satofuru:line:a') THEN RAISE EXCEPTION 'Missing source not flagged'; END IF;
 IF (SELECT count(*) FROM external_order_approval_history)<>1 THEN RAISE EXCEPTION 'Approval audit absent'; END IF;
END $$;
SET ROLE service_role;
SELECT record_referral_sale_or_refund('00000000-0000-0000-0000-000000000020','direct','00000000-0000-0000-0000-000000000003','2026-10-21',1000,'direct-fixture','電話注文','00000000-0000-0000-0000-000000000001');
SELECT record_referral_sale_or_refund('00000000-0000-0000-0000-000000000021','refund',null,'2026-11-01',400,'re_fixture','商品返金','00000000-0000-0000-0000-000000000001','direct:fixture',1000);
SELECT record_referral_sale_or_refund('00000000-0000-0000-0000-000000000021','refund',null,'2026-11-01',400,'re_fixture','商品返金','00000000-0000-0000-0000-000000000001','direct:fixture',1000);
DO $$ BEGIN
 BEGIN
  PERFORM record_referral_sale_or_refund('00000000-0000-0000-0000-000000000022','refund',null,'2026-11-01',700,'re_second','商品返金','00000000-0000-0000-0000-000000000001','direct:fixture',1000);
  RAISE EXCEPTION 'Over-refund allowed';
 EXCEPTION WHEN raise_exception THEN IF SQLERRM='Over-refund allowed' THEN RAISE; END IF; END;
END $$;
RESET ROLE;
DO $$ BEGIN
 IF (SELECT count(*) FROM referral_refunds)<>1 THEN RAISE EXCEPTION 'Refund duplicated'; END IF;
 IF has_function_privilege('authenticated','record_referral_sale_or_refund(uuid,text,uuid,date,bigint,text,text,uuid,text,bigint)','EXECUTE') THEN RAISE EXCEPTION 'Service RPC exposed'; END IF;
END $$;
SET ROLE authenticated;
SET fixture.uid='00000000-0000-0000-0000-000000000002';
DO $$ BEGIN
 IF EXISTS(SELECT 1 FROM external_order_records) OR EXISTS(SELECT 1 FROM referral_refunds) THEN RAISE EXCEPTION 'Non-admin can read'; END IF;
 BEGIN
  PERFORM record_shiitake_stock_entry('00000000-0000-0000-0000-000000000011','2026-10-21',3,'不正');
  RAISE EXCEPTION 'Non-admin write accepted';
 EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $$;
RESET ROLE;
