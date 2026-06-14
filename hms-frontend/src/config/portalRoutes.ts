import { PERMISSIONS } from './permissions';

export interface RouteGuardConfig {
  path: string;
  requiredPermission?: string;
  allowedRoles?: string[];
  isBranchScoped?: boolean;
  zone?: 'staff' | 'patient' | 'marketplace' | 'public';
}

export const portalRoutes: RouteGuardConfig[] = [
  // Clinical routes (Staff, Branch Scoped)
  { path: 'patients', requiredPermission: PERMISSIONS.PATIENT_VIEW, zone: 'staff', isBranchScoped: true },
  { path: 'patients/new', requiredPermission: PERMISSIONS.PATIENT_VIEW, zone: 'staff', isBranchScoped: true },
  { path: 'patients/:id', requiredPermission: PERMISSIONS.PATIENT_VIEW, zone: 'staff', isBranchScoped: true },
  { path: 'queue', requiredPermission: PERMISSIONS.QUEUE_VIEW, zone: 'staff', isBranchScoped: true },
  { path: 'emr', requiredPermission: PERMISSIONS.PATIENT_VIEW, zone: 'staff', isBranchScoped: true },
  
  // Telehealth (Accessible by Staff and Patients, Branch Scoped)
  { path: 'telehealth', requiredPermission: PERMISSIONS.PATIENT_VIEW, allowedRoles: ['Super Admin', 'Branch Admin', 'Doctor', 'Nurse', 'Patient'], isBranchScoped: true },
  
  // Lab & Radiology (Staff, Branch Scoped)
  { path: 'lab/results', requiredPermission: PERMISSIONS.LAB_RESULT_VIEW, zone: 'staff', isBranchScoped: true },
  { path: 'lab/results/:id/encode', requiredPermission: PERMISSIONS.LAB_RESULT_VIEW, zone: 'staff', isBranchScoped: true },
  { path: 'lab/results/:id/approval', requiredPermission: PERMISSIONS.LAB_RESULT_VIEW, zone: 'staff', isBranchScoped: true },
  { path: 'lab/results/:id/print-preview', requiredPermission: PERMISSIONS.LAB_RESULT_VIEW, zone: 'staff', isBranchScoped: true },
  { path: 'radiology', requiredPermission: PERMISSIONS.LAB_RESULT_VIEW, zone: 'staff', isBranchScoped: true },

  // Finance/Supply routes (Staff, Branch Scoped)
  { path: 'pharmacy', requiredPermission: PERMISSIONS.INVENTORY_DISPENSE, allowedRoles: ['Super Admin', 'Branch Admin', 'Pharmacist'], zone: 'staff', isBranchScoped: true },
  { path: 'pharmacy/dashboard', requiredPermission: PERMISSIONS.INVENTORY_VIEW, allowedRoles: ['Super Admin', 'Branch Admin', 'Pharmacist'], zone: 'staff', isBranchScoped: true },
  { path: 'pharmacy/dispense', requiredPermission: PERMISSIONS.INVENTORY_DISPENSE, allowedRoles: ['Super Admin', 'Branch Admin', 'Pharmacist'], zone: 'staff', isBranchScoped: true },
  { path: 'pharmacy/inventory', requiredPermission: PERMISSIONS.INVENTORY_VIEW, allowedRoles: ['Super Admin', 'Branch Admin', 'Pharmacist'], zone: 'staff', isBranchScoped: true },
  { path: 'billing', requiredPermission: PERMISSIONS.BILLING_VIEW, zone: 'staff', isBranchScoped: true },
  { path: 'billing/cashier-closing', requiredPermission: PERMISSIONS.BILLING_VIEW, zone: 'staff', isBranchScoped: true },
  { path: 'claims', requiredPermission: PERMISSIONS.BILLING_VIEW, zone: 'staff', isBranchScoped: true },
  { path: 'inventory', requiredPermission: PERMISSIONS.INVENTORY_VIEW, zone: 'staff', isBranchScoped: true },
  { path: 'inventory/:id', requiredPermission: PERMISSIONS.INVENTORY_VIEW, zone: 'staff', isBranchScoped: true },
  { path: 'inventory/receiving', requiredPermission: PERMISSIONS.INVENTORY_VIEW, zone: 'staff', isBranchScoped: true },
  
  // Orders & Approvals (Staff, Branch Scoped)
  { path: 'orders/new', requiredPermission: PERMISSIONS.ORDER_CREATE, zone: 'staff', isBranchScoped: true },
  { path: 'approvals', requiredPermission: PERMISSIONS.APPROVAL_VIEW, zone: 'staff', isBranchScoped: true },

  // Admin & Security (Staff, Tenant Scoped - no active branch context strictly required for editing roles/users/audit)
  { path: 'admin/users', requiredPermission: PERMISSIONS.ADMIN_ROLE_CHANGE, zone: 'staff' },
  { path: 'admin/users/:id', requiredPermission: PERMISSIONS.ADMIN_ROLE_CHANGE, zone: 'staff' },
  { path: 'admin/roles', requiredPermission: PERMISSIONS.ADMIN_ROLE_CHANGE, zone: 'staff' },
  { path: 'admin/roles/:id', requiredPermission: PERMISSIONS.ADMIN_ROLE_CHANGE, zone: 'staff' },
  { path: 'admin/patient-merges', requiredPermission: PERMISSIONS.ADMIN_ROLE_CHANGE, zone: 'staff' },
  { path: 'settings', requiredPermission: PERMISSIONS.ADMIN_ROLE_CHANGE, zone: 'staff' },
  
  // Reports & Logs (Staff)
  { path: 'reports', requiredPermission: PERMISSIONS.REPORT_EXPORT, zone: 'staff', isBranchScoped: true },
  { path: 'audit-logs', requiredPermission: PERMISSIONS.AUDIT_VIEW, zone: 'staff' },
  { path: 'my-audit-log', requiredPermission: PERMISSIONS.AUDIT_SELF, zone: 'staff' },
  { path: 'audit/events/:id', requiredPermission: PERMISSIONS.AUDIT_VIEW, zone: 'staff' },
  { path: 'audit/entity/:recordType/:recordId', requiredPermission: PERMISSIONS.AUDIT_VIEW, zone: 'staff' },
  { path: 'spatial', requiredPermission: 'it.system.view', zone: 'staff' },
  { path: 'sales-dashboard', requiredPermission: PERMISSIONS.BILLING_VIEW, zone: 'staff' },
  { path: 'logistics-checklist', requiredPermission: PERMISSIONS.INVENTORY_VIEW, zone: 'staff' },
  { path: 'notifications', allowedRoles: ['Super Admin', 'Branch Admin', 'Doctor', 'Nurse', 'Lab Technician', 'Cashier', 'IT Support', 'HR Manager', 'Procurement Manager', 'Procurement Agent'], zone: 'staff' },
  { path: '', allowedRoles: ['Super Admin', 'Branch Admin', 'Doctor', 'Nurse', 'Lab Technician', 'Cashier', 'IT Support', 'HR Manager', 'Procurement Manager', 'Procurement Agent'], zone: 'staff' }, // Dashboard

  // Marketplace Zone (Accessible by all authenticated users: Patients, Suppliers, Customers, Staff)
  { path: 'marketplace', allowedRoles: ['Marketplace Buyer', 'Customer'], zone: 'marketplace' },
  { path: 'marketplace/products', allowedRoles: ['Marketplace Buyer', 'Customer'], zone: 'marketplace' },
  { path: 'marketplace/products/:productId', allowedRoles: ['Marketplace Buyer', 'Customer'], zone: 'marketplace' },
  { path: 'marketplace/compare', allowedRoles: ['Marketplace Buyer', 'Customer'], zone: 'marketplace' },
  { path: 'marketplace/cart', allowedRoles: ['Marketplace Buyer', 'Customer'], zone: 'marketplace' },
  { path: 'marketplace/checkout', allowedRoles: ['Marketplace Buyer', 'Customer'], zone: 'marketplace' },
  { path: 'marketplace/rfqs', allowedRoles: ['Marketplace Buyer', 'Customer'], zone: 'marketplace' },
  { path: 'marketplace/orders', allowedRoles: ['Marketplace Buyer', 'Customer'], zone: 'marketplace' },
  { path: 'marketplace/deliveries', allowedRoles: ['Marketplace Buyer', 'Customer'], zone: 'marketplace' },
  { path: 'marketplace/installations', allowedRoles: ['Marketplace Buyer', 'Customer'], zone: 'marketplace' },
  { path: 'marketplace/warranty', allowedRoles: ['Marketplace Buyer', 'Customer'], zone: 'marketplace' },
  { path: 'marketplace/service-tickets', allowedRoles: ['Marketplace Buyer', 'Customer'], zone: 'marketplace' },

  // Marketplace Supplier Zone
  { path: 'supplier', allowedRoles: ['Supplier', 'Supplier Admin', 'Marketplace Supplier'], zone: 'marketplace' },
  { path: 'supplier/listings', allowedRoles: ['Supplier', 'Supplier Admin', 'Marketplace Supplier'], zone: 'marketplace' },
  { path: 'supplier/service-listings', allowedRoles: ['Supplier', 'Supplier Admin', 'Marketplace Supplier'], zone: 'marketplace' },
  { path: 'supplier/rfq-inbox', allowedRoles: ['Supplier', 'Supplier Admin', 'Marketplace Supplier'], zone: 'marketplace' },
  { path: 'supplier/quotes', allowedRoles: ['Supplier', 'Supplier Admin', 'Marketplace Supplier'], zone: 'marketplace' },
  { path: 'supplier/orders', allowedRoles: ['Supplier', 'Supplier Admin', 'Marketplace Supplier'], zone: 'marketplace' },
  { path: 'supplier/fulfillment', allowedRoles: ['Supplier', 'Supplier Admin', 'Marketplace Supplier'], zone: 'marketplace' },
  { path: 'supplier/warranty-claims', allowedRoles: ['Supplier', 'Supplier Admin', 'Marketplace Supplier'], zone: 'marketplace' },
  { path: 'supplier/service-commitments', allowedRoles: ['Supplier', 'Supplier Admin', 'Marketplace Supplier'], zone: 'marketplace' },
  { path: 'supplier/payouts', allowedRoles: ['Supplier', 'Supplier Admin', 'Marketplace Supplier'], zone: 'marketplace' },
  { path: 'supplier/performance', allowedRoles: ['Supplier', 'Supplier Admin', 'Marketplace Supplier'], zone: 'marketplace' },

  // Marketplace Admin Zone
  { path: 'marketplace-admin', allowedRoles: ['Super Admin', 'Marketplace Admin'], zone: 'marketplace' },
  { path: 'marketplace-admin/suppliers', allowedRoles: ['Super Admin', 'Marketplace Admin'], zone: 'marketplace' },
  { path: 'marketplace-admin/buyers', allowedRoles: ['Super Admin', 'Marketplace Admin'], zone: 'marketplace' },
  { path: 'marketplace-admin/listing-approval', allowedRoles: ['Super Admin', 'Marketplace Admin'], zone: 'marketplace' },
  { path: 'marketplace-admin/rfq-monitor', allowedRoles: ['Super Admin', 'Marketplace Admin'], zone: 'marketplace' },
  { path: 'marketplace-admin/order-monitor', allowedRoles: ['Super Admin', 'Marketplace Admin'], zone: 'marketplace' },
  { path: 'marketplace-admin/fulfillment-monitor', allowedRoles: ['Super Admin', 'Marketplace Admin'], zone: 'marketplace' },
  { path: 'marketplace-admin/installation-monitor', allowedRoles: ['Super Admin', 'Marketplace Admin'], zone: 'marketplace' },
  { path: 'marketplace-admin/warranty-claims', allowedRoles: ['Super Admin', 'Marketplace Admin'], zone: 'marketplace' },
  { path: 'marketplace-admin/disputes', allowedRoles: ['Super Admin', 'Marketplace Admin'], zone: 'marketplace' },
  { path: 'marketplace-admin/commission-fees', allowedRoles: ['Super Admin', 'Marketplace Admin'], zone: 'marketplace' },
  { path: 'marketplace-admin/reports', allowedRoles: ['Super Admin', 'Marketplace Admin'], zone: 'marketplace' },

  // Field Service / Logistics Zone
  { path: 'field-service', requiredPermission: PERMISSIONS.FIELD_SERVICE_MANAGE, zone: 'staff', isBranchScoped: true },
  { path: 'field-service/deliveries', requiredPermission: PERMISSIONS.FIELD_SERVICE_MANAGE, zone: 'staff', isBranchScoped: true },
  { path: 'field-service/installations', requiredPermission: PERMISSIONS.FIELD_SERVICE_MANAGE, zone: 'staff', isBranchScoped: true },
  { path: 'field-service/schedule', requiredPermission: PERMISSIONS.FIELD_SERVICE_MANAGE, zone: 'staff', isBranchScoped: true },
  { path: 'field-service/handover', requiredPermission: PERMISSIONS.FIELD_SERVICE_MANAGE, zone: 'staff', isBranchScoped: true },
  { path: 'field-service/proof-of-delivery', requiredPermission: PERMISSIONS.FIELD_SERVICE_MANAGE, zone: 'staff', isBranchScoped: true },
  { path: 'field-service/warranty-activation', requiredPermission: PERMISSIONS.FIELD_SERVICE_MANAGE, zone: 'staff', isBranchScoped: true },
  { path: 'field-service/preventive-maintenance', requiredPermission: PERMISSIONS.FIELD_SERVICE_MANAGE, zone: 'staff', isBranchScoped: true },
  { path: 'field-service/service-worklog', requiredPermission: PERMISSIONS.FIELD_SERVICE_MANAGE, zone: 'staff', isBranchScoped: true },
  { path: 'field-service/offline-sync', requiredPermission: PERMISSIONS.FIELD_SERVICE_MANAGE, zone: 'staff', isBranchScoped: true },

  // Clinical Ops Dashboard (Staff Zone, Observational, Branch Scoped)
  { path: 'clinical/ops', allowedRoles: ['Super Admin', 'Branch Admin', 'Doctor', 'Nurse'], zone: 'staff', isBranchScoped: true },

  // Doctor Portal Workspace Routes (Staff Zone, Clinical Scope, Branch Scoped, Doctor/Admin allowedRoles)
  { path: 'doctor', allowedRoles: ['Super Admin', 'Branch Admin', 'Doctor'], zone: 'staff', isBranchScoped: true },
  { path: 'doctor/queue', allowedRoles: ['Super Admin', 'Branch Admin', 'Doctor'], zone: 'staff', isBranchScoped: true },
  { path: 'doctor/patients', allowedRoles: ['Super Admin', 'Branch Admin', 'Doctor'], zone: 'staff', isBranchScoped: true },
  { path: 'doctor/emr/:patientId?', allowedRoles: ['Super Admin', 'Branch Admin', 'Doctor'], zone: 'staff', isBranchScoped: true },
  { path: 'doctor/encounters/:encounterId?', allowedRoles: ['Super Admin', 'Branch Admin', 'Doctor'], zone: 'staff', isBranchScoped: true },
  { path: 'doctor/results', allowedRoles: ['Super Admin', 'Branch Admin', 'Doctor'], zone: 'staff', isBranchScoped: true },
  { path: 'doctor/prescriptions', allowedRoles: ['Super Admin', 'Branch Admin', 'Doctor'], zone: 'staff', isBranchScoped: true },
  { path: 'doctor/orders', allowedRoles: ['Super Admin', 'Branch Admin', 'Doctor'], zone: 'staff', isBranchScoped: true },
  { path: 'doctor/timeline/:patientId?', allowedRoles: ['Super Admin', 'Branch Admin', 'Doctor'], zone: 'staff', isBranchScoped: true },

  // Nurse Portal Workspace Routes (Staff Zone, Clinical Scope, Branch Scoped, Nurse/Admin allowedRoles)
  { path: 'nurse', allowedRoles: ['Super Admin', 'Branch Admin', 'Nurse'], zone: 'staff', isBranchScoped: true },
  { path: 'nurse/triage', allowedRoles: ['Super Admin', 'Branch Admin', 'Nurse'], zone: 'staff', isBranchScoped: true },
  { path: 'nurse/intake', allowedRoles: ['Super Admin', 'Branch Admin', 'Nurse'], zone: 'staff', isBranchScoped: true },
  { path: 'nurse/vitals', allowedRoles: ['Super Admin', 'Branch Admin', 'Nurse'], zone: 'staff', isBranchScoped: true },
  { path: 'nurse/tasks', allowedRoles: ['Super Admin', 'Branch Admin', 'Nurse'], zone: 'staff', isBranchScoped: true },
  { path: 'nurse/specimens', allowedRoles: ['Super Admin', 'Branch Admin', 'Nurse'], zone: 'staff', isBranchScoped: true },

  // Lab Portal Workspace Routes (Staff Zone, Clinical Scope, Branch Scoped, Lab Tech/Admin allowedRoles)
  { path: 'lab', allowedRoles: ['Super Admin', 'Branch Admin', 'Lab Technician', 'Med-Tech'], zone: 'staff', isBranchScoped: true },
  { path: 'lab/orders', allowedRoles: ['Super Admin', 'Branch Admin', 'Lab Technician', 'Med-Tech'], zone: 'staff', isBranchScoped: true },
  { path: 'lab/specimens', allowedRoles: ['Super Admin', 'Branch Admin', 'Lab Technician', 'Med-Tech'], zone: 'staff', isBranchScoped: true },
  { path: 'lab/encoding', allowedRoles: ['Super Admin', 'Branch Admin', 'Lab Technician', 'Med-Tech'], zone: 'staff', isBranchScoped: true },
  { path: 'lab/validation', allowedRoles: ['Super Admin', 'Branch Admin', 'Lab Technician', 'Med-Tech'], zone: 'staff', isBranchScoped: true },
  { path: 'lab/validated', allowedRoles: ['Super Admin', 'Branch Admin', 'Lab Technician', 'Med-Tech'], zone: 'staff', isBranchScoped: true },
  { path: 'lab/released', allowedRoles: ['Super Admin', 'Branch Admin', 'Lab Technician', 'Med-Tech'], zone: 'staff', isBranchScoped: true },
  { path: 'lab/released/:patientId/:orderId', allowedRoles: ['Super Admin', 'Branch Admin', 'Lab Technician', 'Med-Tech'], zone: 'staff', isBranchScoped: true },
  { path: 'lab/release', allowedRoles: ['Super Admin', 'Branch Admin', 'Lab Technician', 'Med-Tech'], zone: 'staff', isBranchScoped: true },
  { path: 'lab/critical-results', allowedRoles: ['Super Admin', 'Branch Admin', 'Lab Technician', 'Med-Tech'], zone: 'staff', isBranchScoped: true },
  { path: 'lab/turnaround', allowedRoles: ['Super Admin', 'Branch Admin', 'Lab Technician', 'Med-Tech'], zone: 'staff', isBranchScoped: true },

  // Cashier Portal Workspace Routes (Staff Zone, Financial Scope, Branch Scoped, Cashier/Admin/Finance allowedRoles)
  { path: 'cashier', allowedRoles: ['Super Admin', 'Branch Admin', 'Cashier', 'Finance'], zone: 'staff', isBranchScoped: true },
  { path: 'cashier/billing', allowedRoles: ['Super Admin', 'Branch Admin', 'Cashier', 'Finance'], zone: 'staff', isBranchScoped: true },
  { path: 'cashier/invoices', allowedRoles: ['Super Admin', 'Branch Admin', 'Cashier', 'Finance'], zone: 'staff', isBranchScoped: true },
  { path: 'cashier/payments', allowedRoles: ['Super Admin', 'Branch Admin', 'Cashier', 'Finance'], zone: 'staff', isBranchScoped: true },
  { path: 'cashier/session', allowedRoles: ['Super Admin', 'Branch Admin', 'Cashier', 'Finance'], zone: 'staff', isBranchScoped: true },
  { path: 'cashier/refunds-voids', allowedRoles: ['Super Admin', 'Branch Admin', 'Cashier', 'Finance'], zone: 'staff', isBranchScoped: true },
  { path: 'cashier/hmo-claims', allowedRoles: ['Super Admin', 'Branch Admin', 'Cashier', 'Finance'], zone: 'staff', isBranchScoped: true },
  { path: 'cashier/reconciliation', allowedRoles: ['Super Admin', 'Branch Admin', 'Cashier', 'Finance'], zone: 'staff', isBranchScoped: true },

  // SuperAdmin Portal Workspace Routes (Staff Zone, Governance Scope, Tenant Scoped)
  { path: 'admin', allowedRoles: ['Super Admin'], zone: 'staff' },
  { path: 'admin/executive', allowedRoles: ['Super Admin'], zone: 'staff' },
  { path: 'admin/tenants', allowedRoles: ['Super Admin'], zone: 'staff' },
  { path: 'admin/branches', allowedRoles: ['Super Admin'], zone: 'staff' },
  { path: 'admin/users', allowedRoles: ['Super Admin'], zone: 'staff' },
  { path: 'admin/roles-permissions', allowedRoles: ['Super Admin'], zone: 'staff' },
  { path: 'admin/security', allowedRoles: ['Super Admin'], zone: 'staff' },
  { path: 'admin/audit-logs', allowedRoles: ['Super Admin'], zone: 'staff' },
  { path: 'admin/settings', allowedRoles: ['Super Admin'], zone: 'staff' },
  { path: 'admin/reports', allowedRoles: ['Super Admin'], zone: 'staff' },
  { path: 'admin/catalog', allowedRoles: ['Super Admin'], zone: 'staff' },

  // Branch Admin Workspace Routes (Staff Zone, Governance Scope, Branch Scoped)
  { path: 'branch-admin', allowedRoles: ['Super Admin', 'Branch Admin'], zone: 'staff', isBranchScoped: true },
  { path: 'branch-admin/staff', allowedRoles: ['Super Admin', 'Branch Admin'], zone: 'staff', isBranchScoped: true },
  { path: 'branch-admin/departments', allowedRoles: ['Super Admin', 'Branch Admin'], zone: 'staff', isBranchScoped: true },
  { path: 'branch-admin/rooms', allowedRoles: ['Super Admin', 'Branch Admin'], zone: 'staff', isBranchScoped: true },
  { path: 'branch-admin/schedules', allowedRoles: ['Super Admin', 'Branch Admin'], zone: 'staff', isBranchScoped: true },
  { path: 'branch-admin/services', allowedRoles: ['Super Admin', 'Branch Admin'], zone: 'staff', isBranchScoped: true },
  { path: 'branch-admin/equipment', allowedRoles: ['Super Admin', 'Branch Admin'], zone: 'staff', isBranchScoped: true },
  { path: 'branch-admin/inventory-rules', allowedRoles: ['Super Admin', 'Branch Admin'], zone: 'staff', isBranchScoped: true },
  { path: 'branch-admin/billing-rules', allowedRoles: ['Super Admin', 'Branch Admin'], zone: 'staff', isBranchScoped: true },
  { path: 'branch-admin/queue-settings', allowedRoles: ['Super Admin', 'Branch Admin'], zone: 'staff', isBranchScoped: true },
  { path: 'branch-admin/approvals', allowedRoles: ['Super Admin', 'Branch Admin'], zone: 'staff', isBranchScoped: true },

  // Compliance Officer Portal Workspace Routes (Staff Zone, Compliance Scope, Tenant Scoped)
  { path: 'compliance', allowedRoles: ['Super Admin', 'Compliance Officer'], zone: 'staff' },
  { path: 'compliance/phi-access', allowedRoles: ['Super Admin', 'Compliance Officer'], zone: 'staff' },
  { path: 'compliance/audit-review', allowedRoles: ['Super Admin', 'Compliance Officer'], zone: 'staff' },
  { path: 'compliance/access-reviews', allowedRoles: ['Super Admin', 'Compliance Officer'], zone: 'staff' },
  { path: 'compliance/export-logs', allowedRoles: ['Super Admin', 'Compliance Officer'], zone: 'staff' },
  { path: 'compliance/breach-alerts', allowedRoles: ['Super Admin', 'Compliance Officer'], zone: 'staff' },
  { path: 'compliance/retention', allowedRoles: ['Super Admin', 'Compliance Officer'], zone: 'staff' },
  { path: 'compliance/reports', allowedRoles: ['Super Admin', 'Compliance Officer'], zone: 'staff' },
  { path: 'compliance/audit-chain', allowedRoles: ['Super Admin', 'Compliance Officer'], zone: 'staff' },

  // IT / Support Portal Workspace Routes (Staff Zone, Operations Scope, Tenant Scoped)
  { path: 'it', allowedRoles: ['Super Admin', 'IT Support'], zone: 'staff' },
  { path: 'it/system-health', allowedRoles: ['Super Admin', 'IT Support'], zone: 'staff' },
  { path: 'it/user-support', allowedRoles: ['Super Admin', 'IT Support'], zone: 'staff' },
  { path: 'it/sessions', allowedRoles: ['Super Admin', 'IT Support'], zone: 'staff' },
  { path: 'it/background-jobs', allowedRoles: ['Super Admin', 'IT Support'], zone: 'staff' },
  { path: 'it/integrations', allowedRoles: ['Super Admin', 'IT Support'], zone: 'staff' },
  { path: 'it/logs', allowedRoles: ['Super Admin', 'IT Support'], zone: 'staff' },
  { path: 'it/backup-restore', allowedRoles: ['Super Admin', 'IT Support'], zone: 'staff' },
  { path: 'it/incidents', allowedRoles: ['Super Admin', 'IT Support'], zone: 'staff' },

  // HR Portal Workspace Routes (Staff Zone, HR Scope, Tenant Scoped)
  { path: 'hr', allowedRoles: ['Super Admin', 'Branch Admin', 'HR Manager', 'HR Staff'], zone: 'staff' },
  { path: 'hr/employees', allowedRoles: ['Super Admin', 'Branch Admin', 'HR Manager'], zone: 'staff' },
  { path: 'hr/departments', allowedRoles: ['Super Admin', 'Branch Admin', 'HR Manager', 'HR Staff'], zone: 'staff' },
  { path: 'hr/attendance', allowedRoles: ['Super Admin', 'Branch Admin', 'HR Manager', 'HR Staff'], zone: 'staff' },
  { path: 'hr/leave', allowedRoles: ['Super Admin', 'Branch Admin', 'HR Manager', 'HR Staff'], zone: 'staff' },
  { path: 'hr/payroll', allowedRoles: ['Super Admin', 'Branch Admin', 'HR Manager', 'HR Staff'], zone: 'staff' },
  { path: 'hr/licenses', allowedRoles: ['Super Admin', 'Branch Admin', 'HR Manager', 'HR Staff'], zone: 'staff' },
  { path: 'hr/branch-assignments', allowedRoles: ['Super Admin', 'Branch Admin', 'HR Manager'], zone: 'staff' },
  { path: 'hr/termination', allowedRoles: ['Super Admin', 'Branch Admin', 'HR Manager'], zone: 'staff' },

  // Procurement Portal Workspace Routes (Staff Zone, Procurement Scope, Tenant Scoped)
  { path: 'procurement', allowedRoles: ['Super Admin', 'Branch Admin', 'Procurement Manager', 'Procurement Agent', 'Procurement Officer'], zone: 'staff' },
  { path: 'procurement/suppliers', allowedRoles: ['Super Admin', 'Branch Admin', 'Procurement Manager', 'Procurement Agent', 'Procurement Officer'], zone: 'staff' },
  { path: 'procurement/purchase-requests', allowedRoles: ['Super Admin', 'Branch Admin', 'Procurement Manager', 'Procurement Agent', 'Procurement Officer'], zone: 'staff' },
  { path: 'procurement/rfqs', allowedRoles: ['Super Admin', 'Branch Admin', 'Procurement Manager', 'Procurement Agent', 'Procurement Officer'], zone: 'staff' },
  { path: 'procurement/quotes', allowedRoles: ['Super Admin', 'Branch Admin', 'Procurement Manager', 'Procurement Agent', 'Procurement Officer'], zone: 'staff' },
  { path: 'procurement/purchase-orders', allowedRoles: ['Super Admin', 'Branch Admin', 'Procurement Manager', 'Procurement Agent', 'Procurement Officer'], zone: 'staff' },
  { path: 'procurement/receiving', allowedRoles: ['Super Admin', 'Branch Admin', 'Procurement Manager', 'Procurement Agent', 'Procurement Officer'], zone: 'staff' },
  { path: 'procurement/inventory-requests', allowedRoles: ['Super Admin', 'Branch Admin', 'Procurement Manager', 'Procurement Agent', 'Procurement Officer'], zone: 'staff' },
  { path: 'procurement/vendor-performance', allowedRoles: ['Super Admin', 'Branch Admin', 'Procurement Manager', 'Procurement Agent', 'Procurement Officer'], zone: 'staff' },

  // Patient Portal Workspace Routes (Patient Zone, Self-Service Scope)
  { path: 'patient', allowedRoles: ['Patient'], zone: 'patient' },
  { path: 'patient/appointments', allowedRoles: ['Patient'], zone: 'patient' },
  { path: 'patient/lab-results', allowedRoles: ['Patient'], zone: 'patient' },
  { path: 'patient/prescriptions', allowedRoles: ['Patient'], zone: 'patient' },
  { path: 'patient/billing', allowedRoles: ['Patient'], zone: 'patient' },
  { path: 'patient/medical-records', allowedRoles: ['Patient'], zone: 'patient' },
  { path: 'patient/messages', allowedRoles: ['Patient'], zone: 'patient' },
  { path: 'patient/profile', allowedRoles: ['Patient'], zone: 'patient' },

  // Integration Bridges Workspace Routes (Staff Zone, Cross-Domain Scope, Tenant Scoped)
  { path: 'integration', allowedRoles: ['Super Admin', 'IT Support', 'Marketplace Admin', 'Branch Admin'], zone: 'staff' },
  { path: 'integration/notifications', allowedRoles: ['Super Admin', 'IT Support', 'Marketplace Admin', 'Branch Admin'], zone: 'staff' },
  { path: 'integration/approvals', allowedRoles: ['Super Admin', 'IT Support', 'Marketplace Admin', 'Branch Admin'], zone: 'staff' },
  { path: 'integration/global-search', allowedRoles: ['Super Admin', 'IT Support', 'Marketplace Admin', 'Branch Admin'], zone: 'staff' },
  { path: 'integration/patient-timeline', allowedRoles: ['Super Admin', 'IT Support', 'Marketplace Admin', 'Branch Admin'], zone: 'staff' },
  { path: 'integration/asset-timeline', allowedRoles: ['Super Admin', 'IT Support', 'Marketplace Admin', 'Branch Admin'], zone: 'staff' },
  { path: 'integration/reconciliation', allowedRoles: ['Super Admin', 'IT Support', 'Marketplace Admin', 'Branch Admin'], zone: 'staff' },
  { path: 'integration/activity-audit', allowedRoles: ['Super Admin', 'IT Support', 'Marketplace Admin', 'Branch Admin'], zone: 'staff' },
];
