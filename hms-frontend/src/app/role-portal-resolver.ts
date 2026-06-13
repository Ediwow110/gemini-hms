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
  'Doctor': 60,
  'Nurse': 55,
  'Pharmacist': 50,
  'Med-Tech': 45,
  'Lab Technician': 45,
  'Finance': 40,
  'Cashier': 40,
  'Receptionist': 35,
  'IT Support': 30,
  'Field Technician': 25,
  'HR Staff': 20,
  'Supplier Admin': 15,
  'Supplier': 15,
  'Marketplace Supplier': 15,
  'Marketplace Buyer': 10,
  'Customer': 10,
  'Patient': 10,
};

export const ROLE_ALIASES: Record<string, string> = {
  'Admin': 'Super Admin',
  'Lab Technician': 'Med-Tech',
  'Procurement Manager': 'Procurement Officer',
  'Procurement Agent': 'Procurement Officer',
  'Supplier Admin': 'Supplier',
  'Marketplace Supplier': 'Supplier',
  'Marketplace Buyer': 'Customer',
  'Finance': 'Cashier',
  'HR Manager': 'HR Staff'
};

export const ROLE_PORTAL_PATHS: Record<string, string> = {
  'Super Admin': '/admin/executive',
  'Branch Admin': '/branch-admin',
  'Marketplace Admin': '/marketplace-admin',
  'Compliance Officer': '/compliance',
  'IT Support': '/it',
  'HR Staff': '/hr',
  'HR Manager': '/hr',
  'Procurement Officer': '/procurement',
  'Procurement Manager': '/procurement',
  'Procurement Agent': '/procurement',
  'Doctor': '/doctor',
  'Nurse': '/nurse',
  'Med-Tech': '/lab',
  'Lab Technician': '/lab',
  'Cashier': '/cashier',
  'Finance': '/cashier',
  'Pharmacist': '/pharmacy',
  'Supplier': '/supplier',
  'Supplier Admin': '/supplier',
  'Marketplace Supplier': '/supplier',
  'Marketplace Buyer': '/marketplace',
  'Customer': '/marketplace',
  'Patient': '/patient',
  'Field Technician': '/field-service',
  'Receptionist': '/queue',
};

export function normalizeRole(role: string): string {
  return ROLE_ALIASES[role] || role;
}

export function getPrimaryRole(roles: string[]): string | null {
  if (!roles || roles.length === 0) return null;
  const sorted = [...roles].sort((a, b) => (ROLE_PRIORITY[b] || 0) - (ROLE_PRIORITY[a] || 0));
  return sorted[0];
}

export function getDefaultPortalPath(roles: string[]): string {
  const primary = getPrimaryRole(roles);
  if (!primary) return '/unauthorized';
  
  const path = ROLE_PORTAL_PATHS[primary] || ROLE_PORTAL_PATHS[normalizeRole(primary)];
  return path || '/unauthorized';
}

export function isKnownPortalPath(path: string): boolean {
  return Object.values(ROLE_PORTAL_PATHS).includes(path);
}

export function getSafePortalPath(path: string | undefined, roles: string[]): string {
  if (path && isKnownPortalPath(path)) {
    return path;
  }
  return getDefaultPortalPath(roles);
}
