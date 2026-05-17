#!/usr/bin/env bash
set -euo pipefail

# PostgreSQL Backup Script for HMS
# Usage: ./pg-backup.sh [output_dir]

OUTPUT_DIR="${1:-./backups}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${OUTPUT_DIR}/hms_backup_${TIMESTAMP}.sql.gz"

# Ensure output directory exists
mkdir -p "$OUTPUT_DIR"

# Validate required environment variables
if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "ERROR: DATABASE_URL environment variable is required."
  exit 1
fi

# Extract connection details from DATABASE_URL (postgresql://user:pass@host:port/dbname)
DB_HOST=$(echo "$DATABASE_URL" | sed -n 's|.*://.*:.*@\([^:]*\):\([0-9]*\)/.*|\1|p')
DB_PORT=$(echo "$DATABASE_URL" | sed -n 's|.*://.*:.*@\([^:]*\):\([0-9]*\)/.*|\2|p')
DB_NAME=$(echo "$DATABASE_URL" | sed -n 's|.*/\([^?]*\).*|\1|p')
DB_USER=$(echo "$DATABASE_URL" | sed -n 's|.*://\([^:]*\):.*@.*|\1|p')
DB_PASS=$(echo "$DATABASE_URL" | sed -n 's|.*://[^:]*:\([^@]*\)@.*|\1|p')

if [[ -z "$DB_HOST" || -z "$DB_NAME" ]]; then
  echo "ERROR: Failed to parse DATABASE_URL. Expected format: postgresql://user:pass@host:port/dbname"
  exit 1
fi

echo "Starting backup of database '$DB_NAME' at $DB_HOST:$DB_PORT..."

# Run pg_dump and compress
export PGPASSWORD="$DB_PASS"
pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" --no-owner --no-privileges | gzip > "$BACKUP_FILE"
unset PGPASSWORD

if [[ $? -eq 0 && -f "$BACKUP_FILE" ]]; then
  FILE_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
  echo "Backup completed successfully: $BACKUP_FILE ($FILE_SIZE)"
  
  # Optional: Upload to S3 if configured
  if [[ -n "${BACKUP_S3_BUCKET:-}" ]]; then
    echo "Uploading to S3 bucket: $BACKUP_S3_BUCKET"
    aws s3 cp "$BACKUP_FILE" "s3://${BACKUP_S3_BUCKET}/$(basename "$BACKUP_FILE")"
  fi
  
  # Log backup completion (requires DB connection)
  echo "Backup completed at $(date -u +%Y-%m-%dT%H:%M:%SZ)"
  exit 0
else
  echo "ERROR: Backup failed!"
  exit 1
fi
