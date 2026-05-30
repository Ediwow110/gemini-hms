# Release Checklist

Use this checklist before tagging, deploying, demoing, or externally presenting a release candidate.

## Release Identity

| Field | Value |
|---|---|
| Release name/version | TBD |
| Commit SHA | TBD |
| Release owner | TBD |
| Review date | TBD |
| Target environment | Local production-equivalent / staging / pilot / production |

## Go/No-Go Classification

Choose exactly one:

- [ ] NO-GO
- [ ] STAGING-ONLY
- [ ] PILOT-READY
- [ ] PRODUCTION-READY

A release cannot be marked `PRODUCTION-READY` unless all P0 evidence gates are complete.

## Required Evidence

| Gate | Required Evidence | Status | Link / Notes |
|---|---|---|---|
| CI | Green CI on exact commit SHA | Pending |  |
| Docker | Production image or production-equivalent compose validates | Pending |  |
| Runtime | App starts with production-mode environment | Pending |  |
| Smoke test | Health, auth path, frontend/backend path checked | Pending |  |
| Database | Migrations apply cleanly | Pending |  |
| Backup | Backup generated from seeded environment | Pending |  |
| Restore | Backup restored into clean database | Pending |  |
| Security | Dependency and repository hygiene checks reviewed | Pending |  |
| Observability | Health, metrics, logging, and alert plan reviewed | Pending |  |
| Rollback | Rollback procedure documented for this release | Pending |  |
| Claims hygiene | No unsupported compliance/production claims | Pending |  |

## Pre-Release Commands

Run from repository root unless noted otherwise.

```bash
# Backend
cd hms-backend
npm ci
npx prisma validate
npx prisma generate
npm run lint
npm run build
npm run test
npm run test:e2e

# Frontend
cd ../hms-frontend
npm ci
npm run typecheck
npm run lint
npm run test
npm run build

# Production-equivalent compose validation
cd ..
docker compose -f docker-compose.prod.yml config
```

## Deployment Safety

- [ ] Environment variables reviewed
- [ ] Database backup completed before migration/deploy
- [ ] Rollback owner assigned
- [ ] Incident channel identified
- [ ] Known risks documented
- [ ] Demo/test data clearly separated from real patient data

## Compliance and Claims

- [ ] No claim of HIPAA certification unless external evidence exists
- [ ] No claim of SOC 2 certification unless external evidence exists
- [ ] No claim of production readiness unless all P0 gates are complete
- [ ] Any client-facing material labels the system accurately

## Final Decision

| Decision | Owner | Date | Notes |
|---|---|---|---|
| TBD | TBD | TBD | TBD |
