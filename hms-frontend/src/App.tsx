import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import { AppShell } from './app/AppShell';
import { LoginPage } from './app/LoginPage';
import { ProtectedRoute } from './app/ProtectedRoute';

// Core routes — eagerly loaded (always needed)
import { Dashboard } from './features/dashboard/Dashboard';
import { PatientList } from './features/patients/PatientList';
import { RegisterPatient } from './features/patients/RegisterPatient';
import { PatientProfile } from './features/patients/PatientProfile';
import { CreateOrder } from './features/orders/CreateOrder';
import { Queue } from './features/queue/Queue';

// Lazy-loaded — split by feature/portal (named exports need .then() adapter)
const Billing = lazy(() => import('./features/billing/Billing').then(m => ({ default: m.Billing })));
const CashierClosing = lazy(() => import('./features/billing/CashierClosing').then(m => ({ default: m.CashierClosing })));
const ApprovalCenter = lazy(() => import('./features/approvals/ApprovalCenter').then(m => ({ default: m.ApprovalCenter })));
const AuditLogViewer = lazy(() => import('./features/admin/AuditLogViewer').then(m => ({ default: m.AuditLogViewer })));
const UserList = lazy(() => import('./features/admin/UserList').then(m => ({ default: m.UserList })));
const UserDetail = lazy(() => import('./features/admin/UserDetail').then(m => ({ default: m.UserDetail })));
const RoleList = lazy(() => import('./features/admin/RoleList').then(m => ({ default: m.RoleList })));
const RoleDetail = lazy(() => import('./features/admin/RoleDetail').then(m => ({ default: m.RoleDetail })));
const Reports = lazy(() => import('./features/reports/Reports').then(m => ({ default: m.Reports })));
const Inventory = lazy(() => import('./features/inventory/Inventory').then(m => ({ default: m.Inventory })));
const InventoryDetail = lazy(() => import('./features/inventory/InventoryDetail').then(m => ({ default: m.InventoryDetail })));
const StockReceiving = lazy(() => import('./features/inventory/StockReceiving').then(m => ({ default: m.StockReceiving })));
const LabEncode = lazy(() => import('./features/laboratory/LabEncode').then(m => ({ default: m.LabEncode })));
const LabResultList = lazy(() => import('./features/laboratory/LabResultList').then(m => ({ default: m.LabResultList })));
const LabApproval = lazy(() => import('./features/laboratory/LabApproval').then(m => ({ default: m.LabApproval })));
const PrintPreview = lazy(() => import('./features/laboratory/PrintPreview').then(m => ({ default: m.PrintPreview })));
const ValidatedResultsPage = lazy(() => import('./portals/lab/ValidatedResultsPage').then(m => ({ default: m.ValidatedResultsPage })));
const ReleasedResultsPage = lazy(() => import('./portals/lab/ReleasedResultsPage').then(m => ({ default: m.ReleasedResultsPage })));
const ReleasedResultDetailPage = lazy(() => import('./portals/lab/ReleasedResultDetailPage').then(m => ({ default: m.ReleasedResultDetailPage })));

// Specialized Operational & Compliance Panels
const EMRWorkspace = lazy(() => import('./features/emr/EMRWorkspace').then(m => ({ default: m.EMRWorkspace })));
const PharmacyHub = lazy(() => import('./features/pharmacy/PharmacyHub').then(m => ({ default: m.PharmacyHub })));
const RadiologyCanvas = lazy(() => import('./features/radiology/RadiologyCanvas').then(m => ({ default: m.RadiologyCanvas })));
const HRManagement = lazy(() => import('./features/hr/HRManagement').then(m => ({ default: m.HRManagement })));
const ClaimsDashboard = lazy(() => import('./features/claims/ClaimsDashboard').then(m => ({ default: m.ClaimsDashboard })));
const PatientMergeRequests = lazy(() => import('./features/admin/PatientMergeRequests').then(m => ({ default: m.PatientMergeRequests })));

// Settings (nested routes — lazy load the layout and all children)
const SettingsLayout = lazy(() => import('./features/settings').then(m => ({ default: m.SettingsLayout })));
const SettingsDashboard = lazy(() => import('./features/settings').then(m => ({ default: m.SettingsDashboard })));
const BranchSettings = lazy(() => import('./features/settings').then(m => ({ default: m.BranchSettings })));
const DepartmentSettings = lazy(() => import('./features/settings').then(m => ({ default: m.DepartmentSettings })));
const ServiceSettings = lazy(() => import('./features/settings').then(m => ({ default: m.ServiceSettings })));
const NumberingSettings = lazy(() => import('./features/settings').then(m => ({ default: m.NumberingSettings })));
const TemplateSettings = lazy(() => import('./features/settings').then(m => ({ default: m.TemplateSettings })));
const NotificationSettings = lazy(() => import('./features/settings').then(m => ({ default: m.NotificationSettings })));
const SecuritySettings = lazy(() => import('./features/settings').then(m => ({ default: m.SecuritySettings })));

const NotificationCenter = lazy(() => import('./features/notifications').then(m => ({ default: m.NotificationCenter })));
const NotificationTemplates = lazy(() => import('./features/notifications').then(m => ({ default: m.NotificationTemplates })));
const NotificationSettingsPage = lazy(() => import('./features/notifications').then(m => ({ default: m.NotificationSettingsPage })));

// Suspense fallback component
const LazyPage = ({ children }: { children: React.ReactNode }) => (
  <Suspense fallback={
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="animate-spin h-8 w-8 border-4 border-indigo-500 border-t-transparent rounded-full" />
    </div>
  }>
    {children}
  </Suspense>
);


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
          { path: 'queue', element: <Queue /> },
          // Lazy-loaded routes below
          { path: 'billing', element: <LazyPage><Billing /></LazyPage> },
          { path: 'billing/cashier-closing', element: <LazyPage><CashierClosing /></LazyPage> },
          { path: 'approvals', element: <LazyPage><ApprovalCenter /></LazyPage> },
          { path: 'audit-logs', element: <LazyPage><AuditLogViewer /></LazyPage> },
          { path: 'admin/users', element: <LazyPage><UserList /></LazyPage> },
          { path: 'admin/users/:id', element: <LazyPage><UserDetail /></LazyPage> },
          { path: 'admin/roles', element: <LazyPage><RoleList /></LazyPage> },
          { path: 'admin/roles/:id', element: <LazyPage><RoleDetail /></LazyPage> },
          {
            path: 'settings',
            element: <SettingsLayout />,
            children: [
              { index: true, element: <LazyPage><SettingsDashboard /></LazyPage> },
              { path: 'branches', element: <LazyPage><BranchSettings /></LazyPage> },
              { path: 'departments', element: <LazyPage><DepartmentSettings /></LazyPage> },
              { path: 'services', element: <LazyPage><ServiceSettings /></LazyPage> },
              { path: 'numbering', element: <LazyPage><NumberingSettings /></LazyPage> },
              { path: 'templates', element: <LazyPage><TemplateSettings /></LazyPage> },
              { path: 'notifications', element: <LazyPage><NotificationSettings /></LazyPage> },
              { path: 'security', element: <LazyPage><SecuritySettings /></LazyPage> },
            ],
          },
          { path: 'reports', element: <LazyPage><Reports /></LazyPage> },
          { path: 'inventory', element: <LazyPage><Inventory /></LazyPage> },
          { path: 'inventory/:id', element: <LazyPage><InventoryDetail /></LazyPage> },
          { path: 'inventory/receiving', element: <LazyPage><StockReceiving /></LazyPage> },
          { path: 'lab/results', element: <LazyPage><LabResultList /></LazyPage> },
          { path: 'lab/results/:id/encode', element: <LazyPage><LabEncode /></LazyPage> },
          { path: 'lab/results/:id/approval', element: <LazyPage><LabApproval /></LazyPage> },
          { path: 'lab/results/:id/print-preview', element: <LazyPage><PrintPreview /></LazyPage> },
          { path: 'lab/validated', element: <LazyPage><ValidatedResultsPage /></LazyPage> },
          { path: 'lab/released', element: <LazyPage><ReleasedResultsPage /></LazyPage> },
          { path: 'lab/released/:patientId/:orderId', element: <LazyPage><ReleasedResultDetailPage /></LazyPage> },
          { path: 'emr', element: <LazyPage><EMRWorkspace /></LazyPage> },
          { path: 'radiology', element: <LazyPage><RadiologyCanvas /></LazyPage> },
          { path: 'pharmacy', element: <LazyPage><PharmacyHub /></LazyPage> },
          { path: 'hr', element: <LazyPage><HRManagement /></LazyPage> },
          { path: 'claims', element: <LazyPage><ClaimsDashboard /></LazyPage> },
          { path: 'admin/patient-merges', element: <LazyPage><PatientMergeRequests /></LazyPage> },
          { path: 'notifications', element: <LazyPage><NotificationCenter /></LazyPage> },
          { path: 'notifications/templates', element: <LazyPage><NotificationTemplates /></LazyPage> },
          { path: 'notifications/settings', element: <LazyPage><NotificationSettingsPage /></LazyPage> },
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
