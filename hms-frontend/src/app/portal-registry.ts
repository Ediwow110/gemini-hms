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
  icon: any;
  permission?: string;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

export const PORTAL_PATHS: Record<string, string> = {
  'Super Admin': '/admin',
  'Branch Admin': '/',
  'Receptionist': '/queue',
  'Cashier': '/cashier',
  'Med-Tech': '/lab',
  'Doctor': '/doctor',
  'Pharmacist': '/pharmacy',
  'Nurse': '/nurse',
  'Patient': '/patient',
  'Supplier': '/supplier',
  'Procurement Officer': '/procurement',
  'HR Staff': '/hr',
  'HR Manager': '/hr',
  'IT Support': '/it',
  'Compliance Officer': '/compliance',
  'Field Technician': '/field-service',
  'Marketplace Admin': '/marketplace-admin',
};

const ROLE_PRIORITY: Record<string, number> = {
  'Super Admin': 100,
  'Branch Admin': 90,
  'Procurement Officer': 85,
  'HR Manager': 80,
  'Compliance Officer': 75,
  'Marketplace Admin': 70,
  'Doctor': 60,
  'Nurse': 55,
  'Pharmacist': 50,
  'Med-Tech': 45,
  'Cashier': 40,
  'Receptionist': 35,
  'IT Support': 30,
  'Field Technician': 25,
  'HR Staff': 20,
  'Supplier': 15,
  'Patient': 10,
};

export function getDefaultPortalPath(roles: string[]): string {
  if (!roles || roles.length === 0) return '/';
  
  let bestRole = '';
  let maxPriority = -1;

  for (const role of roles) {
    const priority = ROLE_PRIORITY[role] || 0;
    if (priority > maxPriority) {
      maxPriority = priority;
      bestRole = role;
    }
  }

  return PORTAL_PATHS[bestRole] || '/';
}

export function getNavGroups(roles: string[]): NavGroup[] {
  if (!roles || roles.length === 0) return DEFAULT_NAV_GROUPS;

  // Sort roles by priority descending
  const sortedRoles = [...roles].sort((a, b) => (ROLE_PRIORITY[b] || 0) - (ROLE_PRIORITY[a] || 0));

  for (const role of sortedRoles) {
    if (PORTAL_NAV_CONFIG[role]) {
      return PORTAL_NAV_CONFIG[role];
    }
  }

  return DEFAULT_NAV_GROUPS;
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
        { label: 'Catalog Manage', to: '/catalog', icon: ListOrdered, permission: 'catalog.manage' },
        { label: 'Reports', to: '/reports', icon: BarChart3, permission: 'report.export' },
        { label: 'Settings', to: '/settings', icon: SettingsIcon, permission: 'admin.role.change' },
      ],
    },
  ],
  'Branch Admin': [
    {
      label: 'Core Operations',
      items: [
        { label: 'Command Center', to: '/', icon: LayoutDashboard },
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
        { label: 'Purchase Requests', to: '/procurement/requests', icon: FileText },
        { label: 'Purchase Orders', to: '/procurement/orders', icon: Package },
      ],
    },
  ],
  'Field Technician': [
    {
      label: 'Field Service',
      items: [
        { label: 'My Jobs', to: '/field-service', icon: Zap },
        { label: 'Active Tasks', to: '/field-service/tasks', icon: CheckSquare },
        { label: 'Installations', to: '/field-service/installations', icon: Box },
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
