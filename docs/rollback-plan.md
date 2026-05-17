# Rollback & Recovery Plan

## 1. Application Version Rollback
- **Git Revert**: Identify the faulty commit hash. Run `git revert <commit_hash>` to create a revert commit.
- **Redeploy**: Push the revert commit to `main`. CI/CD will automatically build and deploy the previous working version.
- **Feature Flags**: If the issue is isolated to a specific feature, toggle the corresponding feature flag in the environment configuration (`.env` or secrets manager) to `false` and restart the application containers.

## 2. Database Migration Rollback
- **Prisma Migrate**: If a migration introduced breaking schema changes, use `npx prisma migrate resolve --rolled-back <migration_name>` to mark it as rolled back, then `npx prisma migrate dev` to revert to the previous state.
- **Manual Reversion**: For destructive migrations (e.g., column drops), restore from the latest backup (see Section 3) and replay migrations up to the safe point using `npx prisma migrate status` to verify alignment.
- **Warning**: Never rollback migrations that have already mutated production data without a verified backup.

## 3. Backup Restoration
- **Locate Backup**: Identify the most recent successful backup from `ops/backups/` or the configured S3 bucket.
- **Verify Integrity**: Run `./ops/backup/verify-restore.sh <backup_file>` against a staging database to confirm data integrity.
- **Restore**:
  ```bash
  gunzip -c <backup_file>.sql.gz | psql -h $DB_HOST -U $DB_USER -d $DB_NAME
  ```
- **Post-Restore**: Run `npx prisma migrate deploy` to ensure schema alignment, then restart application services.

## 4. Incident Communication Template
```text
SUBJECT: [INCIDENT] HMS Service Degradation - Rollback Initiated

BODY:
Dear Team,

An incident was detected affecting the HMS platform at [TIMESTAMP UTC].
Impact: [Describe affected modules/users]
Action Taken: Application rolled back to version [VERSION] / Database restored from backup [BACKUP_ID].
Current Status: [Stabilizing / Monitoring / Resolved]
Next Update: [TIME]

Please direct all inquiries to the incident response channel: [#incidents-hms]

Thank you,
HMS Engineering Team
```
