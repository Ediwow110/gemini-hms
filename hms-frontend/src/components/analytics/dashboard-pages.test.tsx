import type React from 'react';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
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

const renderPage = (ui: React.ReactElement) => render(<MemoryRouter>{ui}</MemoryRouter>);

describe('dashboard intelligence pages', () => {
  beforeEach(() => { vi.useFakeTimers(); });
  afterEach(() => { vi.runAllTimers(); vi.useRealTimers(); });

  it('SuperAdminDashboard renders KPIs, charts, insights, and drilldown table', () => {
    renderPage(<SuperAdminDashboard />);
    act(() => { vi.advanceTimersByTime(800); });
    expect(screen.getByText('Platform Command Center')).toBeInTheDocument();
    expect(screen.getByText('Total Tenants')).toBeInTheDocument();
    expect(screen.getByText('Risk and operations insights')).toBeInTheDocument();
    expect(screen.getByText('Tenant health drilldown table')).toBeInTheDocument();
  });

  it('ReportsAnalyticsPage uses disabled WIP export instead of fake export toast', () => {
    renderPage(<ReportsAnalyticsPage />);
    act(() => { vi.advanceTimersByTime(800); });
    expect(screen.getByText('System Reports & Performance Analytics')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Export operations summary WIP/i })).toBeDisabled();
    expect(screen.queryByText(/Generating simulated report bundle/i)).not.toBeInTheDocument();
  });

  it('HRDashboard renders workforce analytics components', () => {
    renderPage(<HRDashboard />);
    expect(screen.getByText('HR Command Center')).toBeInTheDocument();
    expect(screen.getByText('Headcount')).toBeInTheDocument();
    expect(screen.getByText('Workforce insights')).toBeInTheDocument();
  });

  it('ProcurementDashboard renders funnel and metrics', () => {
    renderPage(<ProcurementDashboard />);
    expect(screen.getByText('Procurement Officer')).toBeInTheDocument();
    expect(screen.getByText('Open PRs')).toBeInTheDocument();
    expect(screen.getByText(/PR → RFQ → PO → Receiving funnel/i)).toBeInTheDocument();
  });

  it('MarketplaceAdminDashboard renders governance metrics', () => {
    renderPage(<MarketplaceAdminDashboard />);
    expect(screen.getByText('Marketplace Governance Command Center')).toBeInTheDocument();
    expect(screen.getByText('Pending Suppliers')).toBeInTheDocument();
    expect(screen.getByText('Marketplace fraud/SLA insights')).toBeInTheDocument();
  });

  it('ComplianceDashboard renders governance analytics and drilldown table', () => {
    renderPage(<ComplianceDashboard />);
    expect(screen.getByText('Compliance & Governance Workspace')).toBeInTheDocument();
    expect(screen.getByText('Compliance alerts')).toBeInTheDocument();
    expect(screen.getByText('Compliance control drilldown table')).toBeInTheDocument();
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
