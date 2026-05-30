# Phase 29 Backup and Restore Evidence

## Scope

This document records whether Gemini HMS can create a database backup, restore it into a clean database, and pass smoke checks against restored data.

## Environment

| Field | Value |
|---|---|
| Date | TBD |
| Commit SHA | TBD |
| Operator | TBD |
| Runtime | Local production-equivalent / staging / other |
| Database image/version | TBD |
| Dataset | Seeded synthetic data only |

## Required Commands

```bash
# Validate production-equivalent compose config
docker compose -f docker-compose.prod.yml config

# Start runtime
docker compose -f docker-compose.prod.yml up -d --build

# Confirm containers
docker compose -f docker-compose.prod.yml ps

# Create backup
# Replace with project backup script or pg_dump command once finalized.

# Restore into clean database
# Replace with project restore script or psql/pg_restore command once finalized.

# Run smoke test
BASE_URL=http://localhost:8080 sh scripts/smoke-prod.sh
```

## Results

| Check | Status | Evidence |
|---|---|---|
| Compose config validates | Pending |  |
| Runtime starts | Pending |  |
| Backup created | Pending |  |
| Clean database prepared | Pending |  |
| Restore succeeds | Pending |  |
| Smoke test against restored DB passes | Pending |  |

## Findings

TBD

## Final Verdict

- [ ] PASS
- [ ] FAIL
- [ ] BLOCKED

## Notes

Do not use real patient data for this drill. Use synthetic or seeded data only.
