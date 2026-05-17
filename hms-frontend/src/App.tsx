import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { AppShell } from './app/AppShell';
import { LoginPage } from './app/LoginPage';
import { ProtectedRoute } from './app/ProtectedRoute';
import { Dashboard } from './features/dashboard/Dashboard';
import { PatientList } from './features/patients/PatientList';
import { RegisterPatient } from './features/patients/RegisterPatient';
import { PatientProfile } from './features/patients/PatientProfile';
import { CreateOrder } from './features/orders/CreateOrder';
import { Billing } from './features/billing/Billing';
import { CashierClosing } from './features/billing/CashierClosing';
import { ApprovalCenter } from './features/approvals/ApprovalCenter';
import { AuditLogViewer } from './features/admin/AuditLogViewer';
import { UserList } from './features/admin/UserList';
import { UserDetail } from './features/admin/UserDetail';
import { RoleList } from './features/admin/RoleList';
import { RoleDetail } from './features/admin/RoleDetail';
import { Reports } from './features/reports/Reports';
import { Inventory } from './features/inventory/Inventory';
import { InventoryDetail } from './features/inventory/InventoryDetail';
import { StockReceiving } from './features/inventory/StockReceiving';
import { Queue } from './features/queue/Queue';
import { LabEncode } from './features/laboratory/LabEncode';
import { LabResultList } from './features/laboratory/LabResultList';
import { LabApproval } from './features/laboratory/LabApproval';
import { PrintPreview } from './features/laboratory/PrintPreview';

// Specialized Operational & Compliance Panels
import { EMRWorkspace } from './features/emr/EMRWorkspace';
import { PharmacyHub } from './features/pharmacy/PharmacyHub';
import { RadiologyCanvas } from './features/radiology/RadiologyCanvas';
import { HRManagement } from './features/hr/HRManagement';
import { ClaimsDashboard } from './features/claims/ClaimsDashboard';
import { PatientMergeRequests } from './features/admin/PatientMergeRequests';

import {
  SettingsDashboard,
  SettingsLayout,
  BranchSettings,
  DepartmentSettings,
  ServiceSettings,
  NumberingSettings,
  TemplateSettings,
  NotificationSettings,
  SecuritySettings,
} from './features/settings';
import {
  NotificationCenter,
  NotificationTemplates,
  NotificationSettingsPage,
} from './features/notifications';


const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/',
    element: <ProtectedRoute />,
    children: [
      {
        path: '/',
        element: <AppShell />,
        children: [
          { index: true, element: <Dashboard /> },
          { path: 'patients', element: <PatientList /> },
          { path: 'patients/new', element: <RegisterPatient /> },
          { path: 'patients/:id', element: <PatientProfile /> },
          { path: 'orders/new', element: <CreateOrder /> },
          { path: 'billing', element: <Billing /> },
          { path: 'billing/cashier-closing', element: <CashierClosing /> },
          { path: 'approvals', element: <ApprovalCenter /> },
          { path: 'audit-logs', element: <AuditLogViewer /> },
          { path: 'admin/users', element: <UserList /> },
          { path: 'admin/users/:id', element: <UserDetail /> },
          { path: 'admin/roles', element: <RoleList /> },
          { path: 'admin/roles/:id', element: <RoleDetail /> },
          {
            path: 'settings',
            element: <SettingsLayout />,
            children: [
              { index: true, element: <SettingsDashboard /> },
              { path: 'branches', element: <BranchSettings /> },
              { path: 'departments', element: <DepartmentSettings /> },
              { path: 'services', element: <ServiceSettings /> },
              { path: 'numbering', element: <NumberingSettings /> },
              { path: 'templates', element: <TemplateSettings /> },
              { path: 'notifications', element: <NotificationSettings /> },
              { path: 'security', element: <SecuritySettings /> },
            ],
          },
          { path: 'reports', element: <Reports /> },
          { path: 'inventory', element: <Inventory /> },
          { path: 'inventory/:id', element: <InventoryDetail /> },
          { path: 'inventory/receiving', element: <StockReceiving /> },
          { path: 'queue', element: <Queue /> },
          { path: 'lab/results', element: <LabResultList /> },
          { path: 'lab/results/:id/encode', element: <LabEncode /> },
          { path: 'lab/results/:id/approval', element: <LabApproval /> },
          { path: 'lab/results/:id/print-preview', element: <PrintPreview /> },
          { path: 'emr', element: <EMRWorkspace /> },
          { path: 'radiology', element: <RadiologyCanvas /> },
          { path: 'pharmacy', element: <PharmacyHub /> },
          { path: 'hr', element: <HRManagement /> },
          { path: 'claims', element: <ClaimsDashboard /> },
          { path: 'admin/patient-merges', element: <PatientMergeRequests /> },
          { path: 'notifications', element: <NotificationCenter /> },
          { path: 'notifications/templates', element: <NotificationTemplates /> },
          { path: 'notifications/settings', element: <NotificationSettingsPage /> },
        ],
      },
    ],
  },
]);

import { AuthProvider } from './hooks/use-user';

// ... (router definition)

export default function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  );
}
