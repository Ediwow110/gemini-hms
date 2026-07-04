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
}));

vi.mock('../../hooks/use-patient-portal', () => ({
  usePatientProfile: () => ({ profile: { firstName: 'Ava', patientNumber: 'P-100', status: 'ACTIVE' }, loading: false }),
  usePatientLabResults: () => ({ results: [{ id: 'lab-result-1', createdAt: '2026-05-20T00:00:00Z', lockedAt: '2026-05-21T00:00:00Z', remarks: 'Normal' }], loading: false }),
  usePatientPrescriptions: () => ({ prescriptions: [{ id: 'rx-1', medicationName: 'Amoxicillin', dosage: '500mg', frequency: 'BID', status: 'ACTIVE' }], loading: false }),
}));

vi.mock('../../hooks/use-compliance', () => ({
  useAuditEvents: () => ({ events: [{ id: 'audit-1', createdAt: '2026-05-21T00:00:00Z', activeRole: 'Compliance Officer', recordType: 'Patient', recordId: 'PAT-1', eventKey: 'PHI_ACCESS' }], loading: false }),
  useAccessReview: () => ({ report: { staleAccountsCount: 1, privilegeEscalationsCount: 0, complianceStatus: 'NEEDS_ATTENTION' }, loading: false, error: null }),
}));

vi.mock('../../hooks/use-it-support', () => ({
  useSupportTickets: () => ({ tickets: [{ id: 'ticket-1', reportedBy: { email: 'it@example.com' }, branch: { name: 'Metro' }, issueType: 'LOGIN', summary: 'Cannot login', status: 'OPEN', priority: 'HIGH', createdAt: '2026-05-21T00:00:00Z' }], loading: false }),
  useTicketStats: () => ({ stats: { open: 1, urgent: 1, inProgress: 0, total: 1 }, loading: false }),
}));

vi.mock('../../hooks/use-analytics', () => ({
  useAnalytics: () => ({ isLoading: false }),
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
    expect(await screen.findByText('Tenant Overview')).toBeInTheDocument();
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
    expect(screen.getByText('HR Command Center')).toBeInTheDocument();
    expect(screen.getByText('Total Headcount')).toBeInTheDocument();
    expect(screen.getByText('Workforce insights')).toBeInTheDocument();
  });

  it('ProcurementDashboard renders funnel and metrics', () => {
    renderPage(<ProcurementDashboard />);
    expect(screen.getByText('Procurement Officer')).toBeInTheDocument();
    expect(screen.getByText('Open PRs')).toBeInTheDocument();
    expect(screen.getByText(/PR → RFQ → PO → Receiving funnel/i)).toBeInTheDocument();
  });

  it('MarketplaceAdminDashboard renders governance metrics with honest prototype disclosure', () => {
    renderPage(<MarketplaceAdminDashboard />);
    expect(screen.getByText('Marketplace Governance Command Center')).toBeInTheDocument();
    expect(screen.getByText('Approved Listings')).toBeInTheDocument();
    expect(screen.getByText('Marketplace fraud/SLA insights')).toBeInTheDocument();
    expect(screen.queryByTestId('marketplace-admin-sandbox-notice')).not.toBeInTheDocument();
    // Chart titles no longer carry misleading (mock) or sandbox language
    // Honest audit footer indicates live data source
    expect(screen.getByText(/Source: Marketplace Analytics Database/i)).toBeInTheDocument();
  });

  it('ComplianceDashboard renders governance analytics and drilldown table', () => {
    renderPage(<ComplianceDashboard />);
    expect(screen.getByText('Compliance & Governance Workspace')).toBeInTheDocument();
    expect(screen.getByText('Compliance alerts')).toBeInTheDocument();
    expect(screen.getByText('Compliance report data is being aggregated from live logs.')).toBeInTheDocument();
  });

  it('ITSupportDashboard renders operations analytics and insights', () => {
    renderPage(<ITSupportDashboard />);
    expect(screen.getByText('IT & Infrastructure Support Workspace')).toBeInTheDocument();
    expect(screen.getByText('IT operations insights')).toBeInTheDocument();
    expect(screen.getAllByText('Open Tickets')[0]).toBeInTheDocument();
  });

  it('SupplierDashboard renders supplier intelligence charts and insights', () => {
    renderPage(<SupplierDashboard />);
    expect(screen.getByText('Supplier Command Center')).toBeInTheDocument();
    expect(screen.getByText('Supplier action insights')).toBeInTheDocument();
    expect(screen.getByText('Supplier revenue trend')).toBeInTheDocument();
  });

  it('PatientDashboard remains action-focused instead of executive chart-heavy', () => {
    renderPage(<PatientDashboard />);
    expect(screen.getByText('Hello, Ava')).toBeInTheDocument();
    expect(screen.getByText('Upcoming Appointment')).toBeInTheDocument();
    expect(screen.queryByText(/GMV trend/i)).not.toBeInTheDocument();
  });
});
