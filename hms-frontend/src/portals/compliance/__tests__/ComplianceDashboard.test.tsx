import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { ComplianceDashboard } from '../ComplianceDashboard';
import { useAuditEvents, useAccessReview } from '../../../hooks/use-compliance';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual as Record<string, unknown>,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('../../../hooks/use-compliance', () => ({
  useAuditEvents: vi.fn(),
  useAccessReview: vi.fn(),
}));

vi.mock('../../components/analytics', () => ({
  ChartCard: ({ children, title }: { children?: React.ReactNode; title?: string }) => <div>{title} {children}</div>,
  InsightPanel: ({ title }: { title?: string }) => <div>{title}</div>,
  ReportTable: ({ caption }: { caption?: string }) => <table><caption>{caption}</caption></table>,
  StatusDonutChart: () => <div>StatusDonutChart</div>,
  TrendLineChart: () => <div>TrendLineChart</div>,
}));

describe('ComplianceDashboard Runtime Tests', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('renders standardized shell/header and handles loading states correctly', () => {
    vi.mocked(useAuditEvents).mockReturnValue({
      events: [],
      total: 0,
      loading: true,
      error: null,
      refetch: vi.fn(),
    });

    vi.mocked(useAccessReview).mockReturnValue({
      report: null,
      loading: true,
      error: null,
      refetch: vi.fn(),
    });

    render(
      <MemoryRouter>
        <ComplianceDashboard />
      </MemoryRouter>
    );

    // Verify standardized page header presence
    expect(screen.getByText('Compliance & Governance Workspace')).toBeInTheDocument();
    expect(screen.getByText('Real-time PHI monitor, audit-chain verifier, and data privacy dashboard')).toBeInTheDocument();

    // Verify loading states
    expect(screen.getByText('Loading audit events...')).toBeInTheDocument();
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('renders fallback states when hooks return empty or null data', () => {
    vi.mocked(useAuditEvents).mockReturnValue({
      events: [],
      total: 0,
      loading: false,
      error: null,
      refetch: vi.fn(),
    });

    vi.mocked(useAccessReview).mockReturnValue({
      report: null,
      loading: false,
      error: null,
      refetch: vi.fn(),
    });

    render(
      <MemoryRouter>
        <ComplianceDashboard />
      </MemoryRouter>
    );

    // Verify fallback for empty PHI events
    expect(screen.getByText('No PHI access events found')).toBeInTheDocument();
    expect(screen.getByText('Clinical data access events will appear here from the audit log.')).toBeInTheDocument();

    // Verify fallback for null access review report
    expect(screen.getByText('Access review data unavailable')).toBeInTheDocument();
  });

  it('renders metrics and data sections correctly when hook data is populated', () => {
    const mockAuditEvents = [
      {
        id: 'evt-1',
        tenantId: 'tenant-1',
        userId: 'usr-123',
        createdAt: '2026-06-08T10:00:00Z',
        recordType: 'Patient',
        recordId: 'PAT-001',
        activeRole: 'Doctor',
        eventKey: 'PATIENT_RECORD_VIEW_BREAK_GLASS',
        ipAddress: '192.168.1.1',
      },
    ];

    vi.mocked(useAuditEvents).mockReturnValue({
      events: mockAuditEvents,
      total: 1,
      loading: false,
      error: null,
      refetch: vi.fn(),
    });

    vi.mocked(useAccessReview).mockReturnValue({
      report: {
        complianceStatus: 'COMPLIANT',
        staleAccountsCount: 3,
        privilegeEscalationsCount: 1,
        accessReport: [],
        staleAccounts: [],
        privilegeEscalations: [],
        reviewTimestamp: '2026-06-08T09:00:00Z',
      },
      loading: false,
      error: null,
      refetch: vi.fn(),
    });

    render(
      <MemoryRouter>
        <ComplianceDashboard />
      </MemoryRouter>
    );

    // Verify card values
    expect(screen.getByText('1 Active')).toBeInTheDocument(); // Critical Breach Alert (PATIENT_RECORD_VIEW_BREAK_GLASS risk score > 50)
    expect(screen.getAllByText('1 Events')).toHaveLength(2); // Unauthorized Access Count & Audit Chain Count
    expect(screen.getByText('3 Accounts')).toBeInTheDocument(); // Stale Accounts Count

    // Verify event in the table/list
    expect(screen.getAllByText('Doctor')[0]).toBeInTheDocument();
    expect(screen.getByText(/PA\*\*\*/)).toBeInTheDocument();

    // Verify SOC2 Access Review summary card
    expect(screen.getByText('SOC2 Access Review')).toBeInTheDocument();
    expect(screen.getByText('Privilege Escalations')).toBeInTheDocument();
  });

  it('allows navigating to sub-features from quick actions', () => {
    vi.mocked(useAuditEvents).mockReturnValue({
      events: [],
      total: 0,
      loading: false,
      error: null,
      refetch: vi.fn(),
    });
    vi.mocked(useAccessReview).mockReturnValue({
      report: null,
      loading: false,
      error: null,
      refetch: vi.fn(),
    });

    render(
      <MemoryRouter>
        <ComplianceDashboard />
      </MemoryRouter>
    );

    // Find and click the Export Logs button
    const exportLogsBtn = screen.getByRole('button', { name: /Export Logs/i });
    expect(exportLogsBtn).toBeInTheDocument();
    fireEvent.click(exportLogsBtn);
    expect(mockNavigate).toHaveBeenCalledWith('/compliance/export-logs');
  });
});
