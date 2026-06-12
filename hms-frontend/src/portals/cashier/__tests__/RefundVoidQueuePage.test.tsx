import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { RefundVoidQueuePage } from '../RefundVoidQueuePage';
import { MemoryRouter } from 'react-router-dom';

const mockRequestRefund = vi.fn();
const mockRequestVoid = vi.fn();
const mockRefetch = vi.fn();

let mockReversals: Array<{
  id: string; type: 'REFUND' | 'PAYMENT_VOID'; amount: number; status: string;
  reason: string; requestedAt: string; approvedAt: string | null;
  paymentId: string; receiptNumber: string | null; invoiceNumber: string | null; patientName: string | null;
}> = [];

const defaultReversals = [
  {
    id: 'rev-1',
    type: 'REFUND' as const,
    amount: 500,
    status: 'PENDING',
    reason: 'Duplicate charge',
    requestedAt: '2026-06-13T10:14:00Z',
    approvedAt: null,
    paymentId: 'pay-1',
    receiptNumber: 'RCP-2026-5120',
    invoiceNumber: 'INV-2026-001',
    patientName: 'Jonathan Harker',
  },
  {
    id: 'rev-2',
    type: 'PAYMENT_VOID' as const,
    amount: 1000,
    status: 'APPLIED',
    reason: 'Wrong amount',
    requestedAt: '2026-06-12T15:00:00Z',
    approvedAt: '2026-06-12T16:00:00Z',
    paymentId: 'pay-2',
    receiptNumber: 'RCP-2026-5110',
    invoiceNumber: 'INV-2026-002',
    patientName: 'Wilhelmina Murray',
  },
];

vi.mock('../../../hooks/use-user', () => ({
  useUser: () => ({
    id: 'cashier-1',
    name: 'Mark Santos',
    roles: ['Cashier'],
    branchId: 'branch-1',
  }),
}));

vi.mock('../../../hooks/use-billing', () => ({
  useRequestRefund: () => ({ requestRefund: mockRequestRefund, loading: false, error: null, data: null }),
  useRequestVoid: () => ({ requestVoid: mockRequestVoid, loading: false, error: null, data: null }),
  useMyReversals: () => ({ reversals: mockReversals, loading: false, error: null, refetch: mockRefetch }),
}));

describe('RefundVoidQueuePage', () => {
  beforeEach(() => {
    mockRequestRefund.mockReset();
    mockRequestVoid.mockReset();
    mockRefetch.mockReset();
    mockReversals = [...defaultReversals];
  });

  it('renders live queue rows from the backend', () => {
    render(
      <MemoryRouter>
        <RefundVoidQueuePage />
      </MemoryRouter>
    );

    expect(screen.getByText('Jonathan Harker')).toBeInTheDocument();
    expect(screen.getByText('Wilhelmina Murray')).toBeInTheDocument();
    expect(screen.getByText('Pending')).toBeInTheDocument();
    expect(screen.getByText('Applied')).toBeInTheDocument();
    expect(screen.getByText('2 Requests')).toBeInTheDocument();
  });

  it('does not render SIMULATED labels', () => {
    render(
      <MemoryRouter>
        <RefundVoidQueuePage />
      </MemoryRouter>
    );

    expect(screen.queryByText(/SIMULATED/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Partially Wired/i)).not.toBeInTheDocument();
  });

  it('submits a refund request via the live API', async () => {
    mockRequestRefund.mockResolvedValueOnce({ id: 'approval-1' });

    render(
      <MemoryRouter>
        <RefundVoidQueuePage />
      </MemoryRouter>
    );

    fireEvent.click(screen.getAllByText('Refund')[1]);
    fireEvent.change(screen.getByPlaceholderText(/a1b2c3d4/i), { target: { value: 'pay-1234-5678' } });
    fireEvent.change(screen.getByPlaceholderText('0.00'), { target: { value: '500' } });
    fireEvent.change(screen.getByPlaceholderText(/Detail reason/i), { target: { value: 'Duplicate charge' } });

    fireEvent.click(screen.getByRole('button', { name: /Submit Request/i }));

    await waitFor(() => {
      expect(mockRequestRefund).toHaveBeenCalledWith({
        paymentId: 'pay-1234-5678',
        amount: 500,
        reason: 'Duplicate charge',
      });
    });

    expect(await screen.findByText(/Refund request submitted/i)).toBeInTheDocument();
    expect(mockRefetch).toHaveBeenCalled();
  });

  it('submits a void request via the live API', async () => {
    mockRequestVoid.mockResolvedValueOnce({ id: 'approval-2' });

    render(
      <MemoryRouter>
        <RefundVoidQueuePage />
      </MemoryRouter>
    );

    fireEvent.click(screen.getAllByText('Void')[1]);
    fireEvent.change(screen.getByPlaceholderText(/a1b2c3d4/i), { target: { value: 'pay-9876-5432' } });
    fireEvent.change(screen.getByPlaceholderText(/Detail reason/i), { target: { value: 'Wrong amount' } });

    fireEvent.click(screen.getByRole('button', { name: /Submit Request/i }));

    await waitFor(() => {
      expect(mockRequestVoid).toHaveBeenCalledWith({
        paymentId: 'pay-9876-5432',
        reason: 'Wrong amount',
      });
    });

    expect(await screen.findByText(/Void request submitted/i)).toBeInTheDocument();
    expect(mockRefetch).toHaveBeenCalled();
  });

  it('shows validation error for missing payment ID', () => {
    window.alert = vi.fn();
    render(
      <MemoryRouter>
        <RefundVoidQueuePage />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole('button', { name: /Submit Request/i }));

    expect(window.alert).toHaveBeenCalledWith('Payment ID and reason are required.');
  });

  it('shows the Approval Center notice', () => {
    render(
      <MemoryRouter>
        <RefundVoidQueuePage />
      </MemoryRouter>
    );

    expect(screen.getAllByText(/Approval Center/i).length).toBeGreaterThanOrEqual(1);
  });

  it('shows empty state when no reversals exist', () => {
    mockReversals = [];

    render(
      <MemoryRouter>
        <RefundVoidQueuePage />
      </MemoryRouter>
    );

    expect(screen.getByText(/No reversal requests yet/i)).toBeInTheDocument();
  });
});