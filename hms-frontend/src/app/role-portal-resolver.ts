export const ROLE_PRIORITY: Record<string, number> = {
  'Super Admin': 100,
  'Admin': 95,
  'Branch Admin': 90,
  'Procurement Manager': 85,
  'Procurement Officer': 85,
  'Procurement Agent': 85,
  'HR Manager': 80,
  'Compliance Officer': 75,
  'Marketplace Admin': 70,
  Doctor: 60,
  Nurse: 55,
  Pharmacist: 50,
  'Med-Tech': 45,
  'Lab Technician': 45,
  Finance: 40,
  Cashier: 40,
  Receptionist: 35,
  'IT Support': 30,
  'Service Manager': 28,
  'Logistics Staff': 27,
  'Field Technician': 25,
  'HR Staff': 20,
  'Supplier Admin': 15,
  Supplier: 15,
  'Marketplace Supplier': 15,
  'Marketplace Buyer': 10,
  Customer: 10,
  Patient: 10,
};

export const ROLE_ALIASES: Record<string, string> = {
  'Lab Technician': 'Med-Tech',
  'Procurement Manager': 'Procurement Officer',
  'Procurement Agent': 'Procurement Officer',
  'Supplier Admin': 'Supplier',
  'Marketplace Supplier': 'Supplier',
  'Marketplace Buyer': 'Customer',
  Finance: 'Cashier',
  'HR Manager': 'HR Staff',
  'Service Manager': 'Field Technician',
  'Logistics Staff': 'Field Technician',
};

export const ROLE_PORTAL_PATHS: Record<string, string> = {
  'Super Admin': '/admin',
  Admin: '/admin/users',
  'Branch Admin': '/branch-admin',
  'Marketplace Admin': '/marketplace-admin',
  'Compliance Officer': '/compliance',
  'IT Support': '/it',
  'HR Staff': '/hr',
  'HR Manager': '/hr',
  'Procurement Officer': '/procurement',
  'Procurement Manager': '/procurement',
  'Procurement Agent': '/procurement',
  Doctor: '/doctor',
  Nurse: '/nurse',
  'Med-Tech': '/lab',
  'Lab Technician': '/lab',
  Cashier: '/cashier',
  Finance: '/cashier',
  Pharmacist: '/pharmacy',
  Supplier: '/supplier',
  'Supplier Admin': '/supplier',
  'Marketplace Supplier': '/supplier',
  'Marketplace Buyer': '/marketplace',
  Customer: '/marketplace',
  Patient: '/patient',
  'Field Technician': '/field-service',
  'Logistics Staff': '/field-service',
  'Service Manager': '/field-service',
  Receptionist: '/queue',
};

interface PermissionPortalRule {
  path: string;
  anyOf: string[];
}

/**
 * Custom roles are permission-defined, so they receive a useful landing page even
 * when their display name is not one of the built-in role names.
 */
const PERMISSION_PORTAL_RULES: PermissionPortalRule[] = [
  { path: '/admin', anyOf: ['admin.role.change'] },
  { path: '/compliance', anyOf: ['compliance.audit.review', 'compliance.phi.monitor'] },
  { path: '/it', anyOf: ['it.system.view', 'it.support.manage', 'it.ticket.manage'] },
  { path: '/marketplace-admin', anyOf: ['marketplace.admin.view', 'marketplace.admin.manage', 'marketplace.admin'] },
  { path: '/hr', anyOf: ['hr.employee.view', 'hr.employee.manage', 'hr.payroll.view'] },
  { path: '/procurement', anyOf: ['procurement.request.view', 'procurement.supplier.view', 'procurement.po.view'] },
  { path: '/field-service', anyOf: ['field_service.job.view'] },
  { path: '/marketplace', anyOf: ['marketplace.buyer.view'] },
  { path: '/pharmacy', anyOf: ['inventory.stock.dispense'] },
  { path: '/lab', anyOf: ['lab.result.view'] },
  { path: '/cashier', anyOf: ['billing.invoice.view'] },
  { path: '/queue', anyOf: ['queue.view'] },
  { path: '/branch-admin', anyOf: ['admin.branch.view'] },
];

export function normalizeRole(role: string): string {
  return ROLE_ALIASES[role] || role;
}

export function getPrimaryRole(roles: string[]): string | null {
  if (!roles || roles.length === 0) return null;
  const sorted = [...roles].sort(
    (a, b) => (ROLE_PRIORITY[b] || 0) - (ROLE_PRIORITY[a] || 0),
  );
  return sorted[0];
}

export function getPermissionPortalPath(permissions: string[]): string | null {
  const permissionSet = new Set(permissions || []);
  const match = PERMISSION_PORTAL_RULES.find((rule) =>
    rule.anyOf.some((permission) => permissionSet.has(permission)),
  );
  return match?.path ?? null;
}

export function getDefaultPortalPath(
  roles: string[],
  permissions: string[] = [],
): string {
  const primary = getPrimaryRole(roles);
  if (primary) {
    const path = ROLE_PORTAL_PATHS[primary] || ROLE_PORTAL_PATHS[normalizeRole(primary)];
    if (path) return path;
  }

  return getPermissionPortalPath(permissions) || '/unauthorized';
}

const ADDITIONAL_KNOWN_PORTAL_PATHS = new Set(['/admin/executive']);

export function isKnownPortalPath(path: string): boolean {
  return (
    Object.values(ROLE_PORTAL_PATHS).includes(path) ||
    PERMISSION_PORTAL_RULES.some((rule) => rule.path === path) ||
    ADDITIONAL_KNOWN_PORTAL_PATHS.has(path)
  );
}

export function getSafePortalPath(
  path: string | undefined,
  roles: string[],
  permissions: string[] = [],
): string {
  if (path && isKnownPortalPath(path)) return path;
  return getDefaultPortalPath(roles, permissions);
}
