# Database Restore Runbook

## Purpose

Document the procedure for restoring the HMS database from a backup. This runbook is used when rollback is not possible (destructive migration) or when data corruption requires restoration.

## Automated Scripts

Automated backup and restore scripts are provided in the `scripts/` directory:

- `scripts/db-backup.sh` — Creates a timestamped SQL dump via Docker Compose
- `scripts/db-restore.sh` — Restores from a backup file with explicit confirmation

### Backup

```bash
DB_USER=postgres DB_NAME=hms_db sh scripts/db-backup.sh
```

The backup file is written to `./backups/` by default (overridable via `BACKUP_DIR`).

### Restore into Primary Database

```bash
BACKUP_FILE=./backups/hms_db_backup_20260530_120000.sql \
  DB_USER=postgres DB_NAME=hms_db \
  RESTORE_CONFIRM=YES \
  sh scripts/db-restore.sh
```

**Safety**: Restore requires `RESTORE_CONFIRM=YES` and a valid `BACKUP_FILE` path.

### Restore into Clean Target (Drill Environment)

For restore drills, use the dedicated restore target compose file to avoid touching the primary database volume:

```bash
# 1. Start the clean restore target
docker compose -f docker-compose.restore.yml up -d

# 2. Restore backup into the restore target
COMPOSE_FILE=docker-compose.restore.yml \
  DB_SERVICE=db_restore \
  RESTORE_DB_USER=hms_prod_user \
  RESTORE_DB_NAME=gemini_hms_prod \
  BACKUP_FILE=./backups/gemini_hms_prod_backup_*.sql \
  RESTORE_CONFIRM=YES \
  bash scripts/db-restore.sh

# 3. Teardown when done (destroys restored data)
docker compose -f docker-compose.restore.yml down -v
```

The restore script supports `RESTORE_DB_USER` and `RESTORE_DB_NAME` env vars that override `DB_USER`/`DB_NAME` for restore target scenarios. This allows the `.env` file to keep primary DB credentials while the restore drill uses separate credentials.

## Manual Backup

Backups can also be created manually using `pg_dump`:

```bash
pg_dump -h $DB_HOST -U $DB_USER -d $DB_NAME -F c -f backup-$(date +%Y%m%d%H%M%S).dump
```

Store backups in a secure, encrypted location separate from the application server.

**Never store database backups in the source code repository.**

## Restore Target

The restore target is a new or clean PostgreSQL database. Do **not** restore onto a database that currently has active connections.

## Clean Database Creation

```bash
# Create a new database (run as PostgreSQL superuser)
createdb -h $DB_HOST -U $DB_SUPERUSER $NEW_DB_NAME

# Or via psql
psql -h $DB_HOST -U $DB_SUPERUSER -c "CREATE DATABASE $NEW_DB_NAME;"
```

## Manual Restore Commands

```bash
# Restore using pg_restore (for custom-format dumps)
pg_restore -h $DB_HOST -U $DB_USER -d $NEW_DB_NAME -v backup-file.dump

# Restore using psql (for plain SQL dumps)
psql -h $DB_HOST -U $DB_USER -d $NEW_DB_NAME -f backup-file.sql
```

## Migration Compatibility Check

After restore, verify that the restored schema is compatible with the application version being deployed:

```bash
# Check migration status (run from the application directory)
npx prisma migrate status
```

If migrations are ahead of the restored schema, apply them:

```bash
npx prisma migrate deploy
```

If migrations are behind the restored schema, the restore target is newer than the application — use a newer application version or an older backup.

## Smoke Test After Restore

- [ ] Health endpoint returns 200
- [ ] Login works for existing users
- [ ] Core read operations return expected data
- [ ] Core write operations succeed
- [ ] Audit log records the restore action

## Data Safety Warnings

- Restoring a backup overwrites all current data in the target database
- Ensure the target database is correct before running restore commands
- Verify the backup file is from a trusted source and has not been tampered with
- Never restore a backup from an unknown or untrusted source
- After restore, rotate all secrets that may have been in the backup (JWT_SECRET, etc.)

## Synthetic Data Requirement for Drills

All restore drills must use **synthetic data only**.

Use the seed scripts provided in the repository:

```bash
cd hms-backend
npx prisma db seed
```

## Do Not Use Real Patient Data

**Under no circumstances should real patient data be used for restore drills, testing, or development environments.** If real data is required for debugging a production issue, use a sanitised subset with all personally identifiable information (PII) and protected health information (PHI) removed.

---

**Note**: This runbook is operator readiness scaffolding. It does not imply production readiness or compliance certification.
