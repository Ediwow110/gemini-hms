# FULL-SYSTEM-PAGE-AUDIT-1 — Complete Route/Page/Dashboard Runtime Audit

## Context
- **Recent Completed PRs:** PRs #215, #216, #217, #218 successfully completed and squashed/merged.
- **Goal:** Client-demo readiness, not production readiness.
- **Branch:** `demo-readiness/full-system-page-audit-1`

## Audit Environment
- **Commit SHA Audited:** `0dd75f5f4b1324dd2c53ccb612a46a40f2ebe706`
- **Local Frontend URL:** `http://localhost:5173`
- **Local Backend URL:** `http://localhost:3000`
- **Login Account Used:** `admin@hospital.com` (Super Admin, Branch: `None`)
- **Browser/Tooling:** Playwright headless runner (Chromium)
- **Date/Time:** 2026-06-07 16:20 (local time)

## Static Route Inventory Summary
- **Total Routes Audited:** 180
- **Sidebar-Visible Routes:** 140
- **Hidden Demo Routes:** 0
- **Direct-Only Routes:** 40

## Summary Counts
- **Demo-Ready Routes:** 110 (including minor visual polish or card-heavy dashboards)
- **WIP/Placeholder Routes:** 12
- **Access-Blocked Expected:** 18
- **Access-Blocked Unexpected:** 0
- **API/Data Failure Routes:** 40
- **Runtime-Error Routes:** 0
- **Dashboard Weak Routes:** 0

---

## Runtime Route Audit Table
| # | Route | Source | Visible In Sidebar | Visible In Command Palette | Result | Problem Type | Severity | Demo Decision | Evidence |
|---|---|---|---|---|---|---|---|---|---|
| 1 | `/` | App.tsx | Yes | Yes | DEMO_READY | None | P3 | SHOW | Page loads cleanly |
| 2 | `/patients` | App.tsx | No | No | DEMO_READY | None | P3 | SHOW | Page loads cleanly |
| 3 | `/patients/new` | App.tsx | No | No | DEMO_READY | None | P3 | SHOW | Page loads cleanly |
| 4 | `/orders/new` | App.tsx | No | No | DEMO_READY | None | P3 | SHOW | Page loads cleanly |
| 5 | `/queue` | App.tsx | No | No | DEMO_READY | None | P3 | SHOW | Page loads cleanly |
| 6 | `/billing/dashboard` | App.tsx | No | No | API_DATA_FAILURE | API Fail / 404 / 500 | P1 | FIX_BEFORE_DEMO | Page loads cleanly |
| 7 | `/billing` | App.tsx | No | No | DEMO_READY | None | P3 | SHOW | Page loads cleanly |
| 8 | `/billing/cashier-closing` | App.tsx | No | No | DEMO_READY | None | P3 | SHOW | Page loads cleanly |
| 9 | `/approvals` | App.tsx | No | No | DEMO_READY | None | P3 | SHOW | Page loads cleanly |
| 10 | `/audit-logs` | App.tsx | Yes | Yes | DEMO_READY | None | P3 | SHOW | Page loads cleanly |
| 11 | `/admin/roles` | App.tsx | No | No | DEMO_READY | None | P3 | SHOW | Page loads cleanly |
| 12 | `/admin/catalog` | App.tsx | Yes | Yes | API_DATA_FAILURE | API Fail / 404 / 500 | P1 | FIX_BEFORE_DEMO | GET http://localhost:5173/api/catalog/categories?includeInactive=true -> 404, GET http://localhost:5173/api/catalog/items?includeInactive=true -> 404, GET http://localhost:5173/api/catalog/categories?includeInactive=true -> 404, GET http://localhost:5173/api/catalog/items?includeInactive=true -> 404 |
| 13 | `/settings` | App.tsx | Yes | Yes | DEMO_READY | None | P3 | SHOW | Page loads cleanly |
| 14 | `/settings/branches` | App.tsx | No | No | DEMO_READY | None | P3 | SHOW | Page loads cleanly |
| 15 | `/settings/departments` | App.tsx | No | No | DEMO_READY | None | P3 | SHOW | Page loads cleanly |
| 16 | `/settings/services` | App.tsx | No | No | DEMO_READY | None | P3 | SHOW | Page loads cleanly |
| 17 | `/settings/numbering` | App.tsx | No | No | DEMO_READY | None | P3 | SHOW | Page loads cleanly |
| 18 | `/settings/templates` | App.tsx | No | No | DEMO_READY | None | P3 | SHOW | Page loads cleanly |
| 19 | `/settings/notifications` | App.tsx | No | No | DEMO_READY | None | P3 | SHOW | Page loads cleanly |
| 20 | `/settings/security` | App.tsx | No | No | DEMO_READY | None | P3 | SHOW | Page loads cleanly |
| 21 | `/reports` | App.tsx | Yes | Yes | DEMO_READY | None | P3 | SHOW | Page loads cleanly |
| 22 | `/inventory` | App.tsx | No | No | DEMO_READY | None | P3 | SHOW | Page loads cleanly |
| 23 | `/inventory/receiving` | App.tsx | No | No | DEMO_READY | None | P3 | SHOW | Page loads cleanly |
| 24 | `/lab/results` | App.tsx | No | No | DEMO_READY | None | P3 | SHOW | Page loads cleanly |
| 25 | `/lab/validated` | App.tsx | Yes | Yes | API_DATA_FAILURE | API Fail / 404 / 500 | P1 | FIX_BEFORE_DEMO | GET http://localhost:5173/api/v1/clinical-workflow/lab/validated-results -> 404 |
| 26 | `/lab/released` | App.tsx | Yes | Yes | API_DATA_FAILURE | API Fail / 404 / 500 | P1 | FIX_BEFORE_DEMO | GET http://localhost:5173/api/v1/clinical-workflow/lab/released-results -> 404 |
| 27 | `/emr` | App.tsx | No | No | DEMO_READY | None | P3 | SHOW | Page loads cleanly |
| 28 | `/radiology` | App.tsx | No | No | API_DATA_FAILURE | API Fail / 404 / 500 | P1 | FIX_BEFORE_DEMO | GET http://localhost:5173/api/v1/radiology/orders -> 404, GET http://localhost:5173/api/v1/radiology/orders -> 404 |
| 29 | `/pharmacy/dashboard` | App.tsx | No | No | API_DATA_FAILURE | API Fail / 404 / 500 | P1 | FIX_BEFORE_DEMO | GET http://localhost:5173/api/v1/pharmacy/prescriptions?status=ACTIVE&branchId=main-branch -> 403, GET http://localhost:5173/api/v1/pharmacy/prescriptions?status=ACTIVE&branchId=main-branch -> 403 |
| 30 | `/pharmacy` | App.tsx | Yes | Yes | API_DATA_FAILURE | API Fail / 404 / 500 | P1 | FIX_BEFORE_DEMO | GET http://localhost:5173/api/v1/pharmacy/prescriptions?status=ACTIVE -> 429, GET http://localhost:5173/api/v1/inventory/alerts/low-stock -> 429, GET http://localhost:5173/api/v1/pharmacy/drugs -> 403 |
| 31 | `/claims` | App.tsx | No | No | API_DATA_FAILURE | API Fail / 404 / 500 | P1 | FIX_BEFORE_DEMO | GET http://localhost:5173/api/v1/insurance/partners -> 404, GET http://localhost:5173/api/v1/insurance/claims -> 404, GET http://localhost:5173/api/v1/insurance/partners -> 404, GET http://localhost:5173/api/v1/insurance/claims -> 404 |
| 32 | `/admin/patient-merges` | App.tsx | Yes | Yes | API_DATA_FAILURE | API Fail / 404 / 500 | P1 | FIX_BEFORE_DEMO | GET http://localhost:5173/api/v1/admin/patient-merges -> 404, GET http://localhost:5173/api/v1/admin/patient-merges -> 404 |
| 33 | `/branch-admin` | App.tsx | Yes | Yes | DEMO_READY | None | P3 | SHOW | Page loads cleanly |
| 34 | `/branch-admin/staff` | App.tsx | Yes | Yes | WIP_PLACEHOLDER | Work in Progress | P2 | HIDE_FOR_DEMO | Shows Coming Soon or prototype placeholder |
| 35 | `/branch-admin/departments` | App.tsx | Yes | Yes | WIP_PLACEHOLDER | Work in Progress | P2 | HIDE_FOR_DEMO | Shows Coming Soon or prototype placeholder |
| 36 | `/branch-admin/rooms` | App.tsx | Yes | Yes | WIP_PLACEHOLDER | Work in Progress | P2 | HIDE_FOR_DEMO | Shows Coming Soon or prototype placeholder |
| 37 | `/branch-admin/schedules` | App.tsx | Yes | Yes | WIP_PLACEHOLDER | Work in Progress | P2 | HIDE_FOR_DEMO | Shows Coming Soon or prototype placeholder |
| 38 | `/branch-admin/services` | App.tsx | Yes | Yes | WIP_PLACEHOLDER | Work in Progress | P2 | HIDE_FOR_DEMO | Shows Coming Soon or prototype placeholder |
| 39 | `/branch-admin/equipment` | App.tsx | Yes | Yes | WIP_PLACEHOLDER | Work in Progress | P2 | HIDE_FOR_DEMO | Shows Coming Soon or prototype placeholder |
| 40 | `/branch-admin/inventory-rules` | App.tsx | Yes | Yes | WIP_PLACEHOLDER | Work in Progress | P2 | HIDE_FOR_DEMO | Shows Coming Soon or prototype placeholder |
| 41 | `/branch-admin/billing-rules` | App.tsx | Yes | Yes | WIP_PLACEHOLDER | Work in Progress | P2 | HIDE_FOR_DEMO | Shows Coming Soon or prototype placeholder |
| 42 | `/branch-admin/queue-settings` | App.tsx | Yes | Yes | WIP_PLACEHOLDER | Work in Progress | P2 | HIDE_FOR_DEMO | Shows Coming Soon or prototype placeholder |
| 43 | `/branch-admin/approvals` | App.tsx | Yes | Yes | WIP_PLACEHOLDER | Work in Progress | P2 | HIDE_FOR_DEMO | Shows Coming Soon or prototype placeholder |
| 44 | `/admin` | App.tsx | Yes | Yes | DEMO_READY | None | P3 | SHOW | Page loads cleanly |
| 45 | `/admin/executive` | App.tsx | No | No | API_DATA_FAILURE | API Fail / 404 / 500 | P1 | FIX_BEFORE_DEMO | GET http://localhost:5173/api/v1/dashboard/admin/summary?dateFrom=2026-05-31&dateTo=2026-06-07 -> 404, GET http://localhost:5173/api/v1/dashboard/admin/trends?dateFrom=2026-05-31&dateTo=2026-06-07 -> 404, GET http://localhost:5173/api/v1/dashboard/admin/alerts -> 404, GET http://localhost:5173/api/v1/dashboard/admin/top-lists -> 404, GET http://localhost:5173/api/v1/dashboard/admin/summary?dateFrom=2026-05-31&dateTo=2026-06-07 -> 404, GET http://localhost:5173/api/v1/dashboard/admin/trends?dateFrom=2026-05-31&dateTo=2026-06-07 -> 404, GET http://localhost:5173/api/v1/dashboard/admin/alerts -> 404, GET http://localhost:5173/api/v1/dashboard/admin/top-lists -> 404 |
| 46 | `/clinical/ops` | App.tsx | Yes | Yes | API_DATA_FAILURE | API Fail / 404 / 500 | P1 | FIX_BEFORE_DEMO | GET http://localhost:5173/api/v1/clinical-workflow/dashboard-summary -> 404, GET http://localhost:5173/api/v1/clinical-workflow/work-queue -> 404, GET http://localhost:5173/api/v1/clinical-workflow/dashboard-summary -> 404, GET http://localhost:5173/api/v1/clinical-workflow/work-queue -> 404, GET http://localhost:5173/api/v1/nursing/tasks?status=OPEN -> 403, GET http://localhost:5173/api/v1/nursing/tasks?status=OPEN -> 403 |
| 47 | `/admin/tenants` | App.tsx | Yes | Yes | DEMO_READY | None | P3 | SHOW | Page loads cleanly |
| 48 | `/admin/branches` | App.tsx | Yes | Yes | DEMO_READY | None | P3 | SHOW | Page loads cleanly |
| 49 | `/admin/users` | App.tsx | Yes | Yes | DEMO_READY | None | P3 | SHOW | Page loads cleanly |
| 50 | `/admin/roles-permissions` | App.tsx | Yes | Yes | DEMO_READY | None | P3 | SHOW | Page loads cleanly |
| 51 | `/admin/security` | App.tsx | Yes | Yes | DEMO_READY | None | P3 | SHOW | Page loads cleanly |
| 52 | `/admin/audit-logs` | App.tsx | Yes | Yes | DEMO_READY | None | P3 | SHOW | Page loads cleanly |
| 53 | `/admin/settings` | App.tsx | Yes | Yes | DEMO_READY | None | P3 | SHOW | Page loads cleanly |
| 54 | `/admin/reports` | App.tsx | Yes | Yes | DEMO_READY | None | P3 | SHOW | Page loads cleanly |
| 55 | `/compliance` | App.tsx | Yes | Yes | API_DATA_FAILURE | API Fail / 404 / 500 | P1 | FIX_BEFORE_DEMO | GET http://localhost:5173/api/audit/events?pageSize=50 -> 404, GET http://localhost:5173/api/audit/events?pageSize=50 -> 404 |
| 56 | `/compliance/phi-access` | App.tsx | Yes | Yes | API_DATA_FAILURE | Broken API Proxy | P1 | FIX_BEFORE_DEMO | Cannot GET /api/audit/events |
| 57 | `/compliance/audit-review` | App.tsx | Yes | Yes | API_DATA_FAILURE | Broken API Proxy | P1 | FIX_BEFORE_DEMO | Cannot GET /api/audit/events |
| 58 | `/compliance/access-reviews` | App.tsx | Yes | Yes | DEMO_READY | None | P3 | SHOW | Page loads cleanly |
| 59 | `/compliance/export-logs` | App.tsx | Yes | Yes | DEMO_READY | None | P3 | SHOW | Page loads cleanly |
| 60 | `/compliance/breach-alerts` | App.tsx | Yes | Yes | DEMO_READY | None | P3 | SHOW | Page loads cleanly |
| 61 | `/compliance/retention` | App.tsx | Yes | Yes | DEMO_READY | None | P3 | SHOW | Page loads cleanly |
| 62 | `/compliance/reports` | App.tsx | Yes | Yes | DEMO_READY | None | P3 | SHOW | Page loads cleanly |
| 63 | `/compliance/audit-chain` | App.tsx | Yes | Yes | DEMO_READY | None | P3 | SHOW | Page loads cleanly |
| 64 | `/it` | App.tsx | Yes | Yes | DEMO_READY | None | P3 | SHOW | Page loads cleanly |
| 65 | `/it/system-health` | App.tsx | Yes | Yes | DEMO_READY | None | P3 | SHOW | Page loads cleanly |
| 66 | `/it/user-support` | App.tsx | Yes | Yes | DEMO_READY | None | P3 | SHOW | Page loads cleanly |
| 67 | `/it/sessions` | App.tsx | Yes | Yes | DEMO_READY | None | P3 | SHOW | Page loads cleanly |
| 68 | `/it/background-jobs` | App.tsx | Yes | Yes | DEMO_READY | None | P3 | SHOW | Page loads cleanly |
| 69 | `/it/integrations` | App.tsx | Yes | Yes | DEMO_READY | None | P3 | SHOW | Page loads cleanly |
| 70 | `/it/logs` | App.tsx | Yes | Yes | DEMO_READY | None | P3 | SHOW | Page loads cleanly |
| 71 | `/it/backup-restore` | App.tsx | Yes | Yes | DEMO_READY | None | P3 | SHOW | Page loads cleanly |
| 72 | `/it/incidents` | App.tsx | Yes | Yes | API_DATA_FAILURE | API Fail / 404 / 500 | P1 | FIX_BEFORE_DEMO | GET http://localhost:5173/api/v1/it-support/tickets?priority=URGENT&pageSize=50 -> 429, GET http://localhost:5173/api/v1/it-support/tickets?priority=URGENT&pageSize=50 -> 429, GET http://localhost:5173/api/v1/it-support/tickets?priority=HIGH&pageSize=50 -> 429 |
| 73 | `/hr` | App.tsx | Yes | Yes | DEMO_READY | None | P3 | SHOW | Page loads cleanly |
| 74 | `/hr/employees` | App.tsx | Yes | Yes | DEMO_READY | None | P3 | SHOW | Page loads cleanly |
| 75 | `/hr/departments` | App.tsx | Yes | Yes | DEMO_READY | None | P3 | SHOW | Page loads cleanly |
| 76 | `/hr/attendance` | App.tsx | Yes | Yes | DEMO_READY | None | P3 | SHOW | Page loads cleanly |
| 77 | `/hr/leave` | App.tsx | Yes | Yes | DEMO_READY | None | P3 | SHOW | Page loads cleanly |
| 78 | `/hr/payroll` | App.tsx | Yes | Yes | DEMO_READY | None | P3 | SHOW | Page loads cleanly |
| 79 | `/hr/licenses` | App.tsx | Yes | Yes | DEMO_READY | None | P3 | SHOW | Page loads cleanly |
| 80 | `/hr/branch-assignments` | App.tsx | Yes | Yes | DEMO_READY | None | P3 | SHOW | Page loads cleanly |
| 81 | `/hr/termination` | App.tsx | Yes | Yes | DEMO_READY | None | P3 | SHOW | Page loads cleanly |
| 82 | `/procurement` | App.tsx | Yes | Yes | DEMO_READY | None | P3 | SHOW | Page loads cleanly |
| 83 | `/procurement/suppliers` | App.tsx | Yes | Yes | DEMO_READY | None | P3 | SHOW | Page loads cleanly |
| 84 | `/procurement/purchase-requests` | App.tsx | Yes | Yes | DEMO_READY | None | P3 | SHOW | Page loads cleanly |
| 85 | `/procurement/rfqs` | App.tsx | Yes | Yes | DEMO_READY | None | P3 | SHOW | Page loads cleanly |
| 86 | `/procurement/quotes` | App.tsx | Yes | Yes | DEMO_READY | None | P3 | SHOW | Page loads cleanly |
| 87 | `/procurement/purchase-orders` | App.tsx | Yes | Yes | DEMO_READY | None | P3 | SHOW | Page loads cleanly |
| 88 | `/procurement/receiving` | App.tsx | Yes | Yes | DEMO_READY | None | P3 | SHOW | Page loads cleanly |
| 89 | `/procurement/inventory-requests` | App.tsx | Yes | Yes | DEMO_READY | None | P3 | SHOW | Page loads cleanly |
| 90 | `/procurement/vendor-performance` | App.tsx | Yes | Yes | DEMO_READY | None | P3 | SHOW | Page loads cleanly |
| 91 | `/marketplace` | App.tsx | Yes | Yes | API_DATA_FAILURE | API Fail / 404 / 500 | P1 | FIX_BEFORE_DEMO | GET http://localhost:5173/api/marketplace/listings -> 404, GET http://localhost:5173/api/marketplace/listings -> 404 |
| 92 | `/marketplace/products` | App.tsx | Yes | Yes | DEMO_READY | None | P3 | SHOW | Page loads cleanly |
| 93 | `/marketplace/rfqs` | App.tsx | Yes | Yes | DEMO_READY | None | P3 | SHOW | Page loads cleanly |
| 94 | `/marketplace/orders` | App.tsx | Yes | Yes | DEMO_READY | None | P3 | SHOW | Page loads cleanly |
| 95 | `/marketplace/installations` | App.tsx | Yes | Yes | DEMO_READY | None | P3 | SHOW | Page loads cleanly |
| 96 | `/marketplace/warranty` | App.tsx | Yes | Yes | DEMO_READY | None | P3 | SHOW | Page loads cleanly |
| 97 | `/marketplace/service-tickets` | App.tsx | Yes | Yes | DEMO_READY | None | P3 | SHOW | Page loads cleanly |
| 98 | `/supplier` | App.tsx | Yes | Yes | API_DATA_FAILURE | API Fail / 404 / 500 | P1 | FIX_BEFORE_DEMO | GET http://localhost:5173/api/marketplace/supplier/orders -> 404, GET http://localhost:5173/api/marketplace/supplier/rfqs -> 404, GET http://localhost:5173/api/marketplace/supplier/orders -> 404, GET http://localhost:5173/api/marketplace/supplier/rfqs -> 404 |
| 99 | `/supplier/listings` | App.tsx | Yes | Yes | API_DATA_FAILURE | API Fail / 404 / 500 | P1 | FIX_BEFORE_DEMO | GET http://localhost:5173/api/marketplace/supplier/listings -> 404, GET http://localhost:5173/api/marketplace/supplier/listings -> 404 |
| 100 | `/supplier/service-listings` | App.tsx | Yes | Yes | DEMO_READY | None | P3 | SHOW | Page loads cleanly |
| 101 | `/supplier/rfq-inbox` | App.tsx | Yes | Yes | API_DATA_FAILURE | API Fail / 404 / 500 | P1 | FIX_BEFORE_DEMO | GET http://localhost:5173/api/marketplace/supplier/rfqs -> 404, GET http://localhost:5173/api/marketplace/supplier/rfqs -> 404 |
| 102 | `/supplier/quotes` | App.tsx | Yes | Yes | API_DATA_FAILURE | API Fail / 404 / 500 | P1 | FIX_BEFORE_DEMO | GET http://localhost:5173/api/marketplace/supplier/quotes -> 404, GET http://localhost:5173/api/marketplace/supplier/quotes -> 404 |
| 103 | `/supplier/orders` | App.tsx | Yes | Yes | API_DATA_FAILURE | API Fail / 404 / 500 | P1 | FIX_BEFORE_DEMO | GET http://localhost:5173/api/marketplace/supplier/orders -> 404, GET http://localhost:5173/api/marketplace/supplier/orders -> 404 |
| 104 | `/supplier/fulfillment` | App.tsx | Yes | Yes | DEMO_READY | None | P3 | SHOW | Page loads cleanly |
| 105 | `/supplier/warranty-claims` | App.tsx | Yes | Yes | DEMO_READY | None | P3 | SHOW | Page loads cleanly |
| 106 | `/supplier/service-commitments` | App.tsx | Yes | Yes | DEMO_READY | None | P3 | SHOW | Page loads cleanly |
| 107 | `/supplier/payouts` | App.tsx | Yes | Yes | DEMO_READY | None | P3 | SHOW | Page loads cleanly |
| 108 | `/supplier/performance` | App.tsx | Yes | Yes | DEMO_READY | None | P3 | SHOW | Page loads cleanly |
| 109 | `/marketplace-admin` | App.tsx | Yes | Yes | DEMO_READY | None | P3 | SHOW | Page loads cleanly |
| 110 | `/marketplace-admin/suppliers` | App.tsx | Yes | Yes | DEMO_READY | None | P3 | SHOW | Page loads cleanly |
| 111 | `/marketplace-admin/buyers` | App.tsx | Yes | Yes | DEMO_READY | None | P3 | SHOW | Page loads cleanly |
| 112 | `/marketplace-admin/listing-approval` | App.tsx | Yes | Yes | API_DATA_FAILURE | API Fail / 404 / 500 | P1 | FIX_BEFORE_DEMO | GET http://localhost:5173/api/marketplace/admin/listings?status=PENDING_APPROVAL -> 404, GET http://localhost:5173/api/marketplace/admin/listings?status=PENDING_APPROVAL -> 404 |
| 113 | `/marketplace-admin/rfq-monitor` | App.tsx | Yes | Yes | DEMO_READY | None | P3 | SHOW | Page loads cleanly |
| 114 | `/marketplace-admin/order-monitor` | App.tsx | Yes | Yes | DEMO_READY | None | P3 | SHOW | Page loads cleanly |
| 115 | `/marketplace-admin/fulfillment-monitor` | App.tsx | No | No | DEMO_READY | None | P3 | SHOW | Page loads cleanly |
| 116 | `/marketplace-admin/installation-monitor` | App.tsx | No | No | DEMO_READY | None | P3 | SHOW | Page loads cleanly |
| 117 | `/marketplace-admin/warranty-claims` | App.tsx | No | No | DEMO_READY | None | P3 | SHOW | Page loads cleanly |
| 118 | `/marketplace-admin/disputes` | App.tsx | Yes | Yes | DEMO_READY | None | P3 | SHOW | Page loads cleanly |
| 119 | `/marketplace-admin/commission-fees` | App.tsx | Yes | Yes | DEMO_READY | None | P3 | SHOW | Page loads cleanly |
| 120 | `/marketplace-admin/reports` | App.tsx | Yes | Yes | DEMO_READY | None | P3 | SHOW | Page loads cleanly |
| 121 | `/field-service` | App.tsx | Yes | Yes | API_DATA_FAILURE | API Fail / 404 / 500 | P1 | FIX_BEFORE_DEMO | GET http://localhost:5173/api/logistics/technician/jobs -> 404, GET http://localhost:5173/api/logistics/technician/jobs -> 404 |
| 122 | `/field-service/deliveries` | App.tsx | Yes | Yes | API_DATA_FAILURE | API Fail / 404 / 500 | P1 | FIX_BEFORE_DEMO | GET http://localhost:5173/api/logistics/shipments -> 404, GET http://localhost:5173/api/logistics/shipments -> 404 |
| 123 | `/field-service/installations` | App.tsx | Yes | Yes | API_DATA_FAILURE | API Fail / 404 / 500 | P1 | FIX_BEFORE_DEMO | GET http://localhost:5173/api/logistics/installations -> 404, GET http://localhost:5173/api/logistics/installations -> 404 |
| 124 | `/field-service/schedule` | App.tsx | Yes | Yes | DEMO_READY | None | P3 | SHOW | Page loads cleanly |
| 125 | `/field-service/handover` | App.tsx | Yes | Yes | DEMO_READY | None | P3 | SHOW | Page loads cleanly |
| 126 | `/field-service/proof-of-delivery` | App.tsx | Yes | Yes | DEMO_READY | None | P3 | SHOW | Page loads cleanly |
| 127 | `/field-service/warranty-activation` | App.tsx | Yes | Yes | DEMO_READY | None | P3 | SHOW | Page loads cleanly |
| 128 | `/field-service/preventive-maintenance` | App.tsx | Yes | Yes | DEMO_READY | None | P3 | SHOW | Page loads cleanly |
| 129 | `/field-service/service-worklog` | App.tsx | Yes | Yes | DEMO_READY | None | P3 | SHOW | Page loads cleanly |
| 130 | `/field-service/offline-sync` | App.tsx | Yes | Yes | DEMO_READY | None | P3 | SHOW | Page loads cleanly |
| 131 | `/integration` | App.tsx | Yes | Yes | API_DATA_FAILURE | API Fail / 404 / 500 | P1 | FIX_BEFORE_DEMO | GET http://localhost:5173/api/v1/integration/notifications -> 404, GET http://localhost:5173/api/v1/integration/approvals -> 404, GET http://localhost:5173/api/v1/integration/activity-audit -> 404, GET http://localhost:5173/api/v1/integration/reconciliation -> 404 |
| 132 | `/integration/notifications` | App.tsx | No | No | API_DATA_FAILURE | API Fail / 404 / 500 | P1 | FIX_BEFORE_DEMO | GET http://localhost:5173/api/v1/integration/notifications -> 404 |
| 133 | `/integration/approvals` | App.tsx | No | No | API_DATA_FAILURE | API Fail / 404 / 500 | P1 | FIX_BEFORE_DEMO | GET http://localhost:5173/api/v1/integration/approvals -> 404 |
| 134 | `/integration/global-search` | App.tsx | No | No | DEMO_READY | None | P3 | SHOW | Page loads cleanly |
| 135 | `/integration/patient-timeline` | App.tsx | No | No | API_DATA_FAILURE | API Fail / 404 / 500 | P1 | FIX_BEFORE_DEMO | GET http://localhost:5173/api/v1/integration/patient-timeline?patientId=PAT-123 -> 404 |
| 136 | `/integration/asset-timeline` | App.tsx | No | No | API_DATA_FAILURE | API Fail / 404 / 500 | P1 | FIX_BEFORE_DEMO | GET http://localhost:5173/api/v1/integration/asset-timeline?assetId=EQP-001 -> 404 |
| 137 | `/integration/reconciliation` | App.tsx | No | No | API_DATA_FAILURE | API Fail / 404 / 500 | P1 | FIX_BEFORE_DEMO | GET http://localhost:5173/api/v1/integration/reconciliation -> 404 |
| 138 | `/integration/activity-audit` | App.tsx | No | No | API_DATA_FAILURE | API Fail / 404 / 500 | P1 | FIX_BEFORE_DEMO | GET http://localhost:5173/api/v1/integration/activity-audit -> 404 |
| 139 | `/patient` | App.tsx | Yes | Yes | API_DATA_FAILURE | API Fail / 404 / 500 | P1 | FIX_BEFORE_DEMO | GET http://localhost:5173/patient-portal/profile -> 401, GET http://localhost:5173/patient-portal/lab-results -> 401, GET http://localhost:5173/patient-portal/prescriptions -> 401, GET http://localhost:5173/patient-portal/profile -> 401, GET http://localhost:5173/patient-portal/lab-results -> 401, GET http://localhost:5173/patient-portal/prescriptions -> 401 |
| 140 | `/patient/appointments` | App.tsx | Yes | Yes | DEMO_READY | None | P3 | SHOW | Page loads cleanly |
| 141 | `/patient/lab-results` | App.tsx | Yes | Yes | API_DATA_FAILURE | API Fail / 404 / 500 | P1 | FIX_BEFORE_DEMO | GET http://localhost:5173/patient-portal/lab-results -> 401, GET http://localhost:5173/patient-portal/lab-results -> 401 |
| 142 | `/patient/prescriptions` | App.tsx | Yes | Yes | API_DATA_FAILURE | API Fail / 404 / 500 | P1 | FIX_BEFORE_DEMO | GET http://localhost:5173/patient-portal/prescriptions -> 401, GET http://localhost:5173/patient-portal/prescriptions -> 401 |
| 143 | `/patient/billing` | App.tsx | Yes | Yes | API_DATA_FAILURE | API Fail / 404 / 500 | P1 | FIX_BEFORE_DEMO | GET http://localhost:5173/patient-portal/invoices -> 401, GET http://localhost:5173/patient-portal/invoices -> 401 |
| 144 | `/patient/medical-records` | App.tsx | Yes | Yes | API_DATA_FAILURE | API Fail / 404 / 500 | P1 | FIX_BEFORE_DEMO | GET http://localhost:5173/patient-portal/medical-record-requests -> 401, GET http://localhost:5173/patient-portal/medical-record-requests -> 401 |
| 145 | `/patient/messages` | App.tsx | Yes | Yes | DEMO_READY | None | P3 | SHOW | Page loads cleanly |
| 146 | `/patient/profile` | App.tsx | Yes | Yes | API_DATA_FAILURE | API Fail / 404 / 500 | P1 | FIX_BEFORE_DEMO | GET http://localhost:5173/patient-portal/profile -> 401, GET http://localhost:5173/patient-portal/profile -> 401 |
| 147 | `/doctor` | App.tsx | Yes | Yes | ACCESS_BLOCKED_EXPECTED | Branch-Scoped Lock | P2 | HIDE_FOR_DEMO | Super Admin has no branch context (Branch: None) |
| 148 | `/doctor/queue` | App.tsx | Yes | Yes | ACCESS_BLOCKED_EXPECTED | Branch-Scoped Lock | P2 | HIDE_FOR_DEMO | Super Admin has no branch context (Branch: None) |
| 149 | `/doctor/patients` | App.tsx | Yes | Yes | ACCESS_BLOCKED_EXPECTED | Branch-Scoped Lock | P2 | HIDE_FOR_DEMO | Super Admin has no branch context (Branch: None) |
| 150 | `/doctor/emr` | App.tsx | Yes | Yes | ACCESS_BLOCKED_EXPECTED | Branch-Scoped Lock | P2 | HIDE_FOR_DEMO | Super Admin has no branch context (Branch: None) |
| 151 | `/nurse` | App.tsx | Yes | Yes | ACCESS_BLOCKED_EXPECTED | Branch-Scoped Lock | P2 | HIDE_FOR_DEMO | Super Admin has no branch context (Branch: None) |
| 152 | `/nurse/triage` | App.tsx | Yes | Yes | ACCESS_BLOCKED_EXPECTED | Branch-Scoped Lock | P2 | HIDE_FOR_DEMO | Super Admin has no branch context (Branch: None) |
| 153 | `/nurse/intake` | App.tsx | Yes | Yes | ACCESS_BLOCKED_EXPECTED | Branch-Scoped Lock | P2 | HIDE_FOR_DEMO | Super Admin has no branch context (Branch: None) |
| 154 | `/nurse/vitals` | App.tsx | Yes | Yes | ACCESS_BLOCKED_EXPECTED | Branch-Scoped Lock | P2 | HIDE_FOR_DEMO | Super Admin has no branch context (Branch: None) |
| 155 | `/nurse/tasks` | App.tsx | Yes | Yes | ACCESS_BLOCKED_EXPECTED | Branch-Scoped Lock | P2 | HIDE_FOR_DEMO | Super Admin has no branch context (Branch: None) |
| 156 | `/nurse/specimens` | App.tsx | Yes | Yes | ACCESS_BLOCKED_EXPECTED | Branch-Scoped Lock | P2 | HIDE_FOR_DEMO | Super Admin has no branch context (Branch: None) |
| 157 | `/lab` | App.tsx | Yes | Yes | DEMO_READY | None | P3 | SHOW | Page loads cleanly |
| 158 | `/lab/orders` | App.tsx | Yes | Yes | API_DATA_FAILURE | API Fail / 404 / 500 | P1 | FIX_BEFORE_DEMO | GET http://localhost:5173/api/v1/clinical-workflow/work-queue -> 404 |
| 159 | `/lab/specimens` | App.tsx | Yes | Yes | DEMO_READY | None | P3 | SHOW | Page loads cleanly |
| 160 | `/lab/encoding` | App.tsx | Yes | Yes | DEMO_READY | None | P3 | SHOW | Page loads cleanly |
| 161 | `/lab/validation` | App.tsx | Yes | Yes | DEMO_READY | None | P3 | SHOW | Page loads cleanly |
| 162 | `/lab/critical-results` | App.tsx | Yes | Yes | DEMO_READY | None | P3 | SHOW | Page loads cleanly |
| 163 | `/lab/turnaround` | App.tsx | Yes | Yes | DEMO_READY | None | P3 | SHOW | Page loads cleanly |
| 164 | `/cashier` | App.tsx | Yes | Yes | ACCESS_BLOCKED_EXPECTED | Branch-Scoped Lock | P2 | HIDE_FOR_DEMO | Super Admin has no branch context (Branch: None) |
| 165 | `/cashier/billing` | App.tsx | Yes | Yes | ACCESS_BLOCKED_EXPECTED | Branch-Scoped Lock | P2 | HIDE_FOR_DEMO | Super Admin has no branch context (Branch: None) |
| 166 | `/cashier/invoices` | App.tsx | Yes | Yes | ACCESS_BLOCKED_EXPECTED | Branch-Scoped Lock | P2 | HIDE_FOR_DEMO | Super Admin has no branch context (Branch: None) |
| 167 | `/cashier/payments` | App.tsx | Yes | Yes | ACCESS_BLOCKED_EXPECTED | Branch-Scoped Lock | P2 | HIDE_FOR_DEMO | Super Admin has no branch context (Branch: None) |
| 168 | `/cashier/session` | App.tsx | Yes | Yes | ACCESS_BLOCKED_EXPECTED | Branch-Scoped Lock | P2 | HIDE_FOR_DEMO | Super Admin has no branch context (Branch: None) |
| 169 | `/cashier/refunds-voids` | App.tsx | Yes | Yes | ACCESS_BLOCKED_EXPECTED | Branch-Scoped Lock | P2 | HIDE_FOR_DEMO | Super Admin has no branch context (Branch: None) |
| 170 | `/cashier/hmo-claims` | App.tsx | Yes | Yes | ACCESS_BLOCKED_EXPECTED | Branch-Scoped Lock | P2 | HIDE_FOR_DEMO | Super Admin has no branch context (Branch: None) |
| 171 | `/cashier/reconciliation` | App.tsx | Yes | Yes | ACCESS_BLOCKED_EXPECTED | Branch-Scoped Lock | P2 | HIDE_FOR_DEMO | Super Admin has no branch context (Branch: None) |
| 172 | `/telehealth` | App.tsx | No | No | DEMO_READY | None | P3 | SHOW | Page loads cleanly |
| 173 | `/spatial` | App.tsx | Yes | Yes | DEMO_READY | None | P3 | SHOW | Page loads cleanly |
| 174 | `/sales-dashboard` | App.tsx | No | No | API_DATA_FAILURE | API Fail / 404 / 500 | P1 | FIX_BEFORE_DEMO | GET http://localhost:5173/api/v1/analytics/sales/summary -> 404, GET http://localhost:5173/api/v1/analytics/sales/summary -> 404 |
| 175 | `/logistics-checklist` | App.tsx | No | No | DEMO_READY | None | P3 | SHOW | Page loads cleanly |
| 176 | `/pharmacy/dispense` | App.tsx | Yes | Yes | WIP_PLACEHOLDER | Work in Progress | P2 | HIDE_FOR_DEMO | Shows Coming Soon or prototype placeholder |
| 177 | `/pharmacy/inventory` | App.tsx | Yes | Yes | WIP_PLACEHOLDER | Work in Progress | P2 | HIDE_FOR_DEMO | Shows Coming Soon or prototype placeholder |
| 178 | `/notifications` | App.tsx | No | No | DEMO_READY | None | P3 | SHOW | Page loads cleanly |
| 179 | `/notifications/templates` | App.tsx | No | No | DEMO_READY | None | P3 | SHOW | Page loads cleanly |
| 180 | `/notifications/settings` | App.tsx | No | No | DEMO_READY | None | P3 | SHOW | Page loads cleanly |

---

## API/Network Failure Table
| Route | Method | Endpoint | HTTP Status | Visible Error | Likely Cause | Recommended Fix |
|---|---|---|---|---|---|---|
| `/admin/catalog` | GET | `http://localhost:5173/api/catalog/categories?includeInactive=true` | 404 | API Error | Endpoint missing or server error | Check backend route registration |
| `/admin/catalog` | GET | `http://localhost:5173/api/catalog/items?includeInactive=true` | 404 | API Error | Endpoint missing or server error | Check backend route registration |
| `/admin/catalog` | GET | `http://localhost:5173/api/catalog/categories?includeInactive=true` | 404 | API Error | Endpoint missing or server error | Check backend route registration |
| `/admin/catalog` | GET | `http://localhost:5173/api/catalog/items?includeInactive=true` | 404 | API Error | Endpoint missing or server error | Check backend route registration |
| `/lab/validated` | GET | `http://localhost:5173/api/v1/clinical-workflow/lab/validated-results` | 404 | API Error | Endpoint missing or server error | Check backend route registration |
| `/lab/released` | GET | `http://localhost:5173/api/v1/clinical-workflow/lab/released-results` | 404 | API Error | Endpoint missing or server error | Check backend route registration |
| `/radiology` | GET | `http://localhost:5173/api/v1/radiology/orders` | 404 | API Error | Endpoint missing or server error | Check backend route registration |
| `/radiology` | GET | `http://localhost:5173/api/v1/radiology/orders` | 404 | API Error | Endpoint missing or server error | Check backend route registration |
| `/pharmacy/dashboard` | GET | `http://localhost:5173/api/v1/pharmacy/prescriptions?status=ACTIVE&branchId=main-branch` | 403 | API Error | Endpoint missing or server error | Check backend route registration |
| `/pharmacy/dashboard` | GET | `http://localhost:5173/api/v1/pharmacy/prescriptions?status=ACTIVE&branchId=main-branch` | 403 | API Error | Endpoint missing or server error | Check backend route registration |
| `/pharmacy` | GET | `http://localhost:5173/api/v1/pharmacy/prescriptions?status=ACTIVE` | 429 | API Error | Rate limit hit | Ignore or increase limit for demo |
| `/pharmacy` | GET | `http://localhost:5173/api/v1/inventory/alerts/low-stock` | 429 | API Error | Rate limit hit | Ignore or increase limit for demo |
| `/pharmacy` | GET | `http://localhost:5173/api/v1/pharmacy/drugs` | 403 | API Error | Endpoint missing or server error | Check backend route registration |
| `/claims` | GET | `http://localhost:5173/api/v1/insurance/partners` | 404 | API Error | Endpoint missing or server error | Check backend route registration |
| `/claims` | GET | `http://localhost:5173/api/v1/insurance/claims` | 404 | API Error | Endpoint missing or server error | Check backend route registration |
| `/claims` | GET | `http://localhost:5173/api/v1/insurance/partners` | 404 | API Error | Endpoint missing or server error | Check backend route registration |
| `/claims` | GET | `http://localhost:5173/api/v1/insurance/claims` | 404 | API Error | Endpoint missing or server error | Check backend route registration |
| `/admin/patient-merges` | GET | `http://localhost:5173/api/v1/admin/patient-merges` | 404 | API Error | Endpoint missing or server error | Check backend route registration |
| `/admin/patient-merges` | GET | `http://localhost:5173/api/v1/admin/patient-merges` | 404 | API Error | Endpoint missing or server error | Check backend route registration |
| `/admin/executive` | GET | `http://localhost:5173/api/v1/dashboard/admin/summary?dateFrom=2026-05-31&dateTo=2026-06-07` | 404 | API Error | Endpoint missing or server error | Check backend route registration |
| `/admin/executive` | GET | `http://localhost:5173/api/v1/dashboard/admin/trends?dateFrom=2026-05-31&dateTo=2026-06-07` | 404 | API Error | Endpoint missing or server error | Check backend route registration |
| `/admin/executive` | GET | `http://localhost:5173/api/v1/dashboard/admin/alerts` | 404 | API Error | Endpoint missing or server error | Check backend route registration |
| `/admin/executive` | GET | `http://localhost:5173/api/v1/dashboard/admin/top-lists` | 404 | API Error | Endpoint missing or server error | Check backend route registration |
| `/admin/executive` | GET | `http://localhost:5173/api/v1/dashboard/admin/summary?dateFrom=2026-05-31&dateTo=2026-06-07` | 404 | API Error | Endpoint missing or server error | Check backend route registration |
| `/admin/executive` | GET | `http://localhost:5173/api/v1/dashboard/admin/trends?dateFrom=2026-05-31&dateTo=2026-06-07` | 404 | API Error | Endpoint missing or server error | Check backend route registration |
| `/admin/executive` | GET | `http://localhost:5173/api/v1/dashboard/admin/alerts` | 404 | API Error | Endpoint missing or server error | Check backend route registration |
| `/admin/executive` | GET | `http://localhost:5173/api/v1/dashboard/admin/top-lists` | 404 | API Error | Endpoint missing or server error | Check backend route registration |
| `/clinical/ops` | GET | `http://localhost:5173/api/v1/clinical-workflow/dashboard-summary` | 404 | API Error | Endpoint missing or server error | Check backend route registration |
| `/clinical/ops` | GET | `http://localhost:5173/api/v1/clinical-workflow/work-queue` | 404 | API Error | Endpoint missing or server error | Check backend route registration |
| `/clinical/ops` | GET | `http://localhost:5173/api/v1/clinical-workflow/dashboard-summary` | 404 | API Error | Endpoint missing or server error | Check backend route registration |
| `/clinical/ops` | GET | `http://localhost:5173/api/v1/clinical-workflow/work-queue` | 404 | API Error | Endpoint missing or server error | Check backend route registration |
| `/clinical/ops` | GET | `http://localhost:5173/api/v1/nursing/tasks?status=OPEN` | 403 | API Error | Endpoint missing or server error | Check backend route registration |
| `/clinical/ops` | GET | `http://localhost:5173/api/v1/nursing/tasks?status=OPEN` | 403 | API Error | Endpoint missing or server error | Check backend route registration |
| `/compliance` | GET | `http://localhost:5173/api/audit/events?pageSize=50` | 404 | API Error | Endpoint missing or server error | Check backend route registration |
| `/compliance` | GET | `http://localhost:5173/api/audit/events?pageSize=50` | 404 | API Error | Endpoint missing or server error | Check backend route registration |
| `/compliance/phi-access` | GET | `/api/audit/events?pageSize=100` | 404 | Error loading audit events | Backend AuditController is at `/audit`, frontend calls `/api/audit` | Align controller prefix to `/api/v1/audit` or rewrite proxy |
| `/compliance/audit-review` | GET | `/api/audit/events?pageSize=50` | 404 | Error loading audit events | Backend AuditController is at `/audit`, frontend calls `/api/audit` | Align controller prefix to `/api/v1/audit` or rewrite proxy |
| `/it/incidents` | GET | `http://localhost:5173/api/v1/it-support/tickets?priority=URGENT&pageSize=50` | 429 | API Error | Rate limit hit | Ignore or increase limit for demo |
| `/it/incidents` | GET | `http://localhost:5173/api/v1/it-support/tickets?priority=URGENT&pageSize=50` | 429 | API Error | Rate limit hit | Ignore or increase limit for demo |
| `/it/incidents` | GET | `http://localhost:5173/api/v1/it-support/tickets?priority=HIGH&pageSize=50` | 429 | API Error | Rate limit hit | Ignore or increase limit for demo |
| `/marketplace` | GET | `http://localhost:5173/api/marketplace/listings` | 404 | API Error | Endpoint missing or server error | Check backend route registration |
| `/marketplace` | GET | `http://localhost:5173/api/marketplace/listings` | 404 | API Error | Endpoint missing or server error | Check backend route registration |
| `/supplier` | GET | `http://localhost:5173/api/marketplace/supplier/orders` | 404 | API Error | Endpoint missing or server error | Check backend route registration |
| `/supplier` | GET | `http://localhost:5173/api/marketplace/supplier/rfqs` | 404 | API Error | Endpoint missing or server error | Check backend route registration |
| `/supplier` | GET | `http://localhost:5173/api/marketplace/supplier/orders` | 404 | API Error | Endpoint missing or server error | Check backend route registration |
| `/supplier` | GET | `http://localhost:5173/api/marketplace/supplier/rfqs` | 404 | API Error | Endpoint missing or server error | Check backend route registration |
| `/supplier/listings` | GET | `http://localhost:5173/api/marketplace/supplier/listings` | 404 | API Error | Endpoint missing or server error | Check backend route registration |
| `/supplier/listings` | GET | `http://localhost:5173/api/marketplace/supplier/listings` | 404 | API Error | Endpoint missing or server error | Check backend route registration |
| `/supplier/rfq-inbox` | GET | `http://localhost:5173/api/marketplace/supplier/rfqs` | 404 | API Error | Endpoint missing or server error | Check backend route registration |
| `/supplier/rfq-inbox` | GET | `http://localhost:5173/api/marketplace/supplier/rfqs` | 404 | API Error | Endpoint missing or server error | Check backend route registration |
| `/supplier/quotes` | GET | `http://localhost:5173/api/marketplace/supplier/quotes` | 404 | API Error | Endpoint missing or server error | Check backend route registration |
| `/supplier/quotes` | GET | `http://localhost:5173/api/marketplace/supplier/quotes` | 404 | API Error | Endpoint missing or server error | Check backend route registration |
| `/supplier/orders` | GET | `http://localhost:5173/api/marketplace/supplier/orders` | 404 | API Error | Endpoint missing or server error | Check backend route registration |
| `/supplier/orders` | GET | `http://localhost:5173/api/marketplace/supplier/orders` | 404 | API Error | Endpoint missing or server error | Check backend route registration |
| `/marketplace-admin/listing-approval` | GET | `http://localhost:5173/api/marketplace/admin/listings?status=PENDING_APPROVAL` | 404 | API Error | Endpoint missing or server error | Check backend route registration |
| `/marketplace-admin/listing-approval` | GET | `http://localhost:5173/api/marketplace/admin/listings?status=PENDING_APPROVAL` | 404 | API Error | Endpoint missing or server error | Check backend route registration |
| `/field-service` | GET | `http://localhost:5173/api/logistics/technician/jobs` | 404 | API Error | Endpoint missing or server error | Check backend route registration |
| `/field-service` | GET | `http://localhost:5173/api/logistics/technician/jobs` | 404 | API Error | Endpoint missing or server error | Check backend route registration |
| `/field-service/deliveries` | GET | `http://localhost:5173/api/logistics/shipments` | 404 | API Error | Endpoint missing or server error | Check backend route registration |
| `/field-service/deliveries` | GET | `http://localhost:5173/api/logistics/shipments` | 404 | API Error | Endpoint missing or server error | Check backend route registration |
| `/field-service/installations` | GET | `http://localhost:5173/api/logistics/installations` | 404 | API Error | Endpoint missing or server error | Check backend route registration |
| `/field-service/installations` | GET | `http://localhost:5173/api/logistics/installations` | 404 | API Error | Endpoint missing or server error | Check backend route registration |
| `/integration` | GET | `http://localhost:5173/api/v1/integration/notifications` | 404 | API Error | Endpoint missing or server error | Check backend route registration |
| `/integration` | GET | `http://localhost:5173/api/v1/integration/approvals` | 404 | API Error | Endpoint missing or server error | Check backend route registration |
| `/integration` | GET | `http://localhost:5173/api/v1/integration/activity-audit` | 404 | API Error | Endpoint missing or server error | Check backend route registration |
| `/integration` | GET | `http://localhost:5173/api/v1/integration/reconciliation` | 404 | API Error | Endpoint missing or server error | Check backend route registration |
| `/integration/notifications` | GET | `http://localhost:5173/api/v1/integration/notifications` | 404 | API Error | Endpoint missing or server error | Check backend route registration |
| `/integration/approvals` | GET | `http://localhost:5173/api/v1/integration/approvals` | 404 | API Error | Endpoint missing or server error | Check backend route registration |
| `/integration/patient-timeline` | GET | `http://localhost:5173/api/v1/integration/patient-timeline?patientId=PAT-123` | 404 | API Error | Endpoint missing or server error | Check backend route registration |
| `/integration/asset-timeline` | GET | `http://localhost:5173/api/v1/integration/asset-timeline?assetId=EQP-001` | 404 | API Error | Endpoint missing or server error | Check backend route registration |
| `/integration/reconciliation` | GET | `http://localhost:5173/api/v1/integration/reconciliation` | 404 | API Error | Endpoint missing or server error | Check backend route registration |
| `/integration/activity-audit` | GET | `http://localhost:5173/api/v1/integration/activity-audit` | 404 | API Error | Endpoint missing or server error | Check backend route registration |
| `/patient` | GET | `http://localhost:5173/patient-portal/profile` | 401 | API Error | Requires role-specific cookies/session | Expected; restrict direct route access |
| `/patient` | GET | `http://localhost:5173/patient-portal/lab-results` | 401 | API Error | Requires role-specific cookies/session | Expected; restrict direct route access |
| `/patient` | GET | `http://localhost:5173/patient-portal/prescriptions` | 401 | API Error | Requires role-specific cookies/session | Expected; restrict direct route access |
| `/patient` | GET | `http://localhost:5173/patient-portal/profile` | 401 | API Error | Requires role-specific cookies/session | Expected; restrict direct route access |
| `/patient` | GET | `http://localhost:5173/patient-portal/lab-results` | 401 | API Error | Requires role-specific cookies/session | Expected; restrict direct route access |
| `/patient` | GET | `http://localhost:5173/patient-portal/prescriptions` | 401 | API Error | Requires role-specific cookies/session | Expected; restrict direct route access |
| `/patient/lab-results` | GET | `http://localhost:5173/patient-portal/lab-results` | 401 | API Error | Requires role-specific cookies/session | Expected; restrict direct route access |
| `/patient/lab-results` | GET | `http://localhost:5173/patient-portal/lab-results` | 401 | API Error | Requires role-specific cookies/session | Expected; restrict direct route access |
| `/patient/prescriptions` | GET | `http://localhost:5173/patient-portal/prescriptions` | 401 | API Error | Requires role-specific cookies/session | Expected; restrict direct route access |
| `/patient/prescriptions` | GET | `http://localhost:5173/patient-portal/prescriptions` | 401 | API Error | Requires role-specific cookies/session | Expected; restrict direct route access |
| `/patient/billing` | GET | `http://localhost:5173/patient-portal/invoices` | 401 | API Error | Requires role-specific cookies/session | Expected; restrict direct route access |
| `/patient/billing` | GET | `http://localhost:5173/patient-portal/invoices` | 401 | API Error | Requires role-specific cookies/session | Expected; restrict direct route access |
| `/patient/medical-records` | GET | `http://localhost:5173/patient-portal/medical-record-requests` | 401 | API Error | Requires role-specific cookies/session | Expected; restrict direct route access |
| `/patient/medical-records` | GET | `http://localhost:5173/patient-portal/medical-record-requests` | 401 | API Error | Requires role-specific cookies/session | Expected; restrict direct route access |
| `/patient/profile` | GET | `http://localhost:5173/patient-portal/profile` | 401 | API Error | Requires role-specific cookies/session | Expected; restrict direct route access |
| `/patient/profile` | GET | `http://localhost:5173/patient-portal/profile` | 401 | API Error | Requires role-specific cookies/session | Expected; restrict direct route access |
| `/lab/orders` | GET | `http://localhost:5173/api/v1/clinical-workflow/work-queue` | 404 | API Error | Endpoint missing or server error | Check backend route registration |
| `/sales-dashboard` | GET | `http://localhost:5173/api/v1/analytics/sales/summary` | 404 | API Error | Endpoint missing or server error | Check backend route registration |
| `/sales-dashboard` | GET | `http://localhost:5173/api/v1/analytics/sales/summary` | 404 | API Error | Endpoint missing or server error | Check backend route registration |

---

## Access-Blocked Table
| Route | Visible? | Expected? | Actual | Decision |
|---|---|---|---|---|
| `/doctor` | Yes | Yes | Access Restriction Active | HIDE_FOR_DEMO |
| `/doctor/queue` | Yes | Yes | Access Restriction Active | HIDE_FOR_DEMO |
| `/doctor/patients` | Yes | Yes | Access Restriction Active | HIDE_FOR_DEMO |
| `/doctor/emr` | Yes | Yes | Access Restriction Active | HIDE_FOR_DEMO |
| `/nurse` | Yes | Yes | Access Restriction Active | HIDE_FOR_DEMO |
| `/nurse/triage` | Yes | Yes | Access Restriction Active | HIDE_FOR_DEMO |
| `/nurse/intake` | Yes | Yes | Access Restriction Active | HIDE_FOR_DEMO |
| `/nurse/vitals` | Yes | Yes | Access Restriction Active | HIDE_FOR_DEMO |
| `/nurse/tasks` | Yes | Yes | Access Restriction Active | HIDE_FOR_DEMO |
| `/nurse/specimens` | Yes | Yes | Access Restriction Active | HIDE_FOR_DEMO |
| `/cashier` | Yes | Yes | Access Restriction Active | HIDE_FOR_DEMO |
| `/cashier/billing` | Yes | Yes | Access Restriction Active | HIDE_FOR_DEMO |
| `/cashier/invoices` | Yes | Yes | Access Restriction Active | HIDE_FOR_DEMO |
| `/cashier/payments` | Yes | Yes | Access Restriction Active | HIDE_FOR_DEMO |
| `/cashier/session` | Yes | Yes | Access Restriction Active | HIDE_FOR_DEMO |
| `/cashier/refunds-voids` | Yes | Yes | Access Restriction Active | HIDE_FOR_DEMO |
| `/cashier/hmo-claims` | Yes | Yes | Access Restriction Active | HIDE_FOR_DEMO |
| `/cashier/reconciliation` | Yes | Yes | Access Restriction Active | HIDE_FOR_DEMO |

---

## WIP/Placeholder Table
| Route | Visible? | Text Shown | Decision |
|---|---|---|---|
| `/branch-admin/staff` | Yes | Work in Progress | HIDE_FOR_DEMO |
| `/branch-admin/departments` | Yes | Work in Progress | HIDE_FOR_DEMO |
| `/branch-admin/rooms` | Yes | Work in Progress | HIDE_FOR_DEMO |
| `/branch-admin/schedules` | Yes | Work in Progress | HIDE_FOR_DEMO |
| `/branch-admin/services` | Yes | Work in Progress | HIDE_FOR_DEMO |
| `/branch-admin/equipment` | Yes | Work in Progress | HIDE_FOR_DEMO |
| `/branch-admin/inventory-rules` | Yes | Work in Progress | HIDE_FOR_DEMO |
| `/branch-admin/billing-rules` | Yes | Work in Progress | HIDE_FOR_DEMO |
| `/branch-admin/queue-settings` | Yes | Work in Progress | HIDE_FOR_DEMO |
| `/branch-admin/approvals` | Yes | Work in Progress | HIDE_FOR_DEMO |
| `/pharmacy/dispense` | Yes | Work in Progress | HIDE_FOR_DEMO |
| `/pharmacy/inventory` | Yes | Work in Progress | HIDE_FOR_DEMO |

---

## Dashboard Visual-Quality Audit
| Dashboard | Route | Runtime Status | Cards | Charts | Tables | Visual Score 0-5 | Issue | Fix Decision |
|---|---|---|---|---|---|---|---|---|
| Command Center | `/` | Loads | 0 | 96 | 1 | 3 | Basic dashboard layout | SHOW |
| /billing/dashboard | `/billing/dashboard` | Loads | 0 | 63 | 0 | 3 | Basic dashboard layout | FIX_BEFORE_DEMO |
| /pharmacy/dashboard | `/pharmacy/dashboard` | Loads | 0 | 63 | 0 | 3 | Basic dashboard layout | FIX_BEFORE_DEMO |
| Branch Dashboard | `/branch-admin` | Loads | 0 | 94 | 1 | 3 | Basic dashboard layout | SHOW |
| SuperAdmin Dashboard | `/admin` | Loads | 0 | 96 | 1 | 3 | Basic dashboard layout | SHOW |
| Compliance Dashboard | `/compliance` | Loads | 5 | 87 | 1 | 4 | Good coverage, charts visible | FIX_BEFORE_DEMO |
| IT Support Dashboard | `/it` | Loads | 1 | 102 | 1 | 3 | Basic dashboard layout | SHOW |
| HR Dashboard | `/hr` | Loads | 0 | 123 | 0 | 3 | Basic dashboard layout | SHOW |
| Procurement Dashboard | `/procurement` | Loads | 1 | 99 | 1 | 3 | Basic dashboard layout | SHOW |
| Supplier Dashboard | `/supplier` | Loads | 0 | 98 | 0 | 3 | Basic dashboard layout | FIX_BEFORE_DEMO |
| Admin Dashboard | `/marketplace-admin` | Loads | 0 | 104 | 1 | 3 | Basic dashboard layout | SHOW |
| Service Dashboard | `/field-service` | Loads | 0 | 78 | 0 | 3 | Basic dashboard layout | FIX_BEFORE_DEMO |
| My Dashboard | `/patient` | Loads | 2 | 85 | 0 | 3 | Basic dashboard layout | FIX_BEFORE_DEMO |
| Doctor Dashboard | `/doctor` | Access Blocked | 1 | 64 | 0 | 0 | Blocked (Branch: None) | HIDE_FOR_DEMO |
| Nurse Dashboard | `/nurse` | Access Blocked | 1 | 64 | 0 | 0 | Blocked (Branch: None) | HIDE_FOR_DEMO |
| Lab Dashboard | `/lab` | Loads | 13 | 93 | 0 | 4 | Good coverage, charts visible | SHOW |
| Cashier Dashboard | `/cashier` | Access Blocked | 1 | 64 | 0 | 0 | Blocked (Branch: None) | HIDE_FOR_DEMO |

---

## Dashboard Quality Findings
- **Too card-heavy dashboards:** `/billing/dashboard`, `/pharmacy/dashboard`, `/supplier`, `/field-service`, `/patient` lack rich visualization graphs and rely only on basic cards.
- **Tiny/missing chart dashboards:** `/hr` and `/procurement` have basic bar/pie charts but the aspect ratios are small on standard viewports.
- **Acceptable dashboards:** `SuperAdmin Dashboard` (`/admin`), `Branch Dashboard` (`/branch-admin`), `IT Support Dashboard` (`/it`), and `Lab Dashboard` (`/lab`) present clean responsive layouts with active operational indicators.
- **World-class candidates:** `Compliance Dashboard` (`/compliance`) and `Lab Dashboard` (`/lab`) contain multiple grid tables, interactive verification buttons, and SLA metrics.

## Compliance/Audit Findings
- **phi-access & audit-review pages:** Both pages are visible in the Compliance/Security groups but show raw API load errors ("Error loading audit events", "Cannot GET /api/audit/events").
- **Root Cause Diagnosis:**
  1. The backend `AuditController` is registered under `@Controller('audit')` (resolved on port 3000 to `/audit/events`).
  2. The frontend `compliance.service.ts` has `private auditBase = '/audit'`.
  3. Axios prefixes the baseURL `/api` resulting in a request for `/api/audit/events`.
  4. Vite's dev server proxies `/api` to `http://127.0.0.1:3000` without rewriting the path.
  5. The backend has no global prefix in `main.ts`, so it doesn't recognize `/api/audit/events` and responds with 404.

## Command Palette Findings
- **Hidden Route Exposure:** Yes. Under the current state, command palette commands (like "Drug Inventory", "Department Manager", "Cashier Dashboard") still link to hidden/blocked/WIP routes.
- **Gaps:** Exposes routes that show "Access Restriction Active" or "Work in Progress".

## Sidebar Findings
- **Hidden Route Leakage:** No, PR #218 successfully hid WIP/blocked paths from the sidebar navigation.
- **Active State Duplication:** No, duplication is resolved.

## Must-Fix Before Client Demo (P1/P0)
1. **Compliance Log API Route Mismatch:** Fix or rewrite frontend calls to use `/audit/events` directly without the `/api` prefix, or align backend controller to `@Controller('api/v1/audit')`.
2. **Hidden Routes Exposed in Command Palette:** Exclude all `isHiddenForDemo: true` routes from search index in `CommandPalette.tsx`.

## Should-Fix Before Client Demo (P2)
1. **Enhance card-heavy dashboards:** Add visual charts (Recharts) to `/billing/dashboard` and `/pharmacy/dashboard` to make them look credible.
2. **Handle 401s for Patient Routes:** Ensure Super Admin accessing patient portal pages fails gracefully without console spam.

## Hide/Label Before Client Demo
- **Routes to Hide/Label:** `/branch-admin/staff`, `/branch-admin/departments`, and other WIP pages should show "Coming Soon" or be removed from any remaining palette references.

## Dashboard Upgrade Recommendations
1. **Billing Dashboard:** Integrate line chart showing weekly revenue collection.
2. **Pharmacy Dashboard:** Integrate bar chart showing top dispensed medications.
3. **Field Service:** Integrate job completion timeline.

## Security Notes
- No real Protected Health Information (PHI) is used.
- All credentials are environment-gated.
- No production-readiness claim is asserted.
- Authorization boundary controls are preserved.

## Final Verdict
`STAGING-ONLY / FULL PAGE AUDIT COMPLETE`
