#!/bin/bash
set -eu

# ─── Phase 29E: Database Backup Script ──────────────────────────
# Production-equivalent PostgreSQL backup via Docker Compose.
# Does not imply production readiness on its own.
# ────────────────────────────────────────────────────────────────

COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.prod.yml}"
DB_SERVICE="${DB_SERVICE:-db}"
DB_USER="${DB_USER:?DB_USER is required}"
DB_NAME="${DB_NAME:?DB_NAME is required}"
BACKUP_DIR="${BACKUP_DIR:-./backups}"

fail() {
  echo "[ERROR] $*" >&2
  exit 1
}

info() {
  echo "[INFO] $*"
}

# 1. Validate Docker is available
command -v docker >/dev/null 2>&1 || fail "docker is required but not found"

# 2. Validate compose file exists
[ -f "$COMPOSE_FILE" ] || fail "Compose file not found: $COMPOSE_FILE"

# 3. Create backup directory
mkdir -p "$BACKUP_DIR" || fail "Cannot create backup directory: $BACKUP_DIR"

# 4. Timestamp and filename
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/${DB_NAME}_backup_${TIMESTAMP}.sql"

info "Starting backup of database '$DB_NAME' via service '$DB_SERVICE'..."
info "Writing to: $BACKUP_FILE"

# 5. Run pg_dump through docker compose
docker compose -f "$COMPOSE_FILE" exec -T "$DB_SERVICE" \
  pg_dump -U "$DB_USER" -d "$DB_NAME" --clean --if-exists \
  > "$BACKUP_FILE" 2>/dev/null

# Encrypt backup (requires GPG_KEY_ID environment variable)
if [ -n "${GPG_KEY_ID:-}" ]; then
  echo "Encrypting backup with GPG key: $GPG_KEY_ID"
  gpg --batch --yes --recipient "$GPG_KEY_ID" --output "${BACKUP_FILE}.gpg" --encrypt "$BACKUP_FILE"
  rm -f "$BACKUP_FILE"
  BACKUP_FILE="${BACKUP_FILE}.gpg"
  echo "Encrypted backup: $BACKUP_FILE"
else
  echo "WARNING: GPG_KEY_ID not set. Backup is UNENCRYPTED."
  echo "Set GPG_KEY_ID for production backups containing PHI."
fi

# 6. Verify backup file
if [ ! -s "$BACKUP_FILE" ]; then
  rm -f "$BACKUP_FILE"
  fail "Backup file is empty or was not created. Backup failed."
fi

info "Backup completed successfully."
info "Backup file: $(realpath "$BACKUP_FILE")"
info "Size: $(wc -c < "$BACKUP_FILE") bytes"
