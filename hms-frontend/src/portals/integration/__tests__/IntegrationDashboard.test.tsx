import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { IntegrationDashboard } from '../IntegrationDashboard';
import { useIntegrationNotifications, useIntegrationApprovals, useIntegrationActivityAudit, useIntegrationReconciliation } from '../../../hooks/use-integration';
import { BrowserRouter } from 'react-router-dom';

vi.mock('../../../hooks/use-integration', () => ({
  useIntegrationNotifications: vi.fn(),
  useIntegrationApprovals: vi.fn(),
  useIntegrationActivityAudit: vi.fn(),
  useIntegrationReconciliation: vi.fn(),
}));

const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

const renderWithProviders = (ui: React.ReactElement) =>
  render(ui, {
    wrapper: ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>{children}</BrowserRouter>
      </QueryClientProvider>
    ),
  });

describe('IntegrationDashboard — honest state (post-truth-gap fix)', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('renders loading skeleton when all queries load', () => {
    vi.mocked(useIntegrationNotifications).mockReturnValue({ data: undefined, isLoading: true } as unknown as ReturnType<typeof useIntegrationNotifications>);
    vi.mocked(useIntegrationApprovals).mockReturnValue({ data: undefined, isLoading: true } as unknown as ReturnType<typeof useIntegrationApprovals>);
    vi.mocked(useIntegrationActivityAudit).mockReturnValue({ data: undefined, isLoading: true } as unknown as ReturnType<typeof useIntegrationActivityAudit>);
    vi.mocked(useIntegrationReconciliation).mockReturnValue({ data: undefined, isLoading: true } as unknown as ReturnType<typeof useIntegrationReconciliation>);

    renderWithProviders(<IntegrationDashboard />);
    expect(screen.getByText('Integration Bridges Command Center')).toBeInTheDocument();
    expect(screen.getByText(/Integration Bridges\s+[—-]\s+Mixed Availability/i)).toBeInTheDocument();
  });

  it('does NOT render the hardcoded fake HL7 LIS alert banner', () => {
    vi.mocked(useIntegrationNotifications).mockReturnValue({ data: [], isLoading: false } as unknown as ReturnType<typeof useIntegrationNotifications>);
    vi.mocked(useIntegrationApprovals).mockReturnValue({ data: [], isLoading: false } as unknown as ReturnType<typeof useIntegrationApprovals>);
    vi.mocked(useIntegrationActivityAudit).mockReturnValue({ data: [], isLoading: false } as unknown as ReturnType<typeof useIntegrationActivityAudit>);
    vi.mocked(useIntegrationReconciliation).mockReturnValue({ data: [], isLoading: false } as unknown as ReturnType<typeof useIntegrationReconciliation>);

    renderWithProviders(<IntegrationDashboard />);
    expect(screen.queryByText(/HL7 ADAPTER ALERT/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/CENTRAL LIS LINK DOWN/i)).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Force HL7 Reconnect/i })).not.toBeInTheDocument();
  });

  it('does NOT render the hardcoded fake "98.2%" health metric', () => {
    vi.mocked(useIntegrationNotifications).mockReturnValue({ data: [], isLoading: false } as unknown as ReturnType<typeof useIntegrationNotifications>);
    vi.mocked(useIntegrationApprovals).mockReturnValue({ data: [], isLoading: false } as unknown as ReturnType<typeof useIntegrationApprovals>);
    vi.mocked(useIntegrationActivityAudit).mockReturnValue({ data: [], isLoading: false } as unknown as ReturnType<typeof useIntegrationActivityAudit>);
    vi.mocked(useIntegrationReconciliation).mockReturnValue({ data: [], isLoading: false } as unknown as ReturnType<typeof useIntegrationReconciliation>);

    renderWithProviders(<IntegrationDashboard />);
    expect(screen.queryByText('98.2%')).not.toBeInTheDocument();
    expect(screen.queryByText(/All bridges operational/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Cross-Domain Health \(Mock\)/i)).not.toBeInTheDocument();
  });

  it('renders an honest "Not available" stub for the Cross-Domain Bridge Health card', () => {
    vi.mocked(useIntegrationNotifications).mockReturnValue({ data: [], isLoading: false } as unknown as ReturnType<typeof useIntegrationNotifications>);
    vi.mocked(useIntegrationApprovals).mockReturnValue({ data: [], isLoading: false } as unknown as ReturnType<typeof useIntegrationApprovals>);
    vi.mocked(useIntegrationActivityAudit).mockReturnValue({ data: [], isLoading: false } as unknown as ReturnType<typeof useIntegrationActivityAudit>);
    vi.mocked(useIntegrationReconciliation).mockReturnValue({ data: [], isLoading: false } as unknown as ReturnType<typeof useIntegrationReconciliation>);

    renderWithProviders(<IntegrationDashboard />);
    const health = screen.getByTestId('integration-health-value');
    expect(health.textContent).toMatch(/Not available/i);
    expect(health.textContent).not.toMatch(/98\.2/);
  });

  it('preserves live sections: Notifications, Approvals, Quick Actions, View Audit Trail', () => {
    vi.mocked(useIntegrationNotifications).mockReturnValue({ data: [{ id: 'n1', isMock: false }], isLoading: false } as unknown as ReturnType<typeof useIntegrationNotifications>);
    vi.mocked(useIntegrationApprovals).mockReturnValue({ data: [{ id: 'a1', isMock: false, recordType: 'PATIENT_MERGE', riskLevel: 'MEDIUM', status: 'PENDING', sourceDomain: 'Clinical', requester: 'Dr. Smith' }], isLoading: false } as unknown as ReturnType<typeof useIntegrationApprovals>);
    vi.mocked(useIntegrationActivityAudit).mockReturnValue({ data: [], isLoading: false } as unknown as ReturnType<typeof useIntegrationActivityAudit>);
    vi.mocked(useIntegrationReconciliation).mockReturnValue({ data: [], isLoading: false } as unknown as ReturnType<typeof useIntegrationReconciliation>);

    renderWithProviders(<IntegrationDashboard />);
    expect(screen.getByText('Integration Bridges Command Center')).toBeInTheDocument();
    expect(screen.getByText('Quick Actions')).toBeInTheDocument();
    expect(screen.getByText('Notifications')).toBeInTheDocument();
    expect(screen.getByText('Approvals')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /View Audit Trail/i })).toBeInTheDocument();
  });
});
