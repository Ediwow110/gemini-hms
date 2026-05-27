#!/usr/bin/env bash
# Reset the E2E test database (hms_test) by dropping + recreating + applying migrations.
# Usage: bash scripts/reset-e2e-db.sh
set -euo pipefail

export DATABASE_URL="postgresql://postgres:postgres@localhost:5432/hms_test?schema=public"

echo "Resetting E2E test database (hms_test)..."
npx prisma migrate reset --force
echo "E2E test database reset complete."
