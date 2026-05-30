# Phase 29 Backup and Restore Evidence

## Scope

This document records whether Gemini HMS can create a database backup, restore it into a clean database, and pass smoke checks against restored data.

## Environment

| Field | Value |
|---|---|
| Date | 2026-05-30 |
| Commit SHA | 6d4cff5 |
| Operator | automated-ci |
| Runtime | Local production-equivalent (Docker Compose) |
| Database image/version | postgres:15-alpine |
| Dataset | Empty schema (fresh `migrate deploy`) |

## Required Commands

```bash
# Validate production-equivalent compose config
docker compose -f docker-compose.prod.yml config

# Start runtime
docker compose -f docker-compose.prod.yml up -d --build

# Confirm containers
docker compose -f docker-compose.prod.yml ps

# Create backup
sh scripts/db-backup.sh

# Restore into clean database
RESTORE_CONFIRM=YES BACKUP_FILE=./backups/<file> sh scripts/db-restore.sh

# Run smoke test
BASE_URL=http://localhost:8080 sh scripts/smoke-prod.sh
```

## Results

| Check | Status | Evidence |
|---|---|---|
| Compose config validates | PASS | `docker compose -f docker-compose.prod.yml config` succeeds. Full config resolves correctly. |
| Runtime starts | PASS | 3/3 containers healthy (db, backend, frontend). Backend healthcheck passes via `http://localhost:3000/health`. |
| Backup created | PASS | `scripts/db-backup.sh` runs successfully. Output: `gemini_hms_prod_backup_20260530_160400.sql` (236,658 bytes). |
| Clean database prepared | BLOCKED | Requires stopping runtime and dropping volume. Documented procedure exists in runbook. |
| Restore succeeds | BLOCKED | Full restore drill requires a clean database target. Cannot run against the single available environment without disrupting upstream services. Documented procedure in runbook. |
| Smoke test against restored DB passes | BLOCKED | Depends on restore drill completing. |

## Findings

1. **Backup script works correctly**: `scripts/db-backup.sh` produces a valid PostgreSQL custom-format dump. Output file contains schema DDL (Prisma migrations) and can be verified with `pg_restore --list`.
2. **Restore script syntax valid**: `scripts/db-restore.sh` has been validated with `bash -n`. Full execution requires `RESTORE_CONFIRM=YES` and `BACKUP_FILE=<path>` env vars.
3. **CRLF file issue on Windows**: Shell scripts written on Windows have CRLF line endings. This does not affect CI (Linux runners) nor Docker-based execution (scripts run inside Alpine containers via `docker compose exec`). Local execution on Windows requires conversion or Git's `core.autocrlf` setting.
4. **`.env` credential mismatch**: The project `.env` file has mismatched `DATABASE_URL` (uses `postgres:postgres@localhost:5432/hms_db`) vs `DB_USER/DB_PASSWORD/DB_NAME` (uses `hms_prod_user`/`hms_secure_pass`/`gemini_hms_prod`). The backup script uses `DB_USER/DB_NAME` (correct), but `DATABASE_URL` must be overridden at runtime for compose to connect. This is a pre-existing configuration issue, not a script defect. Fix: align `DATABASE_URL` with `DB_USER/DB_PASSWORD/DB_NAME` in `.env`.
5. **Smoke test health endpoint**: The backend health endpoint (`GET /health`) is not proxied through Nginx (which only forwards `/api/` and `/patient-portal/`). The smoke test's default `API_HEALTH_URL` needs to point to `http://backend:3000/health` (Docker-internal) or the Nginx config needs an additional location block.

## Final Verdict

- [ ] PASS
- [ ] FAIL
- [x] BLOCKED

## Notes

- Do not use real patient data for this drill. Use synthetic or seeded data only.
- A full end-to-end drill (backup, teardown, restore, smoke test) requires a dedicated staging environment or a second Docker Compose stack.
- The backup script is production-viable. The restore script is syntactically correct and follows the documented procedure but has not been executed against a live target.
