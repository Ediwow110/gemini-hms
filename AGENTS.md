# Standing Instructions
- **Always activate relevant skills and plugins** before any task — audit, read, edit, write, review, debug, test, or any other operation. Invoke the skill tool first, then proceed. This is not optional.

# Session State
## Goal
- The audit-log hardening lane (5 phases) is locally complete and frozen. All 5 phases committed, 3 critical blockers fixed and validated locally. Lane is LOCAL GREEN / EXTERNAL PROOF PENDING — not pushed, not CI-proven, not staging-proven.

## Constraints & Preferences
- Stay local; do not push or open PR from this lane unless explicitly requested
- Do not claim staging readiness without remote CI proof
- Separate local proof from external proof clearly
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

### Validation (Frozen State)
- Backend: 77 suites / 1537 tests passing, typecheck clean (pre-existing spec errors only), audit lint 0 errors/3 warnings
- Frontend: 73 files / 406 tests passing, typecheck 0 errors, lint 0 errors, build clean

### Unresolved (Carryover Risks — Current)
Risks ranked by severity:

**HIGH:**
- No remote CI proof — never pushed, CI has never run on these commits
- No staging environment — only production SSH target exists in deploy.yml

**MEDIUM:**
- Pre-existing spec/e2e type errors (173 in `hms-backend/`) — `auth/`, `billing/`, `admin/` spec files
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

## Next Steps (When Authorized)
1. Create feature branch + push + open PR to `main` → triggers CI
2. After CI green → provision staging environment

## Critical Context
- **5 committed fixes** (`8f4ce6c`–`715b50f`): All local, no pushes.
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
1. **No remote CI proof** — never pushed, CI has never run on these commits
2. **No staging environment** — only production SSH target exists in deploy.yml

**MEDIUM:**
3. **Pre-existing spec/e2e type errors (173)** — all in `hms-backend/test/` spec/e2e files across auth, billing, admin
4. **AuditLog retention** — count-only enforcement; no schema change for archival by class

**LOW:**
5. (Resolved) **Stale health-probe path in chaos scripts** — fixed in `b088259`; no stale references remain
6. (Resolved) **Working tree** — clean; no uncommitted changes
