# Deploy Runbook

## Purpose

Standardise the deployment process for the HMS application across local-production-equivalent, staging, and pilot environments.

## Scope

- Local production-equivalent
- Staging
- Pilot

This runbook does **not** cover production deployment. The system is not yet production-ready.

## Prerequisites

- Git access to the repository
- Node.js 20.x
- PostgreSQL 15+ running and accessible
- Environment variables configured (see environment-checklist.md)
- Docker and Docker Compose (for containerised deployments)
- Access to container registry (if pulling pre-built images)

## Required Environment Variables

See `environment-checklist.md` for the full list. At minimum:

- `DATABASE_URL`
- `JWT_SECRET`
- `NODE_ENV`

## Pre-Deploy Checklist

- [ ] Working tree is clean (`git status`)
- [ ] Current branch is `main` or a release candidate
- [ ] All CI checks pass for the commit being deployed
- [ ] Production Docker Build CI job passed
- [ ] Database migrations reviewed and tested
- [ ] Backup of current database taken (if any data exists)
- [ ] Environment variables verified against checklist
- [ ] Secrets rotated if deploying to a new environment
- [ ] Smoke tests planned and documented

## Backup-Before-Deploy Requirement

Always back up the database before deploying:

```bash
pg_dump -h $DB_HOST -U $DB_USER -d $DB_NAME -F c -f pre-deploy-backup-$(date +%Y%m%d%H%M%S).dump
```

Store the backup in a secure, access-controlled location. Never store backups alongside source code.

## Migration Checklist

- [ ] Prisma migrations are up to date (`npx prisma migrate status`)
- [ ] Migrations are applied before starting the new application version
- [ ] Migration rollback steps documented (see rollback.md)
- [ ] Migrations tested against a copy of production data (staging only)

## Deployment Command Sequence

### Local Production-Equivalent (Docker Compose)

```bash
# 1. Pull latest
git checkout main && git pull origin main

# 2. Build and start
docker compose -f docker-compose.prod.yml build
docker compose -f docker-compose.prod.yml up -d

# 3. Apply migrations
docker compose -f docker-compose.prod.yml exec api npx prisma migrate deploy

# 4. Verify health
docker compose -f docker-compose.prod.yml ps
curl http://localhost:3000/api/v1/health
```

### Local Production-Equivalent (Direct)

```bash
# 1. Build backend
cd hms-backend
npm ci
npm run build

# 2. Build frontend
cd ../hms-frontend
npm ci
npm run build

# 3. Run migrations
cd ../hms-backend
npx prisma migrate deploy

# 4. Start backend
NODE_ENV=production node dist/main.js
```

## Post-Deploy Smoke Tests

- [ ] Health endpoint returns 200 (`GET /api/v1/health`)
- [ ] Login works for at least one admin user
- [ ] UI loads without console errors
- [ ] A read-only query executes successfully (e.g., list patients)
- [ ] A write operation executes successfully (e.g., create patient)
- [ ] Audit log records the deployment action

## Go/No-Go Criteria

| Criterion | Pass | Fail |
|---|---|---|
| CI green | ✅ | ❌ |
| Docker build green | ✅ | ❌ |
| Smoke tests pass | ✅ | ❌ |
| Database backup taken | ✅ | ❌ |
| Migrations applied | ✅ | ❌ |
| Operator available post-deploy | ✅ | ❌ |

If any criterion is red, do **not** proceed. Rollback immediately (see rollback.md).

## Rollback Trigger Points

- Smoke tests fail after deploy
- Health endpoint returns non-200 after 2 minutes
- Database migration error that cannot be resolved within 5 minutes
- User-reported critical issue within 30 minutes of deploy

See `rollback.md` for the full rollback procedure.

---

**Note**: This runbook describes deployment for operator readiness scaffolding. It does not imply production readiness or compliance certification.
