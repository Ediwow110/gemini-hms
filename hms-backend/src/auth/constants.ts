/**
 * Shared authentication constants.
 * Import from here to ensure SENSITIVE_ROLES stays in sync across guards and services.
 */
export const SENSITIVE_ROLES = [
  'Super Admin',
  'Branch Admin',
  'Doctor',
  'Cashier',
  'HR',
  'Finance',
] as const;
