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
  { path: 'patients/new', requiredPermission: PERMISSIONS.PATIENT_CREATE, zone: 'staff', isBranchScoped: true },
  { path: 'patients/:id', requiredPermission: PERMISSIONS.PATIENT_VIEW, zone: 'staff', isBranchScoped: true },
  { path: 'queue', requiredPermission: PERMISSIONS.QUEUE_VIEW, zone: 'staff', isBranchScoped: true },
  { path: 'emr', requiredPermission: PERMISSIONS.ENCOUNTER_UPDATE, zone: 'staff', isBranchScoped: true },
  
  // Telehealth (Staff, Branch Scoped)
  { path: 'telehealth', requiredPermission: 'encounter.create', zone: 'staff', isBranchScoped: true },
  
  // Lab & Radiology (Staff, Branch Scoped)
  { path: 'lab/results', requiredPermission: PERMISSIONS.LAB_RESULT_VIEW, zone: 'staff', isBranchScoped: true },
  { path: 'lab/results/:id/encode', requiredPermission: 'lab.result.encode', zone: 'staff', isBranchScoped: true },
  { path: 'lab/results/:id/approval', requiredPermission: 'lab.result.approve', zone: 'staff', isBranchScoped: true },
  { path: 'lab/results/:id/print-preview', requiredPermission: PERMISSIONS.LAB_RESULT_VIEW, zone: 'staff', isBranchScoped: true },
  { path: 'radiology', requiredPermission: PERMISSIONS.LAB_RESULT_VIEW, zone: 'staff', isBranchScoped: true },

  // Finance/Supply routes (Staff, Branch Scoped)
  { path: 'pharmacy', requiredPermission: PERMISSIONS.INVENTORY_DISPENSE, zone: 'staff', isBranchScoped: true },
  { path: 'pharmacy/dashboard', requiredPermission: PERMISSIONS.INVENTORY_VIEW, zone: 'staff', isBranchScoped: true },
  { path: 'pharmacy/dispense', requiredPermission: PERMISSIONS.INVENTORY_DISPENSE, zone: 'staff', isBranchScoped: true },
  { path: 'pharmacy/inventory', requiredPermission: PERMISSIONS.INVENTORY_VIEW, zone: 'staff', isBranchScoped: true },
  { path: 'billing', requiredPermission: PERMISSIONS.BILLING_VIEW, zone: 'staff', isBranchScoped: true },
  { path: 'billing/dashboard', requiredPermission: PERMISSIONS.BILLING_VIEW, zone: 'staff', isBranchScoped: true },
  { path: 'billing/cashier-closing', requiredPermission: PERMISSIONS.BILLING_VIEW, zone: 'staff', isBranchScoped: true },
  { path: 'claims', requiredPermission: 'billing.claim.view', zone: 'staff', isBranchScoped: true },
  { path: 'inventory', requiredPermission: PERMISSIONS.INVENTORY_VIEW, zone: 'staff', isBranchScoped: true },
  { path: 'inventory/:id', requiredPermission: PERMISSIONS.INVENTORY_VIEW, zone: 'staff', isBranchScoped: true },
  { path: 'inventory/receiving', requiredPermission: PERMISSIONS.INVENTORY_RECEIVE, zone: 'staff', isBranchScoped: true },
  
  // Orders & Approvals (Staff, Branch Scoped)
  { path: 'orders/new', requiredPermission: PERMISSIONS.ORDER_CREATE, zone: 'staff', isBranchScoped: true },
  { path: 'approvals', requiredPermission: PERMISSIONS.APPROVAL_VIEW, zone: 'staff', isBranchScoped: true },

  // Admin & Security (Staff, Tenant Scoped - no active branch context strictly required for editing roles/users/audit)
  { path: 'admin/users/:id', requiredPermission: PERMISSIONS.ADMIN_ROLE_CHANGE, allowedRoles: ['Super Admin'], zone: 'staff' },
  { path: 'admin/roles', requiredPermission: PERMISSIONS.ADMIN_ROLE_CHANGE, allowedRoles: ['Super Admin'], zone: 'staff' },
  { path: 'admin/roles/:id', requiredPermission: PERMISSIONS.ADMIN_ROLE_CHANGE, allowedRoles: ['Super Admin'], zone: 'staff' },
  { path: 'admin/patient-merges', requiredPermission: PERMISSIONS.PATIENT_MERGE_APPROVE, allowedRoles: ['Super Admin'], zone: 'staff' },
  { path: 'settings', requiredPermission: PERMISSIONS.ADMIN_ROLE_CHANGE, zone: 'staff' },
  
  // Reports & Logs (Staff)
  { path: 'reports', requiredPermission: PERMISSIONS.REPORT_EXPORT, zone: 'staff', isBranchScoped: true },
  { path: 'audit-logs', requiredPermission: PERMISSIONS.AUDIT_VIEW, zone: 'staff' },
  { path: 'my-audit-log', requiredPermission: PERMISSIONS.AUDIT_SELF, zone: 'staff' },
  { path: 'audit/events/:id', requiredPermission: PERMISSIONS.AUDIT_VIEW, zone: 'staff' },
  { path: 'audit/my-events/:id', requiredPermission: PERMISSIONS.AUDIT_SELF, zone: 'staff' },
  { path: 'audit/entity/:recordType/:recordId', requiredPermission: PERMISSIONS.AUDIT_VIEW, zone: 'staff' },
  { path: 'spatial', requiredPermission: 'it.system.view', zone: 'staff' },
  { path: 'sales-dashboard', requiredPermission: PERMISSIONS.REPORT_EXPORT, zone: 'staff' },
  { path: 'logistics-checklist', requiredPermission: PERMISSIONS.FIELD_SERVICE_JOB_VIEW, zone: 'staff', isBranchScoped: true },
  { path: 'notifications', requiredPermission: PERMISSIONS.NOTIFICATION_VIEW, zone: 'staff' },
  { path: 'notifications/templates', requiredPermission: PERMISSIONS.ADMIN_ROLE_CHANGE, zone: 'staff' },
  { path: 'notifications/settings', requiredPermission: 'notification.manage', zone: 'staff' },
  { path: '', zone: 'staff' }, // Authenticated root; RoleRedirect chooses the actual portal.
  { path: 'unauthorized', zone: 'staff' },

  // Marketplace Buyer Zone (Permission Scoped)
  { path: 'marketplace', requiredPermission: 'marketplace.buyer.view', zone: 'marketplace' },
  { path: 'marketplace/products', requiredPermission: 'marketplace.buyer.view', zone: 'marketplace' },
  { path: 'marketplace/products/:productId', requiredPermission: 'marketplace.buyer.view', zone: 'marketplace' },
  { path: 'marketplace/compare', requiredPermission: 'marketplace.buyer.view', zone: 'marketplace' },
  { path: 'marketplace/cart', requiredPermission: 'marketplace.buyer.view', zone: 'marketplace' },
  { path: 'marketplace/checkout', requiredPermission: 'marketplace.buyer.view', zone: 'marketplace' },
  { path: 'marketplace/rfqs', requiredPermission: 'marketplace.buyer.view', zone: 'marketplace' },
  { path: 'marketplace/orders', requiredPermission: 'marketplace.buyer.view', zone: 'marketplace' },
  { path: 'marketplace/deliveries', requiredPermission: 'marketplace.buyer.view', zone: 'marketplace' },
  { path: 'marketplace/installations', requiredPermission: 'marketplace.buyer.view', zone: 'marketplace' },
  { path: 'marketplace/warranty', requiredPermission: 'marketplace.buyer.view', zone: 'marketplace' },
  { path: 'marketplace/service-tickets', requiredPermission: 'marketplace.buyer.view', zone: 'marketplace' },

  // Marketplace Supplier Zone
  { path: 'supplier', requiredPermission: 'marketplace.supplier.view', allowedRoles: ['Supplier', 'Supplier Admin', 'Marketplace Supplier'], zone: 'marketplace' },
  { path: 'supplier/listings', requiredPermission: 'marketplace.supplier.manage_listing', allowedRoles: ['Supplier', 'Supplier Admin', 'Marketplace Supplier'], zone: 'marketplace' },
  { path: 'supplier/service-listings', requiredPermission: 'marketplace.supplier.manage_listing', allowedRoles: ['Supplier', 'Supplier Admin', 'Marketplace Supplier'], zone: 'marketplace' },
  { path: 'supplier/rfq-inbox', requiredPermission: 'marketplace.supplier.view', allowedRoles: ['Supplier', 'Supplier Admin', 'Marketplace Supplier'], zone: 'marketplace' },
  { path: 'supplier/quotes', requiredPermission: 'marketplace.supplier.view', allowedRoles: ['Supplier', 'Supplier Admin', 'Marketplace Supplier'], zone: 'marketplace' },
  { path: 'supplier/orders', requiredPermission: 'marketplace.supplier.view', allowedRoles: ['Supplier', 'Supplier Admin', 'Marketplace Supplier'], zone: 'marketplace' },
  { path: 'supplier/fulfillment', requiredPermission: 'marketplace.supplier.view', allowedRoles: ['Supplier', 'Supplier Admin', 'Marketplace Supplier'], zone: 'marketplace' },
  { path: 'supplier/warranty-claims', requiredPermission: 'marketplace.supplier.view', allowedRoles: ['Supplier', 'Supplier Admin', 'Marketplace Supplier'], zone: 'marketplace' },
  { path: 'supplier/service-commitments', requiredPermission: 'marketplace.supplier.view', allowedRoles: ['Supplier', 'Supplier Admin', 'Marketplace Supplier'], zone: 'marketplace' },
  { path: 'supplier/payouts', requiredPermission: 'marketplace.supplier.view', allowedRoles: ['Supplier', 'Supplier Admin', 'Marketplace Supplier'], zone: 'marketplace' },
  { path: 'supplier/performance', requiredPermission: 'marketplace.supplier.view', allowedRoles: ['Supplier', 'Supplier Admin', 'Marketplace Supplier'], zone: 'marketplace' },

  // Marketplace Admin Zone
  { path: 'marketplace-admin', requiredPermission: 'marketplace.admin.view', zone: 'marketplace' },
  { path: 'marketplace-admin/suppliers', requiredPermission: 'marketplace.admin.manage', zone: 'marketplace' },
  { path: 'marketplace-admin/buyers', requiredPermission: 'marketplace.admin.manage', zone: 'marketplace' },
  { path: 'marketplace-admin/listing-approval', requiredPermission: 'marketplace.admin.manage', zone: 'marketplace' },
  { path: 'marketplace-admin/rfq-monitor', requiredPermission: 'marketplace.admin.view', zone: 'marketplace' },
  { path: 'marketplace-admin/order-monitor', requiredPermission: 'marketplace.admin.view', zone: 'marketplace' },
  { path: 'marketplace-admin/fulfillment-monitor', requiredPermission: 'marketplace.admin.view', zone: 'marketplace' },
  { path: 'marketplace-admin/installation-monitor', requiredPermission: 'marketplace.admin.view', zone: 'marketplace' },
  { path: 'marketplace-admin/warranty-claims', requiredPermission: 'marketplace.admin.view', zone: 'marketplace' },
  { path: 'marketplace-admin/disputes', requiredPermission: 'marketplace.admin.manage', zone: 'marketplace' },
  { path: 'marketplace-admin/commission-fees', requiredPermission: 'marketplace.admin.manage', zone: 'marketplace' },
  { path: 'marketplace-admin/reports', requiredPermission: 'marketplace.admin.view', zone: 'marketplace' },

  // Field Service / Logistics Zone
  // Permission-first branch-scoped logistics workspace. Pages choose oversight vs
  // technician presentation from capabilities, not hard-coded role names.
  { path: 'field-service', requiredPermission: PERMISSIONS.FIELD_SERVICE_JOB_VIEW, zone: 'staff', isBranchScoped: true },
  { path: 'field-service/deliveries', requiredPermission: PERMISSIONS.FIELD_SERVICE_JOB_VIEW, zone: 'staff', isBranchScoped: true },
  { path: 'field-service/installations', requiredPermission: PERMISSIONS.FIELD_SERVICE_INSTALLATION_UPDATE, zone: 'staff', isBranchScoped: true },
  { path: 'field-service/schedule', requiredPermission: PERMISSIONS.FIELD_SERVICE_JOB_VIEW, zone: 'staff', isBranchScoped: true },
  { path: 'field-service/handover', requiredPermission: PERMISSIONS.FIELD_SERVICE_DELIVERY_PROOF_CREATE, zone: 'staff', isBranchScoped: true },
  { path: 'field-service/proof-of-delivery', requiredPermission: PERMISSIONS.FIELD_SERVICE_DELIVERY_PROOF_CREATE, zone: 'staff', isBranchScoped: true },
  { path: 'field-service/warranty-activation', requiredPermission: PERMISSIONS.FIELD_SERVICE_INSTALLATION_UPDATE, zone: 'staff', isBranchScoped: true },
  { path: 'field-service/preventive-maintenance', requiredPermission: PERMISSIONS.FIELD_SERVICE_MAINTENANCE_UPDATE, zone: 'staff', isBranchScoped: true },
  { path: 'field-service/service-worklog', requiredPermission: PERMISSIONS.FIELD_SERVICE_JOB_UPDATE, zone: 'staff', isBranchScoped: true },
  { path: 'field-service/offline-sync', requiredPermission: PERMISSIONS.FIELD_SERVICE_JOB_VIEW, zone: 'staff', isBranchScoped: true },

  // Clinical Ops Dashboard (Staff Zone, Observational, Branch Scoped)
  { path: 'clinical/ops', requiredPermission: 'patient.view', zone: 'staff', isBranchScoped: true },

  // Doctor Portal Workspace Routes (Staff, Permission Scoped, Branch Scoped)
  { path: 'doctor', allowedRoles: ['Doctor'], zone: 'staff', isBranchScoped: true },
  { path: 'doctor/queue', allowedRoles: ['Doctor'], zone: 'staff', isBranchScoped: true },
  { path: 'doctor/patients', allowedRoles: ['Doctor'], zone: 'staff', isBranchScoped: true },
  { path: 'doctor/emr/:patientId?', allowedRoles: ['Doctor'], zone: 'staff', isBranchScoped: true },
  { path: 'doctor/encounters/:encounterId?', allowedRoles: ['Doctor'], zone: 'staff', isBranchScoped: true },
  { path: 'doctor/results', allowedRoles: ['Doctor'], zone: 'staff', isBranchScoped: true },
  { path: 'doctor/prescriptions', allowedRoles: ['Doctor'], zone: 'staff', isBranchScoped: true },
  { path: 'doctor/orders', allowedRoles: ['Doctor'], zone: 'staff', isBranchScoped: true },
  { path: 'doctor/timeline/:patientId?', allowedRoles: ['Doctor'], zone: 'staff', isBranchScoped: true },

  // Nurse Portal Workspace Routes (Staff, Permission Scoped, Branch Scoped)
  { path: 'nurse', allowedRoles: ['Nurse'], zone: 'staff', isBranchScoped: true },
  { path: 'nurse/triage', allowedRoles: ['Nurse'], zone: 'staff', isBranchScoped: true },
  { path: 'nurse/intake', allowedRoles: ['Nurse'], zone: 'staff', isBranchScoped: true },
  { path: 'nurse/vitals', allowedRoles: ['Nurse'], zone: 'staff', isBranchScoped: true },
  { path: 'nurse/tasks', allowedRoles: ['Nurse'], zone: 'staff', isBranchScoped: true },
  { path: 'nurse/specimens', allowedRoles: ['Nurse'], zone: 'staff', isBranchScoped: true },

  // Lab Portal Workspace Routes (Staff, Permission Scoped, Branch Scoped)
  { path: 'lab', allowedRoles: ['Lab Technician', 'Med-Tech'], zone: 'staff', isBranchScoped: true },
  { path: 'lab/orders', allowedRoles: ['Lab Technician', 'Med-Tech'], zone: 'staff', isBranchScoped: true },
  { path: 'lab/specimens', allowedRoles: ['Lab Technician', 'Med-Tech'], zone: 'staff', isBranchScoped: true },
  { path: 'lab/encoding', allowedRoles: ['Lab Technician', 'Med-Tech'], zone: 'staff', isBranchScoped: true },
  { path: 'lab/validation', allowedRoles: ['Lab Technician', 'Med-Tech'], zone: 'staff', isBranchScoped: true },
  { path: 'lab/validated', allowedRoles: ['Lab Technician', 'Med-Tech'], zone: 'staff', isBranchScoped: true },
  { path: 'lab/released', allowedRoles: ['Lab Technician', 'Med-Tech'], zone: 'staff', isBranchScoped: true },
  { path: 'lab/released/:patientId/:orderId', allowedRoles: ['Lab Technician', 'Med-Tech'], zone: 'staff', isBranchScoped: true },
  { path: 'lab/critical-results', allowedRoles: ['Lab Technician', 'Med-Tech'], zone: 'staff', isBranchScoped: true },
  { path: 'lab/turnaround', allowedRoles: ['Lab Technician', 'Med-Tech'], zone: 'staff', isBranchScoped: true },

  // Cashier Portal Workspace Routes (Staff, Permission Scoped, Branch Scoped)
  { path: 'cashier', allowedRoles: ['Cashier', 'Finance'], zone: 'staff', isBranchScoped: true },
  { path: 'cashier/billing', allowedRoles: ['Cashier', 'Finance'], zone: 'staff', isBranchScoped: true },
  { path: 'cashier/invoices', allowedRoles: ['Cashier', 'Finance'], zone: 'staff', isBranchScoped: true },
  { path: 'cashier/payments', allowedRoles: ['Cashier', 'Finance'], zone: 'staff', isBranchScoped: true },
  { path: 'cashier/session', allowedRoles: ['Cashier', 'Finance'], zone: 'staff', isBranchScoped: true },
  { path: 'cashier/refunds-voids', allowedRoles: ['Cashier', 'Finance'], zone: 'staff', isBranchScoped: true },
  { path: 'cashier/hmo-claims', allowedRoles: ['Cashier', 'Finance'], zone: 'staff', isBranchScoped: true },
  { path: 'cashier/reconciliation', allowedRoles: ['Cashier', 'Finance'], zone: 'staff', isBranchScoped: true },

  // SuperAdmin Portal Workspace Routes (Staff Zone, Governance Scope, Tenant Scoped)
  { path: 'admin', allowedRoles: ['Super Admin'], zone: 'staff' },
  { path: 'admin/executive', allowedRoles: ['Super Admin'], zone: 'staff' },
  { path: 'admin/tenants', allowedRoles: ['Super Admin'], zone: 'staff' },
  { path: 'admin/branches', allowedRoles: ['Super Admin'], zone: 'staff' },
  { path: 'admin/users', requiredPermission: PERMISSIONS.ADMIN_ROLE_CHANGE, allowedRoles: ['Super Admin'], zone: 'staff' },
  { path: 'admin/roles-permissions', requiredPermission: PERMISSIONS.ADMIN_ROLE_CHANGE, allowedRoles: ['Super Admin'], zone: 'staff' },
  { path: 'admin/security', allowedRoles: ['Super Admin'], zone: 'staff' },
  { path: 'admin/audit-logs', requiredPermission: PERMISSIONS.AUDIT_VIEW, allowedRoles: ['Super Admin', 'Compliance Officer'], zone: 'staff' },
  { path: 'admin/settings', requiredPermission: PERMISSIONS.ADMIN_ROLE_CHANGE, allowedRoles: ['Super Admin'], zone: 'staff' },
  { path: 'admin/reports', requiredPermission: PERMISSIONS.REPORT_EXPORT, allowedRoles: ['Super Admin', 'Compliance Officer'], zone: 'staff' },
  { path: 'admin/catalog', requiredPermission: 'catalog.manage', allowedRoles: ['Super Admin'], zone: 'staff' },

  // Branch Admin Workspace Routes (Staff Zone, Governance Scope, Branch Scoped)
  { path: 'branch-admin', requiredPermission: 'admin.branch.view', zone: 'staff', isBranchScoped: true },
  { path: 'branch-admin/staff', requiredPermission: 'admin.user.view', zone: 'staff', isBranchScoped: true },
  { path: 'branch-admin/departments', requiredPermission: 'admin.branch.view', zone: 'staff', isBranchScoped: true },
  { path: 'branch-admin/rooms', requiredPermission: 'admin.branch.view', zone: 'staff', isBranchScoped: true },
  { path: 'branch-admin/schedules', requiredPermission: 'admin.branch.view', zone: 'staff', isBranchScoped: true },
  { path: 'branch-admin/services', requiredPermission: 'catalog.service.view', zone: 'staff', isBranchScoped: true },
  { path: 'branch-admin/equipment', requiredPermission: 'inventory.item.view', zone: 'staff', isBranchScoped: true },
  { path: 'branch-admin/inventory-rules', requiredPermission: 'inventory.item.view', zone: 'staff', isBranchScoped: true },
  { path: 'branch-admin/billing-rules', requiredPermission: 'billing.invoice.view', zone: 'staff', isBranchScoped: true },
  { path: 'branch-admin/queue-settings', requiredPermission: 'queue.view', zone: 'staff', isBranchScoped: true },
  { path: 'branch-admin/approvals', requiredPermission: 'approval.request.view', zone: 'staff', isBranchScoped: true },

  // Compliance Officer Portal Workspace Routes (Staff Zone, Compliance Scope, Tenant Scoped)
  { path: 'compliance', requiredPermission: 'compliance.audit.review', zone: 'staff' },
  { path: 'compliance/phi-access', requiredPermission: 'compliance.phi.monitor', zone: 'staff' },
  { path: 'compliance/audit-review', requiredPermission: 'compliance.audit.review', zone: 'staff' },
  { path: 'compliance/access-reviews', requiredPermission: 'compliance.audit.review', zone: 'staff' },
  { path: 'compliance/export-logs', requiredPermission: 'compliance.report.export', zone: 'staff' },
  { path: 'compliance/breach-alerts', requiredPermission: 'compliance.phi.monitor', zone: 'staff' },
  { path: 'compliance/retention', requiredPermission: 'compliance.audit.review', zone: 'staff' },
  { path: 'compliance/reports', requiredPermission: 'compliance.report.export', zone: 'staff' },
  { path: 'compliance/audit-chain', requiredPermission: 'compliance.audit.review', zone: 'staff' },

  // IT / Support Portal Workspace Routes (Staff Zone, Operations Scope, Tenant Scoped)
  { path: 'it', requiredPermission: 'it.system.view', zone: 'staff' },
  { path: 'it/system-health', requiredPermission: 'it.system.view', zone: 'staff' },
  { path: 'it/user-support', requiredPermission: 'it.support.manage', zone: 'staff' },
  { path: 'it/sessions', requiredPermission: 'it.system.view', zone: 'staff' },
  { path: 'it/background-jobs', requiredPermission: 'it.system.view', zone: 'staff' },
  { path: 'it/integrations', requiredPermission: 'it.system.view', zone: 'staff' },
  { path: 'it/logs', requiredPermission: 'it.system.view', zone: 'staff' },
  { path: 'it/backup-restore', requiredPermission: 'it.system.view', zone: 'staff' },
  { path: 'it/incidents', requiredPermission: 'it.support.manage', zone: 'staff' },

  // HR Portal Workspace Routes (Staff Zone, HR Scope, Tenant Scoped)
  { path: 'hr', requiredPermission: 'hr.employee.view', zone: 'staff' },
  { path: 'hr/employees', requiredPermission: 'hr.employee.manage', zone: 'staff' },
  { path: 'hr/departments', requiredPermission: 'hr.employee.view', zone: 'staff' },
  { path: 'hr/attendance', requiredPermission: 'hr.employee.view', zone: 'staff' },
  { path: 'hr/leave', requiredPermission: 'hr.employee.view', zone: 'staff' },
  { path: 'hr/payroll', requiredPermission: 'hr.payroll.view', zone: 'staff' },
  { path: 'hr/licenses', requiredPermission: 'hr.employee.view', zone: 'staff' },
  { path: 'hr/branch-assignments', requiredPermission: 'hr.employee.manage', zone: 'staff' },
  { path: 'hr/termination', requiredPermission: 'hr.employee.manage', zone: 'staff' },

  // Procurement Portal Workspace Routes (Staff Zone, Procurement Scope, Tenant Scoped)
  { path: 'procurement', requiredPermission: 'procurement.request.view', zone: 'staff' },
  { path: 'procurement/suppliers', requiredPermission: 'procurement.supplier.view', zone: 'staff' },
  { path: 'procurement/purchase-requests', requiredPermission: 'procurement.request.view', zone: 'staff' },
  { path: 'procurement/rfqs', requiredPermission: 'procurement.rfq.view', zone: 'staff' },
  { path: 'procurement/quotes', requiredPermission: 'procurement.quote.view', zone: 'staff' },
  { path: 'procurement/purchase-orders', requiredPermission: 'procurement.po.view', zone: 'staff' },
  { path: 'procurement/receiving', requiredPermission: 'procurement.receiving.post', zone: 'staff' },
  { path: 'procurement/inventory-requests', requiredPermission: 'procurement.request.view', zone: 'staff' },
  { path: 'procurement/vendor-performance', requiredPermission: 'procurement.vendor.performance.view', zone: 'staff' },

  // Patient Portal Workspace Routes (Patient Zone, Self-Service Scope)
  { path: 'patient', requiredPermission: 'patient.portal.view_own', allowedRoles: ['Patient'], zone: 'patient' },
  { path: 'patient/appointments', requiredPermission: 'patient.portal.appointment.view', allowedRoles: ['Patient'], zone: 'patient' },
  { path: 'patient/lab-results', requiredPermission: 'patient.portal.result.view', allowedRoles: ['Patient'], zone: 'patient' },
  { path: 'patient/prescriptions', requiredPermission: 'patient.portal.view_own', allowedRoles: ['Patient'], zone: 'patient' },
  { path: 'patient/billing', requiredPermission: 'patient.portal.billing.view', allowedRoles: ['Patient'], zone: 'patient' },
  { path: 'patient/medical-records', requiredPermission: 'patient.portal.view_own', allowedRoles: ['Patient'], zone: 'patient' },
  { path: 'patient/messages', requiredPermission: 'patient.portal.message', allowedRoles: ['Patient'], zone: 'patient' },
  { path: 'patient/profile', requiredPermission: 'patient.portal.view_own', allowedRoles: ['Patient'], zone: 'patient' },

  // Integration Bridges Workspace Routes (Staff Zone, Cross-Domain Scope, Tenant Scoped)
  { path: 'integration', requiredPermission: 'integration.view', zone: 'staff' },
  { path: 'integration/notifications', requiredPermission: 'integration.view', zone: 'staff' },
  { path: 'integration/approvals', requiredPermission: 'integration.view', zone: 'staff' },
  { path: 'integration/global-search', requiredPermission: 'integration.view', zone: 'staff' },
  { path: 'integration/patient-timeline', requiredPermission: 'integration.view', zone: 'staff' },
  { path: 'integration/asset-timeline', requiredPermission: 'integration.view', zone: 'staff' },
  { path: 'integration/reconciliation', requiredPermission: 'integration.view', zone: 'staff' },
  { path: 'integration/activity-audit', requiredPermission: 'integration.view', zone: 'staff' },
];

const normalizePortalPath = (path: string): string =>
  path
    .split(/[?#]/, 1)[0]
    .replace(/^\/+|\/+$/g, '');

const splitRoute = (path: string): string[] => {
  const normalized = normalizePortalPath(path);
  return normalized ? normalized.split('/') : [];
};

const matchesRoutePattern = (pattern: string, pathname: string): boolean => {
  const patternSegments = splitRoute(pattern);
  const pathSegments = splitRoute(pathname);

  let pathIndex = 0;
  for (const segment of patternSegments) {
    const optional = segment.startsWith(':') && segment.endsWith('?');
    const dynamic = segment.startsWith(':');

    if (optional && pathIndex >= pathSegments.length) continue;
    if (pathIndex >= pathSegments.length) return false;
    if (!dynamic && segment !== pathSegments[pathIndex]) return false;
    pathIndex += 1;
  }

  return pathIndex === pathSegments.length;
};

/**
 * Resolve the canonical access policy for a browser pathname.
 * Exact/dynamic matches win; otherwise the longest static parent policy is used
 * for nested layout routes such as /settings/branches.
 */
const routeSpecificity = (path: string): [number, number] => {
  const segments = splitRoute(path);
  const staticSegments = segments.filter((segment) => !segment.startsWith(':')).length;
  return [staticSegments, segments.length];
};

export const getPortalRouteConfig = (pathname: string): RouteGuardConfig | undefined => {
  const normalized = normalizePortalPath(pathname);
  const exact = portalRoutes
    .filter((route) => matchesRoutePattern(route.path, normalized))
    .sort((a, b) => {
      const [aStatic, aLength] = routeSpecificity(a.path);
      const [bStatic, bLength] = routeSpecificity(b.path);
      return bStatic - aStatic || bLength - aLength;
    })[0];

  if (exact) return exact;

  return portalRoutes
    .filter((route) => {
      const routePath = normalizePortalPath(route.path);
      return Boolean(routePath) && !routePath.includes(':') && normalized.startsWith(`${routePath}/`);
    })
    .sort((a, b) => splitRoute(b.path).length - splitRoute(a.path).length)[0];
};
