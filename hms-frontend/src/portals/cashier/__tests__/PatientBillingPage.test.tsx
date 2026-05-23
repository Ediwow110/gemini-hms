import { render, screen, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { PatientBillingPage } from '../PatientBillingPage';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { apiClient } from '../../../lib/api';

// Mock the apiClient
vi.mock('../../../lib/api', () => ({
  apiClient: {
    get: vi.fn(),
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() },
    },
  },
}));

// Mock the useUser hook for Cashier role
vi.mock('../../../hooks/use-user', () => ({
  useUser: () => ({
    id: 'cashier-1',
    email: 'cashier@example.com',
    tenantId: 'tenant-1',
    branchId: 'branch-1',
    roles: ['Cashier'],
    permissions: ['view_billing_workspace'],
  }),
}));

describe('PatientBillingPage Runtime Tests', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  const renderWithParams = (patientId: string) => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          gcTime: 0,
        },
      },
    });

    return render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={[`/cashier/billing?patientId=${patientId}`]}>
          <PatientBillingPage />
        </MemoryRouter>
      </QueryClientProvider>
    );
  };

  it('renders redacted demographics when in real UUID patient mode', async () => {
    // Mock the billing handoff request response
    vi.mocked(apiClient.get).mockResolvedValueOnce({
      data: [
        {
          id: 'handoff-1',
          orderId: 'order-1',
          orderNumber: 'ORD-9999',
          patientId: 'd3b07384-d113-4956-a5db-25785715e21c',
          totalAmount: 1500,
          status: 'PENDING',
          createdAt: new Date(),
          timestamp: new Date(),
          accessLabel: 'PUBLIC',
          isReadOnly: true,
        }
      ],
    });

    renderWithParams('d3b07384-d113-4956-a5db-25785715e21c');

    await waitFor(() => {
      expect(screen.getByText('[REDACTED (Access Restricted)]')).toBeInTheDocument();
    });

    // Verify MRN and demographics are redacted
    expect(screen.getByText('MRN: [REDACTED (Access Restricted)]')).toBeInTheDocument();
    expect(screen.getByText('[REDACTED] / [REDACTED]')).toBeInTheDocument();

    // Verify clinical details are ABSENT
    expect(screen.queryByText('chiefComplaint')).not.toBeInTheDocument();
    expect(screen.queryByText('diagnosis')).not.toBeInTheDocument();
    expect(screen.queryByText('vitals')).not.toBeInTheDocument();
    expect(screen.queryByText('prescriptions')).not.toBeInTheDocument();
    expect(screen.queryByText('internal notes')).not.toBeInTheDocument();
    expect(screen.queryByText('lab results')).not.toBeInTheDocument();
  });

  it('renders unredacted mock data when not using a UUID patient ID', async () => {
    renderWithParams('mock-id-123');

    await waitFor(() => {
      expect(screen.getByText('Carmilla Karnstein')).toBeInTheDocument();
    });

    expect(screen.getByText('MRN: MRN-2026-0771')).toBeInTheDocument();
  });
});
