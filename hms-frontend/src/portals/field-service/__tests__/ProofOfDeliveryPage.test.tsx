import React from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ProofOfDeliveryPage } from '../ProofOfDeliveryPage';
import { useFieldServiceProofOfDelivery } from '../../../hooks/use-field-service';

vi.mock('../../../hooks/use-field-service', () => ({
  useFieldServiceProofOfDelivery: vi.fn(),
}));

const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>
    <MemoryRouter>{children}</MemoryRouter>
  </QueryClientProvider>
);

describe('ProofOfDeliveryPage Phase 14-C', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    queryClient.clear();
  });

  it('renders page header and shell', () => {
    vi.mocked(useFieldServiceProofOfDelivery).mockReturnValue({ data: undefined, isLoading: false, error: null } as unknown as ReturnType<typeof useFieldServiceProofOfDelivery>);

    render(<ProofOfDeliveryPage />, { wrapper });
    expect(screen.getByText('Proof of Delivery')).toBeInTheDocument();
  });

  it('shows sandbox badge', () => {
    vi.mocked(useFieldServiceProofOfDelivery).mockReturnValue({ data: undefined, isLoading: false, error: null } as unknown as ReturnType<typeof useFieldServiceProofOfDelivery>);

    render(<ProofOfDeliveryPage />, { wrapper });
    expect(screen.getByText('Sandbox')).toBeInTheDocument();
  });
});
