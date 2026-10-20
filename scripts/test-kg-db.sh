#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
name="honma-kg-test-${RANDOM}"
docker run --name "$name" --rm -d -e POSTGRES_PASSWORD=local-test-only postgres:16-alpine >/dev/null
trap 'docker stop "$name" >/dev/null' EXIT
for i in {1..30}; do docker exec "$name" pg_isready -U postgres >/dev/null 2>&1 && break; sleep 1; done
for file in tests/kg-db/fixture.sql migration_add_inventory_system.sql migration_add_kg_inventory.sql tests/kg-db/assertions.sql; do
  docker exec -i "$name" psql -U postgres -v ON_ERROR_STOP=1 < "$file"
done
