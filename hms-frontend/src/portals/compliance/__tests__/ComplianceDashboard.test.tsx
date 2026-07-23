import React from 'react';
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { ComplianceDashboard } from '../ComplianceDashboard';
import { useAnalytics } from '../../../hooks/use-analytics';
import { useAccessReview, useAuditEvents } from '../../../hooks/use-compliance';

const mockHasPermission = vi.fn<(permission: string) => boolean>(() => true);

vi.mock('../../../hooks/use-user', () => ({
  usePermissions: () => ({ hasPermission: mockHasPermission }),
}));

vi.mock('../../../hooks/use-analytics', () => ({
  useAnalytics: vi.fn(),
}));

vi.mock('../../../hooks/use-compliance', () => ({
  useAuditEvents: vi.fn(),
  useAccessReview: vi.fn(),
}));

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  LineChart: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Line: () => <div />,
  PieChart: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Pie: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Cell: () => <div />,
  CartesianGrid: () => <div />,
  Tooltip: () => <div />,
  XAxis: () => <div />,
  YAxis: () => <div />,
  Legend: () => <div />,
}));

const analyticsResult = (overrides: Record<string, unknown> = {}) => ({
  compliance: {
    totalAuditEvents: 540,
    securityAlerts: 1,
    complianceScore: 95,
  },
  isLoading: false,
  isFetching: false,
  demoByScope: { compliance: false },
  refetchAll: vi.fn().mockResolvedValue(undefined),
  ...overrides,
});

const auditResult = (overrides: Record<string, unknown> = {}) => ({
  events: [],
  total: 0,
  loading: false,
  error: null,
  refetch: vi.fn().mockResolvedValue(undefined),
  ...overrides,
});

const reviewResult = (overrides: Record<string, unknown> = {}) => ({
  report: null,
  loading: false,
  error: null,
  refetch: vi.fn().mockResolvedValue(undefined),
  ...overrides,
});

const renderDashboard = () =>
  render(
    <MemoryRouter>
      <ComplianceDashboard />
    </MemoryRouter>,
  );

describe('ComplianceDashboard', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockHasPermission.mockReturnValue(true);
    vi.mocked(useAnalytics).mockReturnValue(
      analyticsResult() as unknown as ReturnType<typeof useAnalytics>,
    );
    vi.mocked(useAuditEvents).mockReturnValue(
      auditResult() as unknown as ReturnType<typeof useAuditEvents>,
    );
    vi.mocked(useAccessReview).mockReturnValue(
      reviewResult() as unknown as ReturnType<typeof useAccessReview>,
    );
  });

  it('renders the governance workspace and populated audit context', () => {
    vi.mocked(useAuditEvents).mockReturnValue(
      auditResult({
        total: 1,
        events: [
          {
            id: 'event-1',
            tenantId: 'tenant-1',
            userId: 'user-1',
            createdAt: '2026-07-10T10:00:00Z',
            recordType: 'Patient',
            recordId: 'DEMO-PAT-1001',
            activeRole: 'Doctor',
            eventKey: 'PATIENT_RECORD_VIEW_BREAK_GLASS',
            ipAddress: '127.0.0.1',
          },
        ],
      }) as unknown as ReturnType<typeof useAuditEvents>,
    );
    vi.mocked(useAccessReview).mockReturnValue(
      reviewResult({
        report: {
          complianceStatus: 'COMPLIANT',
          staleAccountsCount: 3,
          privilegeEscalationsCount: 1,
          accessReport: [],
          staleAccounts: [],
          privilegeEscalations: [],
          reviewTimestamp: '2026-07-10T09:00:00Z',
        },
      }) as unknown as ReturnType<typeof useAccessReview>,
    );

    renderDashboard();

    expect(screen.getByText('Compliance Operations Center')).toBeInTheDocument();
    expect(screen.getByText('Recent PHI access')).toBeInTheDocument();
    expect(screen.getAllByText('Doctor')[0]).toBeInTheDocument();
    expect(screen.getByText('Access review')).toBeInTheDocument();
    expect(screen.getByText('Governance decisions')).toBeInTheDocument();
  });

  it('uses the synthetic PHI scenario when no live PHI event exists in fallback mode', () => {
    renderDashboard();

    expect(screen.getByText('Live + synthetic trends')).toBeInTheDocument();
    expect(screen.getByText(/Synthetic PHI events contain no real patient/i)).toBeInTheDocument();
  });

  it('hides PHI destinations when the user lacks PHI-monitor permission', () => {
    mockHasPermission.mockImplementation(
      (permission) => permission !== 'compliance.phi.monitor',
    );

    renderDashboard();

    expect(
      screen.queryByRole('link', { name: /Critical access events/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('link', { name: /Emergency access/i }),
    ).not.toBeInTheDocument();
  });

  it('exposes only quick actions covered by the user permissions', () => {
    mockHasPermission.mockImplementation(
      (permission) => permission === 'compliance.audit.review',
    );

    renderDashboard();

    expect(screen.getByRole('link', { name: /Verify audit chain/i })).toHaveAttribute(
      'href',
      '/compliance/audit-chain',
    );
    expect(screen.getByRole('link', { name: /Retention policies/i })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Audit reports/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Export logs/i })).not.toBeInTheDocument();
  });
});
