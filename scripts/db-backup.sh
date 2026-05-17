#!/bin/bash

# Configuration
BACKUP_DIR="/backups"
DB_CONTAINER_NAME="hms-login-design-postgres-1"
DB_USER="postgres"
DB_NAME="hms_db"
RETENTION_DAYS=7
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/${DB_NAME}_backup_${TIMESTAMP}.sql.gz"

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

echo "Starting database backup for $DB_NAME..."

# Run pg_dump inside the container and compress the output
docker exec "$DB_CONTAINER_NAME" pg_dump -U "$DB_USER" "$DB_NAME" | gzip > "$BACKUP_FILE"

if [ $? -eq 0 ]; then
  echo "Backup successfully created: $BACKUP_FILE"
else
  echo "Error: Database backup failed."
  exit 1
fi

# Retention policy: Delete backups older than RETENTION_DAYS
echo "Applying retention policy (deleting backups older than $RETENTION_DAYS days)..."
find "$BACKUP_DIR" -name "${DB_NAME}_backup_*.sql.gz" -type f -mtime +$RETENTION_DAYS -delete

echo "Backup process completed."
