import React from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WarrantyActivationPage } from '../WarrantyActivationPage';
import { useFieldServiceWarrantyLogs } from '../../../hooks/use-field-service';

vi.mock('../../../hooks/use-field-service', () => ({
  useFieldServiceWarrantyLogs: vi.fn(),
}));

const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>
    <MemoryRouter>{children}</MemoryRouter>
  </QueryClientProvider>
);

describe('WarrantyActivationPage Phase 14-C', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    queryClient.clear();
  });

  it('renders page header and shell', () => {
    vi.mocked(useFieldServiceWarrantyLogs).mockReturnValue({ data: undefined, isLoading: false, error: null } as unknown as ReturnType<typeof useFieldServiceWarrantyLogs>);

    render(<WarrantyActivationPage />, { wrapper });
    const headings = screen.getAllByText('Warranty Activation');
    expect(headings.length).toBeGreaterThanOrEqual(2);
  });

  it('shows sandbox badge', () => {
    vi.mocked(useFieldServiceWarrantyLogs).mockReturnValue({ data: undefined, isLoading: false, error: null } as unknown as ReturnType<typeof useFieldServiceWarrantyLogs>);

    render(<WarrantyActivationPage />, { wrapper });
    expect(screen.getByText('Sandbox')).toBeInTheDocument();
  });

  it('shows activation guide tips', () => {
    vi.mocked(useFieldServiceWarrantyLogs).mockReturnValue({ data: [], isLoading: false, error: null } as unknown as ReturnType<typeof useFieldServiceWarrantyLogs>);

    render(<WarrantyActivationPage />, { wrapper });
    expect(screen.getByText('Activation Guide')).toBeInTheDocument();
  });
});
