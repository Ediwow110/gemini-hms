import {
  Activity,
  AlertOctagon,
  BarChart3,
  Box,
  Building,
  Calendar,
  CheckCircle2,
  CheckSquare,
  ClipboardCheck,
  ClipboardList,
  Clock,
  Coins,
  Cpu,
  CreditCard,
  Database,
  DollarSign,
  FileBadge,
  FilePlus,
  FileText,
  FlaskConical,
  GitMerge,
  History,
  Inbox,
  Key,
  LayoutDashboard,
  LifeBuoy,
  Link2,
  ListOrdered,
  Map,
  MessageSquare,
  Package,
  PackageCheck,
  Pill,
  Play,
  PlusCircle,
  Scale,
  Send,
  SettingsIcon,
  Sliders,
  ShieldAlert,
  ShieldCheck,
  ShoppingBag,
  ShoppingCart,
  Stethoscope,
  Terminal,
  TrendingUp,
  Trophy,
  Truck,
  UserCircle,
  UserX,
  Users,
  Wrench
} from 'lucide-react';
import { PERMISSIONS } from './permissions';

export interface NavItemConfig {
  label: string;
  to: string;
  icon: React.ElementType;
  permission?: string;
  allowedRoles?: string[];
  isBranchScoped?: boolean;
  zone?: 'staff' | 'patient' | 'marketplace' | 'public';
  isHiddenForDemo?: boolean;
  isComingSoon?: boolean;
  children?: NavItemConfig[];
}

export interface NavGroupConfig {
  label: string;
  items: NavItemConfig[];
}

export const roleNavigation: NavGroupConfig[] = [
  {
    label: 'Platform Control',
    items: [
      { label: 'SuperAdmin Dashboard', to: '/admin', icon: LayoutDashboard, allowedRoles: ['Super Admin'], zone: 'staff' },
      { label: 'Executive View', to: '/admin/executive', icon: Activity, allowedRoles: ['Super Admin'], zone: 'staff' },
      { label: 'Tenants Manager', to: '/admin/tenants', icon: Building, allowedRoles: ['Super Admin'], zone: 'staff' },
      { label: 'Branches Manager', to: '/admin/branches', icon: GitMerge, allowedRoles: ['Super Admin'], zone: 'staff' },
      { label: 'Users & Accounts', to: '/admin/users', icon: Users, allowedRoles: ['Super Admin', 'Admin'], zone: 'staff' },
      { label: 'Roles & Permissions', to: '/admin/roles-permissions', icon: ShieldCheck, allowedRoles: ['Super Admin', 'Admin'], zone: 'staff' },
    ],
  },
  {
    label: 'Security & Compliance',
    items: [
      { label: 'Security Center', to: '/admin/security', icon: ShieldAlert, allowedRoles: ['Super Admin'], zone: 'staff' },
      { label: 'System Audit Logs', to: '/admin/audit-logs', icon: History, allowedRoles: ['Super Admin'], zone: 'staff' },
      { label: 'My Audit Log', to: '/my-audit-log', icon: History, permission: PERMISSIONS.AUDIT_SELF, zone: 'staff' },
      { label: 'Access Reviews', to: '/compliance/access-reviews', icon: Users, allowedRoles: ['Super Admin', 'Compliance Officer'], zone: 'staff' },
      { label: 'PHI Access Monitor', to: '/compliance/phi-access', icon: Activity, allowedRoles: ['Super Admin', 'Compliance Officer'], zone: 'staff' },
    ],
  },
  {
    label: 'System Operations',
    items: [
      { label: 'Catalog Management', to: '/admin/catalog', icon: Database, allowedRoles: ['Super Admin'], zone: 'staff' },
      { label: 'Reports & Analytics', to: '/admin/reports', icon: BarChart3, allowedRoles: ['Super Admin'], zone: 'staff', isHiddenForDemo: true },
      {
        label: 'Organization Settings',
        to: '/settings',
        icon: SettingsIcon,
        allowedRoles: ['Super Admin'],
        zone: 'staff',
        children: [
          { label: 'Overview', to: '/settings', icon: Sliders, allowedRoles: ['Super Admin'], zone: 'staff' },
          { label: 'Branches', to: '/settings/branches', icon: Building, allowedRoles: ['Super Admin'], zone: 'staff' },
          { label: 'Departments', to: '/settings/departments', icon: Box, allowedRoles: ['Super Admin'], zone: 'staff' },
          { label: 'Services & Packages', to: '/settings/services', icon: Stethoscope, allowedRoles: ['Super Admin'], zone: 'staff' },
          { label: 'Numbering Rules', to: '/settings/numbering', icon: ListOrdered, allowedRoles: ['Super Admin'], zone: 'staff' },
          { label: 'Print Templates', to: '/settings/templates', icon: FileText, allowedRoles: ['Super Admin'], zone: 'staff' },
          { label: 'Notifications', to: '/settings/notifications', icon: MessageSquare, allowedRoles: ['Super Admin'], zone: 'staff' },
          { label: 'Security', to: '/settings/security', icon: ShieldCheck, allowedRoles: ['Super Admin'], zone: 'staff' },
          { label: 'Global System Config', to: '/admin/settings', icon: Sliders, allowedRoles: ['Super Admin'], zone: 'staff' },
        ],
      },
      { label: 'Integrations', to: '/integration', icon: Link2, allowedRoles: ['Super Admin', 'IT Support', 'Marketplace Admin', 'Branch Admin'], zone: 'staff', isHiddenForDemo: true },
      { label: 'Background Jobs', to: '/it/background-jobs', icon: Play, allowedRoles: ['Super Admin'], zone: 'staff' },
    ],
  },
  {
    label: 'Data Governance',
    items: [
      { label: 'Patient Merges', to: '/admin/patient-merges', icon: GitMerge, allowedRoles: ['Super Admin'], zone: 'staff', isHiddenForDemo: true },
      { label: 'Data Retention', to: '/compliance/retention', icon: Package, allowedRoles: ['Super Admin', 'Compliance Officer'], zone: 'staff' },
      { label: 'Audit Chain Verification', to: '/compliance/audit-chain', icon: CheckSquare, allowedRoles: ['Super Admin', 'Compliance Officer'], zone: 'staff' },
    ],
  },
  {
    label: 'Marketplace Governance',
    items: [
      { label: 'Admin Dashboard', to: '/marketplace-admin', icon: LayoutDashboard, allowedRoles: ['Super Admin', 'Marketplace Admin'], zone: 'marketplace' },
      { label: 'Supplier Management', to: '/marketplace-admin/suppliers', icon: Users, allowedRoles: ['Super Admin', 'Marketplace Admin'], zone: 'marketplace' },
      { label: 'Buyer Management', to: '/marketplace-admin/buyers', icon: UserCircle, allowedRoles: ['Super Admin', 'Marketplace Admin'], zone: 'marketplace' },
      { label: 'Listing Approval', to: '/marketplace-admin/listing-approval', icon: PackageCheck, allowedRoles: ['Super Admin', 'Marketplace Admin'], zone: 'marketplace' },
      { label: 'RFQ Monitor', to: '/marketplace-admin/rfq-monitor', icon: Send, allowedRoles: ['Super Admin', 'Marketplace Admin'], zone: 'marketplace' },
      { label: 'Order Monitor', to: '/marketplace-admin/order-monitor', icon: ShoppingBag, allowedRoles: ['Super Admin', 'Marketplace Admin'], zone: 'marketplace' },
      { label: 'Disputes', to: '/marketplace-admin/disputes', icon: AlertOctagon, allowedRoles: ['Super Admin', 'Marketplace Admin'], zone: 'marketplace' },
      { label: 'Commission & Fees', to: '/marketplace-admin/commission-fees', icon: DollarSign, allowedRoles: ['Super Admin', 'Marketplace Admin'], zone: 'marketplace', isHiddenForDemo: true },
      { label: 'Reports', to: '/marketplace-admin/reports', icon: BarChart3, allowedRoles: ['Super Admin', 'Marketplace Admin'], zone: 'marketplace', isHiddenForDemo: true },
    ],
  },
  {
    label: 'Clinical Operations',
    items: [
      { label: 'Ops Dashboard', to: '/clinical/ops', icon: LayoutDashboard, allowedRoles: ['Super Admin', 'Admin', 'Doctor', 'Nurse'], zone: 'staff', isBranchScoped: true, isHiddenForDemo: true },
    ],
  },
  {
    label: 'Branch Control',
    items: [
      {
        label: 'Branch Dashboard',
        to: '/branch-admin',
        icon: LayoutDashboard,
        allowedRoles: ['Super Admin', 'Branch Admin'],
        zone: 'staff',
        isBranchScoped: true,
        children: [
          { label: 'Overview', to: '/branch-admin', icon: LayoutDashboard, allowedRoles: ['Super Admin', 'Branch Admin'], zone: 'staff', isBranchScoped: true },
          { label: 'Branch Staff', to: '/branch-admin/staff', icon: Users, allowedRoles: ['Super Admin', 'Branch Admin'], zone: 'staff', isBranchScoped: true, isHiddenForDemo: true, isComingSoon: true },
          { label: 'Department Manager', to: '/branch-admin/departments', icon: Building, allowedRoles: ['Super Admin', 'Branch Admin'], zone: 'staff', isBranchScoped: true, isHiddenForDemo: true, isComingSoon: true },
          { label: 'Rooms / Facilities', to: '/branch-admin/rooms', icon: Map, allowedRoles: ['Super Admin', 'Branch Admin'], zone: 'staff', isBranchScoped: true, isHiddenForDemo: true, isComingSoon: true },
          { label: 'Schedules', to: '/branch-admin/schedules', icon: Calendar, allowedRoles: ['Super Admin', 'Branch Admin'], zone: 'staff', isBranchScoped: true, isHiddenForDemo: true, isComingSoon: true },
        ],
      },
      {
        label: 'Operational Setup',
        to: '/branch-admin/services',
        icon: PlusCircle,
        allowedRoles: ['Super Admin', 'Branch Admin'],
        zone: 'staff',
        isBranchScoped: true,
        isHiddenForDemo: true,
        isComingSoon: true,
        children: [
          { label: 'Branch Services', to: '/branch-admin/services', icon: PlusCircle, allowedRoles: ['Super Admin', 'Branch Admin'], zone: 'staff', isBranchScoped: true, isHiddenForDemo: true, isComingSoon: true },
          { label: 'Branch Equipment', to: '/branch-admin/equipment', icon: Wrench, allowedRoles: ['Super Admin', 'Branch Admin'], zone: 'staff', isBranchScoped: true, isHiddenForDemo: true, isComingSoon: true },
          { label: 'Inventory Rules', to: '/branch-admin/inventory-rules', icon: Package, allowedRoles: ['Super Admin', 'Branch Admin'], zone: 'staff', isBranchScoped: true, isHiddenForDemo: true, isComingSoon: true },
          { label: 'Billing Rules', to: '/branch-admin/billing-rules', icon: CreditCard, allowedRoles: ['Super Admin', 'Branch Admin'], zone: 'staff', isBranchScoped: true, isHiddenForDemo: true, isComingSoon: true },
          { label: 'Queue Settings', to: '/branch-admin/queue-settings', icon: ListOrdered, allowedRoles: ['Super Admin', 'Branch Admin'], zone: 'staff', isBranchScoped: true, isHiddenForDemo: true, isComingSoon: true },
        ],
      },
    ],
  },
  {
    label: 'Governance',
    items: [
      { label: 'Approvals', to: '/branch-admin/approvals', icon: CheckSquare, allowedRoles: ['Super Admin', 'Branch Admin'], zone: 'staff', isHiddenForDemo: true, isComingSoon: true },
      { label: 'Branch Reports', to: '/reports', icon: BarChart3, allowedRoles: ['Super Admin', 'Branch Admin'], zone: 'staff', isHiddenForDemo: true },
      { label: 'Branch Audit Logs', to: '/audit-logs', icon: History, allowedRoles: ['Super Admin', 'Branch Admin'], zone: 'staff' },
      {
        label: 'Branch Settings',
        to: '/settings',
        icon: SettingsIcon,
        allowedRoles: ['Super Admin'],
        zone: 'staff',
        children: [
          { label: 'Overview', to: '/settings', icon: Sliders, allowedRoles: ['Super Admin'], zone: 'staff' },
          { label: 'Branches', to: '/settings/branches', icon: Building, allowedRoles: ['Super Admin'], zone: 'staff' },
          { label: 'Departments', to: '/settings/departments', icon: Box, allowedRoles: ['Super Admin'], zone: 'staff' },
          { label: 'Services & Packages', to: '/settings/services', icon: Stethoscope, allowedRoles: ['Super Admin'], zone: 'staff' },
          { label: 'Numbering Rules', to: '/settings/numbering', icon: ListOrdered, allowedRoles: ['Super Admin'], zone: 'staff' },
          { label: 'Print Templates', to: '/settings/templates', icon: FileText, allowedRoles: ['Super Admin'], zone: 'staff' },
          { label: 'Notifications', to: '/settings/notifications', icon: MessageSquare, allowedRoles: ['Super Admin'], zone: 'staff' },
          { label: 'Security', to: '/settings/security', icon: ShieldCheck, allowedRoles: ['Super Admin'], zone: 'staff' },
        ],
      },
    ],
  },
  {
    label: 'Compliance Workspace',
    items: [
      {
        label: 'Compliance Dashboard',
        to: '/compliance',
        icon: LayoutDashboard,
        allowedRoles: ['Compliance Officer'],
        zone: 'staff',
        children: [
          { label: 'Overview', to: '/compliance', icon: LayoutDashboard, allowedRoles: ['Compliance Officer'], zone: 'staff' },
          { label: 'My Audit Log', to: '/my-audit-log', icon: History, permission: PERMISSIONS.AUDIT_SELF, allowedRoles: ['Compliance Officer'], zone: 'staff' },
          { label: 'PHI Access Monitor', to: '/compliance/phi-access', icon: Activity, allowedRoles: ['Compliance Officer'], zone: 'staff' },
          { label: 'Audit Log Review', to: '/compliance/audit-review', icon: ClipboardList, allowedRoles: ['Compliance Officer'], zone: 'staff' },
          { label: 'Access Reviews', to: '/compliance/access-reviews', icon: Users, allowedRoles: ['Compliance Officer'], zone: 'staff' },
          { label: 'Data Export Logs', to: '/compliance/export-logs', icon: History, allowedRoles: ['Compliance Officer'], zone: 'staff' },
          { label: 'Breach Incidents', to: '/compliance/breach-alerts', icon: ShieldAlert, allowedRoles: ['Compliance Officer'], zone: 'staff' },
          { label: 'Data Retention', to: '/compliance/retention', icon: Package, allowedRoles: ['Compliance Officer'], zone: 'staff' },
          { label: 'Compliance Reports', to: '/compliance/reports', icon: FileText, allowedRoles: ['Compliance Officer'], zone: 'staff' },
          { label: 'Audit Chain Verification', to: '/compliance/audit-chain', icon: CheckSquare, allowedRoles: ['Compliance Officer'], zone: 'staff' },
        ],
      },
    ],
  },
  {
    label: 'IT Workspace',
    items: [
      {
        label: 'IT Support Dashboard',
        to: '/it',
        icon: LayoutDashboard,
        allowedRoles: ['IT Support'],
        zone: 'staff',
        children: [
          { label: 'Overview', to: '/it', icon: LayoutDashboard, allowedRoles: ['IT Support'], zone: 'staff' },
          { label: 'My Audit Log', to: '/my-audit-log', icon: History, permission: PERMISSIONS.AUDIT_SELF, allowedRoles: ['IT Support'], zone: 'staff' },
          { label: 'System Health Monitor', to: '/it/system-health', icon: Cpu, allowedRoles: ['IT Support'], zone: 'staff' },
          { label: 'User Support Queue', to: '/it/user-support', icon: LifeBuoy, allowedRoles: ['IT Support'], zone: 'staff' },
          { label: 'Active User Sessions', to: '/it/sessions', icon: Key, allowedRoles: ['IT Support'], zone: 'staff' },
          { label: 'Background Job Monitor', to: '/it/background-jobs', icon: Play, allowedRoles: ['IT Support'], zone: 'staff' },
          { label: 'System Integrations', to: '/it/integrations', icon: Link2, allowedRoles: ['IT Support'], zone: 'staff' },
          { label: 'System Audit Logs', to: '/it/logs', icon: Terminal, allowedRoles: ['IT Support'], zone: 'staff' },
          { label: 'Backup & Recovery', to: '/it/backup-restore', icon: Database, allowedRoles: ['IT Support'], zone: 'staff', isHiddenForDemo: true },
          { label: 'Incident Desk', to: '/it/incidents', icon: AlertOctagon, allowedRoles: ['IT Support'], zone: 'staff', isHiddenForDemo: true },
        ],
      },
    ],
  },
  {
    label: 'HR Workspace',
    items: [
      {
        label: 'HR Dashboard',
        to: '/hr',
        icon: LayoutDashboard,
        allowedRoles: ['HR Manager', 'HR Staff'],
        zone: 'staff',
        children: [
          { label: 'Overview', to: '/hr', icon: LayoutDashboard, allowedRoles: ['HR Manager', 'HR Staff'], zone: 'staff' },
          { label: 'Employee Directory', to: '/hr/employees', icon: Users, allowedRoles: ['HR Manager'], zone: 'staff' },
          { label: 'Department Manager', to: '/hr/departments', icon: Building, allowedRoles: ['HR Manager', 'HR Staff'], zone: 'staff' },
          { label: 'Attendance Tracking', to: '/hr/attendance', icon: Clock, allowedRoles: ['HR Manager', 'HR Staff'], zone: 'staff', isHiddenForDemo: true },
          { label: 'Leave Management', to: '/hr/leave', icon: Calendar, allowedRoles: ['HR Manager', 'HR Staff'], zone: 'staff' },
          { label: 'Payroll Console', to: '/hr/payroll', icon: DollarSign, allowedRoles: ['HR Manager', 'HR Staff'], zone: 'staff', isHiddenForDemo: true },
          { label: 'Licenses & Certs', to: '/hr/licenses', icon: ShieldCheck, allowedRoles: ['HR Manager', 'HR Staff'], zone: 'staff' },
          { label: 'Branch Assignments', to: '/hr/branch-assignments', icon: GitMerge, allowedRoles: ['HR Manager'], zone: 'staff' },
          { label: 'Termination Desk', to: '/hr/termination', icon: UserX, allowedRoles: ['HR Manager'], zone: 'staff' },
        ],
      },
    ],
  },
  {
    label: 'Procurement Workspace',
    items: [
      {
        label: 'Procurement Dashboard',
        to: '/procurement',
        icon: LayoutDashboard,
        allowedRoles: ['Procurement Manager', 'Procurement Agent', 'Procurement Officer'],
        zone: 'staff',
        children: [
          { label: 'Overview', to: '/procurement', icon: LayoutDashboard, allowedRoles: ['Procurement Manager', 'Procurement Agent', 'Procurement Officer'], zone: 'staff' },
          { label: 'Supplier Directory', to: '/procurement/suppliers', icon: Truck, allowedRoles: ['Procurement Manager', 'Procurement Agent', 'Procurement Officer'], zone: 'staff' },
          { label: 'Purchase Requests', to: '/procurement/purchase-requests', icon: FilePlus, allowedRoles: ['Procurement Manager', 'Procurement Agent', 'Procurement Officer'], zone: 'staff' },
          { label: 'RFQ Manager', to: '/procurement/rfqs', icon: Send, allowedRoles: ['Procurement Manager', 'Procurement Agent', 'Procurement Officer'], zone: 'staff' },
          { label: 'Quotes & Bids', to: '/procurement/quotes', icon: DollarSign, allowedRoles: ['Procurement Manager', 'Procurement Agent', 'Procurement Officer'], zone: 'staff' },
          { label: 'Purchase Orders', to: '/procurement/purchase-orders', icon: ShoppingBag, allowedRoles: ['Procurement Manager', 'Procurement Agent', 'Procurement Officer'], zone: 'staff', isHiddenForDemo: true },
          { label: 'Receiving Dock', to: '/procurement/receiving', icon: PackageCheck, allowedRoles: ['Procurement Manager', 'Procurement Agent', 'Procurement Officer'], zone: 'staff' },
          { label: 'Inventory Requests', to: '/procurement/inventory-requests', icon: Inbox, allowedRoles: ['Procurement Manager', 'Procurement Agent', 'Procurement Officer'], zone: 'staff' },
          { label: 'Vendor Performance', to: '/procurement/vendor-performance', icon: Trophy, allowedRoles: ['Procurement Manager', 'Procurement Agent', 'Procurement Officer'], zone: 'staff' },
        ],
      },
    ],
  },
  {
    label: 'Pharmacy Workspace',
    items: [
      { label: 'Dispensing Hub', to: '/pharmacy', icon: Pill, permission: PERMISSIONS.INVENTORY_DISPENSE, allowedRoles: ['Pharmacist'], zone: 'staff', isBranchScoped: true },
      { label: 'Pharmacy Dashboard', to: '/pharmacy/dashboard', icon: LayoutDashboard, permission: PERMISSIONS.INVENTORY_VIEW, allowedRoles: ['Pharmacist'], zone: 'staff', isBranchScoped: true },
    ],
  },
  {
    label: 'Inventory & Stock',
    items: [
      {
        label: 'Catalog',
        to: '/inventory',
        icon: Package,
        permission: PERMISSIONS.INVENTORY_VIEW,
        allowedRoles: ['Super Admin', 'Branch Admin', 'Pharmacist'],
        zone: 'staff',
        isBranchScoped: true,
      },
    ],
  },
  {
    label: 'Marketplace (Buyer)',
    items: [
      { label: 'Marketplace Home', to: '/marketplace', icon: ShoppingCart, allowedRoles: ['Marketplace Buyer', 'Customer'], zone: 'marketplace' },
      { label: 'Product Catalog', to: '/marketplace/products', icon: Box, allowedRoles: ['Marketplace Buyer', 'Customer'], zone: 'marketplace' },
      { label: 'My RFQs', to: '/marketplace/rfqs', icon: FileText, allowedRoles: ['Marketplace Buyer', 'Customer'], zone: 'marketplace' },
      { label: 'Track Orders', to: '/marketplace/orders', icon: Package, allowedRoles: ['Marketplace Buyer', 'Customer'], zone: 'marketplace' },
      { label: 'Installations', to: '/marketplace/installations', icon: Wrench, allowedRoles: ['Marketplace Buyer', 'Customer'], zone: 'marketplace' },
      { label: 'Warranties', to: '/marketplace/warranty', icon: ShieldCheck, allowedRoles: ['Marketplace Buyer', 'Customer'], zone: 'marketplace' },
      { label: 'Service Desk', to: '/marketplace/service-tickets', icon: Clock, allowedRoles: ['Marketplace Buyer', 'Customer'], zone: 'marketplace' },
    ],
  },
  {
    label: 'Marketplace (Supplier)',
    items: [
      {
        label: 'Supplier Dashboard',
        to: '/supplier',
        icon: LayoutDashboard,
        allowedRoles: ['Supplier', 'Supplier Admin', 'Marketplace Supplier'],
        zone: 'marketplace',
        children: [
          { label: 'Overview', to: '/supplier', icon: LayoutDashboard, allowedRoles: ['Supplier', 'Supplier Admin', 'Marketplace Supplier'], zone: 'marketplace' },
          { label: 'Product Listings', to: '/supplier/listings', icon: Package, allowedRoles: ['Supplier', 'Supplier Admin', 'Marketplace Supplier'], zone: 'marketplace' },
          { label: 'Service Offerings', to: '/supplier/service-listings', icon: Wrench, allowedRoles: ['Supplier', 'Supplier Admin', 'Marketplace Supplier'], zone: 'marketplace' },
          { label: 'RFQ Inbox', to: '/supplier/rfq-inbox', icon: FileText, allowedRoles: ['Supplier', 'Supplier Admin', 'Marketplace Supplier'], zone: 'marketplace' },
          { label: 'My Quotes', to: '/supplier/quotes', icon: DollarSign, allowedRoles: ['Supplier', 'Supplier Admin', 'Marketplace Supplier'], zone: 'marketplace' },
          { label: 'Manage Orders', to: '/supplier/orders', icon: ShoppingBag, allowedRoles: ['Supplier', 'Supplier Admin', 'Marketplace Supplier'], zone: 'marketplace' },
          { label: 'Fulfillment Dock', to: '/supplier/fulfillment', icon: Truck, allowedRoles: ['Supplier', 'Supplier Admin', 'Marketplace Supplier'], zone: 'marketplace' },
          { label: 'Warranty Claims', to: '/supplier/warranty-claims', icon: ShieldCheck, allowedRoles: ['Supplier', 'Supplier Admin', 'Marketplace Supplier'], zone: 'marketplace' },
          { label: 'Service Commitments', to: '/supplier/service-commitments', icon: Clock, allowedRoles: ['Supplier', 'Supplier Admin', 'Marketplace Supplier'], zone: 'marketplace' },
          { label: 'Payouts & Ledger', to: '/supplier/payouts', icon: DollarSign, allowedRoles: ['Supplier', 'Supplier Admin', 'Marketplace Supplier'], zone: 'marketplace' },
          { label: 'Performance', to: '/supplier/performance', icon: Trophy, allowedRoles: ['Supplier', 'Supplier Admin', 'Marketplace Supplier'], zone: 'marketplace' },
        ],
      },
    ],
  },
  {
    label: 'Field Service (Logistics)',
    items: [
      { label: 'Service Dashboard', to: '/field-service', icon: LayoutDashboard, permission: PERMISSIONS.FIELD_SERVICE_MANAGE, zone: 'staff', isBranchScoped: true, isHiddenForDemo: true },
      { label: 'Delivery Jobs', to: '/field-service/deliveries', icon: Truck, permission: PERMISSIONS.FIELD_SERVICE_MANAGE, zone: 'staff', isBranchScoped: true },
      { label: 'Installations', to: '/field-service/installations', icon: Wrench, permission: PERMISSIONS.FIELD_SERVICE_MANAGE, zone: 'staff', isBranchScoped: true },
      { label: 'My Schedule', to: '/field-service/schedule', icon: Calendar, permission: PERMISSIONS.FIELD_SERVICE_MANAGE, zone: 'staff', isBranchScoped: true },
      { label: 'Handover Checklists', to: '/field-service/handover', icon: ClipboardCheck, permission: PERMISSIONS.FIELD_SERVICE_MANAGE, zone: 'staff', isBranchScoped: true },
      { label: 'Proof of Delivery', to: '/field-service/proof-of-delivery', icon: FileBadge, permission: PERMISSIONS.FIELD_SERVICE_MANAGE, zone: 'staff', isBranchScoped: true },
      { label: 'Warranty Activation', to: '/field-service/warranty-activation', icon: ShieldCheck, permission: PERMISSIONS.FIELD_SERVICE_MANAGE, zone: 'staff', isBranchScoped: true },
      { label: 'Preventive Maintenance', to: '/field-service/preventive-maintenance', icon: SettingsIcon, permission: PERMISSIONS.FIELD_SERVICE_MANAGE, zone: 'staff', isBranchScoped: true },
      { label: 'Service Worklog', to: '/field-service/service-worklog', icon: FileText, permission: PERMISSIONS.FIELD_SERVICE_MANAGE, zone: 'staff', isBranchScoped: true },
      { label: 'Offline Sync', to: '/field-service/offline-sync', icon: GitMerge, permission: PERMISSIONS.FIELD_SERVICE_MANAGE, zone: 'staff', isBranchScoped: true },
    ],
  },
  {
    label: 'Patient Workspace',
    items: [
      { label: 'My Dashboard', to: '/patient', icon: LayoutDashboard, allowedRoles: ['Patient'], zone: 'patient' },
      { label: 'Appointments', to: '/patient/appointments', icon: Calendar, allowedRoles: ['Patient'], zone: 'patient' },
      { label: 'Lab Results', to: '/patient/lab-results', icon: FlaskConical, allowedRoles: ['Patient'], zone: 'patient' },
      { label: 'Prescriptions', to: '/patient/prescriptions', icon: Pill, allowedRoles: ['Patient'], zone: 'patient' },
      { label: 'Billing & Payments', to: '/patient/billing', icon: CreditCard, allowedRoles: ['Patient'], zone: 'patient' },
      { label: 'Medical Records', to: '/patient/medical-records', icon: FileBadge, allowedRoles: ['Patient'], zone: 'patient' },
      { label: 'Messages', to: '/patient/messages', icon: MessageSquare, allowedRoles: ['Patient'], zone: 'patient' },
      { label: 'My Profile', to: '/patient/profile', icon: UserCircle, allowedRoles: ['Patient'], zone: 'patient' },
    ],
  },
  {
    label: 'Doctor Workspace',
    items: [
      { label: 'Doctor Dashboard', to: '/doctor', icon: LayoutDashboard, allowedRoles: ['Doctor'], zone: 'staff', isBranchScoped: true },
      { label: 'Patient Queue', to: '/doctor/queue', icon: ListOrdered, allowedRoles: ['Doctor'], zone: 'staff', isBranchScoped: true },
      { label: 'Patient Directory', to: '/doctor/patients', icon: Users, allowedRoles: ['Doctor'], zone: 'staff', isBranchScoped: true },
      { label: 'EMR Charting', to: '/doctor/emr', icon: Stethoscope, allowedRoles: ['Doctor'], zone: 'staff', isBranchScoped: true },
    ],
  },
  {
    label: 'Nurse Workspace',
    items: [
      { label: 'Nurse Dashboard', to: '/nurse', icon: LayoutDashboard, allowedRoles: ['Nurse'], zone: 'staff', isBranchScoped: true },
      { label: 'Triage Queue', to: '/nurse/triage', icon: ListOrdered, allowedRoles: ['Nurse'], zone: 'staff', isBranchScoped: true },
      { label: 'Patient Intake', to: '/nurse/intake', icon: PlusCircle, allowedRoles: ['Nurse'], zone: 'staff', isBranchScoped: true },
      { label: 'Vitals Logging', to: '/nurse/vitals', icon: Activity, allowedRoles: ['Nurse'], zone: 'staff', isBranchScoped: true },
      { label: 'Nursing Tasks', to: '/nurse/tasks', icon: CheckSquare, allowedRoles: ['Nurse'], zone: 'staff', isBranchScoped: true },
      { label: 'Specimen Collection', to: '/nurse/specimens', icon: FlaskConical, allowedRoles: ['Nurse'], zone: 'staff', isBranchScoped: true },
    ],
  },
  {
    label: 'Lab Workspace',
    items: [
      { label: 'Lab Dashboard', to: '/lab', icon: LayoutDashboard, allowedRoles: ['Lab Technician', 'Med-Tech'], zone: 'staff', isBranchScoped: true },
      { label: 'LIS Orders', to: '/lab/orders', icon: ListOrdered, allowedRoles: ['Lab Technician', 'Med-Tech'], zone: 'staff', isBranchScoped: true, isHiddenForDemo: true },
      { label: 'Specimen Receiving', to: '/lab/specimens', icon: FlaskConical, allowedRoles: ['Lab Technician', 'Med-Tech'], zone: 'staff', isBranchScoped: true },
      { label: 'Result Entry', to: '/lab/encoding', icon: FileText, allowedRoles: ['Lab Technician', 'Med-Tech'], zone: 'staff', isBranchScoped: true },
      { label: 'QA Verification', to: '/lab/validation', icon: ClipboardCheck, allowedRoles: ['Lab Technician', 'Med-Tech'], zone: 'staff', isBranchScoped: true },
      { label: 'Pending Release', to: '/lab/validated', icon: Send, allowedRoles: ['Lab Technician', 'Med-Tech'], zone: 'staff', isBranchScoped: true, isHiddenForDemo: true },
      { label: 'Released Results', to: '/lab/released', icon: CheckCircle2, allowedRoles: ['Lab Technician', 'Med-Tech'], zone: 'staff', isBranchScoped: true, isHiddenForDemo: true },
      { label: 'Critical Alerts', to: '/lab/critical-results', icon: ShieldAlert, allowedRoles: ['Lab Technician', 'Med-Tech'], zone: 'staff', isBranchScoped: true },
      { label: 'TAT SLA Monitor', to: '/lab/turnaround', icon: TrendingUp, allowedRoles: ['Lab Technician', 'Med-Tech'], zone: 'staff', isBranchScoped: true },
    ],
  },
  {
    label: 'Cashier Workspace',
    items: [
      { label: 'Cashier Dashboard', to: '/cashier', icon: LayoutDashboard, allowedRoles: ['Cashier', 'Finance'], zone: 'staff', isBranchScoped: true },
      { label: 'Patient Billing', to: '/cashier/billing', icon: CreditCard, allowedRoles: ['Cashier', 'Finance'], zone: 'staff', isBranchScoped: true },
      { label: 'POS Invoices', to: '/cashier/invoices', icon: FileText, allowedRoles: ['Cashier', 'Finance'], zone: 'staff', isBranchScoped: true },
      { label: 'Session Receipts', to: '/cashier/payments', icon: History, allowedRoles: ['Cashier', 'Finance'], zone: 'staff', isBranchScoped: true },
      { label: 'Drawer Session', to: '/cashier/session', icon: Coins, allowedRoles: ['Cashier', 'Finance'], zone: 'staff', isBranchScoped: true },
      { label: 'Voids & Refunds', to: '/cashier/refunds-voids', icon: ShieldAlert, allowedRoles: ['Cashier', 'Finance'], zone: 'staff', isBranchScoped: true },
      { label: 'HMO Claims', to: '/cashier/hmo-claims', icon: ShieldCheck, allowedRoles: ['Cashier', 'Finance'], zone: 'staff', isBranchScoped: true },
      { label: 'Reconciliation', to: '/cashier/reconciliation', icon: Scale, allowedRoles: ['Cashier', 'Finance'], zone: 'staff', isBranchScoped: true },
    ],
  },
  {
    label: 'Queue Workspace',
    items: [
      { label: 'Patient Queue', to: '/queue', icon: ListOrdered, allowedRoles: ['Receptionist'], zone: 'staff', isBranchScoped: true },
    ],
  },
  {
    label: 'Dashboard & Core',
    items: [
      { label: 'Command Center', to: '/', icon: LayoutDashboard, allowedRoles: ['Super Admin', 'Branch Admin', 'Admin'], zone: 'staff' },
      { label: 'Spatial Tracking', to: '/spatial', icon: Map, permission: 'it.system.view', zone: 'staff' },
    ],
  },
];
