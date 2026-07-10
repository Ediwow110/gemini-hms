interface PortalMatch {
  path: string;
  priority: number;
}

const ROLE_PORTALS: Record<string, PortalMatch> = {
  'Super Admin': { path: '/admin', priority: 100 },
  Admin: { path: '/admin/users', priority: 95 },
  'Branch Admin': { path: '/branch-admin', priority: 90 },
  'Procurement Manager': { path: '/procurement', priority: 85 },
  'Procurement Officer': { path: '/procurement', priority: 85 },
  'Procurement Agent': { path: '/procurement', priority: 85 },
  'HR Manager': { path: '/hr', priority: 80 },
  'Compliance Officer': { path: '/compliance', priority: 75 },
  'Marketplace Admin': { path: '/marketplace-admin', priority: 70 },
  Doctor: { path: '/doctor', priority: 60 },
  Nurse: { path: '/nurse', priority: 55 },
  Pharmacist: { path: '/pharmacy', priority: 50 },
  'Med-Tech': { path: '/lab', priority: 45 },
  'Lab Technician': { path: '/lab', priority: 45 },
  Cashier: { path: '/cashier', priority: 40 },
  Finance: { path: '/cashier', priority: 40 },
  Receptionist: { path: '/queue', priority: 35 },
  'IT Support': { path: '/it', priority: 30 },
  'Service Manager': { path: '/field-service', priority: 28 },
  'Logistics Staff': { path: '/field-service', priority: 27 },
  'Field Technician': { path: '/field-service', priority: 25 },
  'HR Staff': { path: '/hr', priority: 20 },
  'Supplier Admin': { path: '/supplier', priority: 15 },
  Supplier: { path: '/supplier', priority: 15 },
  'Marketplace Supplier': { path: '/supplier', priority: 15 },
  'Marketplace Buyer': { path: '/marketplace', priority: 10 },
  Customer: { path: '/marketplace', priority: 10 },
  Patient: { path: '/patient', priority: 10 },
};

const PERMISSION_PORTALS: Array<{ path: string; anyOf: string[] }> = [
  { path: '/admin', anyOf: ['admin.role.change'] },
  {
    path: '/compliance',
    anyOf: ['compliance.audit.review', 'compliance.phi.monitor'],
  },
  {
    path: '/it',
    anyOf: ['it.system.view', 'it.support.manage', 'it.ticket.manage'],
  },
  {
    path: '/marketplace-admin',
    anyOf: [
      'marketplace.admin.view',
      'marketplace.admin.manage',
      'marketplace.admin',
    ],
  },
  {
    path: '/hr',
    anyOf: ['hr.employee.view', 'hr.employee.manage', 'hr.payroll.view'],
  },
  {
    path: '/procurement',
    anyOf: [
      'procurement.request.view',
      'procurement.supplier.view',
      'procurement.po.view',
    ],
  },
  { path: '/field-service', anyOf: ['field_service.job.view'] },
  { path: '/marketplace', anyOf: ['marketplace.buyer.view'] },
  { path: '/pharmacy', anyOf: ['inventory.stock.dispense'] },
  { path: '/lab', anyOf: ['lab.result.view'] },
  { path: '/cashier', anyOf: ['billing.invoice.view'] },
  { path: '/queue', anyOf: ['queue.view'] },
  { path: '/branch-admin', anyOf: ['admin.branch.view'] },
];

export const resolveDefaultPortalPath = (
  roles: string[],
  permissions: string[] = [],
): string => {
  let bestMatch: PortalMatch = { path: '/unauthorized', priority: -1 };

  for (const role of roles || []) {
    const match = ROLE_PORTALS[role];
    if (match && match.priority > bestMatch.priority) bestMatch = match;
  }

  if (bestMatch.priority >= 0) return bestMatch.path;

  const permissionSet = new Set(permissions || []);
  return (
    PERMISSION_PORTALS.find((rule) =>
      rule.anyOf.some((permission) => permissionSet.has(permission)),
    )?.path ?? '/unauthorized'
  );
};
