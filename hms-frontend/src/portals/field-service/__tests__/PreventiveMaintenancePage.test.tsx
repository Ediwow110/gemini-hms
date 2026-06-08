import React from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PreventiveMaintenancePage } from '../PreventiveMaintenancePage';
import { useFieldServicePreventiveMaintenance } from '../../../hooks/use-field-service';

vi.mock('../../../hooks/use-field-service', () => ({
  useFieldServicePreventiveMaintenance: vi.fn(),
}));

const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>
    <MemoryRouter>{children}</MemoryRouter>
  </QueryClientProvider>
);

describe('PreventiveMaintenancePage Phase 14-C', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    queryClient.clear();
  });

  it('renders loading skeleton while fetching', () => {
    vi.mocked(useFieldServicePreventiveMaintenance).mockReturnValue({ data: undefined, isLoading: true, error: null } as unknown as ReturnType<typeof useFieldServicePreventiveMaintenance>);

    render(<PreventiveMaintenancePage />, { wrapper });
    expect(screen.getByText('Preventive Maintenance')).toBeInTheDocument();
  });

  it('renders mock data from hook', async () => {
    vi.mocked(useFieldServicePreventiveMaintenance).mockReturnValue({
      data: [{ id: 'PM-001', asset: { model: 'GE V10', location: 'Building A' } }],
      isLoading: false,
      error: null,
    } as unknown as ReturnType<typeof useFieldServicePreventiveMaintenance>);

    render(<PreventiveMaintenancePage />, { wrapper });
    await waitFor(() => {
      expect(screen.getByText('Preventive Maintenance')).toBeInTheDocument();
      expect(screen.getByText(/PM-001/)).toBeInTheDocument();
    });
  });

  it('shows sandbox badge', () => {
    vi.mocked(useFieldServicePreventiveMaintenance).mockReturnValue({ data: [], isLoading: false, error: null } as unknown as ReturnType<typeof useFieldServicePreventiveMaintenance>);

    render(<PreventiveMaintenancePage />, { wrapper });
    expect(screen.getByText('Sandbox')).toBeInTheDocument();
  });
});
