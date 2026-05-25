# Gemini HMS Portal-Route-Permission Audit

This document provides a comprehensive mapping of frontend portals, their routes, authorization guards, and corresponding backend permissions.

## Portal Audit Table

| Portal | Route | Component | Intended Role(s) | Frontend Guard | Backend Permissions | Seeded Demo User | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Super Admin** | `/admin` | `SuperAdminDashboard` | Super Admin | `allowedRoles=['Super Admin']` | `*` (All Permissions) | `admin@hospital.com` | Real |
| **Branch Admin** | `/` | `Dashboard` | Branch Admin | N/A (Default) | Various (e.g., `patient.view`) | `branch.admin@hospital.com` | Real |
| **Receptionist** | `/queue` | `Queue` | Receptionist | `permission='queue.view'` | `queue.view`, `queue.manage` | `receptionist@hospital.com` | Real |
| **Doctor** | `/doctor` | `DoctorDashboard` | Doctor | `allowedRoles=['Doctor']` | `encounter.create`, `patient.view` | `doctor@hospital.com` | Partial |
| **Nurse** | `/nurse` | `NurseDashboard` | Nurse | `allowedRoles=['Nurse']` | `encounter.update`, `patient.update` | `nurse@hospital.com` | Partial |
| **Patient** | `/patient` | `PatientDashboard` | Patient | `permission='patient.portal.view_own'` | `patient.portal.view_own` | `patient@hospital.com` | Partial |
| **Cashier** | `/cashier` | `CashierDashboard` | Cashier | `allowedRoles=['Cashier']` | `billing.payment.create` | `cashier@hospital.com` | Partial |
| **Med-Tech** | `/lab` | `LabDashboard` | Med-Tech | `permission='lab.result.view'` | `lab.result.encode`, `lab.result.view` | `medtech@hospital.com` | Partial |
| **Pharmacist** | `/pharmacy` | `PharmacyHub` | Pharmacist | `permission='inventory.stock.dispense'` | `inventory.stock.dispense` | `pharmacist@hospital.com` | Partial |
| **Supplier** | `/supplier` | `SupplierDashboard` | Supplier | `allowedRoles=['Supplier']` | `marketplace.supplier.manage_listing` | `supplier@hospital.com` | Real |
| **Procurement** | `/procurement` | `ProcurementDashboard` | Procurement Officer | `permission='procurement.request.view'` | `procurement.*` | `procurement@hospital.com` | Real |
| **Procurement Requests** | `/procurement/purchase-requests` | `PurchaseRequestsPage` | Procurement Officer | `permission='procurement.request.view'` | `procurement.request.*` | `procurement@hospital.com` | Real |
| **Procurement Orders** | `/procurement/purchase-orders` | `PurchaseOrdersPage` | Procurement Officer | `permission='procurement.po.view'` | `procurement.po.*` | `procurement@hospital.com` | Real |
| **HR** | `/hr` | `HRDashboard` | HR Staff / Manager | `permission='hr.employee.view'` | `hr.employee.view`, `hr.payroll.view` | `hr@hospital.com` | Partial |
| **IT Support** | `/it` | `ITSupportDashboard` | IT Support | `permission='it.system.view'` | `it.system.view`, `it.support.manage` | `it.support@hospital.com` | Mock |
| **Compliance** | `/compliance` | `ComplianceDashboard` | Compliance Officer | `permission='compliance.audit.review'` | `compliance.*`, `audit.view` | `compliance@hospital.com` | Mock |
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

## Known WIP / Mock Modules
- **Field Service**: Core job management and status tracking is Real. Advanced mobile offline sync and complex scheduling remain Partially Mock.
- **IT / Compliance**: UI Shell exists, logic is mock.
- **Advanced Fulfillment**: Logistics tracking and job management is Real. 3rd-party courier API integration remains WIP/Mock.

## Security Considerations
- **Tenant Isolation**: Strictly enforced at the database level using `tenantId` and at the API level via `PermissionsGuard`.
- **Branch Isolation**: Enforced for branch-scoped modules (Inventory, Procurement) via `BranchGuard` and explicit filtering in services.
- **Privilege Escalation**: Prevented by server-side verification of all roles and permissions; frontend guards are for UX only.
