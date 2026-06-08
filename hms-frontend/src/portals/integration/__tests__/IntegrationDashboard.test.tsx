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

describe('IntegrationDashboard Redesign', () => {
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
    expect(screen.getByText('Integration Bridges Sandbox')).toBeInTheDocument();
  });

  it('renders dashboard with real data and HMS shell', () => {
    vi.mocked(useIntegrationNotifications).mockReturnValue({ data: [{ id: 'n1', isMock: false }], isLoading: false } as unknown as ReturnType<typeof useIntegrationNotifications>);
    vi.mocked(useIntegrationApprovals).mockReturnValue({ data: [{ id: 'a1', isMock: false, recordType: 'PATIENT_MERGE', riskLevel: 'MEDIUM', status: 'PENDING', sourceDomain: 'Clinical', requester: 'Dr. Smith' }], isLoading: false } as unknown as ReturnType<typeof useIntegrationApprovals>);
    vi.mocked(useIntegrationActivityAudit).mockReturnValue({ data: [{ id: 'ad1', isMock: false, eventType: 'ORDER_UPDATED', risk: 'MEDIUM', actor: 'Admin', role: 'Super Admin', recordId: 'ord-1', tenantBranch: 'Tenant A / Branch 1', timestamp: new Date().toISOString() }], isLoading: false } as unknown as ReturnType<typeof useIntegrationActivityAudit>);
    vi.mocked(useIntegrationReconciliation).mockReturnValue({ data: [{ id: 'r1', isMock: false, status: 'MATCHED', confidence: 0.95, sourceDomain: 'Lab', targetDomain: 'EHR', sourceRecordId: 'lab-1', targetRecordId: 'ehr-1', matchedAt: new Date().toISOString(), matchedBy: 'System' }], isLoading: false } as unknown as ReturnType<typeof useIntegrationReconciliation>);

    renderWithProviders(<IntegrationDashboard />);
    expect(screen.getByText('Integration Bridges Command Center')).toBeInTheDocument();
    expect(screen.getByText('Quick Actions')).toBeInTheDocument();
    expect(screen.getByText('Notifications')).toBeInTheDocument();
    expect(screen.getByText('Approvals')).toBeInTheDocument();
  });
});
