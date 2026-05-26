# Gemini HMS Portal-Route-Permission Audit

This document provides a comprehensive mapping of frontend portals, their routes, authorization guards, and corresponding backend permissions.

## Portal Audit Table

| Portal | Route | Component | Intended Role(s) | Frontend Guard | Backend Permissions | Seeded Demo User | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Super Admin** | `/admin` | `SuperAdminDashboard` | Super Admin | `allowedRoles=['Super Admin']` | `*` (All Permissions) | `admin@hospital.com` | Real |
| **Branch Admin** | `/` | `Dashboard` | Branch Admin | N/A (Default) | Various (e.g., `patient.view`) | `branch.admin@hospital.com` | Real |
| **Receptionist** | `/queue` | `Queue` | Receptionist | `permission='queue.view'` | `queue.view`, `queue.manage` | `receptionist@hospital.com` | Real |
| **Doctor** | `/doctor` | `DoctorDashboard` | Doctor | `allowedRoles=['Doctor']` | `encounter.create`, `patient.view` | `doctor@hospital.com` | Partial (Real clinical workflow API; EMR page WIP) |
| **Nurse** | `/nurse` | `NurseDashboard` | Nurse | `allowedRoles=['Nurse']` | `encounter.update`, `patient.update` | `nurse@hospital.com` | Partial (Real triage/vitals API; tasks WIP) |
| **Patient** | `/patient` | `PatientDashboard` | Patient | `permission='patient.portal.view_own'` | `patient.portal.view_own` | `patient@hospital.com` | Partial (Real patient portal API for profile, lab results, prescriptions, invoices) |
| **Cashier** | `/cashier` | `CashierDashboard` | Cashier | `allowedRoles=['Cashier']` | `billing.invoice.view`, `billing.payment.create` | `cashier@hospital.com` | Partial (Real invoice, payment, and session APIs; refunds/HMO/reconciliation mock) |
| **Med-Tech** | `/lab` | `LabDashboard` | Med-Tech | `permission='lab.result.view'` | `lab.result.encode`, `lab.result.view`, `lab.critical.view`, `lab.critical.acknowledge` | `medtech@hospital.com` | Partial (Real dashboard, specimen receiving, critical results, result release, turnaround) |
| **Pharmacist** | `/pharmacy` | `PharmacyHub` | Pharmacist | `permission='inventory.stock.dispense'` | `inventory.stock.dispense`, `pharmacy.stockmovement.view` | `pharmacist@hospital.com` | Real (Sprint 2A + 2B — prescription queue, dispense, stock movements, low-stock alerts) |
| **Supplier** | `/supplier` | `SupplierDashboard` | Supplier | `allowedRoles=['Supplier']` | `marketplace.supplier.manage_listing` | `supplier@hospital.com` | Real |
| **Procurement** | `/procurement` | `ProcurementDashboard` | Procurement Officer | `permission='procurement.request.view'` | `procurement.*` | `procurement@hospital.com` | Real |
| **Procurement Requests** | `/procurement/purchase-requests` | `PurchaseRequestsPage` | Procurement Officer | `permission='procurement.request.view'` | `procurement.request.*` | `procurement@hospital.com` | Real |
| **Procurement Orders** | `/procurement/purchase-orders` | `PurchaseOrdersPage` | Procurement Officer | `permission='procurement.po.view'` | `procurement.po.*` | `procurement@hospital.com` | Real |
| **HR** | `/hr` | `HRDashboard` | HR Staff / Manager | `permission='hr.employee.view'` | `hr.employee.view`, `hr.payroll.view` | `hr@hospital.com` | Partial |
| **IT Support** | `/it` | `ITSupportDashboard` | IT Support | `permission='it.system.view'` | `it.system.view`, `it.support.manage`, `it.ticket.view`, `it.ticket.manage`, `audit.view` | `it.support@hospital.com` | Partial (Real Ticket Backend + APIs) |
| **Compliance** | `/compliance` | `ComplianceDashboard` | Compliance Officer | `permission='compliance.audit.review'` | `compliance.*`, `audit.view` | `compliance@hospital.com` | Partial (Real Audit/Compliance APIs) |
| **Marketplace Admin** | `/marketplace-admin` | `MarketplaceAdminDashboard` | Marketplace Admin | `allowedRoles=['Marketplace Admin']` | `marketplace.admin.*`, `fulfillment.view` | `marketplace.admin@hospital.com` | Real |
| **Field Service** | `/field-service` | `FieldServiceDashboard` | Field Technician | `allowedRoles=['Field Technician']` | `field_service.job.view`, `field_service.job.update` | `field.tech@hospital.com` | Partial (Real Job Foundations) |
| **Catalog** | `/admin/catalog` | `CatalogManagementPage` | Branch Admin / Super Admin | `permission='catalog.manage'` | `catalog.manage`, `catalog.service.view` | `branch.admin@hospital.com` | Real |

## Authorization Modes

### Backend (`PermissionsGuard`)
- **ANY**: Grants access if the user has at least one of the required permissions. Used by `@RequireAnyPermission(...)` and default `@RequirePermissions(...)`.
- **ALL**: Grants access only if the user has all required permissions. Used by `@RequireAllPermissions(...)`.

### Frontend (`PermissionRoute`)
- **permission**: Single permission check.
- **allPermissions**: Array of permissions, all must be present.
- **allowedRoles**: Array of roles, at least one must be present.

## Known WIP / Partial Modules
- **Field Service**: Core job management and status tracking is Real. Advanced mobile offline sync and complex scheduling remain Partially Mock.
- **IT Support**: Ticket backend and APIs are Real (create, list, update, status/priority management, tenant isolation, audit logging). Dashboard, User Support, and Incident pages fetch real ticket data. System Health, Sessions, Logs, Integrations, Backup pages remain Mock (no real infrastructure monitoring).
- **Compliance**: Audit Review page fetches real audit log data from the backend. Compliance Dashboard shows real PHI access events and access review data. PHI Access Monitor uses real audit events. HIPAA breach reports, data retention, and change management are Real. Full GRC automation, external SIEM, and legal/regulatory advice remain WIP/Mock.
- **Advanced Fulfillment**: Logistics tracking and job management is Real. 3rd-party courier API integration remains WIP/Mock.

## Clinical Portal Status (Phase 2F Hardening)

### Patient Portal
- **Real API-backed**: Profile (GET /patient-portal/profile), Lab results (GET /patient-portal/lab-results), Prescriptions (GET /patient-portal/prescriptions), Invoices (GET /patient-portal/invoices)
- **Partial/Mock**: Appointments, Medical Records, Messages (no backend persistence for these patient-facing flows yet)
- **Permissions**: `patient.portal.view_own` (frontend only; backend uses PatientJwtGuard)

### Doctor Portal
- **Real API-backed**: Dashboard metrics (useClinicalDashboardSummary), Work queue (useClinicalWorkQueue), SOAP Editor (useClinicalWorkflow), Patient directory/list with search (GET /api/v1/patients?search=), Prescription list (GET /api/v1/prescriptions?patientId=), Prescription creation (POST /api/v1/prescriptions with audit)
- **Permissions added**: doctor.patient.view, doctor.prescription.view, doctor.prescription.create — assigned to Doctor role
- **WIP (Visible Banner)**: Full EMR chart view, clinical decision support, drug interaction checks, e-prescribing to external pharmacies, insurance authorization
- **Status**: Partial (real patient list, prescriptions, and SOAP; advanced EMR/CDS/eprescribing remain WIP)
- **All mock pages have visible WIP banners, disabled unsafe actions, and clear explanations of missing backend support.

### Nurse Portal
- **Real API-backed**: Dashboard metrics (useClinicalDashboardSummary), Work queue (useClinicalWorkQueue), Triage queue (triages patients), Vitals capture (POST vitals), Nursing Task Board (GET/POST/PATCH /api/v1/nursing/tasks with full lifecycle: create, start, complete, cancel, reopen)
- **Partial (Phase 4C)**: Nurse Dashboard shows real task counts from API but critical vitals alerts and staff scheduling remain WIP. Task Board is fully API-backed with tenant/branch isolation, RBAC, and audit logging.
- **Out of scope / WIP**: Care plans, medication administration record (MAR), staff scheduling, full nursing workflow engine, clinical decision support.
- **All mock pages have visible WIP banners, disabled unsafe actions, and clear explanations of missing backend support.

### Lab Portal
- **Real API-backed**: Dashboard metrics from work queue, Result encoding (useClinicalWorkflow), Result validation (useClinicalWorkflow), Validated results list, Released results list
- **Partial/WIP**: LabOrdersPage (displays real queue data but patient demographics are redacted — `[REDACTED]` shown instead of hardcoded values)
- **Real (Phase 4D)**: Specimen Receiving (GET/PATCH /api/v1/lab/specimens/pending and /receive with real API, RBAC, audit logging), Result Release (uses existing POST /api/v1/lab/results/:id/release with releasable results list at GET /api/v1/lab/results/releasable)
- **Real (Phase 4E)**: Critical Results (GET /api/v1/lab/critical-results, PATCH acknowledge/escalate/resolve, PATCH /api/v1/lab/results/:id/mark-critical — all with RBAC, audit logging, notification outbox)
- **Real (Phase 4F)**: Turnaround Time Monitor (GET /api/v1/lab/turnaround — real TAT metrics from lifecycle timestamps: specimen-to-release, order-to-release, receipt-to-encode, encode-to-validate, validate-to-release. Missing timestamps reported honestly.)
- **Real (Phase 4G)**: Lab Dashboard — all 7 KPI cards wired to real APIs (pending specimens, critical results, turnaround metrics). No mock data widgets remain. Quick actions unchanged.
- **All mock pages have visible WIP banners, disabled unsafe actions where applicable, and clear explanations of missing backend support.

### Pharmacy Portal
- **Real API-backed**: Prescription queue (GET /api/v1/pharmacy/prescriptions), Drug catalog (GET /api/v1/pharmacy/drugs), Dispense (POST /api/v1/pharmacy/prescriptions/:id/dispense), Stock adjustment (PATCH /api/v1/inventory/stock/:id/adjust), Stock movement log (GET /api/v1/inventory/items/:id/logs), Low-stock alerts (GET /api/v1/inventory/alerts/low-stock)
- **Permissions added**: pharmacy.stockmovement.view assigned to Pharmacist role
- **Status**: Real (Sprint 2A + 2B implementation)

### Cashier / Billing Portal
- **Real API-backed**: Invoice list (GET /api/v1/billing/invoices), Active session (GET /api/v1/billing/sessions/active), Session opening/closing (POST /api/v1/billing/sessions/open, PATCH /api/v1/billing/sessions/:id/close), Payment recording (POST /api/v1/billing/payments)
- **Partial/Mock**: Refund/Void queue, HMO Claims page, Daily Reconciliation (UI shells only)
- **Permissions**: `billing.invoice.view`, `billing.payment.create`, `billing.refund.*`, `billing.payment.void.*`

## Security Considerations
- **Tenant Isolation**: Strictly enforced at the database level using `tenantId` and at the API level via `PermissionsGuard`.
- **Branch Isolation**: Enforced for branch-scoped modules (Inventory, Procurement) via `BranchGuard` and explicit filtering in services.
- **Privilege Escalation**: Prevented by server-side verification of all roles and permissions; frontend guards are for UX only.
