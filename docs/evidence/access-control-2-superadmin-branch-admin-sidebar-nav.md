# Evidence Document - ACCESS-CONTROL-2

## 1. Phase
ACCESS-CONTROL-2 — Super Admin Branch/Admin Navigation Access + Sidebar Active/Hover Cleanup

## 2. Problem
- **Super Admin Blocked**: A Super Admin user was blocked from `/branch-admin/departments` and other branch-admin governance pages when no branch was selected (`Branch: None`).
- **Sidebar UX Issue**: Navigating to a sub-route (e.g. `/branch-admin/departments`) highlighted both the parent dashboard (`Branch Dashboard`) and the child route (`Department Manager`) simultaneously in the sidebar.

## 3. Root Cause
- **Access Denial**: The routes `/branch-admin/*` in `App.tsx` and `portalRoutes.ts` were marked as `isBranchScoped: true`. Because of this, the `PermissionRoute` bypass condition `isSuperAdmin && !isBranchScoped` failed. The component then evaluated the roles list `allowedRoles={['Branch Admin']}`. Since the Super Admin user does not have the `Branch Admin` role, access was denied (`<UnauthorizedState />`).
- **Sidebar Active Duplication**: In `RoleBasedSidebar.tsx`, the `isActive` function was checking `pathname.startsWith(path)`. When on a path like `/branch-admin/departments`, both `/branch-admin` (Branch Dashboard) and `/branch-admin/departments` (Department Manager) returned `true` because they both match the prefix.

## 4. Product Rule Implemented
- **Super Admin Governance Access**: Super Admins can access all global and branch-admin configuration and governance routes without a selected branch. We accomplished this by setting `isBranchScoped` to `false` (removing the property) on the `branch-admin` routes.
- **Protected Operational Zones**: Branch-scoped clinical, financial, and operational routes (doctor, nurse, cashier, lab, pharmacy) retain `isBranchScoped: true` and still require proper branch context and permissions.
- **Lower Privilege Isolation**: Normal users (like Doctor, Nurse, Cashier, Lab Tech) are still restricted based on their role/permission parameters.

## 5. Files Changed
- [App.tsx](file:///d:/Vscode/hms-login-OFFICIAL/hms-frontend/src/App.tsx) — Removed `isBranchScoped` from `branch-admin` routes.
- [portalRoutes.ts](file:///d:/Vscode/hms-login-OFFICIAL/hms-frontend/src/config/portalRoutes.ts) — Removed `isBranchScoped: true` from `branch-admin` routes.
- [RoleBasedSidebar.tsx](file:///d:/Vscode/hms-login-OFFICIAL/hms-frontend/src/app/RoleBasedSidebar.tsx) — Implemented longest-prefix active state resolution.
- [PermissionRoute.test.tsx](file:///d:/Vscode/hms-login-OFFICIAL/hms-frontend/src/app/__tests__/PermissionRoute.test.tsx) — Added Super Admin bypass and role checks test cases.
- [RoleBasedSidebar.test.tsx](file:///d:/Vscode/hms-login-OFFICIAL/hms-frontend/src/app/__tests__/RoleBasedSidebar.test.tsx) — New unit tests verifying sidebar active matching.

## 6. Tests Added/Updated
- **PermissionRoute tests**:
  - Super Admin + Branch None + `/branch-admin/departments` => allowed.
  - Branch Admin + `/branch-admin/departments` => allowed.
  - Doctor + `/branch-admin/departments` => blocked.
  - Super Admin + Branch None + known branch-scoped operational route (`isBranchScoped={true}`) => blocked.
  - `/marketplace-admin` regression check for Super Admin => allowed.
- **RoleBasedSidebar tests**:
  - Marks only exact matched item active (e.g. Department Manager on `/branch-admin/departments`).
  - Marks longest prefix match active on sub-route (e.g. Department Manager on `/branch-admin/departments/new`).
  - Marks Branch Dashboard active on exact `/branch-admin` path.

## 7. Manual QA
| Scenario | Expected | Result |
| :--- | :--- | :--- |
| **Super Admin + Branch: None + `/branch-admin/departments`** | Allowed (loads Department Manager page) | Pass |
| **Super Admin + Branch: None + `/branch-admin`** | Allowed (loads Branch Admin Dashboard) | Pass |
| **Branch Admin + `/branch-admin/departments`** | Allowed (loads Department Manager page) | Pass |
| **Doctor/Nurse + `/branch-admin/departments`** | Blocked (displays Access Restriction Active) | Pass |
| **Super Admin + Branch: None + clinical route (Doctor)** | Blocked (requires explicit branch context) | Pass |
| **Sidebar UX on `/branch-admin/departments`** | Only `Department Manager` is highlighted | Pass |
| **Sidebar UX on `/branch-admin`** | Only `Branch Dashboard` is highlighted | Pass |
| **Console errors** | None | Pass |

## 8. Security Safety
- No hardcoding of any emails (`admin@hospital.com` not hardcoded).
- No removal of route guards.
- Lower-privilege users remain blocked from unauthorized pages.
- Branch-scoped clinical routes still require branch context.

## 9. Verification
- Frontend Lint: `0 errors, 2 warnings` (warnings are existing shims)
- Frontend Typecheck: `Clean`
- Frontend Tests: `198 passed (22 test files)`
- Frontend Build: `Successful production build compilation`
- git diff --check: `Clean`

## 10. Final Verdict
STAGING-ONLY / ACCESS-CONTROL-2 BUGFIX COMPLETE
