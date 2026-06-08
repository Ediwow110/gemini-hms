import React from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { OfflineSyncQueuePage } from '../OfflineSyncQueuePage';
import { useFieldServiceOfflineSync } from '../../../hooks/use-field-service';

vi.mock('../../../hooks/use-field-service', () => ({
  useFieldServiceOfflineSync: vi.fn(),
}));

const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>
    <MemoryRouter>{children}</MemoryRouter>
  </QueryClientProvider>
);

describe('OfflineSyncQueuePage Phase 14-C', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    queryClient.clear();
  });

  it('renders loading skeleton while fetching', () => {
    vi.mocked(useFieldServiceOfflineSync).mockReturnValue({ data: undefined, isLoading: true, error: null } as unknown as ReturnType<typeof useFieldServiceOfflineSync>);

    render(<OfflineSyncQueuePage />, { wrapper });
    expect(screen.getByText('Offline Sync Queue')).toBeInTheDocument();
  });

  it('renders mock data from hook', async () => {
    vi.mocked(useFieldServiceOfflineSync).mockReturnValue({
      data: { pendingCount: 5, lastSynced: '2026-05-15T10:30:00Z', items: [] },
      isLoading: false,
      error: null,
    } as unknown as ReturnType<typeof useFieldServiceOfflineSync>);

    render(<OfflineSyncQueuePage />, { wrapper });
    await waitFor(() => {
      expect(screen.getByText('Offline Sync Queue')).toBeInTheDocument();
      expect(screen.getByText(/5 items/)).toBeInTheDocument();
    });
  });

  it('shows sandbox badge', () => {
    vi.mocked(useFieldServiceOfflineSync).mockReturnValue({ data: undefined, isLoading: false, error: null } as unknown as ReturnType<typeof useFieldServiceOfflineSync>);

    render(<OfflineSyncQueuePage />, { wrapper });
    expect(screen.getByText('Sandbox')).toBeInTheDocument();
  });
});
