import React from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { DeliveryJobTable } from '../components/DeliveryJobTable';
import { useFieldServiceShipments } from '../../../hooks/use-field-service';

vi.mock('../../../hooks/use-field-service', () => ({
  useFieldServiceShipments: vi.fn(),
}));

const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

describe('DeliveryJobTable Phase 14-B', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    queryClient.clear();
  });

  it('renders loading skeleton while fetching', () => {
    vi.mocked(useFieldServiceShipments).mockReturnValue({ data: undefined, isLoading: true, error: null } as unknown as ReturnType<typeof useFieldServiceShipments>);

    render(<DeliveryJobTable />, { wrapper });
    expect(screen.getByText('Active Deliveries')).toBeInTheDocument();
  });

  it('renders with real data from hook', async () => {
    vi.mocked(useFieldServiceShipments).mockReturnValue({
      data: [{ id: 'ship-1', trackingNumber: 'TRK-001', salesOrder: { id: 'SO-001' }, status: 'IN_TRANSIT' as const, carrier: 'FastLog' }],
      isLoading: false,
      error: null,
    } as unknown as ReturnType<typeof useFieldServiceShipments>);

    render(<DeliveryJobTable />, { wrapper });
    await waitFor(() => {
      expect(screen.getByText('Active Deliveries')).toBeInTheDocument();
      expect(screen.getByText('TRK-001')).toBeInTheDocument();
    });
  });

  it('shows error state when API fails', async () => {
    vi.mocked(useFieldServiceShipments).mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('Network error'),
    } as unknown as ReturnType<typeof useFieldServiceShipments>);

    render(<DeliveryJobTable />, { wrapper });
    await waitFor(() => {
      expect(screen.getByText('Failed to load shipments.')).toBeInTheDocument();
    });
  });

  it('shows empty state when no shipments', async () => {
    vi.mocked(useFieldServiceShipments).mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    } as unknown as ReturnType<typeof useFieldServiceShipments>);

    render(<DeliveryJobTable />, { wrapper });
    await waitFor(() => {
      expect(screen.getByText('No active shipments')).toBeInTheDocument();
    });
  });
});
