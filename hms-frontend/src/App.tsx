import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppShell } from './app/AppShell';
import { LoginPage } from './app/LoginPage';
import { ProtectedRoute } from './app/ProtectedRoute';
import { PermissionRoute } from './app/PermissionRoute';
import { GuardMode } from './app/types';
import { RouteErrorBoundary } from './app/RouteErrorBoundary';
import { AuthDiagnosticsPanel } from './components/debug/AuthDiagnosticsPanel';
import { AuthProvider } from './hooks/use-user';
import { UnauthorizedState } from './components/feedback/UnauthorizedState';
import { ProviderErrorBoundary } from './app/ProviderErrorBoundary';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Core routes — eagerly loaded (always needed)
import { RoleRedirect } from './app/RoleRedirect';

// Lazy-loaded — split by feature/portal (named exports need .then() adapter)
const PatientList = lazy(() => import('./features/patients/PatientList').then(m => ({ default: m.PatientList })));
const RegisterPatient = lazy(() => import('./features/patients/RegisterPatient').then(m => ({ default: m.RegisterPatient })));
const PatientProfile = lazy(() => import('./features/patients/PatientProfile').then(m => ({ default: m.PatientProfile })));
const CreateOrder = lazy(() => import('./features/orders/CreateOrder').then(m => ({ default: m.CreateOrder })));
const Queue = lazy(() => import('./features/queue/Queue').then(m => ({ default: m.Queue })));

const Billing = lazy(() => import('./features/billing/Billing').then(m => ({ default: m.Billing })));
const BillingDashboard = lazy(() => import('./pages/billing/BillingDashboard').then(m => ({ default: m.BillingDashboard })));
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
const ValidatedResultsPage = lazy(() => import('./portals/lab/ValidatedResultsPage').then(m => ({ default: m.ValidatedResultsPage })));
const ReleasedResultsPage = lazy(() => import('./portals/lab/ReleasedResultsPage').then(m => ({ default: m.ReleasedResultsPage })));
const ReleasedResultDetailPage = lazy(() => import('./portals/lab/ReleasedResultDetailPage').then(m => ({ default: m.ReleasedResultDetailPage })));
const LegacyResultRedirectBridge = lazy(() => import('./portals/lab/LegacyResultRedirectBridge').then(m => ({ default: m.LegacyResultRedirectBridge })));

// Specialized Operational & Compliance Panels
const EMRWorkspace = lazy(() => import('./features/emr/EMRWorkspace').then(m => ({ default: m.EMRWorkspace })));
const PharmacyHub = lazy(() => import('./features/pharmacy/PharmacyHub').then(m => ({ default: m.PharmacyHub })));
const PharmacyDashboard = lazy(() => import('./pages/pharmacy/PharmacyDashboard').then(m => ({ default: m.PharmacyDashboard })));
const RadiologyCanvas = lazy(() => import('./features/radiology/RadiologyCanvas').then(m => ({ default: m.RadiologyCanvas })));
const ClaimsDashboard = lazy(() => import('./features/claims/ClaimsDashboard').then(m => ({ default: m.ClaimsDashboard })));
const PatientMergeRequests = lazy(() => import('./features/admin/PatientMergeRequests').then(m => ({ default: m.PatientMergeRequests })));
const CatalogManagementPage = lazy(() => import('./portals/admin/CatalogManagementPage').then(m => ({ default: m.CatalogManagementPage })));

const WIPPage = lazy(() => import('./app/WIPPage').then(m => ({ default: m.WIPPage })));
const BranchAdminDashboard = lazy(() => import('./portals/branch-admin/BranchAdminDashboard').then(m => ({ default: m.BranchAdminDashboard })));

// SuperAdmin Portal
const SuperAdminDashboard = lazy(() => import('./portals/admin/SuperAdminDashboard').then(m => ({ default: m.SuperAdminDashboard })));
const AdminExecutiveDashboard = lazy(() => import('./pages/admin/AdminExecutiveDashboard').then(m => ({ default: m.AdminExecutiveDashboard })));
const ClinicalOperationsDashboard = lazy(() => import('./pages/clinical/ClinicalOperationsDashboard'));


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
const MyAuditLogPage = lazy(() => import('./pages/audit/MyAuditLogPage').then(m => ({ default: m.MyAuditLogPage })));
const AuditEventDetailPage = lazy(() => import('./pages/audit/AuditEventDetailPage').then(m => ({ default: m.AuditEventDetailPage })));
const EntityAuditTimelinePage = lazy(() => import('./pages/audit/EntityAuditTimelinePage').then(m => ({ default: m.EntityAuditTimelinePage })));

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
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: '/',
    element: <ProtectedRoute />,
    errorElement: <RouteErrorBoundary />,
    children: [
      {
        path: '/',
        element: <AppShell />,
        children: [
          { index: true, element: <RoleRedirect /> },
          { path: 'unauthorized', element: <LazyPage><UnauthorizedState /></LazyPage> },
          { path: 'patients', element: <PermissionRoute permission="patient.view"><LazyPage><PatientList /></LazyPage></PermissionRoute> },
          { path: 'patients/new', element: <PermissionRoute permission="patient.create"><LazyPage><RegisterPatient /></LazyPage></PermissionRoute> },
          { path: 'patients/:id', element: <PermissionRoute permission="patient.view"><LazyPage><PatientProfile /></LazyPage></PermissionRoute> },
          { path: 'orders/new', element: <PermissionRoute permission="order.create"><LazyPage><CreateOrder /></LazyPage></PermissionRoute> },
          { path: 'queue', element: <PermissionRoute permission="queue.view"><LazyPage><Queue /></LazyPage></PermissionRoute> },
          // Lazy-loaded routes below
           { path: 'billing/dashboard', element: <PermissionRoute permission="billing.invoice.view"><LazyPage><BillingDashboard /></LazyPage></PermissionRoute> },
           { path: 'billing', element: <PermissionRoute permission="billing.invoice.view"><LazyPage><Billing /></LazyPage></PermissionRoute> },

          { path: 'billing/cashier-closing', element: <PermissionRoute allowedRoles={['Cashier']}><LazyPage><CashierClosing /></LazyPage></PermissionRoute> },
          { path: 'approvals', element: <PermissionRoute permission="approval.request.view"><LazyPage><ApprovalCenter /></LazyPage></PermissionRoute> },
          { path: 'audit-logs', element: <PermissionRoute permission="audit.view"><LazyPage><AuditLogViewer /></LazyPage></PermissionRoute> },
          { path: 'my-audit-log', element: <PermissionRoute permission="audit.self"><LazyPage><MyAuditLogPage /></LazyPage></PermissionRoute> },
          { path: 'audit/my-events/:id', element: <PermissionRoute permission="audit.self"><LazyPage><AuditEventDetailPage /></LazyPage></PermissionRoute> },
          { path: 'audit/events/:id', element: <PermissionRoute permission="audit.view"><LazyPage><AuditEventDetailPage /></LazyPage></PermissionRoute> },
          { path: 'audit/entity/:recordType/:recordId', element: <PermissionRoute permission="audit.view"><LazyPage><EntityAuditTimelinePage /></LazyPage></PermissionRoute> },
          { path: 'admin/users/:id', element: <PermissionRoute permission="admin.role.change"><LazyPage><UserDetail /></LazyPage></PermissionRoute> },
          { path: 'admin/roles', element: <PermissionRoute permission="admin.role.change"><LazyPage><RoleList /></LazyPage></PermissionRoute> },
          { path: 'admin/roles/:id', element: <PermissionRoute permission="admin.role.change"><LazyPage><RoleDetail /></LazyPage></PermissionRoute> },
          { path: 'admin/catalog', element: <PermissionRoute permission="catalog.manage"><LazyPage><CatalogManagementPage /></LazyPage></PermissionRoute> },
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
          { path: 'lab/results', element: <Navigate to="/lab/orders" replace /> },
          { path: 'lab/results/:id/encode', element: <PermissionRoute permission="lab.result.encode"><LazyPage><LegacyResultRedirectBridge mode="encode" /></LazyPage></PermissionRoute> },
          { path: 'lab/results/:id/approval', element: <PermissionRoute permission="lab.result.approve"><LazyPage><LegacyResultRedirectBridge mode="approval" /></LazyPage></PermissionRoute> },
          { path: 'lab/results/:id/print-preview', element: <PermissionRoute permission="lab.result.view"><LazyPage><LegacyResultRedirectBridge mode="print-preview" /></LazyPage></PermissionRoute> },
          { path: 'lab/validated', element: <PermissionRoute permission="lab.result.view"><LazyPage><ValidatedResultsPage /></LazyPage></PermissionRoute> },
          { path: 'lab/released', element: <PermissionRoute permission="lab.result.view"><LazyPage><ReleasedResultsPage /></LazyPage></PermissionRoute> },
          { path: 'lab/released/:patientId/:orderId', element: <PermissionRoute permission="lab.result.view"><LazyPage><ReleasedResultDetailPage /></LazyPage></PermissionRoute> },
          { path: 'emr', element: <PermissionRoute permission="patient.view"><LazyPage><EMRWorkspace /></LazyPage></PermissionRoute> },
          { path: 'radiology', element: <PermissionRoute permission="lab.result.view"><LazyPage><RadiologyCanvas /></LazyPage></PermissionRoute> },
           { path: 'pharmacy/dashboard', element: <PermissionRoute permission="inventory.item.view"><LazyPage><PharmacyDashboard /></LazyPage></PermissionRoute> },
           { path: 'pharmacy', element: <PermissionRoute permission="inventory.stock.dispense"><LazyPage><PharmacyHub /></LazyPage></PermissionRoute> },

          { path: 'claims', element: <PermissionRoute permission="billing.claim.view"><LazyPage><ClaimsDashboard /></LazyPage></PermissionRoute> },
          { path: 'admin/patient-merges', element: <PermissionRoute permission="admin.role.change"><LazyPage><PatientMergeRequests /></LazyPage></PermissionRoute> },
          
          // Branch Admin routes (branch-scoped)
          { path: 'branch-admin', element: <PermissionRoute allowedRoles={['Super Admin', 'Branch Admin']} isBranchScoped><LazyPage><BranchAdminDashboard /></LazyPage></PermissionRoute> },
          { path: 'branch-admin/staff', element: <PermissionRoute allowedRoles={['Super Admin', 'Branch Admin']} isBranchScoped><LazyPage><WIPPage /></LazyPage></PermissionRoute> },
          { path: 'branch-admin/departments', element: <PermissionRoute allowedRoles={['Super Admin', 'Branch Admin']} isBranchScoped><LazyPage><WIPPage /></LazyPage></PermissionRoute> },
          { path: 'branch-admin/rooms', element: <PermissionRoute allowedRoles={['Super Admin', 'Branch Admin']} isBranchScoped><LazyPage><WIPPage /></LazyPage></PermissionRoute> },
          { path: 'branch-admin/schedules', element: <PermissionRoute allowedRoles={['Super Admin', 'Branch Admin']} isBranchScoped><LazyPage><WIPPage /></LazyPage></PermissionRoute> },
          { path: 'branch-admin/services', element: <PermissionRoute allowedRoles={['Super Admin', 'Branch Admin']} isBranchScoped><LazyPage><WIPPage /></LazyPage></PermissionRoute> },
          { path: 'branch-admin/equipment', element: <PermissionRoute allowedRoles={['Super Admin', 'Branch Admin']} isBranchScoped><LazyPage><WIPPage /></LazyPage></PermissionRoute> },
          { path: 'branch-admin/inventory-rules', element: <PermissionRoute allowedRoles={['Super Admin', 'Branch Admin']} isBranchScoped><LazyPage><WIPPage /></LazyPage></PermissionRoute> },
          { path: 'branch-admin/billing-rules', element: <PermissionRoute allowedRoles={['Super Admin', 'Branch Admin']} isBranchScoped><LazyPage><WIPPage /></LazyPage></PermissionRoute> },
          { path: 'branch-admin/queue-settings', element: <PermissionRoute allowedRoles={['Super Admin', 'Branch Admin']} isBranchScoped><LazyPage><WIPPage /></LazyPage></PermissionRoute> },
          { path: 'branch-admin/approvals', element: <PermissionRoute allowedRoles={['Super Admin', 'Branch Admin']} isBranchScoped><LazyPage><WIPPage /></LazyPage></PermissionRoute> },

          // SuperAdmin Portal
          { path: 'admin', element: <PermissionRoute allowedRoles={['Super Admin']}><LazyPage><SuperAdminDashboard /></LazyPage></PermissionRoute> },
           { path: 'admin/executive', element: <PermissionRoute allowedRoles={['Super Admin', 'Branch Admin']}><LazyPage><AdminExecutiveDashboard /></LazyPage></PermissionRoute> },
           { path: 'clinical/ops', element: <PermissionRoute allowedRoles={['Super Admin', 'Branch Admin', 'Doctor', 'Nurse']} isBranchScoped><LazyPage><ClinicalOperationsDashboard /></LazyPage></PermissionRoute> },
           { path: 'admin/tenants', element: <PermissionRoute allowedRoles={['Super Admin']}><LazyPage><TenantsPage /></LazyPage></PermissionRoute> },

          { path: 'admin/branches', element: <PermissionRoute allowedRoles={['Super Admin']}><LazyPage><BranchesPage /></LazyPage></PermissionRoute> },
          { path: 'admin/users', element: <PermissionRoute permission="admin.role.change"><LazyPage><UsersPage /></LazyPage></PermissionRoute> },
          { path: 'admin/roles-permissions', element: <PermissionRoute permission="admin.role.change"><LazyPage><RolesPermissionsPage /></LazyPage></PermissionRoute> },
          { path: 'admin/security', element: <PermissionRoute allowedRoles={['Super Admin']}><LazyPage><SecurityCenterPage /></LazyPage></PermissionRoute> },
          { path: 'admin/audit-logs', element: <PermissionRoute permission="audit.view"><LazyPage><AuditLogsPage /></LazyPage></PermissionRoute> },
          { path: 'admin/settings', element: <PermissionRoute permission="admin.role.change"><LazyPage><SystemSettingsPage /></LazyPage></PermissionRoute> },
          { path: 'admin/reports', element: <PermissionRoute permission="report.export"><LazyPage><ReportsAnalyticsPage /></LazyPage></PermissionRoute> },

          // Compliance Portal
          { path: 'compliance', element: <PermissionRoute permission="compliance.audit.review"><LazyPage><ComplianceDashboard /></LazyPage></PermissionRoute> },
          { path: 'compliance/phi-access', element: <PermissionRoute permission="compliance.phi.monitor"><LazyPage><PHIAccessMonitorPage /></LazyPage></PermissionRoute> },
          { path: 'compliance/audit-review', element: <PermissionRoute permission="compliance.audit.review"><LazyPage><AuditReviewPage /></LazyPage></PermissionRoute> },
          { path: 'compliance/access-reviews', element: <PermissionRoute permission="compliance.audit.review"><LazyPage><AccessReviewsPage /></LazyPage></PermissionRoute> },
          { path: 'compliance/export-logs', element: <PermissionRoute permission="compliance.report.export"><LazyPage><ExportLogsPage /></LazyPage></PermissionRoute> },
          { path: 'compliance/breach-alerts', element: <PermissionRoute permission="compliance.phi.monitor"><LazyPage><BreachAlertsPage /></LazyPage></PermissionRoute> },
          { path: 'compliance/retention', element: <PermissionRoute permission="compliance.audit.review"><LazyPage><RetentionManagementPage /></LazyPage></PermissionRoute> },
          { path: 'compliance/reports', element: <PermissionRoute permission="compliance.report.export"><LazyPage><ComplianceReportsPage /></LazyPage></PermissionRoute> },
          { path: 'compliance/audit-chain', element: <PermissionRoute permission="compliance.audit.review"><LazyPage><AuditChainReviewPage /></LazyPage></PermissionRoute> },

          // IT Support Portal
          { path: 'it', element: <PermissionRoute permission="it.system.view"><LazyPage><ITSupportDashboard /></LazyPage></PermissionRoute> },
          { path: 'it/system-health', element: <PermissionRoute permission="it.system.view"><LazyPage><SystemHealthPage /></LazyPage></PermissionRoute> },
          { path: 'it/user-support', element: <PermissionRoute permission="it.support.manage"><LazyPage><UserSupportPage /></LazyPage></PermissionRoute> },
          { path: 'it/sessions', element: <PermissionRoute permission="it.system.view"><LazyPage><SessionsPage /></LazyPage></PermissionRoute> },
          { path: 'it/background-jobs', element: <PermissionRoute permission="it.system.view"><LazyPage><BackgroundJobsPage /></LazyPage></PermissionRoute> },
          { path: 'it/integrations', element: <PermissionRoute permission="it.system.view"><LazyPage><IntegrationsPage /></LazyPage></PermissionRoute> },
          { path: 'it/logs', element: <PermissionRoute permission="it.system.view"><LazyPage><LogsPage /></LazyPage></PermissionRoute> },
          { path: 'it/backup-restore', element: <PermissionRoute permission="it.system.view"><LazyPage><BackupRestorePage /></LazyPage></PermissionRoute> },
          { path: 'it/incidents', element: <PermissionRoute permission="it.support.manage"><LazyPage><IncidentReportsPage /></LazyPage></PermissionRoute> },

          // HR Portal
          { path: 'hr', element: <PermissionRoute permission="hr.employee.view"><LazyPage><HRDashboard /></LazyPage></PermissionRoute> },
          { path: 'hr/employees', element: <PermissionRoute permission="hr.employee.manage"><LazyPage><EmployeesPage /></LazyPage></PermissionRoute> },
          { path: 'hr/departments', element: <PermissionRoute permission="hr.employee.view"><LazyPage><DepartmentsPage /></LazyPage></PermissionRoute> },
          { path: 'hr/attendance', element: <PermissionRoute permission="hr.employee.view"><LazyPage><AttendancePage /></LazyPage></PermissionRoute> },
          { path: 'hr/leave', element: <PermissionRoute permission="hr.employee.view"><LazyPage><LeaveManagementPage /></LazyPage></PermissionRoute> },
          { path: 'hr/payroll', element: <PermissionRoute permission="hr.payroll.view"><LazyPage><PayrollPage /></LazyPage></PermissionRoute> },
          { path: 'hr/licenses', element: <PermissionRoute permission="hr.employee.view"><LazyPage><LicensesCertificationsPage /></LazyPage></PermissionRoute> },
          { path: 'hr/branch-assignments', element: <PermissionRoute permission="hr.employee.manage"><LazyPage><BranchAssignmentsPage /></LazyPage></PermissionRoute> },
          { path: 'hr/termination', element: <PermissionRoute permission="hr.employee.manage"><LazyPage><TerminationWorkflowPage /></LazyPage></PermissionRoute> },

          // Procurement Portal
          { path: 'procurement', element: <PermissionRoute permission="procurement.request.view"><LazyPage><ProcurementDashboard /></LazyPage></PermissionRoute> },
          { path: 'procurement/suppliers', element: <PermissionRoute permission="procurement.supplier.view"><LazyPage><SuppliersPage /></LazyPage></PermissionRoute> },
          { path: 'procurement/purchase-requests', element: <PermissionRoute permission="procurement.request.view"><LazyPage><PurchaseRequestsPage /></LazyPage></PermissionRoute> },
          { path: 'procurement/rfqs', element: <PermissionRoute permission="procurement.rfq.view"><LazyPage><RFQsPage /></LazyPage></PermissionRoute> },
          { path: 'procurement/quotes', element: <PermissionRoute permission="procurement.quote.view"><LazyPage><QuotesPage /></LazyPage></PermissionRoute> },
          { path: 'procurement/purchase-orders', element: <PermissionRoute permission="procurement.po.view"><LazyPage><PurchaseOrdersPage /></LazyPage></PermissionRoute> },
          { path: 'procurement/receiving', element: <PermissionRoute permission="procurement.receiving.post"><LazyPage><ProcurementReceivingPage /></LazyPage></PermissionRoute> },
          { path: 'procurement/inventory-requests', element: <PermissionRoute permission="procurement.request.view"><LazyPage><InventoryRequestsPage /></LazyPage></PermissionRoute> },
          { path: 'procurement/vendor-performance', element: <PermissionRoute permission="procurement.vendor.performance.view"><LazyPage><VendorPerformancePage /></LazyPage></PermissionRoute> },

          // Marketplace (Buyer)
          { path: 'marketplace', element: <PermissionRoute permission="marketplace.buyer.view"><LazyPage><MarketplaceHomePage /></LazyPage></PermissionRoute> },
          { path: 'marketplace/products', element: <PermissionRoute permission="marketplace.buyer.view"><LazyPage><MarketplaceProductListingPage /></LazyPage></PermissionRoute> },
          { path: 'marketplace/rfqs', element: <PermissionRoute permission="marketplace.buyer.view"><LazyPage><MarketplaceRFQPage /></LazyPage></PermissionRoute> },
          { path: 'marketplace/orders', element: <PermissionRoute permission="marketplace.buyer.view"><LazyPage><MarketplaceOrdersPage /></LazyPage></PermissionRoute> },
          { path: 'marketplace/installations', element: <PermissionRoute permission="marketplace.buyer.view"><LazyPage><MarketplaceInstallationTrackingPage /></LazyPage></PermissionRoute> },
          { path: 'marketplace/warranty', element: <PermissionRoute permission="marketplace.buyer.view"><LazyPage><MarketplaceWarrantyPage /></LazyPage></PermissionRoute> },
          { path: 'marketplace/service-tickets', element: <PermissionRoute permission="marketplace.buyer.view"><LazyPage><MarketplaceServiceTicketsPage /></LazyPage></PermissionRoute> },

          // Marketplace (Supplier)
          { path: 'supplier', element: <PermissionRoute allowedRoles={['Supplier']}><LazyPage><SupplierDashboard /></LazyPage></PermissionRoute> },
          { path: 'supplier/listings', element: <PermissionRoute permission="marketplace.supplier.manage_listing"><LazyPage><SupplierListingsPage /></LazyPage></PermissionRoute> },
          { path: 'supplier/service-listings', element: <PermissionRoute permission="marketplace.supplier.manage_listing"><LazyPage><SupplierServiceListingsPage /></LazyPage></PermissionRoute> },
          { path: 'supplier/rfq-inbox', element: <PermissionRoute allowedRoles={['Supplier']}><LazyPage><SupplierRFQInboxPage /></LazyPage></PermissionRoute> },
          { path: 'supplier/quotes', element: <PermissionRoute allowedRoles={['Supplier']}><LazyPage><SupplierQuotesPage /></LazyPage></PermissionRoute> },
          { path: 'supplier/orders', element: <PermissionRoute allowedRoles={['Supplier']}><LazyPage><SupplierOrdersPage /></LazyPage></PermissionRoute> },
          { path: 'supplier/fulfillment', element: <PermissionRoute allowedRoles={['Supplier']}><LazyPage><SupplierFulfillmentPage /></LazyPage></PermissionRoute> },
          { path: 'supplier/warranty-claims', element: <PermissionRoute allowedRoles={['Supplier']}><LazyPage><SupplierWarrantyClaimsPage /></LazyPage></PermissionRoute> },
          { path: 'supplier/service-commitments', element: <PermissionRoute allowedRoles={['Supplier']}><LazyPage><SupplierServiceCommitmentsPage /></LazyPage></PermissionRoute> },
          { path: 'supplier/payouts', element: <PermissionRoute allowedRoles={['Supplier']}><LazyPage><SupplierPayoutsPage /></LazyPage></PermissionRoute> },
          { path: 'supplier/performance', element: <PermissionRoute allowedRoles={['Supplier']}><LazyPage><SupplierPerformancePage /></LazyPage></PermissionRoute> },

          // Marketplace (Admin)
          { path: 'marketplace-admin', element: <PermissionRoute allowedRoles={['Super Admin', 'Marketplace Admin']}><LazyPage><MarketplaceAdminDashboard /></LazyPage></PermissionRoute> },
          { path: 'marketplace-admin/suppliers', element: <PermissionRoute permission="marketplace.admin.manage"><LazyPage><SupplierManagementPage /></LazyPage></PermissionRoute> },
          { path: 'marketplace-admin/buyers', element: <PermissionRoute permission="marketplace.admin.manage"><LazyPage><BuyerManagementPage /></LazyPage></PermissionRoute> },
          { path: 'marketplace-admin/listing-approval', element: <PermissionRoute permission="marketplace.admin.manage"><LazyPage><ListingApprovalPage /></LazyPage></PermissionRoute> },
          { path: 'marketplace-admin/rfq-monitor', element: <PermissionRoute permission="marketplace.admin.view"><LazyPage><RFQMonitorPage /></LazyPage></PermissionRoute> },
          { path: 'marketplace-admin/order-monitor', element: <PermissionRoute permission="marketplace.admin.view"><LazyPage><OrderMonitorPage /></LazyPage></PermissionRoute> },
          { path: 'marketplace-admin/fulfillment-monitor', element: <PermissionRoute permission="marketplace.admin.view"><LazyPage><FulfillmentMonitorPage /></LazyPage></PermissionRoute> },
          { path: 'marketplace-admin/installation-monitor', element: <PermissionRoute permission="marketplace.admin.view"><LazyPage><InstallationMonitorPage /></LazyPage></PermissionRoute> },
          { path: 'marketplace-admin/warranty-claims', element: <PermissionRoute permission="marketplace.admin.view"><LazyPage><MarketplaceWarrantyClaimsPage /></LazyPage></PermissionRoute> },
          { path: 'marketplace-admin/disputes', element: <PermissionRoute permission="marketplace.admin.manage"><LazyPage><DisputesPage /></LazyPage></PermissionRoute> },
          { path: 'marketplace-admin/commission-fees', element: <PermissionRoute permission="marketplace.admin.manage"><LazyPage><CommissionFeesPage /></LazyPage></PermissionRoute> },
          { path: 'marketplace-admin/reports', element: <PermissionRoute permission="marketplace.admin.view"><LazyPage><MarketplaceReportsPage /></LazyPage></PermissionRoute> },

          // Field Service Portal
          { path: 'field-service', element: <PermissionRoute allowedRoles={['Field Technician']}><LazyPage><FieldServiceDashboard /></LazyPage></PermissionRoute> },
          { path: 'field-service/deliveries', element: <PermissionRoute permission="field_service.job.view"><LazyPage><DeliveryJobsPage /></LazyPage></PermissionRoute> },
          { path: 'field-service/installations', element: <PermissionRoute permission="field_service.installation.update"><LazyPage><InstallationJobsPage /></LazyPage></PermissionRoute> },
          { path: 'field-service/schedule', element: <PermissionRoute permission="field_service.job.view"><LazyPage><TechnicianSchedulePage /></LazyPage></PermissionRoute> },
          { path: 'field-service/handover', element: <PermissionRoute permission="field_service.delivery.proof_create"><LazyPage><MobileHandoverChecklistPage /></LazyPage></PermissionRoute> },
          { path: 'field-service/proof-of-delivery', element: <PermissionRoute permission="field_service.delivery.proof_create"><LazyPage><ProofOfDeliveryPage /></LazyPage></PermissionRoute> },
          { path: 'field-service/warranty-activation', element: <PermissionRoute permission="field_service.installation.update"><LazyPage><WarrantyActivationPage /></LazyPage></PermissionRoute> },
          { path: 'field-service/preventive-maintenance', element: <PermissionRoute permission="field_service.maintenance.update"><LazyPage><PreventiveMaintenancePage /></LazyPage></PermissionRoute> },
          { path: 'field-service/service-worklog', element: <PermissionRoute permission="field_service.job.update"><LazyPage><ServiceTicketWorklogPage /></LazyPage></PermissionRoute> },
          { path: 'field-service/offline-sync', element: <PermissionRoute allowedRoles={['Field Technician']}><LazyPage><OfflineSyncQueuePage /></LazyPage></PermissionRoute> },

          // Integration Portal
          { path: 'integration', element: <PermissionRoute allowedRoles={['Super Admin', 'IT Support', 'Marketplace Admin', 'Branch Admin']}><LazyPage><IntegrationDashboard /></LazyPage></PermissionRoute> },
          { path: 'integration/notifications', element: <PermissionRoute allowedRoles={['Super Admin', 'IT Support', 'Marketplace Admin', 'Branch Admin']}><LazyPage><NotificationCenterPage /></LazyPage></PermissionRoute> },
          { path: 'integration/approvals', element: <PermissionRoute allowedRoles={['Super Admin', 'IT Support', 'Marketplace Admin', 'Branch Admin']}><LazyPage><IntegrationApprovalCenterPage /></LazyPage></PermissionRoute> },
          { path: 'integration/global-search', element: <PermissionRoute allowedRoles={['Super Admin', 'IT Support', 'Marketplace Admin', 'Branch Admin']}><LazyPage><GlobalSearchPage /></LazyPage></PermissionRoute> },
          { path: 'integration/patient-timeline', element: <PermissionRoute allowedRoles={['Super Admin', 'IT Support', 'Marketplace Admin', 'Branch Admin']}><LazyPage><PatientTimelinePage /></LazyPage></PermissionRoute> },
          { path: 'integration/asset-timeline', element: <PermissionRoute allowedRoles={['Super Admin', 'IT Support', 'Marketplace Admin', 'Branch Admin']}><LazyPage><AssetTimelinePage /></LazyPage></PermissionRoute> },
          { path: 'integration/reconciliation', element: <PermissionRoute allowedRoles={['Super Admin', 'IT Support', 'Marketplace Admin', 'Branch Admin']}><LazyPage><ReconciliationMonitorPage /></LazyPage></PermissionRoute> },
          { path: 'integration/activity-audit', element: <PermissionRoute allowedRoles={['Super Admin', 'IT Support', 'Marketplace Admin', 'Branch Admin']}><LazyPage><ActivityAuditContextPage /></LazyPage></PermissionRoute> },

          // Patient Portal
          { path: 'patient', element: <PermissionRoute permission="patient.portal.view_own"><LazyPage><PatientDashboard /></LazyPage></PermissionRoute> },
          { path: 'patient/appointments', element: <PermissionRoute permission="patient.portal.appointment.view"><LazyPage><PatientAppointmentsPage /></LazyPage></PermissionRoute> },
          { path: 'patient/lab-results', element: <PermissionRoute permission="patient.portal.result.view"><LazyPage><PatientLabResultsPage /></LazyPage></PermissionRoute> },
          { path: 'patient/prescriptions', element: <PermissionRoute permission="patient.portal.view_own"><LazyPage><PatientPrescriptionsPage /></LazyPage></PermissionRoute> },
          { path: 'patient/billing', element: <PermissionRoute permission="patient.portal.billing.view"><LazyPage><PatientBillingPage /></LazyPage></PermissionRoute> },
          { path: 'patient/medical-records', element: <PermissionRoute permission="patient.portal.view_own"><LazyPage><PatientMedicalRecordsPage /></LazyPage></PermissionRoute> },
          { path: 'patient/messages', element: <PermissionRoute permission="patient.portal.message"><LazyPage><PatientMessagesPage /></LazyPage></PermissionRoute> },
          { path: 'patient/profile', element: <PermissionRoute permission="patient.portal.view_own"><LazyPage><PatientProfilePage /></LazyPage></PermissionRoute> },

          // Doctor Portal (branch-scoped)
          { path: 'doctor', element: <PermissionRoute allowedRoles={['Super Admin', 'Branch Admin', 'Doctor']} isBranchScoped><LazyPage><DoctorDashboard /></LazyPage></PermissionRoute> },
          { path: 'doctor/queue', element: <PermissionRoute allowedRoles={['Super Admin', 'Branch Admin', 'Doctor']} isBranchScoped><LazyPage><DoctorQueuePage /></LazyPage></PermissionRoute> },
          { path: 'doctor/patients', element: <PermissionRoute allowedRoles={['Super Admin', 'Branch Admin', 'Doctor']} isBranchScoped><LazyPage><DoctorPatientsPage /></LazyPage></PermissionRoute> },
          { path: 'doctor/emr', element: <PermissionRoute allowedRoles={['Super Admin', 'Branch Admin', 'Doctor']} isBranchScoped><LazyPage><DoctorEMRPage /></LazyPage></PermissionRoute> },

          // Nurse Portal (branch-scoped)
          { path: 'nurse', element: <PermissionRoute allowedRoles={['Super Admin', 'Branch Admin', 'Nurse']} isBranchScoped><LazyPage><NurseDashboard /></LazyPage></PermissionRoute> },
          { path: 'nurse/triage', element: <PermissionRoute allowedRoles={['Super Admin', 'Branch Admin', 'Nurse']} isBranchScoped><LazyPage><NurseTriageQueuePage /></LazyPage></PermissionRoute> },
          { path: 'nurse/intake', element: <PermissionRoute allowedRoles={['Super Admin', 'Branch Admin', 'Nurse']} isBranchScoped><LazyPage><NursePatientIntakePage /></LazyPage></PermissionRoute> },
          { path: 'nurse/vitals', element: <PermissionRoute allowedRoles={['Super Admin', 'Branch Admin', 'Nurse']} isBranchScoped><LazyPage><NurseVitalsPage /></LazyPage></PermissionRoute> },
          { path: 'nurse/tasks', element: <PermissionRoute allowedRoles={['Super Admin', 'Branch Admin', 'Nurse']} isBranchScoped><LazyPage><NurseTasksPage /></LazyPage></PermissionRoute> },
          { path: 'nurse/specimens', element: <PermissionRoute allowedRoles={['Super Admin', 'Branch Admin', 'Nurse']} isBranchScoped><LazyPage><NurseSpecimenCollectionPage /></LazyPage></PermissionRoute> },

          // Lab Portal (branch-scoped)
          { path: 'lab', element: <PermissionRoute allowedRoles={['Super Admin', 'Branch Admin', 'Lab Technician']} isBranchScoped><LazyPage><LabDashboard /></LazyPage></PermissionRoute> },
          { path: 'lab/orders', element: <PermissionRoute allowedRoles={['Super Admin', 'Branch Admin', 'Lab Technician']} isBranchScoped><LazyPage><LabOrdersPage /></LazyPage></PermissionRoute> },
          { path: 'lab/specimens', element: <PermissionRoute allowedRoles={['Super Admin', 'Branch Admin', 'Lab Technician']} isBranchScoped><LazyPage><SpecimenReceivingPage /></LazyPage></PermissionRoute> },
          { path: 'lab/encoding', element: <PermissionRoute allowedRoles={['Super Admin', 'Branch Admin', 'Lab Technician']} isBranchScoped><LazyPage><ResultEncodingPage /></LazyPage></PermissionRoute> },
          { path: 'lab/validation', element: <PermissionRoute allowedRoles={['Super Admin', 'Branch Admin', 'Lab Technician']} isBranchScoped><LazyPage><ResultValidationPage /></LazyPage></PermissionRoute> },
          { path: 'lab/critical-results', element: <PermissionRoute allowedRoles={['Super Admin', 'Branch Admin', 'Lab Technician']} isBranchScoped><LazyPage><CriticalResultsPage /></LazyPage></PermissionRoute> },
          { path: 'lab/turnaround', element: <PermissionRoute allowedRoles={['Super Admin', 'Branch Admin', 'Lab Technician']} isBranchScoped><LazyPage><TurnaroundMonitorPage /></LazyPage></PermissionRoute> },

          // Cashier Portal (branch-scoped)
          { path: 'cashier', element: <PermissionRoute allowedRoles={['Super Admin', 'Branch Admin', 'Cashier', 'Finance']} isBranchScoped><LazyPage><CashierDashboard /></LazyPage></PermissionRoute> },
          { path: 'cashier/billing', element: <PermissionRoute allowedRoles={['Super Admin', 'Branch Admin', 'Cashier', 'Finance']} isBranchScoped><LazyPage><CashierPatientBillingPage /></LazyPage></PermissionRoute> },
          { path: 'cashier/invoices', element: <PermissionRoute allowedRoles={['Super Admin', 'Branch Admin', 'Cashier', 'Finance']} isBranchScoped><LazyPage><InvoicesPage /></LazyPage></PermissionRoute> },
          { path: 'cashier/payments', element: <PermissionRoute allowedRoles={['Super Admin', 'Branch Admin', 'Cashier', 'Finance']} isBranchScoped><LazyPage><PaymentsPage /></LazyPage></PermissionRoute> },
          { path: 'cashier/session', element: <PermissionRoute allowedRoles={['Super Admin', 'Branch Admin', 'Cashier', 'Finance']} isBranchScoped><LazyPage><CashierSessionPage /></LazyPage></PermissionRoute> },
          { path: 'cashier/refunds-voids', element: <PermissionRoute allowedRoles={['Super Admin', 'Branch Admin', 'Cashier', 'Finance']} isBranchScoped><LazyPage><RefundVoidQueuePage /></LazyPage></PermissionRoute> },
          { path: 'cashier/hmo-claims', element: <PermissionRoute allowedRoles={['Super Admin', 'Branch Admin', 'Cashier', 'Finance']} isBranchScoped><LazyPage><HMOClaimsPage /></LazyPage></PermissionRoute> },
          { path: 'cashier/reconciliation', element: <PermissionRoute allowedRoles={['Super Admin', 'Branch Admin', 'Cashier', 'Finance']} isBranchScoped><LazyPage><DailyReconciliationPage /></LazyPage></PermissionRoute> },

          // Other Features
          { path: 'telehealth', element: <PermissionRoute permission="encounter.create"><LazyPage><TelehealthConsole /></LazyPage></PermissionRoute> },
          { path: 'spatial', element: <PermissionRoute permission="it.system.view"><LazyPage><SpatialConsole /></LazyPage></PermissionRoute> },
          { path: 'sales-dashboard', element: <PermissionRoute permission="report.export"><LazyPage><SalesDashboard /></LazyPage></PermissionRoute> },
          { path: 'logistics-checklist', element: <PermissionRoute permission="field_service.job.view"><LazyPage><InstallationChecklist /></LazyPage></PermissionRoute> },

          // Pharmacy Sub-routes (branch-scoped)
          { path: 'pharmacy/dispense', element: <PermissionRoute permission="inventory.stock.dispense" isBranchScoped><LazyPage><WIPPage /></LazyPage></PermissionRoute> },
          { path: 'pharmacy/inventory', element: <PermissionRoute permission="inventory.stock.dispense" isBranchScoped><LazyPage><WIPPage /></LazyPage></PermissionRoute> },

          // Notifications
          { path: 'notifications', element: <PermissionRoute mode={GuardMode.ANY} permissions={['it.system.view', 'compliance.audit.review']}><LazyPage><NotificationCenter /></LazyPage></PermissionRoute> },
          { path: 'notifications/templates', element: <PermissionRoute permission="admin.role.change"><LazyPage><NotificationTemplates /></LazyPage></PermissionRoute> },
          { path: 'notifications/settings', element: <PermissionRoute mode={GuardMode.ANY} permissions={['it.system.view', 'admin.role.change']}><LazyPage><NotificationSettingsPage /></LazyPage></PermissionRoute> },
        ],
      },
    ],
  },
]);

export default function App() {
  return (
    <ProviderErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <RouterProvider router={router} />
          <AuthDiagnosticsPanel />
        </AuthProvider>
      </QueryClientProvider>
    </ProviderErrorBoundary>
  );
}
