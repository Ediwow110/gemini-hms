# Evidence Document - DEMO-NAV-1

## 1. Phase
DEMO-NAV-1 — Hide/Label WIP + Blocked Demo Routes Before Client Demo

## 2. Problem
- Super Admin users could see WIP pages and branch-scoped blocked operational pages (Cashier, Doctor, Nurse) in their navigation sidebar when the active branch context was set to `None`.
- Specific examples identified in screenshots:
  - `/pharmacy/inventory` showing "Work in Progress".
  - `/branch-admin/departments` showing "Work in Progress".
  - `/cashier` showing "Access Restriction Active" while visible in Super Admin navigation.
  - The "SIGN HANDOVER (SHELL)" button on `/field-service/handover` was misaligned (using layout-unfriendly absolute/fixed positioning that floated awkwardly over the UI shell).

## 3. Source Audit
- Derived from the baseline findings of PR #217 (DEMO-READINESS-1 visible routes audit).

## 4. Policy
- **Demo-ready routes**: Kept completely visible and accessible.
- **WIP routes**: Hidden from navigation and command palette.
- **Branch-scoped blocked operational routes**: Dynamically hidden for Super Admin in the sidebar and command palette when `branchId` is `None` (falsy). If a branch is selected, relevant operational workspaces reappear.
- **Direct route protection**: The underlying route definitions and `PermissionRoute` guards remain intact. Manually typing a hidden route URL will still trigger the appropriate access-denied or WIP block screens (no security controls were bypassed or weakened).

## 5. Files Changed
- [hms-frontend/src/config/roleNavigation.ts](file:///d:/Vscode/hms-login-OFFICIAL/hms-frontend/src/config/roleNavigation.ts)
- [hms-frontend/src/app/RoleBasedSidebar.tsx](file:///d:/Vscode/hms-login-OFFICIAL/hms-frontend/src/app/RoleBasedSidebar.tsx)
- [hms-frontend/src/app/CommandPalette.tsx](file:///d:/Vscode/hms-login-OFFICIAL/hms-frontend/src/app/CommandPalette.tsx)
- [hms-frontend/src/portals/field-service/MobileHandoverChecklistPage.tsx](file:///d:/Vscode/hms-login-OFFICIAL/hms-frontend/src/portals/field-service/MobileHandoverChecklistPage.tsx)
- [hms-frontend/src/app/__tests__/RoleBasedSidebar.test.tsx](file:///d:/Vscode/hms-login-OFFICIAL/hms-frontend/src/app/__tests__/RoleBasedSidebar.test.tsx)

## 6. Routes Hidden / Labelled

| Label | Route | Previous Problem | Demo Action |
| :--- | :--- | :--- | :--- |
| Reports & Analytics | `/admin/reports` | WIP placeholder | Hidden for Demo |
| Integrations | `/integration` | API/data failure | Hidden for Demo |
| Patient Merges | `/admin/patient-merges` | API/data failure | Hidden for Demo |
| Commission & Fees | `/marketplace-admin/commission-fees` | WIP placeholder | Hidden for Demo |
| Reports | `/marketplace-admin/reports` | WIP placeholder | Hidden for Demo |
| Ops Dashboard | `/clinical/ops` | API/data failure | Hidden for Demo |
| Branch Staff | `/branch-admin/staff` | WIP placeholder | Hidden for Demo |
| Department Manager | `/branch-admin/departments` | WIP placeholder | Hidden for Demo |
| Rooms / Facilities | `/branch-admin/rooms` | WIP placeholder | Hidden for Demo |
| Schedules | `/branch-admin/schedules` | WIP placeholder | Hidden for Demo |
| Branch Services | `/branch-admin/services` | WIP placeholder | Hidden for Demo |
| Branch Equipment | `/branch-admin/equipment` | WIP placeholder | Hidden for Demo |
| Inventory Rules | `/branch-admin/inventory-rules` | WIP placeholder | Hidden for Demo |
| Billing Rules | `/branch-admin/billing-rules` | WIP placeholder | Hidden for Demo |
| Queue Settings | `/branch-admin/queue-settings` | WIP placeholder | Hidden for Demo |
| Approvals | `/branch-admin/approvals` | WIP placeholder | Hidden for Demo |
| Branch Reports | `/reports` | WIP placeholder | Hidden for Demo |
| Compliance Dashboard | `/compliance` | WIP placeholder | Hidden for Demo |
| IT Support Dashboard | `/it` | WIP placeholder | Hidden for Demo |
| Backup & Recovery | `/it/backup-restore` | WIP placeholder | Hidden for Demo |
| Incident Desk | `/it/incidents` | API/data failure | Hidden for Demo |
| Attendance Tracking | `/hr/attendance` | WIP placeholder | Hidden for Demo |
| Payroll Console | `/hr/payroll` | WIP placeholder | Hidden for Demo |
| Purchase Orders | `/procurement/purchase-orders` | WIP placeholder | Hidden for Demo |
| Dispense Queue | `/pharmacy/dispense` | WIP placeholder | Hidden for Demo |
| Drug Inventory | `/pharmacy/inventory` | WIP placeholder | Hidden for Demo |
| Service Dashboard | `/field-service` | WIP placeholder | Hidden for Demo |
| LIS Orders | `/lab/orders` | API/data failure | Hidden for Demo |
| Pending Release | `/lab/validated` | API/data failure | Hidden for Demo |
| Released Results | `/lab/released` | API/data failure | Hidden for Demo |
| Cashier Dashboard | `/cashier` | Access blocked (Branch None) | Dynamically hidden for Branch: None |
| Patient Billing | `/cashier/billing` | Access blocked (Branch None) | Dynamically hidden for Branch: None |
| POS Invoices | `/cashier/invoices` | Access blocked (Branch None) | Dynamically hidden for Branch: None |
| Receipts Ledger | `/cashier/payments` | Access blocked (Branch None) | Dynamically hidden for Branch: None |
| Drawer Session | `/cashier/session` | Access blocked (Branch None) | Dynamically hidden for Branch: None |
| Voids & Refunds | `/cashier/refunds-voids` | Access blocked (Branch None) | Dynamically hidden for Branch: None |
| HMO Claims | `/cashier/hmo-claims` | Access blocked (Branch None) | Dynamically hidden for Branch: None |
| Reconciliation | `/cashier/reconciliation` | Access blocked (Branch None) | Dynamically hidden for Branch: None |

## 7. Routes Kept Visible

| Label | Route | Reason |
| :--- | :--- | :--- |
| Tenants Manager | `/admin/tenants` | Core admin, fully functional |
| Branches Manager | `/admin/branches` | Core admin, fully functional |
| Users & Accounts | `/admin/users` | Core admin, fully functional |
| Roles & Permissions | `/admin/roles-permissions` | Core admin, fully functional |
| Security Center | `/admin/security` | Core admin, fully functional |
| Marketplace Admin | `/marketplace-admin` | Demo-ready core marketplace control |
| Branch Dashboard | `/branch-admin` | Demo-ready branch administration overview |
| Branch Settings | `/settings` | Demo-ready settings page |

## 8. Field-Service UI Polish
- **Changes made**: Modified [MobileHandoverChecklistPage.tsx](file:///d:/Vscode/hms-login-OFFICIAL/hms-frontend/src/portals/field-service/MobileHandoverChecklistPage.tsx) to remove absolute/fixed viewport positioning (`fixed bottom-4 left-4 right-4`) on the "Sign Handover (Shell)" button. Placed the button inside a relative container (`mt-8 pb-8`) matching the page's scrollable grid.
- **Verification**: Alignment is now relative to the card container, preventing layout overlaps. No functional signing backend was implemented (the label remains "Sign Handover (Shell)" to reflect prototype mock behavior).

## 9. Tests
- Updated `RoleBasedSidebar.test.tsx` to use `/settings` and `Branch Settings` (instead of `/branch-admin/departments` / `Department Manager`) to verify active navigation states.
- Added test: `hides WIP routes and branch-scoped routes for Super Admin with no branch`.
- Added test: `shows branch-scoped routes for Super Admin when branch is selected`.

## 10. Manual QA

| Scenario | Expected | Result |
| :--- | :--- | :--- |
| Login as Super Admin (Branch: None) | No WIP items or cashier/doctor/nurse workspaces visible in sidebar. | PASS |
| Login as Super Admin (Branch: Selected) | Cashier/doctor/nurse workspaces reappear; WIP routes remain hidden. | PASS |
| Search Command Palette (Branch: None) | None of the hidden routes appear in search. | PASS |
| Access `/field-service/handover` | The "Sign Handover" button is inline and aligned with content. | PASS |
| Manual URL input to `/cashier` | Access remains blocked with "Access Restriction Active" guard. | PASS |

## 11. Security Safety
- No auth gates or guards were disabled.
- Route verification parameters remain active in [portalRoutes.ts](file:///d:/Vscode/hms-login-OFFICIAL/hms-frontend/src/config/portalRoutes.ts) and [App.tsx](file:///d:/Vscode/hms-login-OFFICIAL/hms-frontend/src/App.tsx).
- No real PHI or client-sensitive data is hardcoded or exposed.

## 12. Verification Summary
- **eslint**: 0 errors
- **typescript compiler**: 0 typecheck errors
- **tests**: 200/200 tests passing successfully
- **build**: Build succeeded in 1.38s

## 13. Final Verdict
STAGING-ONLY / DEMO-NAV CLEANUP COMPLETE
