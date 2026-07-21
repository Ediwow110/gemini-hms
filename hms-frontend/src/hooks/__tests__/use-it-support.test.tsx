import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  useItSupport,
  useSupportTickets,
  useTicketStats,
} from '../use-it-support';
import { apiClient } from '../../lib/api';

vi.mock('../../lib/api', () => ({
  apiClient: {
    get: vi.fn(),
  },
}));

const createWrapper = () => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
};

const Probe = () => {
  const tickets = useSupportTickets();
  const stats = useTicketStats();
  const support = useItSupport();

  const loading = tickets.loading || stats.loading || support.isLoading;

  return (
    <div>
      <span data-testid="state">{loading ? 'loading' : 'ready'}</span>
      <button
        type="button"
        onClick={() => void support.fetchLogs('branch-1')}
      >
        Fetch logs
      </button>
    </div>
  );
};

describe('IT support hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(apiClient.get).mockImplementation(async (url: string) => {
      if (url.endsWith('/stats')) {
        return { data: { open: 0, inProgress: 0, total: 0, urgent: 0 } };
      }
      if (url.endsWith('/health')) {
        return { data: { services: [], overallStatus: 'healthy' } };
      }
      return { data: [] };
    });
  });

  it('uses the versioned backend paths for every IT support query', async () => {
    render(<Probe />, { wrapper: createWrapper() });

    await waitFor(() =>
      expect(screen.getByTestId('state')).toHaveTextContent('ready'),
    );

    const paths = vi.mocked(apiClient.get).mock.calls.map(([url]) => url).sort();
    expect(paths).toEqual([
      '/v1/it-support/backups',
      '/v1/it-support/health',
      '/v1/it-support/integrations',
      '/v1/it-support/sessions',
      '/v1/it-support/tickets',
      '/v1/it-support/tickets/stats',
    ]);
  });

  it('uses the versioned backend path for branch log retrieval', async () => {
    render(<Probe />, { wrapper: createWrapper() });

    await waitFor(() =>
      expect(screen.getByTestId('state')).toHaveTextContent('ready'),
    );

    screen.getByRole('button', { name: 'Fetch logs' }).click();

    await waitFor(() =>
      expect(apiClient.get).toHaveBeenCalledWith(
        '/v1/it-support/logs?branchId=branch-1',
      ),
    );
  });

  it('does not fetch the protected support queue when disabled', async () => {
    const DisabledProbe = () => {
      const tickets = useSupportTickets(false);
      const stats = useTicketStats(false);
      return (
        <div data-testid="disabled-state">
          {String(tickets.loading)}:{String(stats.loading)}
        </div>
      );
    };

    render(<DisabledProbe />, { wrapper: createWrapper() });

    await waitFor(() =>
      expect(screen.getByTestId('disabled-state')).toHaveTextContent('false:false'),
    );
    expect(apiClient.get).not.toHaveBeenCalled();
  });
});
