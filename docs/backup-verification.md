# Backup Verification Policy

## Principle
"A backup that has never been restored is not a backup."

## Automated Verification Script

A script is provided to verify backup integrity by restoring it into a throwaway database and running smoke tests.

**Location**: `hms-backend/scripts/verify-backup-restore.ts`

### Prerequisites
- `DATABASE_URL_RESTORE_TEST` environment variable pointing to a clean/temporary PostgreSQL instance.
- Access to the backup file (SQL format).

### Running Verification
```bash
# From hms-backend directory
npx ts-node scripts/verify-backup-restore.ts /path/to/backup.sql
```

### Success Criteria
1. Script completes with "Backup verification SUCCESSFUL".
2. Throwaway DB contains valid non-zero user and tenant counts.
3. Health check endpoint (pointed at restored DB) returns OK.

### Handling Failure
If verification fails:
1. **IMMEDIATE**: Alert the DevOps/Security lead.
2. **INVESTIGATE**: Check backup creation logs for errors.
3. **RE-RUN**: Manual backup and verify again.
4. **DOCUMENT**: Record the failure and resolution in the incident log.
