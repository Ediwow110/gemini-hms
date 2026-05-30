# Rollback Runbook

## Purpose

Define the procedure for rolling back the HMS application to a known-good state after a failed or degraded deployment.

## When to Rollback

- Health checks fail after deployment
- Smoke tests fail
- Database migration errors that cannot be resolved
- Critical user-facing regression
- Performance degradation exceeding 2x baseline response time
- Security concern discovered during or after deployment

## Who Decides

The deploy operator or on-call engineer makes the initial call. Escalate to the tech lead if:
- The rollback itself fails
- Database rollback is required
- More than one service needs rollback
- Data integrity is in question

## How to Identify Last Known Good Commit/Image

```bash
# Find the commit deployed before the failed one
git log --oneline -10

# The previous green CI commit is the last known good
# Alternatively, check the Production Docker Build history for the last successful run
```

Tag the last known good commit:

```bash
git tag -a last-known-good -m "Last known good before rollback on $(date -u +%Y-%m-%dT%H:%M:%SZ)"
git push origin last-known-good
```

## Application Rollback Steps

### Docker Compose

```bash
# 1. Revert to the previous image tag
docker compose -f docker-compose.prod.yml down
git checkout last-known-good
docker compose -f docker-compose.prod.yml build
docker compose -f docker-compose.prod.yml up -d

# 2. Verify health
curl http://localhost:3000/api/v1/health
```

### Direct

```bash
# 1. Checkout the last known good commit
git checkout last-known-good

# 2. Rebuild
cd hms-backend && npm ci && npm run build
cd ../hms-frontend && npm ci && npm run build

# 3. Restart services
# (process manager-specific command)
```

## Database Rollback Decision Tree

```
Did the migration include destructive changes (DROP, ALTER)?
├── Yes → Manual restore required. See database-restore.md.
└── No  → Can the migration be reversed with prisma migrate down?
    ├── Yes → Run npx prisma migrate down and re-deploy old version.
    └── No  → Manual restore required. See database-restore.md.
```

**Always** test database rollbacks on a non-production copy first.

## Post-Rollback Validation

- [ ] Health endpoint returns 200
- [ ] Login works
- [ ] Core read/write operations work
- [ ] Audit log records the rollback action
- [ ] Database integrity verified (if migration was rolled back)
- [ ] Team notified of rollback and current state

## Communication Notes

- Notify the team in the operations channel immediately when rollback starts
- Include: deployment time, failed commit SHA, rollback target, expected duration
- After rollback completes: confirm green state, link to rollback documentation
- Schedule a post-incident review if the rollback was caused by process gap

## Known Limitations

- Rollback does not automatically revert data written by the new version
- Long-running migrations may require data reconciliation
- Clients connected during rollback may see errors — plan for a brief maintenance window
- Database rollback from a destructive migration requires full restore, not just rollback

---

**Note**: This runbook is operator readiness scaffolding. It does not imply production readiness or compliance certification.
