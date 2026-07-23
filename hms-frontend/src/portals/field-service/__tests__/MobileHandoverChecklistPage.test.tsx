import React from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MobileHandoverChecklistPage } from '../MobileHandoverChecklistPage';
import { useFieldServiceHandoverChecklist } from '../../../hooks/use-field-service';
import { useFieldServiceHandoverLogs } from '../../../hooks/use-field-service';

vi.mock('../../../hooks/use-field-service', () => ({
  useFieldServiceHandoverChecklist: vi.fn(),
  useFieldServiceHandoverLogs: vi.fn(),
}));

const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>
    <MemoryRouter>{children}</MemoryRouter>
  </QueryClientProvider>
);

describe('MobileHandoverChecklistPage Phase 14-C', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    queryClient.clear();
  });

  it('renders loading skeleton while fetching', () => {
    vi.mocked(useFieldServiceHandoverChecklist).mockReturnValue({ data: undefined, isLoading: true, error: null } as unknown as ReturnType<typeof useFieldServiceHandoverChecklist>);
    vi.mocked(useFieldServiceHandoverLogs).mockReturnValue({ data: undefined, isLoading: true, error: null } as unknown as ReturnType<typeof useFieldServiceHandoverLogs>);

    render(<MobileHandoverChecklistPage />, { wrapper });
    expect(screen.getByText('Handover Checklist')).toBeInTheDocument();
  });

  it('renders mock data from hook', async () => {
    vi.mocked(useFieldServiceHandoverChecklist).mockReturnValue({
      data: { jobId: 'H-42', asset: 'GE X-Ray 3000', serialNumber: 'SN-001', tasks: ['Check power cable', 'Verify calibration'] },
      isLoading: false,
      error: null,
    } as unknown as ReturnType<typeof useFieldServiceHandoverChecklist>);
    vi.mocked(useFieldServiceHandoverLogs).mockReturnValue({ data: [], isLoading: false, error: null } as unknown as ReturnType<typeof useFieldServiceHandoverLogs>);

    render(<MobileHandoverChecklistPage />, { wrapper });
    await waitFor(() => {
      expect(screen.getByText('Handover Checklist')).toBeInTheDocument();
      expect(screen.getByText('Check power cable')).toBeInTheDocument();
    });
  });

  it('shows sandbox badge', () => {
    vi.mocked(useFieldServiceHandoverChecklist).mockReturnValue({ data: undefined, isLoading: false, error: null } as unknown as ReturnType<typeof useFieldServiceHandoverChecklist>);
    vi.mocked(useFieldServiceHandoverLogs).mockReturnValue({ data: [], isLoading: false, error: null } as unknown as ReturnType<typeof useFieldServiceHandoverLogs>);

    render(<MobileHandoverChecklistPage />, { wrapper });
    expect(screen.getByText('Sandbox')).toBeInTheDocument();
  });
});
