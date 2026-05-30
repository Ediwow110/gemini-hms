# Phase 30 Staging-Equivalent Execution

## Phase 30A — Clean Restore Target Environment

### Purpose

Create a dedicated clean PostgreSQL restore target for backup/restore drills without touching the primary production-equivalent database volume.

### Scope

- Local Docker Compose restore target only
- No product features
- No GCP
- No real PHI
- No production readiness claim

### Target Environment

| Field | Value |
|---|---|
| Compose file | `docker-compose.restore.yml` |
| Service name | `db_restore` |
| Image | postgres:15-alpine |
| Volume | `postgres_restore_data` (separate from primary `postgres_prod_data`) |
| Network | `hms_restore` (isolated from primary stack) |

### Required Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `RESTORE_DB_USER` | No | Falls back to `DB_USER` | PostgreSQL user for restore target |
| `RESTORE_DB_PASSWORD` | No | Falls back to `DB_PASSWORD` | PostgreSQL password for restore target |
| `RESTORE_DB_NAME` | No | Falls back to `DB_NAME` | PostgreSQL database name for restore target |

If `RESTORE_*` variables are not set, the compose file reads `DB_USER`, `DB_PASSWORD`, `DB_NAME` from the environment or `.env` file.

### Commands

**Start the restore target:**
```bash
docker compose -f docker-compose.restore.yml up -d
```

**Verify restore target health:**
```bash
docker compose -f docker-compose.restore.yml ps
# Expect: db_restore  ...  Up ... (healthy)
```

**Restore a backup into the restore target:**
```bash
COMPOSE_FILE=docker-compose.restore.yml \
  DB_SERVICE=db_restore \
  RESTORE_DB_USER=hms_prod_user \
  RESTORE_DB_NAME=gemini_hms_prod \
  BACKUP_FILE=./backups/gemini_hms_prod_backup_20260530_160400.sql \
  RESTORE_CONFIRM=YES \
  bash scripts/db-restore.sh
```

**Verify restored data (optional):**
```bash
docker compose -f docker-compose.restore.yml exec -T db_restore \
  psql -U hms_prod_user -d gemini_hms_prod -c "\dt"
```

**Run smoke test against restored DB (requires secondary app stack):**
Not implemented in Phase 30A. Phase 30B will cover this.

**Teardown the restore target (destroys restored data):**
```bash
docker compose -f docker-compose.restore.yml down -v
```
**Warning:** `down -v` destroys the `postgres_restore_data` volume. All restored data will be lost.

### Safety Warnings

1. **Restore never runs without `RESTORE_CONFIRM=YES`.** The script enforces this.
2. **Restore target is isolated.** `docker-compose.restore.yml` uses a separate volume (`postgres_restore_data`) and network (`hms_restore`). It does not touch the primary `postgres_prod_data` volume.
3. **Do not use real patient data.** All drills must use synthetic or seeded data only.
4. **Teardown warning.** `docker compose -f docker-compose.restore.yml down -v` destroys all restored data. Ensure backups exist before teardown.

### Known Limitations

1. **Smoke test after restore requires secondary app stack.** Phase 30A provides the DB restore target only. Pointing the application to the restored DB requires a separate compose override or manual `DATABASE_URL` change.
2. **No automated migration check after restore.** The restored DB may have a different schema version than the app. Run `npx prisma migrate status` manually.
3. **Windows CRLF issue.** Shell scripts may have CRLF line endings on Windows. Use `bash` explicitly or convert to LF.

### Verdict

- [ ] BLOCKED
- [x] READY-FOR-DRILL

### Next Steps

Proceed to Phase 30B: execute the full backup/restore drill against this clean restore target and record evidence.
