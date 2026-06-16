# Standing Instructions
- **Always activate relevant skills and plugins** before any task — audit, read, edit, write, review, debug, test, or any other operation. Invoke the skill tool first, then proceed. This is not optional.
- **Do not invent unavailable tool names.** If the environment does not expose a named tool like `run_command`, `get_current_working_directory`, or similar pseudo-tools, use the actual available shell/file tools directly and continue. Check available tools first; do not stop just because a guessed tool name failed.
- **Work on branch `remediation/production-readiness-lane-2`** (created from `main@HEAD`). Commit locally; do not push.

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

### Committed Baseline
- **`93c5fd6` — UsersPage lane:** Backend `AdminService.listUsers()`/`getUser()`, `GET /api/v1/admin/users` and `/:id`; frontend `UsersPage.tsx` wired to live API. 219 admin tests.
- **`aa068f2` + `d731cab` — RolesPermissionsPage lane:** Backend `AdminService.listRoles()`/`listPermissions()`, `GET /api/v1/admin/roles` and `/permissions`; frontend `RolesPermissionsPage.tsx` wired to live API, role list from API, PermissionMatrix read-only with honest WIP notices. 223 admin tests. Circular `useCallback` dep fixed.

### Carryover Risks
**HIGH:**
- No staging environment — only production SSH target exists in deploy.yml

**MEDIUM:**
- Pre-existing spec/e2e type errors (173 in `hms-backend/test/`) — auth, billing, admin spec files
- AuditLog retention: count-only enforcement; no schema change for archival by class
- AdminCreateUserForm, AdminBranchForm, AdminSettingsPage, AdminTenantNetworkPage still on hardcoded/mock data (not in scope for this lane)

**LOW:**
- (Resolved) Chaos script health-probe path drift fixed in `b088259`; no stale references remain
- Tree is clean

## Key Decisions
- Reuse existing `AuditLog` model and `AuditService.log()` throughout
- Print/reprint/export events emitted via `POST /receipts/event` (frontend-triggered)
- Rejection events added in `BillingService` rather than `ApprovalsService`
- HMAC uses `JWT_SECRET` env var for compatibility
- Retention is count-only (schema change deferred)
- `audit.branch`/`audit.global`/`audit.admin` not added — backend role-based filtering is the authority
- Blocker fixes committed in `715b50f` under descriptive fix commit
- Used `admin.health.view` permission for GET user endpoints (less privileged than `admin.role.change` used for mutations)
- Excluded `passwordHash` and `mfaSecret` from admin user list/detail responses
- Tenant-scoped by `actor.tenantId` automatically; branch-scoped admins filtered to their branch
- Mapped backend `AdminUserItem` to frontend `UserItem` shape in UsersPage (surfacing real data where available, honest defaults for unavailable fields like `lastLogin`)

## Next Steps
1. **Provision staging environment** — see `docs/infrastructure/staging-provisioning-handoff.md` for exact requirements
2. After staging is healthy → deploy and run E2E / integration smoke tests against staging
3. After staging validated → trigger production deploy via `deploy.yml` (manual workflow_dispatch)
4. **(Admin lane queue):** Next unlockable pages — AdminExecutiveDashboard (dashboard missing endpoints), then BranchesPage/TenantsPage (new backend modules)

## Critical Context
- **42 commits merged** via PR #226. Local repo at parity with `origin/main`. Current work on branch `remediation/production-readiness-lane-2`.
- **Backend `AdminModule`** (`admin.controller.ts`, `admin.service.ts`, `admin.module.ts`) now has GET `/api/v1/admin/users` and `/:id` endpoints in addition to existing mutation endpoints.
- **Frontend `UsersPage`** now calls live API via `admin.service.ts`; retains honest WIP notices for mutation actions.
- **Other 6 admin pages** still on mock/hardcoded data: AdminExecutiveDashboard, BranchesPage, TenantsPage, SecurityCenterPage, ReportsAnalyticsPage, SystemSettingsPage (not in scope for this lane).
- **Audit event keys**: 70+ across CLINICAL, FINANCIAL, ADMIN, SECURITY, PHARMACY, PRESCRIPTION, LAB, INVENTORY
- **Permissions**: `audit.view`, `audit.self`, `audit.export` for audit module; `admin.health.view` for user read endpoints
- **Roles added**: `Compliance Officer` (all 3 audit permissions), `IT Support` (audit.view + audit.self)
- **Daily cron**: `AuditChainMonitorService` at midnight per tenant
- **Retention**: 6-class (FINANCIAL 10y, CLINICAL 10y, ADMIN 3y, SECURITY 5y, EXPORT 1y, TRANSIENT 90d)

## Relevant Files
### This Session (Uncommitted)
- `hms-backend/src/admin/admin.controller.ts` — GET `/api/v1/admin/users` and `/:id`
- `hms-backend/src/admin/admin.service.ts` — `listUsers()`, `getUser()`, pagination, filters
- `hms-backend/src/admin/admin.controller.spec.ts` — 5 new test cases
- `hms-frontend/src/services/admin.service.ts` — API service (untracked)
- `hms-frontend/src/portals/admin/UsersPage.tsx` — live API wiring, loading/empty/error states
- `docs/superpowers/plans/2026-06-16-admin-governance-backend-roadmap.md` — roadmap doc (intentional, untracked)
- `AGENTS.md` — this session state file
