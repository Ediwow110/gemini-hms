import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { PatientBillingPage } from '../PatientBillingPage';
import { MemoryRouter } from 'react-router-dom';
import { useInvoices, useActiveSession, useCreatePayment } from '../../../hooks/use-billing';

vi.mock('../../../hooks/use-billing', () => ({
  useInvoices: vi.fn(),
  useActiveSession: vi.fn(),
  useCreatePayment: vi.fn(),
}));

vi.mock('../../../hooks/use-clinical-workflow', () => ({
  usePatientBillingHandoff: () => ({ data: null, loading: false }),
}));

vi.mock('../../../hooks/use-user', () => ({
  useUser: () => ({
    id: 'cashier-1',
    email: 'cashier@example.com',
    tenantId: 'tenant-1',
    branchId: 'branch-1',
    roles: ['Cashier'],
  }),
}));

describe('PatientBillingPage Runtime Tests', () => {
  const mockInvoice = {
    id: 'invoice-123',
    invoiceNumber: 'INV-2026-001',
    status: 'UNPAID',
    totalAmount: 1500,
    paidAmount: 500,
    createdAt: new Date().toISOString(),
    order: {
      patient: {
        firstName: 'John',
        lastName: 'Doe',
        patientNumber: 'MRN-100',
      },
    },
  };

  const mockSession = {
    id: 'session-456',
    status: 'OPEN',
    openedAt: new Date().toISOString(),
    openingBalance: 5000,
    payments: [],
  };

  const mockPostPayment = vi.fn();

  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(useInvoices).mockReturnValue({
      invoices: [mockInvoice],
      loading: false,
      error: null,
      refetch: vi.fn() as unknown as () => Promise<void>,
    });
    vi.mocked(useActiveSession).mockReturnValue({
      session: mockSession,
      loading: false,
      error: null,
      refetch: vi.fn(),
      openSession: vi.fn(),
      closeSession: vi.fn(),
    });
    vi.mocked(useCreatePayment).mockReturnValue({
      postPayment: mockPostPayment,
      loading: false,
      error: null,
    });
  });

  it('renders invoice details and remaining balance when invoice is found', () => {
    render(
      <MemoryRouter initialEntries={['/cashier/billing?invoice=INV-2026-001']}>
        <PatientBillingPage />
      </MemoryRouter>
    );

    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('MRN: MRN-100')).toBeInTheDocument();
    expect(screen.getAllByText('₱1,500.00').length).toBeGreaterThan(0);
    expect(screen.getByText('₱1,000.00')).toBeInTheDocument();
  });

  it('shows confirmation modal when submitting and processes payment on confirmation', async () => {
    mockPostPayment.mockResolvedValueOnce({ payment: { receiptNumber: 'RCP-2026-001' }, invoice: {} });

    render(
      <MemoryRouter initialEntries={['/cashier/billing?invoice=INV-2026-001']}>
        <PatientBillingPage />
      </MemoryRouter>
    );

    const submitBtn = screen.getByRole('button', { name: /Process Payment Clearance/i });
    fireEvent.click(submitBtn);

    expect(screen.getByText('Confirm Payment')).toBeInTheDocument();
    expect(screen.getByText(/Are you sure you want to process the payment of/i)).toBeInTheDocument();

    const confirmBtn = screen.getByRole('button', { name: /Confirm/i });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(mockPostPayment).toHaveBeenCalledWith(
        {
          invoiceId: 'invoice-123',
          cashierSessionId: 'session-456',
          amount: 1000,
          paymentMethod: 'CASH',
        },
        expect.stringMatching(/^PAY-invoice-123-[a-z0-9]+$/)
      );
    });

    await waitFor(() => {
      expect(screen.getByText(/Billing cleared. Payment posted successfully./i)).toBeInTheDocument();
    });
  });

  it('reuses the same idempotency key when retrying after payment failure', async () => {
    mockPostPayment
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce({ payment: { receiptNumber: 'RCP-2026-001' }, invoice: {} });

    render(
      <MemoryRouter initialEntries={['/cashier/billing?invoice=INV-2026-001']}>
        <PatientBillingPage />
      </MemoryRouter>
    );

    const submitBtn = screen.getByRole('button', { name: /Process Payment Clearance/i });

    // First attempt — payment fails
    fireEvent.click(submitBtn);
    fireEvent.click(screen.getByRole('button', { name: /Confirm/i }));

    await waitFor(() => {
      expect(screen.getByText('Network error')).toBeInTheDocument();
    });

    const firstKey = mockPostPayment.mock.calls[0][1];

    // Second attempt — payment succeeds
    fireEvent.click(submitBtn);
    fireEvent.click(screen.getByRole('button', { name: /Confirm/i }));

    await waitFor(() => {
      expect(screen.getByText(/Billing cleared. Payment posted successfully./i)).toBeInTheDocument();
    });

    const secondKey = mockPostPayment.mock.calls[1][1];
    expect(secondKey).toBe(firstKey);
    expect(mockPostPayment).toHaveBeenCalledTimes(2);
  });

  it('shows real patient demographics even with UUID patient id', () => {
    const uuidInvoice = {
      ...mockInvoice,
      order: {
        patient: {
          id: 'd3b07384-d113-4956-a5db-25785715e21c',
          firstName: 'John',
          lastName: 'Doe',
          patientNumber: 'MRN-100',
        },
      },
    };
    vi.mocked(useInvoices).mockReturnValue({
      invoices: [uuidInvoice],
      loading: false,
      error: null,
      refetch: vi.fn() as unknown as () => Promise<void>,
    });

    render(
      <MemoryRouter initialEntries={['/cashier/billing?invoice=INV-2026-001']}>
        <PatientBillingPage />
      </MemoryRouter>
    );

    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('MRN: MRN-100')).toBeInTheDocument();
  });
});
