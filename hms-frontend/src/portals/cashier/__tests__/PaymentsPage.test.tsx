import { render, screen } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { PaymentsPage } from '../PaymentsPage';
import { MemoryRouter } from 'react-router-dom';
import { useActiveSession } from '../../../hooks/use-billing';
import { ActiveSessionDto } from '../../../services/billing-frontend.service';

vi.mock('../../../hooks/use-billing', () => ({
  useActiveSession: vi.fn(),
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

describe('PaymentsPage', () => {
  const mockSession: ActiveSessionDto = {
    id: 'session-456',
    status: 'OPEN',
    openedAt: new Date().toISOString(),
    openingBalance: 0,
    payments: [
      {
        id: 'PAY-1',
        amount: 1000,
        paymentMethod: 'CASH',
        status: 'COMPLETED',
        createdAt: new Date().toISOString(),
        invoice: {
          invoiceNumber: 'INV-001',
          order: {
            patient: {
              firstName: 'John',
              lastName: 'Doe',
            },
          },
        },
      },
    ],
  };

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('renders payment records when session is active', () => {
    vi.mocked(useActiveSession).mockReturnValue({
      session: mockSession,
      loading: false,
      error: null,
      refetch: vi.fn(),
      openSession: vi.fn(),
      closeSession: vi.fn(),
    });

    render(
      <MemoryRouter>
        <PaymentsPage />
      </MemoryRouter>
    );

    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('INV-001')).toBeInTheDocument();
    expect(screen.getByText('₱1,000.00')).toBeInTheDocument();
  });

  it('shows no active session warning when session is null', () => {
    vi.mocked(useActiveSession).mockReturnValue({
      session: null,
      loading: false,
      error: null,
      refetch: vi.fn(),
      openSession: vi.fn(),
      closeSession: vi.fn(),
    });

    render(
      <MemoryRouter>
        <PaymentsPage />
      </MemoryRouter>
    );

    expect(screen.getByText(/No Active Cashier Session/i)).toBeInTheDocument();
  });

  it('shows simulated print notice', () => {
    vi.mocked(useActiveSession).mockReturnValue({
      session: mockSession,
      loading: false,
      error: null,
      refetch: vi.fn(),
      openSession: vi.fn(),
      closeSession: vi.fn(),
    });

    render(
      <MemoryRouter>
        <PaymentsPage />
      </MemoryRouter>
    );

    expect(screen.getByText(/Simulated Print Behavior/i)).toBeInTheDocument();
  });
});
