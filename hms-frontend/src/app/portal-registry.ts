import { ROLE_PORTAL_PATHS, ROLE_PRIORITY, getDefaultPortalPath } from './role-portal-resolver';
import { 
  LayoutDashboard, 
  Users, 
  ListOrdered, 
  FlaskConical, 
  Pill, 
  CreditCard, 
  ShieldCheck, 
  Package, 
  ShoppingBag, 
  Box, 
  PlusCircle, 
  ClipboardCheck, 
  GitMerge, 
  BarChart3, 
  Settings as SettingsIcon,
  CheckSquare,
  ClipboardList,
  Clock,
  MessageSquare,
  FileText,
  User,
  Heart,
  Truck,
  Zap,
  Activity,
  Search
} from 'lucide-react';
export interface NavItem {
  label: string;
  to: string;
  icon: React.ElementType;
  permission?: string;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

export { getDefaultPortalPath, ROLE_PRIORITY };
export const PORTAL_PATHS = ROLE_PORTAL_PATHS;

export function getNavGroups(roles: string[]): NavGroup[] {
  if (!roles || roles.length === 0) return DEFAULT_NAV_GROUPS;

  // Merge navigation from ALL roles instead of returning only the first match
  const merged: NavGroup[] = [];
  const seenPaths = new Set<string>();

  // Sort by priority so higher-priority role groups appear first
  const sortedRoles = [...roles].sort((a, b) => (ROLE_PRIORITY[b] || 0) - (ROLE_PRIORITY[a] || 0));

  for (const role of sortedRoles) {
    const groups = PORTAL_NAV_CONFIG[role];
    if (!groups) continue;
    for (const group of groups) {
      const uniqueItems = group.items.filter((item) => {
        if (seenPaths.has(item.to)) return false;
        seenPaths.add(item.to);
        return true;
      });
      if (uniqueItems.length > 0) {
        merged.push({ label: group.label, items: uniqueItems });
      }
    }
  }

  return merged.length > 0 ? merged : DEFAULT_NAV_GROUPS;
}

/**
 * Navigation configurations for each role/portal
 */
export const PORTAL_NAV_CONFIG: Record<string, NavGroup[]> = {
  'Super Admin': [
    {
      label: 'Admin Control',
      items: [
        { label: 'Admin Dashboard', to: '/admin', icon: ShieldCheck },
        { label: 'User Management', to: '/admin/users', icon: Users, permission: 'admin.role.change' },
        { label: 'Patient Merges', to: '/admin/patient-merges', icon: GitMerge, permission: 'admin.role.change' },
        { label: 'Audit Logs', to: '/audit-logs', icon: Search, permission: 'audit.view' },
      ],
    },
    {
      label: 'System Operations',
      items: [
        { label: 'Catalog Manage', to: '/admin/catalog', icon: ListOrdered, permission: 'catalog.manage' },
        { label: 'Reports', to: '/reports', icon: BarChart3, permission: 'report.export' },
        { label: 'Settings', to: '/settings', icon: SettingsIcon, permission: 'admin.role.change' },
      ],
    },
  ],
  'Branch Admin': [
    {
      label: 'Core Operations',
      items: [
        { label: 'Command Center', to: '/branch-admin', icon: LayoutDashboard },
        { label: 'Patients', to: '/patients', icon: Users, permission: 'patient.view' },
        { label: 'Queue', to: '/queue', icon: ListOrdered, permission: 'queue.view' },
      ],
    },
    {
      label: 'Departmental',
      items: [
        { label: 'Laboratory', to: '/lab/results', icon: FlaskConical, permission: 'lab.result.view' },
        { label: 'Pharmacy', to: '/pharmacy', icon: Pill, permission: 'inventory.stock.dispense' },
        { label: 'Billing', to: '/billing', icon: CreditCard, permission: 'billing.invoice.view' },
        { label: 'Inventory', to: '/inventory', icon: Package, permission: 'inventory.item.view' },
      ],
    },
    {
      label: 'Support',
      items: [
        { label: 'Approvals', to: '/approvals', icon: ClipboardCheck, permission: 'approval.request.view' },
        { label: 'Reports', to: '/reports', icon: BarChart3, permission: 'report.export' },
      ],
    },
  ],
  'Doctor': [
    {
      label: 'Medical Portal',
      items: [
        { label: 'Doctor Dashboard', to: '/doctor', icon: Activity },
        { label: 'Patient Queue', to: '/doctor/queue', icon: ListOrdered },
        { label: 'My Patients', to: '/doctor/patients', icon: Users },
        { label: 'EMR / Records', to: '/emr', icon: ClipboardList, permission: 'patient.view' },
      ],
    },
    {
      label: 'Diagnostics',
      items: [
        { label: 'Lab Results', to: '/lab/results', icon: FlaskConical, permission: 'lab.result.view' },
        { label: 'Orders', to: '/orders/new', icon: PlusCircle, permission: 'order.create' },
      ],
    },
  ],
  'Patient': [
    {
      label: 'Patient Portal',
      items: [
        { label: 'My Dashboard', to: '/patient', icon: Heart },
        { label: 'Appointments', to: '/patient/appointments', icon: Clock },
        { label: 'Lab Results', to: '/patient/lab-results', icon: FlaskConical },
        { label: 'Prescriptions', to: '/patient/prescriptions', icon: Pill },
        { label: 'Billing', to: '/patient/billing', icon: CreditCard },
      ],
    },
    {
      label: 'My Account',
      items: [
        { label: 'Messages', to: '/patient/messages', icon: MessageSquare },
        { label: 'Profile', to: '/patient/profile', icon: User },
      ],
    },
  ],
  'Cashier': [
    {
      label: 'Cashier Portal',
      items: [
        { label: 'Cashier Home', to: '/cashier', icon: CreditCard },
        { label: 'Patient Billing', to: '/cashier/billing', icon: Users },
        { label: 'Invoices', to: '/cashier/invoices', icon: FileText },
        { label: 'Session Control', to: '/cashier/session', icon: Clock },
      ],
    },
    {
      label: 'Claims',
      items: [
        { label: 'HMO Claims', to: '/claims', icon: ShieldCheck, permission: 'billing.claim.view' },
      ],
    },
  ],
  'Supplier': [
    {
      label: 'Supplier Portal',
      items: [
        { label: 'Supplier Dashboard', to: '/supplier', icon: Truck },
        { label: 'My Listings', to: '/supplier/listings', icon: Box },
        { label: 'RFQ Inbox', to: '/supplier/rfq-inbox', icon: MessageSquare },
        { label: 'Orders', to: '/supplier/orders', icon: Package },
      ],
    },
  ],
  'Procurement Officer': [
    {
      label: 'Procurement',
      items: [
        { label: 'Procurement Home', to: '/procurement', icon: ShoppingBag },
        { label: 'Suppliers', to: '/procurement/suppliers', icon: Users },
        { label: 'Purchase Requests', to: '/procurement/purchase-requests', icon: FileText },
        { label: 'Purchase Orders', to: '/procurement/purchase-orders', icon: Package },
      ],
    },
  ],
  'Field Technician': [
    {
      label: 'Field Service',
      items: [
        { label: 'My Jobs', to: '/field-service', icon: Zap },
        { label: 'Schedule', to: '/field-service/schedule', icon: CheckSquare },
        { label: 'Installations', to: '/field-service/installations', icon: Box },
      ],
    },
  ],
  'Nurse': [
    {
      label: 'Nursing Portal',
      items: [
        { label: 'Nurse Dashboard', to: '/nurse', icon: LayoutDashboard },
        { label: 'Triage Queue', to: '/nurse/triage', icon: ListOrdered },
        { label: 'Patient Intake', to: '/nurse/intake', icon: ClipboardList },
        { label: 'Vitals', to: '/nurse/vitals', icon: Activity },
        { label: 'Tasks', to: '/nurse/tasks', icon: CheckSquare },
        { label: 'Specimens', to: '/nurse/specimens', icon: FlaskConical },
      ],
    },
  ],
  'Pharmacist': [
    {
      label: 'Pharmacy Portal',
      items: [
        { label: 'Pharmacy Hub', to: '/pharmacy', icon: Pill },
        { label: 'Inventory', to: '/inventory', icon: Package, permission: 'inventory.item.view' },
      ],
    },
  ],
  'Med-Tech': [
    {
      label: 'Lab Portal',
      items: [
        { label: 'Lab Dashboard', to: '/lab', icon: FlaskConical },
        { label: 'Lab Results', to: '/lab/results', icon: FlaskConical, permission: 'lab.result.view' },
        { label: 'Lab Orders', to: '/lab/orders', icon: ClipboardList },
      ],
    },
  ],
  'Receptionist': [
    {
      label: 'Front Desk',
      items: [
        { label: 'Patients', to: '/patients', icon: Users, permission: 'patient.view' },
        { label: 'Queue', to: '/queue', icon: ListOrdered, permission: 'queue.view' },
        { label: 'New Patient', to: '/patients/new', icon: PlusCircle, permission: 'patient.create' },
      ],
    },
  ],
  'IT Support': [
    {
      label: 'IT Workspace',
      items: [
        { label: 'IT Dashboard', to: '/it', icon: LayoutDashboard },
        { label: 'System Health', to: '/it/system-health', icon: Activity },
        { label: 'User Support', to: '/it/user-support', icon: MessageSquare },
        { label: 'Sessions', to: '/it/sessions', icon: Clock },
        { label: 'Background Jobs', to: '/it/background-jobs', icon: ClipboardList },
        { label: 'Integrations', to: '/it/integrations', icon: Zap },
        { label: 'Logs', to: '/it/logs', icon: FileText },
        { label: 'Backup & Recovery', to: '/it/backup-restore', icon: Package },
        { label: 'Incidents', to: '/it/incidents', icon: ShieldCheck },
      ],
    },
  ],
  'Compliance Officer': [
    {
      label: 'Compliance Portal',
      items: [
        { label: 'Compliance Dashboard', to: '/compliance', icon: LayoutDashboard },
        { label: 'PHI Access Monitor', to: '/compliance/phi-access', icon: Search },
        { label: 'Audit Review', to: '/compliance/audit-review', icon: CheckSquare },
        { label: 'Access Reviews', to: '/compliance/access-reviews', icon: Users },
        { label: 'Export Logs', to: '/compliance/export-logs', icon: FileText },
        { label: 'Breach Alerts', to: '/compliance/breach-alerts', icon: ShieldCheck },
        { label: 'Retention', to: '/compliance/retention', icon: Clock },
        { label: 'Reports', to: '/compliance/reports', icon: BarChart3 },
        { label: 'Audit Chain', to: '/compliance/audit-chain', icon: ClipboardCheck },
      ],
    },
  ],
  'HR Staff': [
    {
      label: 'HR Portal',
      items: [
        { label: 'HR Dashboard', to: '/hr', icon: LayoutDashboard },
        { label: 'Employees', to: '/hr/employees', icon: Users },
        { label: 'Departments', to: '/hr/departments', icon: Briefcase },
        { label: 'Attendance', to: '/hr/attendance', icon: Clock },
        { label: 'Leave', to: '/hr/leave', icon: ClipboardCheck },
        { label: 'Payroll', to: '/hr/payroll', icon: CreditCard },
        { label: 'Licenses', to: '/hr/licenses', icon: ShieldCheck },
        { label: 'Branch Assignments', to: '/hr/branch-assignments', icon: GitMerge },
        { label: 'Termination', to: '/hr/termination', icon: User },
      ],
    },
  ],
  'Marketplace Admin': [
    {
      label: 'Marketplace Admin',
      items: [
        { label: 'Admin Dashboard', to: '/marketplace-admin', icon: LayoutDashboard },
        { label: 'Suppliers', to: '/marketplace-admin/suppliers', icon: Users },
        { label: 'Buyers', to: '/marketplace-admin/buyers', icon: User },
        { label: 'Listing Approval', to: '/marketplace-admin/listing-approval', icon: CheckSquare },
        { label: 'RFQ Monitor', to: '/marketplace-admin/rfq-monitor', icon: Search },
        { label: 'Order Monitor', to: '/marketplace-admin/order-monitor', icon: Package },
        { label: 'Reports', to: '/marketplace-admin/reports', icon: BarChart3 },
      ],
    },
  ],
};

/**
 * Fallback navigation for roles not explicitly defined above
 */
export const DEFAULT_NAV_GROUPS: NavGroup[] = [
  {
    label: 'Dashboard & Core',
    items: [
      { label: 'Command Center', to: '/', icon: LayoutDashboard },
      { label: 'Patient Management', to: '/patients', icon: Users, permission: 'patient.view' },
      { label: 'Appointment & Queue', to: '/queue', icon: ListOrdered, permission: 'queue.view' },
    ],
  },
  {
    label: 'Clinical Modules',
    items: [
      { label: 'EMR / Records', to: '/emr', icon: ClipboardList, permission: 'patient.view' },
      { label: 'Laboratory / LIS', to: '/lab/results', icon: FlaskConical, permission: 'lab.result.view' },
      { label: 'Pharmacy', to: '/pharmacy', icon: Pill, permission: 'inventory.stock.dispense' },
    ],
  },
  {
    label: 'Finance & Supply',
    items: [
      { label: 'Billing & Cashier', to: '/billing', icon: CreditCard, permission: 'billing.invoice.view' },
      { label: 'Inventory & Stock', to: '/inventory', icon: Package, permission: 'inventory.item.view' },
      { label: 'Procurement', to: '/procurement', icon: ShoppingBag, permission: 'inventory.stock.receive' },
    ],
  },
];
