#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
cmp migration_add_kg_inventory.sql docs/kg-inventory-sql/02-apply-kg-inventory.sql
name="honma-kg-runbook-${RANDOM}"
runbook_tmp=$(mktemp -d /tmp/honma-kg-runbook.XXXXXX)
docker run --name "$name" --rm -d -e POSTGRES_PASSWORD=local-test-only postgres:16-alpine >/dev/null
trap 'docker stop "$name" >/dev/null; rm -rf "$runbook_tmp"' EXIT
for i in {1..30}; do docker exec "$name" pg_isready -U postgres >/dev/null 2>&1 && break; sleep 1; done
sql() { docker exec -i "$name" psql -U postgres -v ON_ERROR_STOP=1; }
sql < tests/kg-db/fixture.sql
sql < migration_add_inventory_system.sql
# Local-only representation of pre-existing Supabase RLS. Never run this fixture in production.
sql <<'SQL'
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY fixture_profile_self ON profiles FOR SELECT TO authenticated USING(id=auth.uid());
CREATE POLICY fixture_products_admin ON products FOR SELECT TO authenticated USING(EXISTS(SELECT 1 FROM profiles WHERE id=auth.uid() AND is_admin));
CREATE POLICY fixture_orders_admin ON orders FOR SELECT TO authenticated USING(EXISTS(SELECT 1 FROM profiles WHERE id=auth.uid() AND is_admin));
CREATE POLICY fixture_items_admin ON order_items FOR SELECT TO authenticated USING(EXISTS(SELECT 1 FROM profiles WHERE id=auth.uid() AND is_admin));
SQL
sql < docs/kg-inventory-sql/01-preflight.sql
sql <<'SQL'
ALTER TABLE order_items RENAME COLUMN quantity TO fixture_wrong_quantity;
SQL
if sql < docs/kg-inventory-sql/01-preflight.sql > "$runbook_tmp/mismatch.log" 2>&1; then echo 'FAIL: schema mismatch was not rejected'; exit 1; fi
sql <<'SQL'
ALTER TABLE order_items RENAME COLUMN fixture_wrong_quantity TO quantity;
SQL
sql < docs/kg-inventory-sql/02-apply-kg-inventory.sql
sql < docs/kg-inventory-sql/03-postflight.sql
sql < tests/kg-db/assertions.sql
if sql < docs/kg-inventory-sql/01-preflight.sql > "$runbook_tmp/repeat.log" 2>&1; then echo 'FAIL: repeated migration was not rejected'; exit 1; fi
if sql < docs/kg-inventory-sql/04-emergency-stop.sql > "$runbook_tmp/guard.log" 2>&1; then echo 'FAIL: emergency guard did not block'; exit 1; fi
sql < docs/kg-inventory-sql/03-postflight.sql
sed "s/IF 'NOT_APPROVED'/IF 'STOP_KG_ORDER_TRIGGERS'/" docs/kg-inventory-sql/04-emergency-stop.sql > "$runbook_tmp/stop.sql"
sql < "$runbook_tmp/stop.sql"
sql <<'SQL'
SELECT test_assert((SELECT count(*)=2 FROM pg_trigger WHERE tgname IN ('kg_capture_item','kg_order_changed') AND tgenabled='D'),'both order triggers disabled');
CREATE TEMP TABLE before_stop AS SELECT count(*) AS n FROM kg_movements;
UPDATE orders SET payment_status='pending' WHERE order_number='legacy';
SELECT test_assert((SELECT count(*) FROM kg_movements)=(SELECT n FROM before_stop),'no ledger mutations while stopped');
SELECT test_assert((SELECT count(*)>0 FROM kg_item_snapshots),'history retained');
SQL
if sql < docs/kg-inventory-sql/03-postflight.sql > "$runbook_tmp/stopped.log" 2>&1; then echo 'FAIL: stopped triggers not detected'; exit 1; fi
if sql < docs/kg-inventory-sql/05-resume-after-reconciliation.sql > "$runbook_tmp/resume-guard.log" 2>&1; then echo 'FAIL: resume guard did not block'; exit 1; fi
# Fixture-only explicit reconciliation of a known unshipped payment-state change.
sql <<'SQL'
SELECT kg_sync_item('30000000-0000-0000-0000-000000000001');
SELECT test_assert((SELECT used_quantity=0 AND held_quantity=2 FROM kg_item_snapshots WHERE item_id='30000000-0000-0000-0000-000000000001'),'fixture reconciled before resume');
SQL
sed "s/IF 'NOT_APPROVED'/IF 'RESUME_KG_AFTER_RECONCILIATION'/" docs/kg-inventory-sql/05-resume-after-reconciliation.sql > "$runbook_tmp/resume.sql"
sql < "$runbook_tmp/resume.sql"
sql < docs/kg-inventory-sql/03-postflight.sql
sql <<'SQL'
UPDATE orders SET payment_status='paid' WHERE order_number='legacy';
SELECT test_assert((SELECT used_quantity=2 AND held_quantity=0 FROM kg_item_snapshots WHERE item_id='30000000-0000-0000-0000-000000000001'),'tracking resumes');
SELECT 'kg runbook procedure passed' AS result;
SQL
