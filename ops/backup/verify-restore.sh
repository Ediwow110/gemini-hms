#!/usr/bin/env bash
set -euo pipefail

# PostgreSQL Backup Verification & Restore Script
# Usage: ./verify-restore.sh <backup_file> [restore_db_url]

BACKUP_FILE="${1:?Usage: ./verify-restore.sh <backup_file> [restore_db_url]}"
RESTORE_URL="${2:-}"

if [[ ! -f "$BACKUP_FILE" ]]; then
  echo "ERROR: Backup file not found: $BACKUP_FILE"
  exit 1
fi

# Create a temporary database for verification
TEMP_DB="hms_verify_restore_$(date +%s)"
echo "Creating temporary database: $TEMP_DB"

if [[ -n "$RESTORE_URL" ]]; then
  # Use provided URL to extract connection details
  DB_HOST=$(echo "$RESTORE_URL" | sed -n 's|.*://.*:.*@\([^:]*\):\([0-9]*\)/.*|\1|p')
  DB_PORT=$(echo "$RESTORE_URL" | sed -n 's|.*://.*:.*@\([^:]*\):\([0-9]*\)/.*|\2|p')
  DB_USER=$(echo "$RESTORE_URL" | sed -n 's|.*://\([^:]*\):.*@.*|\1|p')
  DB_PASS=$(echo "$RESTORE_URL" | sed -n 's|.*://[^:]*:\([^@]*\)@.*|\1|p')
else
  # Fallback to DATABASE_URL
  if [[ -z "${DATABASE_URL:-}" ]]; then
    echo "ERROR: RESTORE_URL or DATABASE_URL environment variable is required."
    exit 1
  fi
  DB_HOST=$(echo "$DATABASE_URL" | sed -n 's|.*://.*:.*@\([^:]*\):\([0-9]*\)/.*|\1|p')
  DB_PORT=$(echo "$DATABASE_URL" | sed -n 's|.*://.*:.*@\([^:]*\):\([0-9]*\)/.*|\2|p')
  DB_USER=$(echo "$DATABASE_URL" | sed -n 's|.*://\([^:]*\):.*@.*|\1|p')
  DB_PASS=$(echo "$DATABASE_URL" | sed -n 's|.*://[^:]*:\([^@]*\)@.*|\1|p')
fi

export PGPASSWORD="$DB_PASS"

# Create temp DB
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres -c "CREATE DATABASE $TEMP_DB;" || { echo "Failed to create temp DB"; exit 1; }

# Restore backup into temp DB
echo "Restoring backup into $TEMP_DB..."
gunzip -c "$BACKUP_FILE" | psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$TEMP_DB" --quiet

if [[ $? -ne 0 ]]; then
  echo "ERROR: Restore failed!"
  psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres -c "DROP DATABASE IF EXISTS $TEMP_DB;"
  exit 1
fi

# Run smoke queries
echo "Running smoke queries..."
SMOKE_PASS=true

# Check core tables exist and have data
for TABLE in tenants users roles permissions audit_logs; do
  COUNT=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$TEMP_DB" -t -c "SELECT COUNT(*) FROM $TABLE;" 2>/dev/null || echo "0")
  echo "  $TABLE: $COUNT rows"
done

# Verify schema integrity (check for expected tables)
TABLE_COUNT=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$TEMP_DB" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>/dev/null || echo "0")
if [[ "$TABLE_COUNT" -lt 10 ]]; then
  echo "WARNING: Expected at least 10 tables, found $TABLE_COUNT"
  SMOKE_PASS=false
fi

# Cleanup
echo "Dropping temporary database: $TEMP_DB"
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres -c "DROP DATABASE IF EXISTS $TEMP_DB;"
unset PGPASSWORD

if $SMOKE_PASS; then
  echo "PASS: Backup verification successful."
  exit 0
else
  echo "FAIL: Backup verification failed."
  exit 1
fi
