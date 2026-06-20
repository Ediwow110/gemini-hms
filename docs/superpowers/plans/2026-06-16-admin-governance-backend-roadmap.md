# Admin Governance Backend-First Unlock Roadmap

> **For agentic workers:** This roadmap classifies 8 admin frontend pages by their backend dependency gap and prescribes the minimum backend work needed to wire each. Do not touch frontend admin pages until the corresponding backend endpoints exist.

**Goal:** Identify the exact backend endpoints and frontend hooks needed to replace mock data on all 8 admin governance pages.

**Architecture:** Backend-first — build missing controllers/services/DTOs in `hms-backend/src/`, then wire frontend pages via new hooks calling `apiClient`. Existing `AdminModule` in the backend already has mutation endpoints (`createUser`, `deactivateUser`, `assignUserRole`, etc.) but zero `GET` /list endpoints.

**Tech Stack:** NestJS (backend), React/TypeScript (frontend), Prisma (DB), `apiClient` (axios instance)

---

## Current Backend Inventory

### Exists (`hms-backend/src/admin/`)
- `AdminController` (`GET api/v1/admin/health`, `GET /metrics`, `GET /metrics/prometheus`)
- Mutation endpoints: `POST/PATCH users/:id`, `POST users/:id/deactivate|activate`, `POST users/:id/roles`, `POST users/:id/roles/:roleId/revoke`, `POST/PATCH roles`, `POST roles/:roleId/archive`, `POST roles/:roleId/permissions`, privileged request/approve/reject flows
- `AdminService` — full Prisma-based implementation for user/role lifecycle
- `MetricsController` + `MetricsService`
- DTOs: `CreateUserDto`, `UpdateUserDto`, `AssignUserRoleDto`, `CreateCustomRoleDto`, `UpdateCustomRoleDto`, `GrantRolePermissionDto`, `PrivilegedRoleRequestDto`, `UserLifecycleReasonDto`, `PrivilegedUserProfileUpdateDto`

### Exists (`hms-backend/src/dashboard/`)
- `DashboardController` (`GET api/v1/dashboard/admin/summary`, `/admin/trends`, `/admin/alerts`, `/admin/top-lists`)
- `DashboardService` — real Prisma queries

### Missing (no controller, no service, no DTO)
- **Branch management** — no `BranchController` or `BranchService` (only `branch.guard.ts` exists)
- **Tenant management** — no `TenantController` or `TenantService` (only `tenant-provisioning.ts` utility)
- **Security center** — no session listing/termination, MFA compliance, or lockout endpoints
- **System settings** — no settings CRUD
- **Admin reports** — no report-specific endpoints (only generic `reports/` module unrelated to admin)

---

## Page Classifications

| Page | Classification | Backend Gap | Frontend Hook |
|------|---------------|-------------|---------------|
| AdminExecutiveDashboard | **Frontend-Hook-Blocked** (partial) | Missing: `/admin/operations/bottlenecks`, `/admin/branches/risks`, `/admin/trends` | `dashboardService` exists — add 3 new methods |
| UsersPage | **Backend-Blocked** (no GET queries) | Missing: `GET /admin/users`, `GET /admin/users/:id`, `GET /admin/users/:id/roles` | New: `useAdminUsers` hook |
| RolesPermissionsPage | **Backend-Blocked** (no GET queries) | Missing: `GET /admin/roles`, `GET /admin/roles/:id`, `GET /admin/permissions` | New: `useAdminRoles` hook |
| BranchesPage | **Backend-Blocked** (full) | No backend at all | New: `useAdminBranches` hook |
| TenantsPage | **Backend-Blocked** (full) | No backend at all | New: `useAdminTenants` hook |
| SecurityCenterPage | **Backend-Blocked** (full) | No backend at all | New: `useAdminSecurity` hook |
| ReportsAnalyticsPage | **Backend-Blocked** (full) | No admin-specific report backend | New: `useAdminReports` hook |
| SystemSettingsPage | **Backend-Blocked** (full) | No settings backend | New: `useAdminSettings` hook |

---

## Phase 1: Low-Hanging Fruit — Add GET Endpoints to Existing AdminController

**Effort:** ~1-2 days backend, ~0.5 day frontend

### Task 1: `GET /api/v1/admin/users`

**Files:**
- Modify: `hms-backend/src/admin/admin.controller.ts`
- Modify: `hms-backend/src/admin/admin.service.ts`
- Create: `hms-backend/src/admin/dto/query-users.dto.ts`
- Create: `hms-frontend/src/hooks/use-admin-users.ts`

**Backend work:**
- Add `AdminService.listUsers(actor, filters)` returning paginated user list with roles/branches
- Add `AdminService.getUser(actor, userId)` returning single user detail
- Add `QueryUsersDto` with optional `search`, `status`, `branchId`, `page`, `limit`
- Add `GET /api/v1/admin/users` and `GET /api/v1/admin/users/:id` controller endpoints with `@RequirePermissions('admin.health.view')` guard

**Frontend work:**
- Create `useAdminUsers` hook with `listUsers`, `getUser`, loading/error states
- Wire `UsersPage` to replace `mockUsers` with hook data

### Task 2: `GET /api/v1/admin/roles` and `GET /api/v1/admin/permissions`

**Files:**
- Modify: `hms-backend/src/admin/admin.controller.ts`
- Modify: `hms-backend/src/admin/admin.service.ts`
- Create: `hms-frontend/src/hooks/use-admin-roles.ts`

**Backend work:**
- Add `AdminService.listRoles(actor)` returning roles with their permissions
- Add `AdminService.listPermissions(actor)` returning all permissions
- Add `GET /api/v1/admin/roles` and `GET /api/v1/admin/permissions` endpoints

**Frontend work:**
- Create `useAdminRoles` hook
- Wire `RolesPermissionsPage` to replace `mockRoles` with real data

### Task 3: Dashboard missing endpoints

**Files:**
- Modify: `hms-backend/src/dashboard/controllers/dashboard.controller.ts`
- Modify: `hms-backend/src/dashboard/services/dashboard.service.ts`
- Modify: `hms-frontend/src/services/dashboard.service.ts`

**Backend work:**
- Add `GET /api/v1/dashboard/admin/operations/bottlenecks` — query bottleneck data
- Add `GET /api/v1/dashboard/admin/branches/risks` — query branch risk data

**Frontend work:**
- Add `getAdminBottlenecks()` and `getAdminBranchRisks()` to `dashboardService`
- Wire to `AdminExecutiveDashboard` sections currently showing `HmsDataUnavailable`

---

## Phase 2: New Backend Modules — Branch, Tenant, Security, Settings, Reports

**Effort:** ~3-5 days per module backend, ~1 day per module frontend

### Task 4: Branch Management Module

**Files:**
- Create: `hms-backend/src/admin/branch.controller.ts` or `hms-backend/src/branches/branches.controller.ts`
- Create: `hms-backend/src/admin/branch.service.ts`
- Create: `hms-frontend/src/hooks/use-admin-branches.ts`

**Backend endpoints needed:**
- `GET /api/v1/admin/branches` — list branches with tenant scoping
- `GET /api/v1/admin/branches/:id` — branch detail with capacity/staff/queue
- `POST /api/v1/admin/branches` — provision new branch
- `PATCH /api/v1/admin/branches/:id` — update branch config
- `POST /api/v1/admin/branches/:id/maintenance` — toggle maintenance mode
- `GET /api/v1/admin/branches/:id/health` — latency/status

### Task 5: Tenant Management Module

**Files:**
- Create: `hms-backend/src/tenant/tenant.controller.ts`
- Create: `hms-backend/src/tenant/tenant.service.ts`
- Create: `hms-frontend/src/hooks/use-admin-tenants.ts`

**Backend endpoints needed:**
- `GET /api/v1/admin/tenants` — list tenants (Super Admin only)
- `GET /api/v1/admin/tenants/:id` — tenant detail with health/branchCount/userCount
- `POST /api/v1/admin/tenants` — provision tenant
- `GET /api/v1/admin/tenants/:id/metrics` — CPU/RAM/DB size/error rate

### Task 6: Security Center Module

**Files:**
- Create: `hms-backend/src/admin/security.controller.ts`
- Create: `hms-backend/src/admin/security.service.ts`
- Create: `hms-frontend/src/hooks/use-admin-security.ts`

**Backend endpoints needed:**
- `GET /api/v1/admin/security/metrics` — failed logins, locked accounts, MFA compliance, active sessions
- `GET /api/v1/admin/security/alerts` — security alert list
- `GET /api/v1/admin/security/sessions` — active session list
- `POST /api/v1/admin/security/sessions/:id/terminate` — terminate session
- `GET /api/v1/admin/security/mfa-compliance` — users with MFA disabled
- `POST /api/v1/admin/security/enforce-mfa/:userId` — enforce MFA
- `POST /api/v1/admin/security/unlock/:userId` — unlock account
- `GET /api/v1/admin/security/failed-login-trends` — trend data for charts

### Task 7: System Settings Module

**Files:**
- Create: `hms-backend/src/admin/settings.controller.ts`
- Create: `hms-backend/src/admin/settings.service.ts`
- Create: `hms-frontend/src/hooks/use-admin-settings.ts`

**Backend endpoints needed:**
- `GET /api/v1/admin/settings` — get all settings
- `PATCH /api/v1/admin/settings` — bulk update settings
- Settings stored in DB (new `SystemSetting` model) or env-file based

### Task 8: Admin Reports Module

**Files:**
- Create: `hms-backend/src/admin/reports.controller.ts`
- Create: `hms-backend/src/admin/reports.service.ts`
- Create: `hms-frontend/src/hooks/use-admin-reports.ts`

**Backend endpoints needed:**
- `GET /api/v1/admin/reports/metrics` — operations/security/storage metrics
- `GET /api/v1/admin/reports/transactions` — transaction volume trend
- `GET /api/v1/admin/reports/api-latency` — API latency trend
- `GET /api/v1/admin/reports/db-growth` — storage/db growth
- `GET /api/v1/admin/reports/jobs` — background job status
- `POST /api/v1/admin/reports/export` — generate and return report

---

## Prioritization

```
Phase 1 (1-2 weeks):
  ┌─────────────────────────────────────────────┐
  │ 1a. GET /admin/users              HIGH VALUE │
  │ 1b. GET /admin/roles/permissions   HIGH VALUE │
  │ 1c. Dashboard missing endpoints   MEDIUM     │
  └─────────────────────────────────────────────┘

Phase 2 (2-3 months):
  ┌─────────────────────────────────────────────┐
  │ 2a. Branch Management            HIGH VALUE │
  │ 2b. Tenant Management            HIGH VALUE │
  │ 2c. Security Center              MEDIUM     │
  │ 2d. System Settings              LOW        │
  │ 2e. Admin Reports                LOW        │
  └─────────────────────────────────────────────┘
```

**Phase 1** unlocks 3 of 8 admin pages immediately using the existing `AdminModule` and `DashboardModule`. **Phase 2** requires new backend modules for the remaining 5 pages.

---

## Prisma Schema Note

All Phase 1 endpoints can be built against existing models (`User`, `Role`, `Permission`, `RolePermission`, `UserRole`, `UserBranch`, `Branch`, `Tenant`). Phase 2 may require:

- `Branch` model additions for `maintenanceMode`, `latency`, `capacity`
- `Tenant` model additions for `tier`, `region`, `dbSize`, `cpuUsage`, `ramUsage`
- New `SystemSetting` model (key/value per tenant)
- New `SecurityAlert`, `SessionLog` models for security center
- New `AdminReport` or report configuration model
