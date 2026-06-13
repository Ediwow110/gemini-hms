## Summary

- Audits backend Prisma `findMany` list queries.
- Classifies externally reachable unbounded queries vs bounded/internal/test/script queries.
- Hardens 15 highest-risk endpoints covering 22 `findMany` calls with safe pagination or hard caps.
- Preserves tenantId/branchId isolation and existing filters.
- Adds shared pagination utility and DTOs.
- Closes PERF-H-1A test gap with 81 focused tests for pagination utilities and DTO validation.
- Updates PERF-H-1 evidence.

## Scope

- Backend query hardening only.
- Backend tests and evidence only.
- No Prisma schema changes.
- No migrations.
- No deployment changes.
- No dependency changes.
- No unrelated auth/admin/script changes.
- No production-readiness claim.
- No HIPAA/SOC 2 claim.

## Baseline

- Total `findMany` calls inventoried: 136
- Source `findMany` calls: 97
- Test-only `findMany` calls: 12
- Script `findMany` calls: 25
- Seed `findMany` calls: 2
- Externally reachable unbounded queries found: 57

## Hardened in This PR

- 15 high-risk endpoints hardened.
- 22 `findMany` calls affected.
- Areas hardened:
  - analytics
  - audit/compliance
  - billing
  - encounters
  - inventory
  - lab
  - nursing
  - notifications
  - orders
  - pharmacy

## Test Gap Closure

- Added 81 tests.
- `hms-backend/src/common/utils/pagination.spec.ts`: 48 tests.
- `hms-backend/src/common/dto/pagination.dto.spec.ts`: 33 tests.
- Covered:
  - `clampTake`
  - `clampPage`
  - `getPaginationOptions`
  - pagination constants
  - `PaginationDto`
  - `AuditPaginationDto`

## Verification

- `npm run lint`: 0 errors
- `npm run typecheck`: PASS
- `npm test`: 1526/1526 PASS, 77 suites
- `npm run build`: PASS
- `npx prisma validate`: PASS
- `git diff --check`: clean

## Security Safety

- tenantId/branchId filters preserved.
- auth/session/CSRF guards untouched.
- no raw SQL added.
- no schema or migration changes.
- no deployment changes.
- no cross-tenant/cross-branch behavior introduced.

## Scope Cleanup

- Previous PR #201 included unrelated branch-history files and was closed.
- This clean PR excludes all disallowed scope-drift files:
  - AGENTS.md
  - hms-backend/src/admin/admin.service.spec.ts
  - hms-backend/src/auth/jwt.strategy.ts
  - hms-backend/src/auth/auth.service.spec.ts
  - hms-backend/src/auth/tests/session-boundary.spec.ts
  - scripts/verify-branding-guard.js
  - frontend files
  - schema/migration/deployment/package changes

## Remaining Risks / Deferred Items

- Integration tests for each modified service method are deferred.
- Analytics aggregation is approximate for tenants above 5000 records.
- Audit `verifyChain` is capped above 10000 logs and uses a `truncated` flag.
- Lab turnaround metrics are based on the recent capped result set.
- Remaining backend `no-unsafe-argument` warnings are unrelated and deferred.

## Evidence

- `docs/evidence/perf-h1-pagination-unbounded-query-hardening.md`

## Verdict

STAGING-ONLY / PERF-H-1 PAGINATION HARDENING COMPLETE / PERF-H-1A TEST GAP CLOSED
