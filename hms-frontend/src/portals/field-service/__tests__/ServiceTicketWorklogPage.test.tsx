import React from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ServiceTicketWorklogPage } from '../ServiceTicketWorklogPage';
import { useFieldServiceServiceTicket } from '../../../hooks/use-field-service';

vi.mock('../../../hooks/use-field-service', () => ({
  useFieldServiceServiceTicket: vi.fn(),
}));

const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>
    <MemoryRouter>{children}</MemoryRouter>
  </QueryClientProvider>
);

describe('ServiceTicketWorklogPage Phase 14-C', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    queryClient.clear();
  });

  it('renders loading skeleton while fetching', () => {
    vi.mocked(useFieldServiceServiceTicket).mockReturnValue({ data: undefined, isLoading: true, error: null } as unknown as ReturnType<typeof useFieldServiceServiceTicket>);

    render(<ServiceTicketWorklogPage />, { wrapper });
    expect(screen.getByText('Service Ticket Worklog')).toBeInTheDocument();
  });

  it('renders mock data from hook', async () => {
    vi.mocked(useFieldServiceServiceTicket).mockReturnValue({
      data: { id: 'TK-1001', issue: 'X-Ray power fluctuation', asset: 'GE X-Ray 3000', serialNumber: 'SN-001', priority: 'HIGH', status: 'OPEN' },
      isLoading: false,
      error: null,
    } as unknown as ReturnType<typeof useFieldServiceServiceTicket>);

    render(<ServiceTicketWorklogPage />, { wrapper });
    await waitFor(() => {
      expect(screen.getByText('Service Ticket Worklog')).toBeInTheDocument();
      expect(screen.getByText(/TK-1001/)).toBeInTheDocument();
    });
  });

  it('shows sandbox badge', () => {
    vi.mocked(useFieldServiceServiceTicket).mockReturnValue({ data: undefined, isLoading: false, error: null } as unknown as ReturnType<typeof useFieldServiceServiceTicket>);

    render(<ServiceTicketWorklogPage />, { wrapper });
    expect(screen.getByText('Sandbox')).toBeInTheDocument();
  });
});
