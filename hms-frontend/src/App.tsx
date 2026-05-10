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

import { Settings } from './features/admin/Settings';
import { ComingSoon } from './components/ui/coming-soon';

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
          { path: 'settings', element: <Settings /> },
          { path: 'reports', element: <Reports /> },
          { path: 'inventory', element: <Inventory /> },
          { path: 'inventory/:id', element: <InventoryDetail /> },
          { path: 'inventory/receiving', element: <StockReceiving /> },
          { path: 'queue', element: <Queue /> },
          { path: 'lab/results', element: <LabResultList /> },
          { path: 'lab/results/:id/encode', element: <LabEncode /> },
          { path: 'lab/results/:id/approval', element: <LabApproval /> },
          { path: 'lab/results/:id/print-preview', element: <PrintPreview /> },
          { path: 'emr', element: <ComingSoon moduleName="EMR & Clinical Records" /> },
          { path: 'radiology', element: <ComingSoon moduleName="Radiology Imaging" /> },
          { path: 'pharmacy', element: <ComingSoon moduleName="Pharmacy Management" /> },
          { path: 'hr', element: <ComingSoon moduleName="HR Management" /> },
          { path: 'notifications', element: <ComingSoon moduleName="Notifications Engine" /> },
        ],
      },
    ],
  },
]);

export default function App() {
  return <RouterProvider router={router} />;
}
