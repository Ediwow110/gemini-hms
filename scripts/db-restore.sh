#!/bin/bash
set -eu

# ─── Phase 29E: Database Restore Script ─────────────────────────
# Production-equivalent PostgreSQL restore via Docker Compose.
# Requires explicit confirmation. Does not imply production readiness.
# ────────────────────────────────────────────────────────────────

COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.prod.yml}"
DB_SERVICE="${DB_SERVICE:-db}"
DB_USER="${DB_USER:?DB_USER is required}"
DB_NAME="${DB_NAME:?DB_NAME is required}"
BACKUP_FILE="${BACKUP_FILE:-}"
RESTORE_CONFIRM="${RESTORE_CONFIRM:-}"

fail() {
  echo "[ERROR] $*" >&2
  exit 1
}

info() {
  echo "[INFO] $*"
}

warn() {
  echo "[WARN] $*" >&2
}

# 1. Validate Docker
command -v docker >/dev/null 2>&1 || fail "docker is required but not found"

# 2. Validate compose file
[ -f "$COMPOSE_FILE" ] || fail "Compose file not found: $COMPOSE_FILE"

# 3. Require backup file
[ -n "$BACKUP_FILE" ] || fail "BACKUP_FILE is required. Set BACKUP_FILE=/path/to/backup.sql"
[ -f "$BACKUP_FILE" ] || fail "Backup file not found: $BACKUP_FILE"
[ -s "$BACKUP_FILE" ] || fail "Backup file is empty: $BACKUP_FILE"

# 4. Require explicit confirmation
[ "$RESTORE_CONFIRM" = "YES" ] || fail "RESTORE_CONFIRM=YES is required to proceed with restore"

warn "══════════════════════════════════════════════════════════════"
warn "  DATABASE RESTORE IN PROGRESS"
warn "  Target database: $DB_NAME"
warn "  Backup file:     $(realpath "$BACKUP_FILE")"
warn "  This will OVERWRITE all existing data in $DB_NAME."
warn "  Do not use real patient data for drills."
warn "  Production restore requires explicit operational approval."
warn "══════════════════════════════════════════════════════════════"

# 5. Restore via docker compose
info "Restoring database '$DB_NAME' from backup..."

# Drop and recreate to ensure a clean state
docker compose -f "$COMPOSE_FILE" exec -T "$DB_SERVICE" \
  psql -U "$DB_USER" -d "$DB_NAME" -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;" >/dev/null 2>&1

# Apply backup
docker compose -f "$COMPOSE_FILE" exec -T "$DB_SERVICE" \
  psql -U "$DB_USER" -d "$DB_NAME" \
  < "$BACKUP_FILE" 2>&1 || fail "Restore command failed"

info "Restore completed successfully."

# 6. Post-restore instructions
cat <<INSTRUCTIONS

══════════════════════════════════════════════════════════════
  POST-RESTORE STEPS
══════════════════════════════════════════════════════════════

  1. Run smoke tests to verify the restored database:
     BASE_URL=http://localhost:8080 sh scripts/smoke-prod.sh

  2. Verify health endpoint:
     curl http://localhost:3000/api/v1/health

  3. Confirm login works for existing users.

  4. Check audit logs for restore event.

  IMPORTANT:
  - Do not use real patient data for drills.
  - Production restore requires explicit operational approval.
  - These scripts are production-equivalent readiness tooling,
    not proof of production readiness by themselves.

══════════════════════════════════════════════════════════════
INSTRUCTIONS
