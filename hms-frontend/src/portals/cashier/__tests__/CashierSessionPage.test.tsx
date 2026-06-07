import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { CashierSessionPage } from '../CashierSessionPage';
import { useActiveSession } from '../../../hooks/use-billing';
import { useUser } from '../../../hooks/use-user';

vi.mock('../../../hooks/use-billing', () => ({
  useActiveSession: vi.fn(),
}));

vi.mock('../../../hooks/use-user', () => ({
  useUser: vi.fn(),
}));

describe('CashierSessionPage', () => {
  const mockUser = {
    id: 'cashier-1',
    email: 'cashier@example.com',
    tenantId: 'tenant-1',
    branchId: 'branch-1',
    roles: ['Cashier'],
    permissions: [],
  };

  const mockActiveSession = {
    id: 'session-123',
    status: 'OPEN',
    openedAt: '2026-06-07T12:00:00.000Z',
    openingBalance: 5000,
    payments: [
      { 
        id: 'p-1', 
        paymentMethod: 'CASH', 
        amount: 1500, 
        status: 'POSTED',
        createdAt: '2026-06-07T12:05:00.000Z',
        invoice: {
          invoiceNumber: 'INV-001',
          order: {
            patient: {
              firstName: 'Jane',
              lastName: 'Doe',
            },
          },
        },
      },
      { 
        id: 'p-2', 
        paymentMethod: 'CARD', 
        amount: 1000, 
        status: 'POSTED',
        createdAt: '2026-06-07T12:10:00.000Z',
        invoice: {
          invoiceNumber: 'INV-002',
          order: {
            patient: {
              firstName: 'John',
              lastName: 'Smith',
            },
          },
        },
      }, // shouldn't count for cash expected
    ],
  };

  const mockOpenSession = vi.fn();
  const mockCloseSession = vi.fn();
  const mockRefetch = vi.fn();

  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(useUser).mockReturnValue(mockUser);
    vi.mocked(useActiveSession).mockReturnValue({
      session: null,
      loading: false,
      error: null,
      refetch: mockRefetch,
      openSession: mockOpenSession,
      closeSession: mockCloseSession,
    });
  });

  it('renders loading state when loading is true', () => {
    vi.mocked(useActiveSession).mockReturnValue({
      session: null,
      loading: true,
      error: null,
      refetch: mockRefetch,
      openSession: mockOpenSession,
      closeSession: mockCloseSession,
    });

    render(<CashierSessionPage />);
    expect(screen.getByText(/Loading cashier session status/i)).toBeInTheDocument();
  });

  it('renders open session form when no active session exists', async () => {
    render(<CashierSessionPage />);
    expect(screen.getByText(/Open Cashier Shift Drawer/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Starting Drawer Float/i)).toBeInTheDocument();

    const openBtn = screen.getByRole('button', { name: /Open Drawer Shift/i });
    expect(openBtn).toBeInTheDocument();
  });

  it('allows opening a session successfully', async () => {
    mockOpenSession.mockResolvedValueOnce({});
    render(<CashierSessionPage />);

    const floatInput = screen.getByLabelText(/Starting Drawer Float/i);
    fireEvent.change(floatInput, { target: { value: '4500' } });

    const openBtn = screen.getByRole('button', { name: /Open Drawer Shift/i });
    fireEvent.click(openBtn);

    await waitFor(() => {
      expect(mockOpenSession).toHaveBeenCalledWith({
        branchId: 'branch-1',
        openingBalance: 4500,
      });
      expect(mockRefetch).toHaveBeenCalled();
    });
  });

  it('renders active session details and reconciliation info', () => {
    vi.mocked(useActiveSession).mockReturnValue({
      session: mockActiveSession,
      loading: false,
      error: null,
      refetch: mockRefetch,
      openSession: mockOpenSession,
      closeSession: mockCloseSession,
    });

    render(<CashierSessionPage />);
    expect(screen.getByText(/session-123/)).toBeInTheDocument();
    expect(screen.getByText('● ACTIVE SHIFT')).toBeInTheDocument();

    // Starting Float: 5,000.00, CASH Payments: 1,500.00, Expected: 6,500.00
    expect(screen.getByText('₱5,000.00')).toBeInTheDocument();
    expect(screen.getByText('₱1,500.00')).toBeInTheDocument();
    expect(screen.getByText('₱6,500.00')).toBeInTheDocument();
  });

  it('shows variance warning and requires remarks for drawer discrepancy', async () => {
    vi.mocked(useActiveSession).mockReturnValue({
      session: mockActiveSession,
      loading: false,
      error: null,
      refetch: mockRefetch,
      openSession: mockOpenSession,
      closeSession: mockCloseSession,
    });

    render(<CashierSessionPage />);

    const countedInput = screen.getByLabelText(/Actual Counted Cash/i);
    fireEvent.change(countedInput, { target: { value: '6400' } }); // Discrepancy of -100

    // Should show variance warning alert
    await waitFor(() => {
      expect(screen.getByText(/Drawer Discrepancy Detected/i)).toBeInTheDocument();
    });

    const submitBtn = screen.getByRole('button', { name: /Close Shift Session/i });
    fireEvent.click(submitBtn);

    // Should show error about remarks requirement
    await waitFor(() => {
      expect(screen.getByText(/Remarks are strictly required when there is a cash drawer variance/i)).toBeInTheDocument();
    });
    expect(mockCloseSession).not.toHaveBeenCalled();

    // Fill remarks and submit again
    const remarksInput = screen.getByPlaceholderText(/Describe reason/i);
    fireEvent.change(remarksInput, { target: { value: 'Short by 100 pesos' } });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockCloseSession).toHaveBeenCalledWith('session-123', {
        actualClosingBalance: 6400,
        remarks: 'Short by 100 pesos',
      });
      expect(mockRefetch).toHaveBeenCalled();
    });
  });
});
