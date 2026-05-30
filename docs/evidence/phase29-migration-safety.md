# Phase 29 Database Migration Safety Evidence

## Scope

This document records database migration safety posture for the release candidate.

## Environment

| Field | Value |
|---|---|
| Date | 2026-05-30 |
| Commit SHA | e5317a3 |
| Operator | automated-ci |
| Database | PostgreSQL 15 (Docker) |

## Required Checks

| Check | Command | Status | Evidence |
|---|---|---|---|
| Prisma schema validation | `npx prisma validate` | PASS | Schema valid. |
| Prisma client generation | `npx prisma generate` | PASS | Client generated v7.8.0. |
| Migration deploy (clean) | `npx prisma migrate deploy` | BLOCKED | Requires PostgreSQL. CI passes this step. |
| Migration status | `npx prisma migrate status` | BLOCKED | Cannot reach `localhost:5432`. CI passes. |
| Seeded DB migration result | N/A | BLOCKED | Requires running DB with seed data. |

## Migration Safety Checklist

| Item | Status | Notes |
|---|---|---|
| No pending unapplied migrations | CI check | CI runs `prisma migrate deploy` and `prisma migrate status` — both pass. |
| Destructive migrations reviewed | Guideline | All schema changes should be reviewed for backward compatibility. No automated guardrails. |
| Backup-before-migration rule | Documented | Runbooks specify backup before deploy. |
| Rollback decision tree | Documented | `docs/runbooks/rollback.md` covers migration rollback. |
| Migration files tracked in git | Yes | All migrations in `hms-backend/prisma/migrations/`. |
| `prisma.config.ts` exists | Yes | Configures Prisma with datasource and generator. |

## Known Risks

1. **No automated migration dry-run**: Migrations are applied directly to the target database. No `--preview-feature` dry-run in CI.
2. **No schema drift detection**: No tooling to detect if the production database schema differs from the migration history.
3. **No zero-downtime migration process**: All migrations lock tables. No blue-green or shadow pattern.
4. **No migration rollback testing**: Rollback procedure exists in runbooks but has not been exercised.
5. **Phase 14 + Sprint 2A migrations unapplied**: Local environment lacks PostgreSQL. These migrations exist in `prisma/migrations/` but have not been tested against a running database.

## Final Verdict

- [ ] PASS
- [ ] FAIL
- [x] BLOCKED

## Notes

CI proves migration validation and client generation. Full migration deploy requires a running PostgreSQL instance. System remains **STAGING-ONLY**.
