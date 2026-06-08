import React from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WarrantyActivationPage } from '../WarrantyActivationPage';

vi.mock('../../../hooks/use-field-service', () => ({}));

const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>
    <MemoryRouter>{children}</MemoryRouter>
  </QueryClientProvider>
);

describe('WarrantyActivationPage Phase 14-C', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queryClient.clear();
  });

  it('renders page header and shell', () => {
    render(<WarrantyActivationPage />, { wrapper });
    const headings = screen.getAllByText('Warranty Activation');
    expect(headings.length).toBeGreaterThanOrEqual(2);
  });

  it('shows sandbox badge', () => {
    render(<WarrantyActivationPage />, { wrapper });
    expect(screen.getByText('Sandbox')).toBeInTheDocument();
  });

  it('shows activation guide tips', () => {
    render(<WarrantyActivationPage />, { wrapper });
    expect(screen.getByText('Activation Guide')).toBeInTheDocument();
  });
});
