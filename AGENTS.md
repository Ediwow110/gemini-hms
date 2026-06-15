# Standing Instructions
- **Always activate relevant skills and plugins** before any task — audit, read, edit, write, review, debug, test, or any other operation. Invoke the skill tool first, then proceed. This is not optional.

# Session State
## Goal
- The production-readiness remediation lane was merged to `main` via PR #226. All 42 commits are merged, CI is green (5/5 checks pass), and local repo is synced.
- Staging environment is NOT YET PROVISIONED — that is the current blocker.

## Constraints & Preferences
- Work on `main` unless branching off for a new task
- Do not claim staging readiness unless staging is actually provisioned and verified
- Separate local/CI proof from staging/production proof clearly
- Workspace root: `D:\Vscode\hms-login-OFFICIAL`

## Progress
### Done (Committed Baseline)
- **Phase 1 (`8f4ce6c`):** 4 Prisma indexes, event key registry (70+ keys), DTO validation (audit-query, audit-export with class-validator), `ValidationPipe` in findAll. 21/21 audit tests.
- **Phase 2 (`4c5e0a7`):** `findMyEvents`, `findEntityTimeline`, `verifyChainWithSignatures`, `exportEvents`; 4 new controller endpoints. 21/21 audit tests.
- **Phase 3 (`94bff48`):** `PAYMENT_VOID_REJECTED`/`REFUND_REJECTED`/`RECONCILIATION_PERFORMED`; `POST /receipts/event` endpoint. 21/21 audit tests.
- **Phase 4+5 (`7b27178`):** Frontend audit UX (MyAuditLog, AuditEventDetail, EntityTimeline, admin rewrites, permissions, routes, hooks) + operational hardening (chain review UI, breach/compliance pages, 6-class retention, daily chain verification cron). 23 audit tests total.

### Done (Blocker Fixes — Committed)
Three verified critical blockers were fixed and committed in `715b50f`:
1. **Backend permission enforcement**: `audit.controller.ts` — `events/self` now requires `audit.self`, `export` now requires `audit.export`
2. **Pagination refetch**: `use-compliance.ts` — removed stale `paramsRef`+`useCallback([],[])` pattern; hooks now re-trigger on param change via serialized `paramsKey` dependency
3. **Admin audit source**: `AuditLogsPage.tsx`, `AuditLogViewer.tsx` — switched from `useMyAuditEvents` to `useAuditEvents` for full tenant/branch-scoped data

### Validation (Merged State — PR #226)
- Remote CI: 5/5 checks pass (Static Analysis, Backend Tests, Frontend Tests, Docker Build, Vercel Preview)
- Local: 80 suites / 1614 tests passing, lint 0 errors, tsc clean
- Staging: NOT PROVISIONED

### Unresolved (Carryover Risks — Current)
Risks ranked by severity:

**HIGH:**
- (Resolved) Remote CI proof exists — PR #226 merged with 5/5 checks passed
- No staging environment — only production SSH target exists in deploy.yml

**MEDIUM:**
- Pre-existing spec/e2e type errors (173 in `hms-backend/test/`) — auth, billing, admin spec files
- AuditLog archive: retention is count-only (schema change deferred; immutability trigger blocks physical delete)

**LOW:**
- (Resolved) Chaos script health-probe path drift fixed in `b088259`; no stale references remain
- (Resolved) Working tree is clean; no uncommitted changes remain

## Key Decisions
- Reuse existing `AuditLog` model and `AuditService.log()` throughout
- Print/reprint/export events emitted via `POST /receipts/event` (frontend-triggered)
- Rejection events added in `BillingService` rather than `ApprovalsService`
- HMAC uses `JWT_SECRET` env var for compatibility
- Retention is count-only (schema change deferred)
- `audit.branch`/`audit.global`/`audit.admin` not added — backend role-based filtering is the authority
- Blocker fixes committed in `715b50f` under descriptive fix commit

## Next Steps
1. **Provision staging environment** — see `docs/infrastructure/staging-provisioning-handoff.md` for exact requirements
2. After staging is healthy → deploy and run E2E / integration smoke tests against staging
3. After staging validated → trigger production deploy via `deploy.yml` (manual workflow_dispatch)

## Critical Context
- **42 commits merged** via PR #226 (toolchain stabilization, 8 production-readiness blockers, frontend hardening, canonical report, provenance corrections). Local repo is at parity with `origin/main`.
- **8 backend endpoints**: 3 original + 4 Phase 2 + 1 Phase 3 (receipt/event)
- **Audit event keys**: 70+ across CLINICAL, FINANCIAL, ADMIN, SECURITY, PHARMACY, PRESCRIPTION, LAB, INVENTORY
- **Permissions**: `audit.view` (existing), `audit.self` (new, backend-enforced), `audit.export` (new, backend-enforced)
- **Roles added**: `Compliance Officer` (all 3 audit permissions), `IT Support` (audit.view + audit.self)
- **Daily cron**: `AuditChainMonitorService` at midnight per tenant
- **Retention**: 6-class (FINANCIAL 10y, CLINICAL 10y, ADMIN 3y, SECURITY 5y, EXPORT 1y, TRANSIENT 90d)
- **31 files changed**: 13 new, 18 modified across all phases + blocker fixes

## Relevant Files
(unchanged from prior session — see committed baseline and working-tree diffs)

## Carryover Risks
Ranked by severity:

**HIGH:**
1. **No staging environment** — only production SSH target exists in deploy.yml

**MEDIUM:**
2. **Pre-existing spec/e2e type errors (173)** — all in `hms-backend/test/` spec/e2e files across auth, billing, admin
3. **AuditLog retention** — count-only enforcement; no schema change for archival by class

**LOW:**
4. (Resolved) **Stale health-probe path in chaos scripts** — fixed in `b088259`; no stale references remain
5. (Resolved) **Working tree** — clean; no uncommitted changes
