import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { ReconciliationMonitorPage } from '../ReconciliationMonitorPage';
import {
  useIntegrationReconciliation,
} from '../../../hooks/use-integration';

vi.mock('../../../hooks/use-integration', () => ({
  useIntegrationReconciliation: vi.fn(),
}));

const renderPage = () =>
  render(
    <MemoryRouter>
      <ReconciliationMonitorPage />
    </MemoryRouter>,
  );

describe('ReconciliationMonitorPage honesty', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('does not show fake zero KPI counts when shell reconciliation returns []', () => {
    vi.mocked(useIntegrationReconciliation).mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    } as unknown as ReturnType<typeof useIntegrationReconciliation>);

    renderPage();

    expect(screen.getByTestId('reconciliation-open-count')).toHaveTextContent('—');
    expect(screen.getByTestId('reconciliation-review-count')).toHaveTextContent('—');
    expect(screen.getByTestId('reconciliation-resolved-count')).toHaveTextContent('—');
    expect(screen.getAllByText('Shell empty').length).toBeGreaterThanOrEqual(1);
  });

  it('shows real counts when reconciliation issues are returned', () => {
    vi.mocked(useIntegrationReconciliation).mockReturnValue({
      data: [
        {
          id: 'RI-1',
          domainPair: 'Billing/Clinical',
          severity: 'HIGH',
          category: 'MISMATCH',
          suggestedResolution: 'Review',
          status: 'OPEN',
          timestamp: '2026-06-20T00:00:00.000Z',
          accessLabel: 'FULL',
          isMock: false,
          isShell: false,
        },
        {
          id: 'RI-2',
          domainPair: 'Billing/Inventory',
          severity: 'MEDIUM',
          category: 'MISMATCH',
          suggestedResolution: 'Review',
          status: 'UNDER_REVIEW',
          timestamp: '2026-06-20T00:00:00.000Z',
          accessLabel: 'FULL',
          isMock: false,
          isShell: false,
        },
      ],
      isLoading: false,
      error: null,
    } as unknown as ReturnType<typeof useIntegrationReconciliation>);

    renderPage();

    expect(screen.getByTestId('reconciliation-open-count')).toHaveTextContent('2');
    expect(screen.getByTestId('reconciliation-review-count')).toHaveTextContent('1');
    expect(screen.getByTestId('reconciliation-resolved-count')).toHaveTextContent('0');
  });
});