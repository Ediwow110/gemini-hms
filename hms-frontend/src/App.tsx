import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import { AppShell } from './app/AppShell';
import { LoginPage } from './app/LoginPage';
import { ProtectedRoute } from './app/ProtectedRoute';
import { PermissionRoute } from './app/PermissionRoute';
import { AuthProvider } from './hooks/use-user';

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

const WIPPage = lazy(() => import('./app/WIPPage').then(m => ({ default: m.WIPPage })));

// SuperAdmin Portal
const SuperAdminDashboard = lazy(() => import('./portals/admin/SuperAdminDashboard').then(m => ({ default: m.SuperAdminDashboard })));
const TenantsPage = lazy(() => import('./portals/admin/TenantsPage').then(m => ({ default: m.TenantsPage })));
const BranchesPage = lazy(() => import('./portals/admin/BranchesPage').then(m => ({ default: m.BranchesPage })));
const UsersPage = lazy(() => import('./portals/admin/UsersPage').then(m => ({ default: m.UsersPage })));
const RolesPermissionsPage = lazy(() => import('./portals/admin/RolesPermissionsPage').then(m => ({ default: m.RolesPermissionsPage })));
const SecurityCenterPage = lazy(() => import('./portals/admin/SecurityCenterPage').then(m => ({ default: m.SecurityCenterPage })));
const AuditLogsPage = lazy(() => import('./portals/admin/AuditLogsPage').then(m => ({ default: m.AuditLogsPage })));
const SystemSettingsPage = lazy(() => import('./portals/admin/SystemSettingsPage').then(m => ({ default: m.SystemSettingsPage })));
const ReportsAnalyticsPage = lazy(() => import('./portals/admin/ReportsAnalyticsPage').then(m => ({ default: m.ReportsAnalyticsPage })));

// Compliance Portal
const ComplianceDashboard = lazy(() => import('./portals/compliance/ComplianceDashboard').then(m => ({ default: m.ComplianceDashboard })));
const PHIAccessMonitorPage = lazy(() => import('./portals/compliance/PHIAccessMonitorPage').then(m => ({ default: m.PHIAccessMonitorPage })));
const AuditReviewPage = lazy(() => import('./portals/compliance/AuditReviewPage').then(m => ({ default: m.AuditReviewPage })));
const AccessReviewsPage = lazy(() => import('./portals/compliance/AccessReviewsPage').then(m => ({ default: m.AccessReviewsPage })));
const ExportLogsPage = lazy(() => import('./portals/compliance/ExportLogsPage').then(m => ({ default: m.ExportLogsPage })));
const BreachAlertsPage = lazy(() => import('./portals/compliance/BreachAlertsPage').then(m => ({ default: m.BreachAlertsPage })));
const RetentionManagementPage = lazy(() => import('./portals/compliance/RetentionManagementPage').then(m => ({ default: m.RetentionManagementPage })));
const ComplianceReportsPage = lazy(() => import('./portals/compliance/ComplianceReportsPage').then(m => ({ default: m.ComplianceReportsPage })));
const AuditChainReviewPage = lazy(() => import('./portals/compliance/AuditChainReviewPage').then(m => ({ default: m.AuditChainReviewPage })));

// IT Support Portal
const ITSupportDashboard = lazy(() => import('./portals/it-support/ITSupportDashboard').then(m => ({ default: m.ITSupportDashboard })));
const SystemHealthPage = lazy(() => import('./portals/it-support/SystemHealthPage').then(m => ({ default: m.SystemHealthPage })));
const UserSupportPage = lazy(() => import('./portals/it-support/UserSupportPage').then(m => ({ default: m.UserSupportPage })));
const SessionsPage = lazy(() => import('./portals/it-support/SessionsPage').then(m => ({ default: m.SessionsPage })));
const BackgroundJobsPage = lazy(() => import('./portals/it-support/BackgroundJobsPage').then(m => ({ default: m.BackgroundJobsPage })));
const IntegrationsPage = lazy(() => import('./portals/it-support/IntegrationsPage').then(m => ({ default: m.IntegrationsPage })));
const LogsPage = lazy(() => import('./portals/it-support/LogsPage').then(m => ({ default: m.LogsPage })));
const BackupRestorePage = lazy(() => import('./portals/it-support/BackupRestorePage').then(m => ({ default: m.BackupRestorePage })));
const IncidentReportsPage = lazy(() => import('./portals/it-support/IncidentReportsPage').then(m => ({ default: m.IncidentReportsPage })));

// HR Portal
const HRDashboard = lazy(() => import('./portals/hr/HRDashboard').then(m => ({ default: m.HRDashboard })));
const EmployeesPage = lazy(() => import('./portals/hr/EmployeesPage').then(m => ({ default: m.EmployeesPage })));
const DepartmentsPage = lazy(() => import('./portals/hr/DepartmentsPage').then(m => ({ default: m.DepartmentsPage })));
const AttendancePage = lazy(() => import('./portals/hr/AttendancePage').then(m => ({ default: m.AttendancePage })));
const LeaveManagementPage = lazy(() => import('./portals/hr/LeaveManagementPage').then(m => ({ default: m.LeaveManagementPage })));
const PayrollPage = lazy(() => import('./portals/hr/PayrollPage').then(m => ({ default: m.PayrollPage })));
const LicensesCertificationsPage = lazy(() => import('./portals/hr/LicensesCertificationsPage').then(m => ({ default: m.LicensesCertificationsPage })));
const BranchAssignmentsPage = lazy(() => import('./portals/hr/BranchAssignmentsPage').then(m => ({ default: m.BranchAssignmentsPage })));
const TerminationWorkflowPage = lazy(() => import('./portals/hr/TerminationWorkflowPage').then(m => ({ default: m.TerminationWorkflowPage })));

// Procurement Portal
const ProcurementDashboard = lazy(() => import('./portals/procurement/ProcurementDashboard').then(m => ({ default: m.ProcurementDashboard })));
const SuppliersPage = lazy(() => import('./portals/procurement/SuppliersPage').then(m => ({ default: m.SuppliersPage })));
const PurchaseRequestsPage = lazy(() => import('./portals/procurement/PurchaseRequestsPage').then(m => ({ default: m.PurchaseRequestsPage })));
const RFQsPage = lazy(() => import('./portals/procurement/RFQsPage').then(m => ({ default: m.RFQsPage })));
const QuotesPage = lazy(() => import('./portals/procurement/QuotesPage').then(m => ({ default: m.QuotesPage })));
const PurchaseOrdersPage = lazy(() => import('./portals/procurement/PurchaseOrdersPage').then(m => ({ default: m.PurchaseOrdersPage })));
const ProcurementReceivingPage = lazy(() => import('./portals/procurement/ProcurementReceivingPage').then(m => ({ default: m.ProcurementReceivingPage })));
const InventoryRequestsPage = lazy(() => import('./portals/procurement/InventoryRequestsPage').then(m => ({ default: m.InventoryRequestsPage })));
const VendorPerformancePage = lazy(() => import('./portals/procurement/VendorPerformancePage').then(m => ({ default: m.VendorPerformancePage })));

// Marketplace Portals
const MarketplaceHomePage = lazy(() => import('./portals/marketplace/buyer/MarketplaceHomePage').then(m => ({ default: m.MarketplaceHomePage })));
const MarketplaceProductListingPage = lazy(() => import('./portals/marketplace/buyer/MarketplaceProductListingPage').then(m => ({ default: m.MarketplaceProductListingPage })));
const MarketplaceRFQPage = lazy(() => import('./portals/marketplace/buyer/MarketplaceRFQPage').then(m => ({ default: m.MarketplaceRFQPage })));
const MarketplaceOrdersPage = lazy(() => import('./portals/marketplace/buyer/MarketplaceOrdersPage').then(m => ({ default: m.MarketplaceOrdersPage })));
const MarketplaceInstallationTrackingPage = lazy(() => import('./portals/marketplace/buyer/MarketplaceInstallationTrackingPage').then(m => ({ default: m.MarketplaceInstallationTrackingPage })));
const MarketplaceWarrantyPage = lazy(() => import('./portals/marketplace/buyer/MarketplaceWarrantyPage').then(m => ({ default: m.MarketplaceWarrantyPage })));
const MarketplaceServiceTicketsPage = lazy(() => import('./portals/marketplace/buyer/MarketplaceServiceTicketsPage').then(m => ({ default: m.MarketplaceServiceTicketsPage })));

const SupplierDashboard = lazy(() => import('./portals/marketplace/supplier/SupplierDashboard').then(m => ({ default: m.SupplierDashboard })));
const SupplierListingsPage = lazy(() => import('./portals/marketplace/supplier/SupplierListingsPage').then(m => ({ default: m.SupplierListingsPage })));
const SupplierServiceListingsPage = lazy(() => import('./portals/marketplace/supplier/SupplierServiceListingsPage').then(m => ({ default: m.SupplierServiceListingsPage })));
const SupplierRFQInboxPage = lazy(() => import('./portals/marketplace/supplier/SupplierRFQInboxPage').then(m => ({ default: m.SupplierRFQInboxPage })));
const SupplierQuotesPage = lazy(() => import('./portals/marketplace/supplier/SupplierQuotesPage').then(m => ({ default: m.SupplierQuotesPage })));
const SupplierOrdersPage = lazy(() => import('./portals/marketplace/supplier/SupplierOrdersPage').then(m => ({ default: m.SupplierOrdersPage })));
const SupplierFulfillmentPage = lazy(() => import('./portals/marketplace/supplier/SupplierFulfillmentPage').then(m => ({ default: m.SupplierFulfillmentPage })));
const SupplierWarrantyClaimsPage = lazy(() => import('./portals/marketplace/supplier/SupplierWarrantyClaimsPage').then(m => ({ default: m.SupplierWarrantyClaimsPage })));
const SupplierServiceCommitmentsPage = lazy(() => import('./portals/marketplace/supplier/SupplierServiceCommitmentsPage').then(m => ({ default: m.SupplierServiceCommitmentsPage })));
const SupplierPayoutsPage = lazy(() => import('./portals/marketplace/supplier/SupplierPayoutsPage').then(m => ({ default: m.SupplierPayoutsPage })));
const SupplierPerformancePage = lazy(() => import('./portals/marketplace/supplier/SupplierPerformancePage').then(m => ({ default: m.SupplierPerformancePage })));

const MarketplaceAdminDashboard = lazy(() => import('./portals/marketplace/admin/MarketplaceAdminDashboard').then(m => ({ default: m.MarketplaceAdminDashboard })));
const SupplierManagementPage = lazy(() => import('./portals/marketplace/admin/SupplierManagementPage').then(m => ({ default: m.SupplierManagementPage })));
const BuyerManagementPage = lazy(() => import('./portals/marketplace/admin/BuyerManagementPage').then(m => ({ default: m.BuyerManagementPage })));
const ListingApprovalPage = lazy(() => import('./portals/marketplace/admin/ListingApprovalPage').then(m => ({ default: m.ListingApprovalPage })));
const RFQMonitorPage = lazy(() => import('./portals/marketplace/admin/RFQMonitorPage').then(m => ({ default: m.RFQMonitorPage })));
const OrderMonitorPage = lazy(() => import('./portals/marketplace/admin/OrderMonitorPage').then(m => ({ default: m.OrderMonitorPage })));
const FulfillmentMonitorPage = lazy(() => import('./portals/marketplace/admin/FulfillmentMonitorPage').then(m => ({ default: m.FulfillmentMonitorPage })));
const InstallationMonitorPage = lazy(() => import('./portals/marketplace/admin/InstallationMonitorPage').then(m => ({ default: m.InstallationMonitorPage })));
const MarketplaceWarrantyClaimsPage = lazy(() => import('./portals/marketplace/admin/MarketplaceWarrantyClaimsPage').then(m => ({ default: m.MarketplaceWarrantyClaimsPage })));
const DisputesPage = lazy(() => import('./portals/marketplace/admin/DisputesPage').then(m => ({ default: m.DisputesPage })));
const CommissionFeesPage = lazy(() => import('./portals/marketplace/admin/CommissionFeesPage').then(m => ({ default: m.CommissionFeesPage })));
const MarketplaceReportsPage = lazy(() => import('./portals/marketplace/admin/MarketplaceReportsPage').then(m => ({ default: m.MarketplaceReportsPage })));

// Field Service Portal
const FieldServiceDashboard = lazy(() => import('./portals/field-service/FieldServiceDashboard').then(m => ({ default: m.FieldServiceDashboard })));
const DeliveryJobsPage = lazy(() => import('./portals/field-service/DeliveryJobsPage').then(m => ({ default: m.DeliveryJobsPage })));
const InstallationJobsPage = lazy(() => import('./portals/field-service/InstallationJobsPage').then(m => ({ default: m.InstallationJobsPage })));
const TechnicianSchedulePage = lazy(() => import('./portals/field-service/TechnicianSchedulePage').then(m => ({ default: m.TechnicianSchedulePage })));
const MobileHandoverChecklistPage = lazy(() => import('./portals/field-service/MobileHandoverChecklistPage').then(m => ({ default: m.MobileHandoverChecklistPage })));
const ProofOfDeliveryPage = lazy(() => import('./portals/field-service/ProofOfDeliveryPage').then(m => ({ default: m.ProofOfDeliveryPage })));
const WarrantyActivationPage = lazy(() => import('./portals/field-service/WarrantyActivationPage').then(m => ({ default: m.WarrantyActivationPage })));
const PreventiveMaintenancePage = lazy(() => import('./portals/field-service/PreventiveMaintenancePage').then(m => ({ default: m.PreventiveMaintenancePage })));
const ServiceTicketWorklogPage = lazy(() => import('./portals/field-service/ServiceTicketWorklogPage').then(m => ({ default: m.ServiceTicketWorklogPage })));
const OfflineSyncQueuePage = lazy(() => import('./portals/field-service/OfflineSyncQueuePage').then(m => ({ default: m.OfflineSyncQueuePage })));

// Integration Portal
const IntegrationDashboard = lazy(() => import('./portals/integration/IntegrationDashboard').then(m => ({ default: m.IntegrationDashboard })));
const NotificationCenterPage = lazy(() => import('./portals/integration/NotificationCenterPage').then(m => ({ default: m.NotificationCenterPage })));
const IntegrationApprovalCenterPage = lazy(() => import('./portals/integration/ApprovalCenterPage').then(m => ({ default: m.ApprovalCenterPage })));
const GlobalSearchPage = lazy(() => import('./portals/integration/GlobalSearchPage').then(m => ({ default: m.GlobalSearchPage })));
const PatientTimelinePage = lazy(() => import('./portals/integration/PatientTimelinePage').then(m => ({ default: m.PatientTimelinePage })));
const AssetTimelinePage = lazy(() => import('./portals/integration/AssetTimelinePage').then(m => ({ default: m.AssetTimelinePage })));
const ReconciliationMonitorPage = lazy(() => import('./portals/integration/ReconciliationMonitorPage').then(m => ({ default: m.ReconciliationMonitorPage })));
const ActivityAuditContextPage = lazy(() => import('./portals/integration/ActivityAuditContextPage').then(m => ({ default: m.ActivityAuditContextPage })));

// Patient Portal
const PatientDashboard = lazy(() => import('./portals/patient/PatientDashboard').then(m => ({ default: m.PatientDashboard })));
const PatientAppointmentsPage = lazy(() => import('./portals/patient/PatientAppointmentsPage').then(m => ({ default: m.PatientAppointmentsPage })));
const PatientLabResultsPage = lazy(() => import('./portals/patient/PatientLabResultsPage').then(m => ({ default: m.PatientLabResultsPage })));
const PatientPrescriptionsPage = lazy(() => import('./portals/patient/PatientPrescriptionsPage').then(m => ({ default: m.PatientPrescriptionsPage })));
const PatientBillingPage = lazy(() => import('./portals/patient/PatientBillingPage').then(m => ({ default: m.PatientBillingPage })));
const PatientMedicalRecordsPage = lazy(() => import('./portals/patient/PatientMedicalRecordsPage').then(m => ({ default: m.PatientMedicalRecordsPage })));
const PatientMessagesPage = lazy(() => import('./portals/patient/PatientMessagesPage').then(m => ({ default: m.PatientMessagesPage })));
const PatientProfilePage = lazy(() => import('./portals/patient/PatientProfilePage').then(m => ({ default: m.PatientProfilePage })));

// Doctor Portal
const DoctorDashboard = lazy(() => import('./portals/doctor/DoctorDashboard').then(m => ({ default: m.DoctorDashboard })));
const DoctorQueuePage = lazy(() => import('./portals/doctor/DoctorQueuePage').then(m => ({ default: m.DoctorQueuePage })));
const DoctorPatientsPage = lazy(() => import('./portals/doctor/DoctorPatientsPage').then(m => ({ default: m.DoctorPatientsPage })));
const DoctorEMRPage = lazy(() => import('./portals/doctor/DoctorEMRPage').then(m => ({ default: m.DoctorEMRPage })));

// Nurse Portal
const NurseDashboard = lazy(() => import('./portals/nurse/NurseDashboard').then(m => ({ default: m.NurseDashboard })));
const NurseTriageQueuePage = lazy(() => import('./portals/nurse/NurseTriageQueuePage').then(m => ({ default: m.NurseTriageQueuePage })));
const NursePatientIntakePage = lazy(() => import('./portals/nurse/NursePatientIntakePage').then(m => ({ default: m.NursePatientIntakePage })));
const NurseVitalsPage = lazy(() => import('./portals/nurse/NurseVitalsPage').then(m => ({ default: m.NurseVitalsPage })));
const NurseTasksPage = lazy(() => import('./portals/nurse/NurseTasksPage').then(m => ({ default: m.NurseTasksPage })));
const NurseSpecimenCollectionPage = lazy(() => import('./portals/nurse/NurseSpecimenCollectionPage').then(m => ({ default: m.NurseSpecimenCollectionPage })));

// Lab Portal
const LabDashboard = lazy(() => import('./portals/lab/LabDashboard').then(m => ({ default: m.LabDashboard })));
const LabOrdersPage = lazy(() => import('./portals/lab/LabOrdersPage').then(m => ({ default: m.LabOrdersPage })));
const SpecimenReceivingPage = lazy(() => import('./portals/lab/SpecimenReceivingPage').then(m => ({ default: m.SpecimenReceivingPage })));
const ResultEncodingPage = lazy(() => import('./portals/lab/ResultEncodingPage').then(m => ({ default: m.ResultEncodingPage })));
const ResultValidationPage = lazy(() => import('./portals/lab/ResultValidationPage').then(m => ({ default: m.ResultValidationPage })));
const CriticalResultsPage = lazy(() => import('./portals/lab/CriticalResultsPage').then(m => ({ default: m.CriticalResultsPage })));
const TurnaroundMonitorPage = lazy(() => import('./portals/lab/TurnaroundMonitorPage').then(m => ({ default: m.TurnaroundMonitorPage })));

// Cashier Portal
const CashierDashboard = lazy(() => import('./portals/cashier/CashierDashboard').then(m => ({ default: m.CashierDashboard })));
const CashierPatientBillingPage = lazy(() => import('./portals/cashier/PatientBillingPage').then(m => ({ default: m.PatientBillingPage })));
const InvoicesPage = lazy(() => import('./portals/cashier/InvoicesPage').then(m => ({ default: m.InvoicesPage })));
const PaymentsPage = lazy(() => import('./portals/cashier/PaymentsPage').then(m => ({ default: m.PaymentsPage })));
const CashierSessionPage = lazy(() => import('./portals/cashier/CashierSessionPage').then(m => ({ default: m.CashierSessionPage })));
const RefundVoidQueuePage = lazy(() => import('./portals/cashier/RefundVoidQueuePage').then(m => ({ default: m.RefundVoidQueuePage })));
const HMOClaimsPage = lazy(() => import('./portals/cashier/HMOClaimsPage').then(m => ({ default: m.HMOClaimsPage })));
const DailyReconciliationPage = lazy(() => import('./portals/cashier/DailyReconciliationPage').then(m => ({ default: m.DailyReconciliationPage })));

// Additional Feature Consoles
const TelehealthConsole = lazy(() => import('./features/telehealth/TelehealthConsole').then(m => ({ default: m.TelehealthConsole })));
const SpatialConsole = lazy(() => import('./features/spatial/SpatialConsole').then(m => ({ default: m.SpatialConsole })));
const SalesDashboard = lazy(() => import('./features/sales/SalesDashboard').then(m => ({ default: m.SalesDashboard })));
const InstallationChecklist = lazy(() => import('./features/logistics/InstallationChecklist').then(m => ({ default: m.InstallationChecklist })));

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
          { path: 'audit-logs', element: <PermissionRoute permission="audit.view"><LazyPage><AuditLogViewer /></LazyPage></PermissionRoute> },
          { path: 'admin/users/:id', element: <PermissionRoute permission="admin.role.change"><LazyPage><UserDetail /></LazyPage></PermissionRoute> },
          { path: 'admin/roles', element: <PermissionRoute permission="admin.role.change"><LazyPage><RoleList /></LazyPage></PermissionRoute> },
          { path: 'admin/roles/:id', element: <PermissionRoute permission="admin.role.change"><LazyPage><RoleDetail /></LazyPage></PermissionRoute> },
          {
            path: 'settings',
            element: <PermissionRoute permission="admin.role.change"><SettingsLayout /></PermissionRoute>,
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
          { path: 'reports', element: <PermissionRoute permission="report.export"><LazyPage><Reports /></LazyPage></PermissionRoute> },
          { path: 'inventory', element: <PermissionRoute permission="inventory.item.view"><LazyPage><Inventory /></LazyPage></PermissionRoute> },
          { path: 'inventory/:id', element: <PermissionRoute permission="inventory.item.view"><LazyPage><InventoryDetail /></LazyPage></PermissionRoute> },
          { path: 'inventory/receiving', element: <PermissionRoute permission="inventory.stock.receive"><LazyPage><StockReceiving /></LazyPage></PermissionRoute> },
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
          
          // SuperAdmin Portal
          { path: 'admin', element: <LazyPage><SuperAdminDashboard /></LazyPage> },
          { path: 'admin/tenants', element: <LazyPage><TenantsPage /></LazyPage> },
          { path: 'admin/branches', element: <LazyPage><BranchesPage /></LazyPage> },
          { path: 'admin/users', element: <PermissionRoute permission="admin.role.change"><LazyPage><UsersPage /></LazyPage></PermissionRoute> },
          { path: 'admin/roles-permissions', element: <PermissionRoute permission="admin.role.change"><LazyPage><RolesPermissionsPage /></LazyPage></PermissionRoute> },
          { path: 'admin/security', element: <LazyPage><SecurityCenterPage /></LazyPage> },
          { path: 'admin/audit-logs', element: <PermissionRoute permission="audit.view"><LazyPage><AuditLogsPage /></LazyPage></PermissionRoute> },
          { path: 'admin/settings', element: <PermissionRoute permission="admin.role.change"><LazyPage><SystemSettingsPage /></LazyPage></PermissionRoute> },
          { path: 'admin/reports', element: <PermissionRoute permission="report.export"><LazyPage><ReportsAnalyticsPage /></LazyPage></PermissionRoute> },

          // Compliance Portal
          { path: 'compliance', element: <LazyPage><ComplianceDashboard /></LazyPage> },
          { path: 'compliance/phi-access', element: <LazyPage><PHIAccessMonitorPage /></LazyPage> },
          { path: 'compliance/audit-review', element: <LazyPage><AuditReviewPage /></LazyPage> },
          { path: 'compliance/access-reviews', element: <LazyPage><AccessReviewsPage /></LazyPage> },
          { path: 'compliance/export-logs', element: <LazyPage><ExportLogsPage /></LazyPage> },
          { path: 'compliance/breach-alerts', element: <LazyPage><BreachAlertsPage /></LazyPage> },
          { path: 'compliance/retention', element: <LazyPage><RetentionManagementPage /></LazyPage> },
          { path: 'compliance/reports', element: <LazyPage><ComplianceReportsPage /></LazyPage> },
          { path: 'compliance/audit-chain', element: <LazyPage><AuditChainReviewPage /></LazyPage> },

          // IT Support Portal
          { path: 'it', element: <LazyPage><ITSupportDashboard /></LazyPage> },
          { path: 'it/system-health', element: <LazyPage><SystemHealthPage /></LazyPage> },
          { path: 'it/user-support', element: <LazyPage><UserSupportPage /></LazyPage> },
          { path: 'it/sessions', element: <LazyPage><SessionsPage /></LazyPage> },
          { path: 'it/background-jobs', element: <LazyPage><BackgroundJobsPage /></LazyPage> },
          { path: 'it/integrations', element: <LazyPage><IntegrationsPage /></LazyPage> },
          { path: 'it/logs', element: <LazyPage><LogsPage /></LazyPage> },
          { path: 'it/backup-restore', element: <LazyPage><BackupRestorePage /></LazyPage> },
          { path: 'it/incidents', element: <LazyPage><IncidentReportsPage /></LazyPage> },

          // HR Portal
          { path: 'hr', element: <LazyPage><HRDashboard /></LazyPage> },
          { path: 'hr/employees', element: <LazyPage><EmployeesPage /></LazyPage> },
          { path: 'hr/departments', element: <LazyPage><DepartmentsPage /></LazyPage> },
          { path: 'hr/attendance', element: <LazyPage><AttendancePage /></LazyPage> },
          { path: 'hr/leave', element: <LazyPage><LeaveManagementPage /></LazyPage> },
          { path: 'hr/payroll', element: <LazyPage><PayrollPage /></LazyPage> },
          { path: 'hr/licenses', element: <LazyPage><LicensesCertificationsPage /></LazyPage> },
          { path: 'hr/branch-assignments', element: <LazyPage><BranchAssignmentsPage /></LazyPage> },
          { path: 'hr/termination', element: <LazyPage><TerminationWorkflowPage /></LazyPage> },

          // Procurement Portal
          { path: 'procurement', element: <PermissionRoute permission="inventory.stock.receive"><LazyPage><ProcurementDashboard /></LazyPage></PermissionRoute> },
          { path: 'procurement/suppliers', element: <PermissionRoute permission="inventory.stock.receive"><LazyPage><SuppliersPage /></LazyPage></PermissionRoute> },
          { path: 'procurement/purchase-requests', element: <PermissionRoute permission="inventory.stock.receive"><LazyPage><PurchaseRequestsPage /></LazyPage></PermissionRoute> },
          { path: 'procurement/rfqs', element: <PermissionRoute permission="inventory.stock.receive"><LazyPage><RFQsPage /></LazyPage></PermissionRoute> },
          { path: 'procurement/quotes', element: <PermissionRoute permission="inventory.stock.receive"><LazyPage><QuotesPage /></LazyPage></PermissionRoute> },
          { path: 'procurement/purchase-orders', element: <PermissionRoute permission="inventory.stock.receive"><LazyPage><PurchaseOrdersPage /></LazyPage></PermissionRoute> },
          { path: 'procurement/receiving', element: <PermissionRoute permission="inventory.stock.receive"><LazyPage><ProcurementReceivingPage /></LazyPage></PermissionRoute> },
          { path: 'procurement/inventory-requests', element: <PermissionRoute permission="inventory.stock.receive"><LazyPage><InventoryRequestsPage /></LazyPage></PermissionRoute> },
          { path: 'procurement/vendor-performance', element: <PermissionRoute permission="inventory.stock.receive"><LazyPage><VendorPerformancePage /></LazyPage></PermissionRoute> },

          // Marketplace (Buyer)
          { path: 'marketplace', element: <LazyPage><MarketplaceHomePage /></LazyPage> },
          { path: 'marketplace/products', element: <LazyPage><MarketplaceProductListingPage /></LazyPage> },
          { path: 'marketplace/rfqs', element: <LazyPage><MarketplaceRFQPage /></LazyPage> },
          { path: 'marketplace/orders', element: <LazyPage><MarketplaceOrdersPage /></LazyPage> },
          { path: 'marketplace/installations', element: <LazyPage><MarketplaceInstallationTrackingPage /></LazyPage> },
          { path: 'marketplace/warranty', element: <LazyPage><MarketplaceWarrantyPage /></LazyPage> },
          { path: 'marketplace/service-tickets', element: <LazyPage><MarketplaceServiceTicketsPage /></LazyPage> },

          // Marketplace (Supplier)
          { path: 'supplier', element: <LazyPage><SupplierDashboard /></LazyPage> },
          { path: 'supplier/listings', element: <LazyPage><SupplierListingsPage /></LazyPage> },
          { path: 'supplier/service-listings', element: <LazyPage><SupplierServiceListingsPage /></LazyPage> },
          { path: 'supplier/rfq-inbox', element: <LazyPage><SupplierRFQInboxPage /></LazyPage> },
          { path: 'supplier/quotes', element: <LazyPage><SupplierQuotesPage /></LazyPage> },
          { path: 'supplier/orders', element: <LazyPage><SupplierOrdersPage /></LazyPage> },
          { path: 'supplier/fulfillment', element: <LazyPage><SupplierFulfillmentPage /></LazyPage> },
          { path: 'supplier/warranty-claims', element: <LazyPage><SupplierWarrantyClaimsPage /></LazyPage> },
          { path: 'supplier/service-commitments', element: <LazyPage><SupplierServiceCommitmentsPage /></LazyPage> },
          { path: 'supplier/payouts', element: <LazyPage><SupplierPayoutsPage /></LazyPage> },
          { path: 'supplier/performance', element: <LazyPage><SupplierPerformancePage /></LazyPage> },

          // Marketplace (Admin)
          { path: 'marketplace-admin', element: <LazyPage><MarketplaceAdminDashboard /></LazyPage> },
          { path: 'marketplace-admin/suppliers', element: <LazyPage><SupplierManagementPage /></LazyPage> },
          { path: 'marketplace-admin/buyers', element: <LazyPage><BuyerManagementPage /></LazyPage> },
          { path: 'marketplace-admin/listing-approval', element: <LazyPage><ListingApprovalPage /></LazyPage> },
          { path: 'marketplace-admin/rfq-monitor', element: <LazyPage><RFQMonitorPage /></LazyPage> },
          { path: 'marketplace-admin/order-monitor', element: <LazyPage><OrderMonitorPage /></LazyPage> },
          { path: 'marketplace-admin/fulfillment-monitor', element: <LazyPage><FulfillmentMonitorPage /></LazyPage> },
          { path: 'marketplace-admin/installation-monitor', element: <LazyPage><InstallationMonitorPage /></LazyPage> },
          { path: 'marketplace-admin/warranty-claims', element: <LazyPage><MarketplaceWarrantyClaimsPage /></LazyPage> },
          { path: 'marketplace-admin/disputes', element: <LazyPage><DisputesPage /></LazyPage> },
          { path: 'marketplace-admin/commission-fees', element: <LazyPage><CommissionFeesPage /></LazyPage> },
          { path: 'marketplace-admin/reports', element: <LazyPage><MarketplaceReportsPage /></LazyPage> },

          // Field Service Portal
          { path: 'field-service', element: <LazyPage><FieldServiceDashboard /></LazyPage> },
          { path: 'field-service/deliveries', element: <LazyPage><DeliveryJobsPage /></LazyPage> },
          { path: 'field-service/installations', element: <LazyPage><InstallationJobsPage /></LazyPage> },
          { path: 'field-service/schedule', element: <LazyPage><TechnicianSchedulePage /></LazyPage> },
          { path: 'field-service/handover', element: <LazyPage><MobileHandoverChecklistPage /></LazyPage> },
          { path: 'field-service/proof-of-delivery', element: <LazyPage><ProofOfDeliveryPage /></LazyPage> },
          { path: 'field-service/warranty-activation', element: <LazyPage><WarrantyActivationPage /></LazyPage> },
          { path: 'field-service/preventive-maintenance', element: <LazyPage><PreventiveMaintenancePage /></LazyPage> },
          { path: 'field-service/service-worklog', element: <LazyPage><ServiceTicketWorklogPage /></LazyPage> },
          { path: 'field-service/offline-sync', element: <LazyPage><OfflineSyncQueuePage /></LazyPage> },

          // Integration Portal
          { path: 'integration', element: <LazyPage><IntegrationDashboard /></LazyPage> },
          { path: 'integration/notifications', element: <LazyPage><NotificationCenterPage /></LazyPage> },
          { path: 'integration/approvals', element: <LazyPage><IntegrationApprovalCenterPage /></LazyPage> },
          { path: 'integration/global-search', element: <LazyPage><GlobalSearchPage /></LazyPage> },
          { path: 'integration/patient-timeline', element: <LazyPage><PatientTimelinePage /></LazyPage> },
          { path: 'integration/asset-timeline', element: <LazyPage><AssetTimelinePage /></LazyPage> },
          { path: 'integration/reconciliation', element: <LazyPage><ReconciliationMonitorPage /></LazyPage> },
          { path: 'integration/activity-audit', element: <LazyPage><ActivityAuditContextPage /></LazyPage> },

          // Patient Portal
          { path: 'patient', element: <LazyPage><PatientDashboard /></LazyPage> },
          { path: 'patient/appointments', element: <LazyPage><PatientAppointmentsPage /></LazyPage> },
          { path: 'patient/lab-results', element: <LazyPage><PatientLabResultsPage /></LazyPage> },
          { path: 'patient/prescriptions', element: <LazyPage><PatientPrescriptionsPage /></LazyPage> },
          { path: 'patient/billing', element: <LazyPage><PatientBillingPage /></LazyPage> },
          { path: 'patient/medical-records', element: <LazyPage><PatientMedicalRecordsPage /></LazyPage> },
          { path: 'patient/messages', element: <LazyPage><PatientMessagesPage /></LazyPage> },
          { path: 'patient/profile', element: <LazyPage><PatientProfilePage /></LazyPage> },

          // Doctor Portal
          { path: 'doctor', element: <LazyPage><DoctorDashboard /></LazyPage> },
          { path: 'doctor/queue', element: <LazyPage><DoctorQueuePage /></LazyPage> },
          { path: 'doctor/patients', element: <LazyPage><DoctorPatientsPage /></LazyPage> },
          { path: 'doctor/emr', element: <LazyPage><DoctorEMRPage /></LazyPage> },

          // Nurse Portal
          { path: 'nurse', element: <LazyPage><NurseDashboard /></LazyPage> },
          { path: 'nurse/triage', element: <LazyPage><NurseTriageQueuePage /></LazyPage> },
          { path: 'nurse/intake', element: <LazyPage><NursePatientIntakePage /></LazyPage> },
          { path: 'nurse/vitals', element: <LazyPage><NurseVitalsPage /></LazyPage> },
          { path: 'nurse/tasks', element: <LazyPage><NurseTasksPage /></LazyPage> },
          { path: 'nurse/specimens', element: <LazyPage><NurseSpecimenCollectionPage /></LazyPage> },

          // Lab Portal
          { path: 'lab', element: <LazyPage><LabDashboard /></LazyPage> },
          { path: 'lab/orders', element: <LazyPage><LabOrdersPage /></LazyPage> },
          { path: 'lab/specimens', element: <LazyPage><SpecimenReceivingPage /></LazyPage> },
          { path: 'lab/encoding', element: <LazyPage><ResultEncodingPage /></LazyPage> },
          { path: 'lab/validation', element: <LazyPage><ResultValidationPage /></LazyPage> },
          { path: 'lab/critical-results', element: <LazyPage><CriticalResultsPage /></LazyPage> },
          { path: 'lab/turnaround', element: <LazyPage><TurnaroundMonitorPage /></LazyPage> },

          // Cashier Portal
          { path: 'cashier', element: <LazyPage><CashierDashboard /></LazyPage> },
          { path: 'cashier/billing', element: <LazyPage><CashierPatientBillingPage /></LazyPage> },
          { path: 'cashier/invoices', element: <LazyPage><InvoicesPage /></LazyPage> },
          { path: 'cashier/payments', element: <LazyPage><PaymentsPage /></LazyPage> },
          { path: 'cashier/session', element: <LazyPage><CashierSessionPage /></LazyPage> },
          { path: 'cashier/refunds-voids', element: <LazyPage><RefundVoidQueuePage /></LazyPage> },
          { path: 'cashier/hmo-claims', element: <LazyPage><HMOClaimsPage /></LazyPage> },
          { path: 'cashier/reconciliation', element: <LazyPage><DailyReconciliationPage /></LazyPage> },

          // Other Features
          { path: 'telehealth', element: <LazyPage><TelehealthConsole /></LazyPage> },
          { path: 'spatial', element: <LazyPage><SpatialConsole /></LazyPage> },
          { path: 'sales-dashboard', element: <LazyPage><SalesDashboard /></LazyPage> },
          { path: 'logistics-checklist', element: <LazyPage><InstallationChecklist /></LazyPage> },

          // Pharmacy Sub-routes
          { path: 'pharmacy/dispense', element: <LazyPage><WIPPage /></LazyPage> },
          { path: 'pharmacy/inventory', element: <LazyPage><WIPPage /></LazyPage> },

          { path: 'notifications', element: <LazyPage><NotificationCenter /></LazyPage> },
          { path: 'notifications/templates', element: <LazyPage><NotificationTemplates /></LazyPage> },
          { path: 'notifications/settings', element: <LazyPage><NotificationSettingsPage /></LazyPage> },
        ],
      },
    ],
  },
]);

export default function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  );
}
