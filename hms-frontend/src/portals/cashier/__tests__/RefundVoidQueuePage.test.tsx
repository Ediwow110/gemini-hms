import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { RefundVoidQueuePage } from '../RefundVoidQueuePage';
import { MemoryRouter } from 'react-router-dom';

const mockRequestRefund = vi.fn();
const mockRequestVoid = vi.fn();

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
}));

describe('RefundVoidQueuePage', () => {
  beforeEach(() => {
    mockRequestRefund.mockReset();
    mockRequestVoid.mockReset();
  });

  it('renders simulated queue rows', () => {
    render(
      <MemoryRouter>
        <RefundVoidQueuePage />
      </MemoryRouter>
    );

    expect(screen.getByText('Jonathan Harker')).toBeInTheDocument();
    expect(screen.getByText('Wilhelmina Murray')).toBeInTheDocument();
    expect(screen.getAllByText(/SIMULATED/i).length).toBeGreaterThanOrEqual(1);
  });

  it('renders the partial wiring banner', () => {
    render(
      <MemoryRouter>
        <RefundVoidQueuePage />
      </MemoryRouter>
    );

    expect(screen.getByText(/Partially Wired/i)).toBeInTheDocument();
  });

  it('submits a refund request via the live API', async () => {
    mockRequestRefund.mockResolvedValueOnce({ id: 'approval-1' });

    render(
      <MemoryRouter>
        <RefundVoidQueuePage />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText('Refund'));
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
  });

  it('submits a void request via the live API', async () => {
    mockRequestVoid.mockResolvedValueOnce({ id: 'approval-2' });

    render(
      <MemoryRouter>
        <RefundVoidQueuePage />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText('Void'));
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
});
