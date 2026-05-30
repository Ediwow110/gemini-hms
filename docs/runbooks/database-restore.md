# Database Restore Runbook

## Purpose

Document the procedure for restoring the HMS database from a backup. This runbook is used when rollback is not possible (destructive migration) or when data corruption requires restoration.

## Backup Source

Backups are created using `pg_dump`:

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

## Restore Command Placeholders

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
