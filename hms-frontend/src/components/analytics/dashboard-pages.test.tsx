import type React from 'react';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SuperAdminDashboard } from '../../portals/admin/SuperAdminDashboard';
import { ReportsAnalyticsPage } from '../../portals/admin/ReportsAnalyticsPage';
import { HRDashboard } from '../../portals/hr/HRDashboard';
import { ProcurementDashboard } from '../../portals/procurement/ProcurementDashboard';
import { MarketplaceAdminDashboard } from '../../portals/marketplace/admin/MarketplaceAdminDashboard';
import { SupplierDashboard } from '../../portals/marketplace/supplier/SupplierDashboard';
import { ComplianceDashboard } from '../../portals/compliance/ComplianceDashboard';
import { ITSupportDashboard } from '../../portals/it-support/ITSupportDashboard';
import { PatientDashboard } from '../../portals/patient/PatientDashboard';

vi.mock('../../lib/api', () => ({
  apiClient: {
    get: vi.fn().mockResolvedValue({ data: [] }),
    post: vi.fn().mockResolvedValue({ data: {} }),
    patch: vi.fn().mockResolvedValue({ data: {} }),
  },
}));

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div data-testid="responsive-chart">{children}</div>,
  LineChart: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Line: () => <div />,
  BarChart: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Bar: () => <div />,
  AreaChart: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Area: () => <div />,
  PieChart: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Pie: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Cell: () => <div />,
  CartesianGrid: () => <div />,
  Tooltip: () => <div />,
  XAxis: () => <div />,
  YAxis: () => <div />,
  Legend: () => <div />,
}));

vi.mock('../../hooks/use-patient-portal', () => ({
  usePatientProfile: () => ({ profile: { firstName: 'Ava', patientNumber: 'P-100', status: 'ACTIVE' }, loading: false }),
  usePatientLabResults: () => ({ results: [{ id: 'lab-result-1', createdAt: '2026-05-20T00:00:00Z', lockedAt: '2026-05-21T00:00:00Z', remarks: 'Normal' }], loading: false }),
  usePatientPrescriptions: () => ({ prescriptions: [{ id: 'rx-1', medicationName: 'Amoxicillin', dosage: '500mg', frequency: 'BID', status: 'ACTIVE' }], loading: false, error: null, refetch: vi.fn() }),
  usePatientInvoices: () => ({ invoices: [{ id: 'inv-1', totalAmount: 2000, paidAmount: 500, status: 'PARTIAL' }], loading: false, error: null, refetch: vi.fn() }),
}));

vi.mock('../../hooks/use-compliance', () => ({
  useAuditEvents: () => ({ events: [{ id: 'audit-1', createdAt: '2026-05-21T00:00:00Z', activeRole: 'Compliance Officer', recordType: 'Patient', recordId: 'PAT-1', eventKey: 'PHI_ACCESS' }], total: 1, loading: false, error: null, refetch: vi.fn() }),
  useAccessReview: () => ({ report: { staleAccountsCount: 1, privilegeEscalationsCount: 0, complianceStatus: 'NEEDS_ATTENTION' }, loading: false, error: null, refetch: vi.fn() }),
}));

vi.mock('../../hooks/use-it-support', () => ({
  useSupportTickets: () => ({ tickets: [{ id: 'ticket-1', reportedBy: { email: 'it@example.com' }, branch: { name: 'Metro' }, issueType: 'LOGIN', summary: 'Cannot login', status: 'OPEN', priority: 'HIGH', createdAt: '2026-05-21T00:00:00Z' }], loading: false, error: null, refetch: vi.fn() }),
  useTicketStats: () => ({ stats: { open: 1, urgent: 1, inProgress: 0, total: 1 }, loading: false, statsError: null, refetch: vi.fn() }),
}));

vi.mock('../../hooks/use-analytics', () => ({
  useAnalytics: () => ({
    hr: { headcount: 1, pendingLeave: 0, expiredLicenses: 0, staffingGap: 0 },
    it: { activeSessions: 4, healthyIntegrations: 3, backupFailures: 0, systemLatencyMs: 45 },
    marketplace: { gmv: 100000, totalOrders: 12, approvedListings: 8, revenue: 5000 },
    compliance: { totalAuditEvents: 120, securityAlerts: 1, complianceScore: 95 },
    isLoading: false,
    isFetching: false,
    demoByScope: { hr: false, it: false, marketplace: false, compliance: false },
    refetchAll: vi.fn(),
  }),
}));

vi.mock('../../hooks/use-user', () => ({
  usePermissions: () => ({ hasPermission: () => true }),
}));

vi.mock('../../services/dashboard.service', () => ({
  dashboardService: {
    getAdminSummary: () => Promise.resolve({ activePatients: 150, todaysAppointments: 42, pendingLabs: 7, lowStock: 3, revenue: 250000, securityAlerts: 1 }),
    getAdminTrends: () => Promise.resolve([]),
    getAdminAlerts: () => Promise.resolve({ lowStock: [], criticalLabs: [] }),
    getAdminTopLists: () => Promise.resolve({ busiestDepts: [], unpaidBills: [] }),
    buildQueryParams: () => ({}),
  },
}));

vi.mock('../../services/procurement.service', () => ({
  procurementService: {
    listSuppliers: () => Promise.resolve([
      { id: 'supplier-1', name: 'Medical Supply Co.', status: 'ACTIVE' },
      { id: 'supplier-2', name: 'Inactive Supplier', status: 'INACTIVE' },
    ]),
    listPurchaseRequests: () => Promise.resolve([
      { id: 'pr-1', branchId: 'branch-1', requestedById: 'user-1', items: [], status: 'SUBMITTED', createdAt: '2026-07-01T00:00:00Z' },
      { id: 'pr-2', branchId: 'branch-1', requestedById: 'user-1', items: [], status: 'APPROVED', createdAt: '2026-07-02T00:00:00Z' },
      { id: 'pr-3', branchId: 'branch-1', requestedById: 'user-1', items: [], status: 'ORDERED', createdAt: '2026-07-03T00:00:00Z' },
    ]),
    listPurchaseOrders: () => Promise.resolve([
      { id: 'po-1', branchId: 'branch-1', supplierId: 'supplier-1', purchaseRequestId: 'pr-2', orderNumber: 'PO-000001', status: 'SENT', supplier: { id: 'supplier-1', name: 'Medical Supply Co.', status: 'ACTIVE' } },
      { id: 'po-2', branchId: 'branch-1', supplierId: 'supplier-1', purchaseRequestId: 'pr-3', orderNumber: 'PO-000002', status: 'RECEIVED', supplier: { id: 'supplier-1', name: 'Medical Supply Co.', status: 'ACTIVE' } },
    ]),
  },
}));

vi.mock('../../services/admin.service', () => ({
  adminService: {
    listTenants: () => Promise.resolve([{ id: 't1', name: 'Central Hospital', status: 'ACTIVE', userCount: 21, branchCount: 2 }]),
    listUsers: () => Promise.resolve({ data: [], total: 0, page: 1, limit: 10 }),
    getUser: () => Promise.resolve(null),
    listRoles: () => Promise.resolve([]),
    listPermissions: () => Promise.resolve([]),
    listBranches: () => Promise.resolve({ data: [], total: 0, page: 1, limit: 10 }),
    getBranch: () => Promise.resolve(null),
    createUser: () => Promise.resolve(null),
    activateUser: () => Promise.resolve(null),
    deactivateUser: () => Promise.resolve(null),
    forceLogout: () => Promise.resolve(),
    resetPassword: () => Promise.resolve({ tempPassword: '' }),
    assignUserRole: () => Promise.resolve(null),
    revokeUserRole: () => Promise.resolve(null),
  },
}));

vi.mock('../../hooks/use-hr', () => ({
  useHr: () => ({
    employees: [{ id: 'e1', firstName: 'Alice', lastName: 'Anderson', email: 'alice@test.com', role: 'Nurse', department: 'ER', status: 'ACTIVE', rawStatus: 'ACTIVE', joinedAt: '2025-01-01' }],
    leaveRequests: [],
    licenses: [],
    isLoading: false,
    refetchAll: vi.fn(),
  }),
}));

vi.mock('../../components/analytics', async () => {
  const actual = await vi.importActual<typeof import('../../components/analytics')>('../../components/analytics');
  return {
    ...actual,
    InsightPanel: ({ title }: { title?: string }) => <div data-testid="insight-panel">{title}</div>,
  };
});

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

const renderPage = (ui: React.ReactElement) => render(
  <QueryClientProvider client={queryClient}>
    <MemoryRouter>{ui}</MemoryRouter>
  </QueryClientProvider>,
);

describe('dashboard intelligence pages', () => {
  beforeEach(() => { vi.useFakeTimers(); });
  afterEach(() => { try { vi.runAllTimers(); } catch { /* ok if not mocked */ } vi.useRealTimers(); });

  it('SuperAdminDashboard renders live platform command center with KPIs and tenant overview', async () => {
    vi.useRealTimers();
    renderPage(<SuperAdminDashboard />);
    expect(screen.getByText('Platform Command Center')).toBeInTheDocument();
    expect(await screen.findByText('Tenant overview')).toBeInTheDocument();
    expect(screen.queryByText(/Not yet implemented in this release/i)).not.toBeInTheDocument();
  });

  it('ReportsAnalyticsPage renders live system reports and analytics', async () => {
    vi.useRealTimers();
    renderPage(<ReportsAnalyticsPage />);
    expect(screen.getByText('System Reports & Performance Analytics')).toBeInTheDocument();
    expect(screen.queryByText(/Not yet implemented in this release/i)).not.toBeInTheDocument();
  });

  it('HRDashboard renders workforce analytics components', () => {
    renderPage(<HRDashboard />);
    expect(screen.getByText('Workforce Command Center')).toBeInTheDocument();
    expect(screen.getByText('Total headcount')).toBeInTheDocument();
    expect(screen.getByText('Workforce decisions')).toBeInTheDocument();
  });

  it('ProcurementDashboard renders live API totals without simulated alerts or dead actions', async () => {
    vi.useRealTimers();
    renderPage(<ProcurementDashboard />);
    expect(screen.getByText('Procurement Officer')).toBeInTheDocument();
    expect(screen.getByText('Open purchase requests')).toBeInTheDocument();
    expect(await screen.findByText('PO-000001')).toBeInTheDocument();
    expect(screen.getByText(/Source: Live Procurement API/i)).toBeInTheDocument();
    expect(screen.queryByText(/CRITICAL STOCKOUTS DETECTED/i)).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Auto-Generate RFQs/i })).not.toBeInTheDocument();
  });

  it('MarketplaceAdminDashboard renders governance metrics with honest prototype disclosure', () => {
    renderPage(<MarketplaceAdminDashboard />);
    expect(screen.getByText('Marketplace Command Center')).toBeInTheDocument();
    expect(screen.getByText('Approved listings')).toBeInTheDocument();
    expect(screen.getByText('Governance decisions')).toBeInTheDocument();
    expect(screen.queryByTestId('marketplace-admin-sandbox-notice')).not.toBeInTheDocument();
    // Chart titles no longer carry misleading (mock) or sandbox language
    // Honest audit footer indicates live data source
    expect(screen.getByText(/Live marketplace metrics with synthetic trend context/i)).toBeInTheDocument();
  });

  it('ComplianceDashboard renders governance analytics and drilldown table', () => {
    renderPage(<ComplianceDashboard />);
    expect(screen.getByText('Compliance Operations Center')).toBeInTheDocument();
    expect(screen.getByText('Governance decisions')).toBeInTheDocument();
    expect(screen.getByText('Recent PHI access')).toBeInTheDocument();
  });

  it('ITSupportDashboard renders operations analytics and insights', () => {
    renderPage(<ITSupportDashboard />);
    expect(screen.getByText('IT Reliability Workspace')).toBeInTheDocument();
    expect(screen.getByText('Reliability decisions')).toBeInTheDocument();
    expect(screen.getByText('Open support tickets')).toBeInTheDocument();
  });

  it('SupplierDashboard renders supplier intelligence charts and insights', () => {
    renderPage(<SupplierDashboard />);
    expect(screen.getByText('Supplier Command Center')).toBeInTheDocument();
    expect(screen.getByText('Supplier decisions')).toBeInTheDocument();
    expect(screen.getByText('Revenue trajectory')).toBeInTheDocument();
  });

  it('PatientDashboard remains action-focused instead of executive chart-heavy', () => {
    renderPage(<PatientDashboard />);
    expect(screen.getByText('Hello, Ava')).toBeInTheDocument();
    expect(screen.getByText(/Upcoming appointments — data not available yet/i)).toBeInTheDocument();
    expect(screen.queryByText(/GMV trend/i)).not.toBeInTheDocument();
  });
});
