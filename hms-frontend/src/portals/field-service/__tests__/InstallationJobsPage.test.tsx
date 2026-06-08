import React from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { InstallationJobsPage } from '../InstallationJobsPage';
import { useFieldServiceInstallations } from '../../../hooks/use-field-service';

vi.mock('../../../hooks/use-field-service', () => ({
  useFieldServiceInstallations: vi.fn(),
  useUpdateInstallationStatus: () => ({ mutate: vi.fn(), isPending: false }),
}));

const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>
    <MemoryRouter>{children}</MemoryRouter>
  </QueryClientProvider>
);

describe('InstallationJobsPage Phase 14-B', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    queryClient.clear();
  });

  it('renders loading skeleton while fetching', () => {
    vi.mocked(useFieldServiceInstallations).mockReturnValue({ data: undefined, isLoading: true, error: null } as unknown as ReturnType<typeof useFieldServiceInstallations>);

    render(<InstallationJobsPage />, { wrapper });
    expect(screen.getByText('Installation Jobs')).toBeInTheDocument();
  });

  it('renders with real data from hook', async () => {
    vi.mocked(useFieldServiceInstallations).mockReturnValue({
      data: [{ id: 'inst-1', asset: { model: 'GE V10', serialNumber: 'SN-001' }, status: 'ASSIGNED' as const }],
      isLoading: false,
      error: null,
    } as unknown as ReturnType<typeof useFieldServiceInstallations>);

    render(<InstallationJobsPage />, { wrapper });
    await waitFor(() => {
      expect(screen.getByText('Installation Jobs')).toBeInTheDocument();
      expect(screen.getByText(/ASSIGNED/)).toBeInTheDocument();
    });
  });

  it('shows error state when API fails', async () => {
    vi.mocked(useFieldServiceInstallations).mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('Network error'),
    } as unknown as ReturnType<typeof useFieldServiceInstallations>);

    render(<InstallationJobsPage />, { wrapper });
    await waitFor(() => {
      expect(screen.getByText('Failed to load installation jobs.')).toBeInTheDocument();
    });
  });

  it('shows empty state when no jobs', async () => {
    vi.mocked(useFieldServiceInstallations).mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    } as unknown as ReturnType<typeof useFieldServiceInstallations>);

    render(<InstallationJobsPage />, { wrapper });
    await waitFor(() => {
      expect(screen.getByText('No installation jobs')).toBeInTheDocument();
    });
  });
});
