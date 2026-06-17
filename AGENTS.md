# Standing Instructions
- **Always activate relevant skills and plugins** before any task — audit, read, edit, write, review, debug, test, or any other operation. Invoke the skill tool first, then proceed. This is not optional.
- **Do not invent unavailable tool names.** If the environment does not expose a named tool like `run_command`, `get_current_working_directory`, or similar pseudo-tools, use the actual available shell/file tools directly and continue. Check available tools first; do not stop just because a guessed tool name failed.
- **Work on branch `remediation/production-readiness-lane-2`** (created from `main@HEAD`). Commit locally; do not push.

# Session State
## Goal
- 43 prior commits on `remediation/production-readiness-lane-2` documented in `AGENTS.md` baseline (Phases 1–5, 3 blocker fixes, UsersPage lane, RolesPermissionsPage lane, Branch Management lane, AdminExecutiveDashboard carryover, Proactive Staging Repo-Prep lane in `72bd168`, Inventory Sidebar carryover).
- 10 honest-UX mega-lane commits (b5df7498..bcb6548e) done between prior AGENTS.md update and this session: production-readiness mock purge, admin truth-gap contradiction removal, integration/field-service/marketplace hardcoded-data purge, body-level sandbox notices + audit footers across the 7-page family, pop-culture employee/provider placeholder removal.
- This session: verified bcb6548e honestly (9/10 claims confirmed, 1 false), then fixed the 1 pre-existing backend tsc error in `d36d67e6`.
- CI green, local 84/1695 backend + 98/580 frontend tests passing, **backend tsc --noEmit now 0 errors** (was 1 pre-existing from `21916ccf`).
- Staging is **still NOT provisioned** — the hard external blocker remains (no VM, no DB, no DNS, no GitHub environment/secrets).

## Constraints & Preferences
- Work on `main` unless branching off for a new task
- Do not claim staging readiness unless staging is actually provisioned and verified
- Separate local/CI proof from staging/production proof clearly
- Workspace root: `D:\Vscode\hms-login-OFFICIAL`

## Progress
### Done (Committed Baseline — Prior Sessions)
- **Phase 1 (`8f4ce6c`):** 4 Prisma indexes, event key registry (70+ keys), DTO validation (audit-query, audit-export with class-validator), `ValidationPipe` in findAll. 21/21 audit tests.
- **Phase 2 (`4c5e0a7`):** `findMyEvents`, `findEntityTimeline`, `verifyChainWithSignatures`, `exportEvents`; 4 new controller endpoints. 21/21 audit tests.
- **Phase 3 (`94bff48`):** `PAYMENT_VOID_REJECTED`/`REFUND_REJECTED`/`RECONCILIATION_PERFORMED`; `POST /receipts/event` endpoint. 21/21 audit tests.
- **Phase 4+5 (`7b27178`):** Frontend audit UX (MyAuditLog, AuditEventDetail, EntityTimeline, admin rewrites, permissions, routes, hooks) + operational hardening (chain review UI, breach/compliance pages, 6-class retention, daily chain verification cron). 23 audit tests total.
- **`715b50f` — 3 Blocker Fixes:** Backend permission enforcement (audit.self/audit.export), pagination refetch (use-compliance.ts), admin audit source (AuditLogsPage/AuditLogViewer).
- **`93c5fd6` — UsersPage lane:** Backend `AdminService.listUsers()`/`getUser()`, `GET /api/v1/admin/users` and `/:id`; frontend `UsersPage.tsx` wired to live API. 219 admin tests.
- **`aa068f2` + `d731cab` — RolesPermissionsPage lane:** Backend `AdminService.listRoles()`/`listPermissions()`, `GET /api/v1/admin/roles` and `/permissions`; frontend `RolesPermissionsPage.tsx` wired to live API, role list from API, PermissionMatrix read-only with honest WIP notices. 223 admin tests. Circular `useCallback` dep fixed.
- **`252fe42` — Branch Management lane:** Backend `branches/` module (controller, service, 15 tests), frontend `BranchesPage.tsx` wired to live API with honest WIP defaults for unsupported fields (director, doctors, nurses, beds, queue, latency). 15/15 backend tests pass.
- **`e66dd6dc` — AdminExecutiveDashboard carryover:** Patient Volume Trend chart live via `HmsTrendChart` + `getAdminTrends`. Revenue Trend remains `HmsDataUnavailable` (honest). 2/2 frontend tests pass.

### Done (This Session — Proactive Staging Repo-Prep Lane)
Committed in `72bd168`:
1. **`.github/workflows/deploy-staging.yml`** — 2-job staging deployment workflow (`docker-build` + `cd-deploy-staging` with `environment: Staging` and 11 `STAGING_*` secrets). No CI step (operator deploys green commits only). SSH secrets prefixed `STAGING_SSH_*` to prevent fallback to repo-level production credentials.
2. **`docker-compose.staging.yml`** — 3-service topology (db, backend, frontend) from prod template with isolated volume (`postgres_staging_data`) and network (`hms_staging`); same env var names as prod.
3. **`hms-backend/scripts/remote-deploy-staging.sh`** — Separate 59-line deploy script (all 6 references use `docker-compose.staging.yml`). Zero production risk. Health probe path preserved.
4. **`docs/infrastructure/staging-provisioning-handoff.md`** — SSH secrets renamed to `STAGING_SSH_*`; 11 secrets now consistent with workflow env references.

### 10 Honest-UX Mega-Lane Commits (Between Prior AGENTS.md Update and This Session)
**Mega-lane summary:** Eliminate every confirmed production-readiness blocker surfaced in source audit. No fake data, no fake success, no dead interactive shells, no misleading production semantics. Body-level sandbox notices + audit footers across the 7-page family. Pop-culture placeholder names replaced with neutral sandbox identifiers.

- `b5df7498` — `fix(production-readiness): eliminate remaining mock/sandbox production exposure` (22 files, +1046/-1417). 4 admin pages → honest stubs, StockReceiving wired live, demo-data file deleted, 3 backend stubs now throw `NotImplementedException`, factory rejects mock providers in production.
- `0eebbe68` — `fix(admin): remove remaining admin truth-gap contradiction` (4 files, +147/-124). SuperAdminDashboard honest stub, AdminShellNotice truthful.
- `0c04cdb2` — `fix(integration): wire approval center to live billing reversals and fix summary KPIs`
- `1da0f66d` — `fix(integration): align shell notice and KPI counters with live backend state`
- `14c25bc2` — `fix(integration): remove hardcoded fake HL7 alert + fake 98.2% health from IntegrationDashboard`
- `13d08eab` — `fix(field-service): rewrite FieldServiceShellNotice + remove misleading dashboard footer`
- `8ad9d7e9` — `fix(marketplace): replace hardcoded mock KPI numbers with live backend data`
- `9ad19bf5` — `fix(marketplace): add body-level sandbox notice + audit footer to admin dashboard and reports`
- `fa6a64e8` — `fix(patients): add body-level sandbox notice + audit footer to legacy PatientList`
- `e455acfa` — `fix(settings+notifications): add body-level sandbox notice + audit footer to 7-page family`
- `bcb6548e` — `fix(hr-portal+doctor-timeline): replace pop-culture employee/provider placeholders with neutral sandbox identifiers` (11 files, +60/-50). 9 HR portal files + 2 doctor portal files. HRDashboard alert count derived from data. Sandbox notices added where missing.

### Done (This Session — Pop-Culture Name Cleanup Extension Lane, Commit `6a598704`)
**Trigger:** bcb6548e (3 commits prior) replaced pop-culture names in 9 HR + 2 doctor portal files, but missed 4 files that still contained the same House M.D. + Hill House + Frankenstein characters.

**Fix:** Replaced pop-culture names in 4 honestly-stubbed sandbox pages:
- `hms-frontend/src/portals/doctor/DoctorEMRPage.tsx` — `mockPatientDb` Eleanor Vance / Arthur Pendleton / Victor Frankenstein → `Patient 001/002/003`; in-component fallback derivation also updated.
- `hms-frontend/src/features/emr/EMRWorkspace.tsx` — fallbackQueue catch-block entries → `Patient 001/002`.
- `hms-frontend/src/portals/procurement/PurchaseRequestsPage.tsx` — `Dr. House / Nurse Hopps / Dr. Chase` → `Requester 001/002/003` (generic placeholders like `Engr. Smith`, `Nurse Wilson` preserved).
- `hms-frontend/src/portals/patient/PatientMessagesPage.tsx` — `Dr. House` (sender + preview) → `Provider 003`.

**New regression tests** (mirror `NurseSpecimenCollectionPage.test.tsx:117` pattern):
- `hms-frontend/src/portals/doctor/__tests__/DoctorEMRPage.test.tsx` (2 tests)
- `hms-frontend/src/portals/procurement/__tests__/PurchaseRequestsPage.test.tsx` (2 tests)
- `hms-frontend/src/portals/patient/__tests__/PatientMessagesPage.test.tsx` (2 tests)

**Validation (this session):**
- `cd hms-frontend && npx tsc --noEmit` → 0 errors
- `cd hms-backend && npx tsc --noEmit` → 0 errors
- `cd hms-frontend && npm run lint` → 0 errors, 2 pre-existing warnings
- `cd hms-frontend && npm test` → 101 files / 586 tests pass (was 98/580, +3 files / +6 tests)
- `cd hms-frontend && npx vitest run [3 new test files]` → 6/6 pass
- `grep` for pop-culture names in non-test files → 0 matches
- `git diff --check` → no whitespace errors

**Out of scope:** backend, no live data wiring, no admin honest-stub expansion, no changes to generic placeholder names in other files (SessionsPage, ReleasedResultDetailPage, MarketplaceInstallationTrackingPage).

### Done (This Session — Pre-Existing tsc Error Fix Lane, Commit `d36d67e6`)
**Trigger:** bcb6548e claimed "tsc clean" but `cd hms-backend && npx tsc --noEmit` reported 1 pre-existing error: `src/billing/billing.service.spec.ts(3582,17): error TS2554: Expected 5 arguments, but got 4.` The error was introduced in `21916ccf` (2026-06-17, prior session) when `BillingService.expirePayment` was extended to take a 5th `dto: ExpirePaymentDto` argument; that lane updated production code but missed this one test call.

**Fix:** `hms-backend/src/billing/billing.service.spec.ts` line 3587 — added `{ reason: 'test' }` as the 5th argument to the `expirePayment` call. The test asserts `NotFoundException`, which is reached by `prisma.payment.findFirst.mockResolvedValue(null)` before `dto` is consumed, so the added object is never touched. Test behavior unchanged.

**Why this lane beat alternatives:**
- (a) Refresh stale snapshot files: low value, file-ops only, would not change code state
- (b) **Fix pre-existing tsc error ← chosen** — real, small, scoped, closes a long-standing false-claim
- (c) Pre-existing test/ e2e tsc errors: 173 in `hms-backend/test/` (per AGENTS.md risk bucket) — not in default tsc, out of scope for this single-error lane
- (d) Stage provisioning: external blocker, no code change can unblock

**Validation (this session):**
- `cd hms-backend && npx tsc --noEmit` → 0 errors (was 1)
- `cd hms-backend && npm test` → 84 suites / 1695 tests pass
- `cd hms-backend && npx jest --testPathPatterns=billing.service.spec` → 107/107 pass
- Targeted: `expirePayment rejects archived payment` passes (2ms)
- `cd hms-backend && npm run lint` → 0 errors, 160 pre-existing warnings (not introduced)

### Done (This Session — Inventory Sidebar Discoverability Carryover)
1. **`hms-frontend/src/config/permissions.ts`** — Added `INVENTORY_RECEIVE` permission constant and mapped it to the `Branch Admin` role default permissions.
2. **`hms-frontend/src/config/roleNavigation.ts`** — Added the `/inventory/receiving` ("Stock Receiving") entry to the "Inventory & Stock" sidebar group for users with `INVENTORY_RECEIVE` permission.
3. **`hms-frontend/src/app/__tests__/RoleBasedSidebar.test.tsx`** — Added tests to verify correct sidebar display of "Stock Receiving" depending on role permission mappings (shown for Branch Admin, hidden for Pharmacist).

### Validation (Current Branch State)
- Remote CI: 5/5 checks pass (Static Analysis, Backend Tests, Frontend Tests, Docker Build, Vercel Preview)
- Local: 84 backend suites / 1695 tests passing, **101 frontend files / 586 tests passing** (post-`6a598704`; was 98/580, +3 test files / +6 tests), lint 0 errors, **backend tsc --noEmit 0 errors** (post-`d36d67e6`), frontend tsc clean
- Staging: NOT PROVISIONED (external blocker)
- Repo-side staging readiness: COMPLETE (4 files committed in `72bd168`)
- bcb6548e claim audit: 9/10 confirmed, 1 (`tsc clean`) corrected by `d36d67e6`
- Pop-culture name cleanup: 9 HR + 2 doctor (in bcb6548e) + 4 honestly-stubbed (in `6a598704`) = **15 frontend files now pop-culture-free**; 0 pop-culture name hits in non-test frontend source
- Backend tsc was previously false-claimed clean in bcb6548e; now genuinely clean (verified this session)

### Carryover Risks
**HIGH:**
- Staging VM/host not provisioned — no VM, no Docker, no DNS, no PostgreSQL 15, no GitHub Staging environment, no STAGING_* secrets exist. All repo-side artifacts ready.

**MEDIUM:**
- Pre-existing spec/e2e type errors (173 in `hms-backend/test/`) — auth, billing, admin spec files. NOT in default `tsc --noEmit`, but real debt.
- AuditLog retention: count-only enforcement; no schema change for archival by class.
- Stale untracked snapshot files: `audit-baseline.txt` and `handoff-verify.txt` show 84/1690 tests (current is 1695). Not committed; not blocking; can confuse future agents.
- Other admin pages still on mock/hardcoded data (none in this scope — the 4 admin pages with hardcoded data were honest-stubbed in `b5df7498`).

**LOW:**
- (Resolved) Chaos script health-probe path drift fixed in `b088259`; no stale references remain
- (Resolved) Staging handoff doc gaps corrected in this session — SSH secret isolation, secret naming convention, workflow file surface
- (Resolved) Pre-existing backend tsc error fixed in `d36d67e6` — `npx tsc --noEmit` is now genuinely clean
- (Resolved) bcb6548e "tsc clean" overclaim corrected by `d36d67e6`
- (Resolved) Pop-culture placeholder names in HR portal + Doctor timeline replaced with neutral sandbox identifiers in `bcb6548e`
- Tree is clean (only 4 intentional untracked files: 2 stale snapshots, 1 staging checklist, 1 plan doc)

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
- **PATH B (stop product work, staging is next blocker)** determined: remaining 4 admin pages (Tenants, Security, Reports, Settings) require full new backend modules — no valuable local-only lane remains
- **Branch Management module** created as standalone `hms-backend/src/branches/` module; frontend `BranchesPage.tsx` uses shared `admin.service.ts`
- **AdminExecutiveDashboard carryover** was real and worth finishing — all dependencies existed (`HmsTrendChart`, `getAdminTrends`, `GET /v1/dashboard/admin/trends`)
- **Separate staging deploy script over parameterization**: Zero risk to production path. Duplication of 59-line script is acceptable for isolation.
- **STAGING_SSH_* naming over shared SSH_HOST**: Eliminates GHA fallback risk — if Staging environment is missing SSH secrets, workflow fails immediately instead of silently targeting production.
- **Same env var names as prod in compose files**: Containers expect `DB_USER`, `DATABASE_URL`, `JWT_SECRET` etc.; staging workflow provides values from `STAGING_*` secrets.

## Next Steps
1. **Provision staging environment** — see `docs/infrastructure/staging-provisioning-handoff.md` for exact requirements. Execution checklist at `docs/infrastructure/staging-provisioning-execution-checklist.md`.
2. After staging is healthy → deploy and run E2E / integration smoke tests against staging.
3. After staging validated → trigger production deploy via `deploy.yml` (manual workflow_dispatch).
4. **(Backend tsc is now genuinely clean.)** Next backend type-safety lanes to consider:
   - Pre-existing 173 spec/e2e tsc errors in `hms-backend/test/` (not in default tsc; would require `tsconfig.test.json` and fix-up).
   - General `tsc --noEmit` discipline: future commits can now legitimately claim "tsc clean" without caveat.
5. **(Admin lane queue — mostly closed.)** 4 admin pages (Tenants, Security, Reports, Settings) honest-stubbed in `b5df7498`. SuperAdminDashboard honest-stubbed in `0eebbe68`. UsersPage, RolesPermissionsPage, BranchesPage, AuditLogsPage all live-wired. Remaining admin surfaces: AdminCreateUserForm, AdminBranchForm, AdminTenantNetworkPage, AdminSettingsPage (mutation forms still on hardcoded data).

## Critical Context
- **43 prior commits + 10 honest-UX mega-lane commits + 2 this session = 55 commits on `remediation/production-readiness-lane-2`. Local repo at parity with `origin/main`.
- **`6a598704` (this session):** Pop-culture name cleanup extended to 4 remaining honestly-stubbed files: `DoctorEMRPage.tsx`, `EMRWorkspace.tsx`, `PurchaseRequestsPage.tsx`, `PatientMessagesPage.tsx`. 3 new regression tests added. The bcb6548e lane intent is now fully executed.
- **`d36d67e6` (this session):** Backend `tsc --noEmit` is now genuinely clean. The 1 pre-existing error from `21916ccf` is fixed. Future commits can claim "tsc clean" without caveat.
- **`bcb6548e` (prior session, end of mega-lane):** 9 HR + 2 doctor portal files. Sandbox identifiers (`Employee 001..010`, `Provider 001..003`) replace TV/movie character names. HRDashboard alert count derived from data. DoctorClinicalTimeline sandbox notice added.
- **`0eebbe68` (mega-lane):** SuperAdminDashboard honest stub; AdminShellNotice truthful (no more "all admin data is mock-generated").
- **`b5df7498` (mega-lane):** 4 admin pages honest-stubbed; StockReceiving live-wired; 3 backend stubs now throw `NotImplementedException`; demo-data file deleted.
- **Backend `AdminModule`** (`admin.controller.ts`, `admin.service.ts`, `admin.module.ts`) now has GET `/api/v1/admin/users` and `/:id` endpoints in addition to existing mutation endpoints.
- **Frontend `UsersPage`** now calls live API via `admin.service.ts`; retains honest WIP notices for mutation actions.
- **(Updated)** The 4 admin pages that were on mock/hardcoded data (Tenants, Security, Reports, Settings) were honest-stubbed in `b5df7498`. SuperAdminDashboard honest-stubbed in `0eebbe68`. No admin page remains in the "fake-data" state.
- **Audit event keys**: 70+ across CLINICAL, FINANCIAL, ADMIN, SECURITY, PHARMACY, PRESCRIPTION, LAB, INVENTORY
- **Permissions**: `audit.view`, `audit.self`, `audit.export` for audit module; `admin.health.view` for user read endpoints
- **Roles added**: `Compliance Officer` (all 3 audit permissions), `IT Support` (audit.view + audit.self)
- **Daily cron**: `AuditChainMonitorService` at midnight per tenant
- **Retention**: 6-class (FINANCIAL 10y, CLINICAL 10y, ADMIN 3y, SECURITY 5y, EXPORT 1y, TRANSIENT 90d)

## Relevant Files
### This Session (Pop-Culture Name Cleanup Extension — Commit `6a598704`)
- `hms-frontend/src/portals/doctor/DoctorEMRPage.tsx` — 3 patients: Eleanor Vance / Arthur Pendleton / Victor Frankenstein → Patient 001/002/003
- `hms-frontend/src/features/emr/EMRWorkspace.tsx` — fallbackQueue: Eleanor Vance / Arthur Pendleton → Patient 001/002
- `hms-frontend/src/portals/procurement/PurchaseRequestsPage.tsx` — Dr. House / Nurse Hopps / Dr. Chase → Requester 001/002/003
- `hms-frontend/src/portals/patient/PatientMessagesPage.tsx` — Dr. House (sender + preview) → Provider 003
- `hms-frontend/src/portals/doctor/__tests__/DoctorEMRPage.test.tsx` — NEW regression test (2 tests)
- `hms-frontend/src/portals/procurement/__tests__/PurchaseRequestsPage.test.tsx` — NEW regression test (2 tests)
- `hms-frontend/src/portals/patient/__tests__/PatientMessagesPage.test.tsx` — NEW regression test (2 tests)

### This Session (Pre-Existing tsc Error Fix — Commit `d36d67e6`)
- `hms-backend/src/billing/billing.service.spec.ts` — 1-line fix: added `{ reason: 'test' }` as 5th arg to `expirePayment` call in `expirePayment rejects archived payment` test. Production code untouched.

### This Session (Docs Truth-Correction)
- `docs/infrastructure/staging-provisioning-handoff.md` — corrected gaps (production env scoping, secret naming, workflow file surface)
- `docs/superpowers/plans/2026-06-16-admin-branch-management-backend-module.md` — plan doc (intentional, untracked)
- `docs/superpowers/plans/2026-06-16-admin-governance-backend-roadmap.md` — roadmap doc (intentional, untracked)
- `AGENTS.md` — this session state file

### Committed Baseline (Prior Sessions)
- `hms-backend/src/branches/` — Branch Management module (controller, service, module, spec)
- `hms-backend/src/admin/admin.controller.ts` — GET `/api/v1/admin/users` and `/:id`
- `hms-backend/src/admin/admin.service.ts` — `listUsers()`, `getUser()`, pagination, filters
- `hms-frontend/src/pages/admin/AdminExecutiveDashboard.tsx` — Patient Volume Trend chart live
- `hms-frontend/src/pages/admin/BranchesPage.tsx` — wired to live API, honest WIP defaults
- `hms-frontend/src/pages/admin/UsersPage.tsx` — wired to live API, loading/empty/error states
- `hms-frontend/src/services/admin.service.ts` — shared admin API service

### This Session (Proactive Staging Repo-Prep Lane — Commit `72bd168`)
- `.github/workflows/deploy-staging.yml` — **NEW**: 2-job staging deployment workflow
- `docker-compose.staging.yml` — **NEW**: 3-service staging compose with isolated volume/network
- `hms-backend/scripts/remote-deploy-staging.sh` — **NEW**: Staging deploy script (all staging.yml references)
- `docs/infrastructure/staging-provisioning-handoff.md` — **MODIFIED**: SSH secrets renamed to STAGING_SSH_*
