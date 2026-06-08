import React from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TechnicianSchedulePage } from '../TechnicianSchedulePage';
import { useFieldServiceTechnicianSchedule } from '../../../hooks/use-field-service';

vi.mock('../../../hooks/use-field-service', () => ({
  useFieldServiceTechnicianSchedule: vi.fn(),
}));

const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>
    <MemoryRouter>{children}</MemoryRouter>
  </QueryClientProvider>
);

describe('TechnicianSchedulePage Phase 14-C', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    queryClient.clear();
  });

  it('renders loading skeleton while fetching', () => {
    vi.mocked(useFieldServiceTechnicianSchedule).mockReturnValue({ data: undefined, isLoading: true, error: null } as unknown as ReturnType<typeof useFieldServiceTechnicianSchedule>);

    render(<TechnicianSchedulePage />, { wrapper });
    expect(screen.getByText('My Schedule')).toBeInTheDocument();
  });

  it('renders mock data from hook', async () => {
    vi.mocked(useFieldServiceTechnicianSchedule).mockReturnValue({
      data: [{ day: 'Mon 10', jobs: [{ id: 'S-1', time: '09:00', duration: '2h', customer: 'Hospital A', location: 'Floor 2' }] }],
      isLoading: false,
      error: null,
    } as unknown as ReturnType<typeof useFieldServiceTechnicianSchedule>);

    render(<TechnicianSchedulePage />, { wrapper });
    await waitFor(() => {
      expect(screen.getByText('My Schedule')).toBeInTheDocument();
      expect(screen.getByText(/S-1/)).toBeInTheDocument();
    });
  });

  it('shows sandbox badge', () => {
    vi.mocked(useFieldServiceTechnicianSchedule).mockReturnValue({ data: [], isLoading: false, error: null } as unknown as ReturnType<typeof useFieldServiceTechnicianSchedule>);

    render(<TechnicianSchedulePage />, { wrapper });
    expect(screen.getByText('Sandbox')).toBeInTheDocument();
  });
});
