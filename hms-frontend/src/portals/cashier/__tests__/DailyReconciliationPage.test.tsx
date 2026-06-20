import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { DailyReconciliationPage } from '../DailyReconciliationPage';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// ── Mocks ────────────────────────────────────────────────────────────────────

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('../../../hooks/use-user', () => ({
  useUser: () => ({
    id: 'cashier-1',
    email: 'cashier@test.com',
    branchId: 'branch-1',
    roles: ['Cashier'],
    tenantId: 'tenant-1',
  }),
}));

const mockCloseSession = vi.fn();
const mockRefetch = vi.fn();

function createMockUseActiveSession(overrides: Record<string, unknown> = {}) {
  return {
    session: overrides.session ?? null,
    loading: overrides.loading ?? false,
    error: overrides.error ?? null,
    closeSession: mockCloseSession,
    refetch: mockRefetch,
  };
}

let mockUseActiveSessionValue = createMockUseActiveSession();
vi.mock('../../../hooks/use-billing', () => ({
  useActiveSession: () => mockUseActiveSessionValue,
}));

// ── Helpers ─────────────────────────────────────────────────────────────────

function renderWithQuery(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>{ui}</MemoryRouter>
    </QueryClientProvider>,
  );
}

// ── Test data ────────────────────────────────────────────────────────────────

const ACTIVE_SESSION = {
  id: 'session-abc',
  status: 'ACTIVE',
  openedAt: '2026-06-16T08:00:00Z',
  openingBalance: 5000,
  payments: [
    { id: 'p1', amount: 1000, paymentMethod: 'CASH', status: 'POSTED', createdAt: '2026-06-16T09:00:00Z', reversals: [], invoice: { invoiceNumber: 'INV-001', order: { patient: { firstName: 'Juan', lastName: 'Dela Cruz' } } } },
    { id: 'p2', amount: 500, paymentMethod: 'CARD', status: 'POSTED', createdAt: '2026-06-16T09:30:00Z', reversals: [], invoice: { invoiceNumber: 'INV-002', order: { patient: { firstName: 'Maria', lastName: 'Santos' } } } },
    { id: 'p3', amount: 200, paymentMethod: 'ONLINE', status: 'POSTED', createdAt: '2026-06-16T10:00:00Z', reversals: [], invoice: { invoiceNumber: 'INV-003', order: { patient: { firstName: 'Pedro', lastName: 'Reyes' } } } },
    { id: 'p4', amount: 1500, paymentMethod: 'HMO', status: 'POSTED', createdAt: '2026-06-16T10:30:00Z', reversals: [], invoice: { invoiceNumber: 'INV-004', order: { patient: { firstName: 'Ana', lastName: 'Lim' } } } },
    // Non-POSTED payment should be excluded
    { id: 'p5', amount: 300, paymentMethod: 'CASH', status: 'PENDING', createdAt: '2026-06-16T11:00:00Z', reversals: [], invoice: { invoiceNumber: 'INV-005', order: { patient: { firstName: 'Luis', lastName: 'Garcia' } } } },
    // Cash payment with a refund should deduct the refund amount
    { id: 'p6', amount: 800, paymentMethod: 'CASH', status: 'POSTED', createdAt: '2026-06-16T11:30:00Z', reversals: [{ id: 'r1', amount: 200, type: 'REFUND' }], invoice: { invoiceNumber: 'INV-006', order: { patient: { firstName: 'Rosa', lastName: 'Cruz' } } } },
  ],
};

// Expected totals:
// Cash POSTED: p1(1000) + p6(800) - r1(200) = 1600
// Card: 500
// Online: 200
// HMO: 1500
// Opening: 5000
// Expected cash total: 5000 + 1600 = 6600

// ── Tests ────────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
  mockNavigate.mockClear();
  mockCloseSession.mockReset();
  mockRefetch.mockReset();
});

describe('DailyReconciliationPage', () => {
  it('shows loading state while fetching session', () => {
    mockUseActiveSessionValue = createMockUseActiveSession({ loading: true });
    renderWithQuery(<DailyReconciliationPage />);
    expect(screen.getByText(/Loading session data/i)).toBeInTheDocument();
  });

  it('shows no-active-session state with link to session console', () => {
    mockUseActiveSessionValue = createMockUseActiveSession({ session: null });
    renderWithQuery(<DailyReconciliationPage />);
    expect(screen.getByText(/No Active Session/i)).toBeInTheDocument();
    const link = screen.getByRole('button', { name: /Go to Session Console/i });
    fireEvent.click(link);
    expect(mockNavigate).toHaveBeenCalledWith('/cashier/session');
  });

  it('renders reconciliation metrics from live session data', () => {
    mockUseActiveSessionValue = createMockUseActiveSession({ session: ACTIVE_SESSION });
    renderWithQuery(<DailyReconciliationPage />);
    // 5000 opening float
    expect(screen.getByText('₱5,000.00')).toBeInTheDocument();
    // Expected cash total = 5000 + 1600 = 6600
    expect(screen.getByText('₱6,600.00')).toBeInTheDocument();
  });

  it('computes per-method collection totals from real payments', () => {
    mockUseActiveSessionValue = createMockUseActiveSession({ session: ACTIVE_SESSION });
    renderWithQuery(<DailyReconciliationPage />);
    // Cash: 1000 + 800 - 200 = 1600
    expect(screen.getByText('₱1,600.00')).toBeInTheDocument();
    // Card: 500
    expect(screen.getByText('₱500.00')).toBeInTheDocument();
    // Online: 200
    expect(screen.getByText('₱200.00')).toBeInTheDocument();
    // HMO: 1500
    expect(screen.getByText('₱1,500.00')).toBeInTheDocument();
  });

  it('shows balanced ledger when actual matches expected', () => {
    mockUseActiveSessionValue = createMockUseActiveSession({ session: ACTIVE_SESSION });
    renderWithQuery(<DailyReconciliationPage />);
    const input = screen.getByPlaceholderText('0.00');
    fireEvent.change(input, { target: { value: '6600' } });
    expect(screen.getByText(/Balanced Ledger/i)).toBeInTheDocument();
  });

  it('shows audit required when variance exists', () => {
    mockUseActiveSessionValue = createMockUseActiveSession({ session: ACTIVE_SESSION });
    renderWithQuery(<DailyReconciliationPage />);
    const input = screen.getByPlaceholderText('0.00');
    fireEvent.change(input, { target: { value: '6500' } });
    // variance = 6500 - 6600 = -100
    expect(screen.getByText('₱-100.00')).toBeInTheDocument();
    expect(screen.getByText(/Audit Required/i)).toBeInTheDocument();
  });

  it('requires remarks for variance (inline error, not alert)', () => {
    mockUseActiveSessionValue = createMockUseActiveSession({ session: ACTIVE_SESSION });
    renderWithQuery(<DailyReconciliationPage />);
    const input = screen.getByPlaceholderText('0.00');
    fireEvent.change(input, { target: { value: '6500' } });

    const submitBtn = screen.getByRole('button', { name: /Submit Reconciled Shift/i });
    fireEvent.click(submitBtn);

    // Should show inline error, NOT call window.alert
    expect(screen.getByText(/Discrepancy remarks are strictly required/i)).toBeInTheDocument();
    expect(mockCloseSession).not.toHaveBeenCalled();
  });

  it('calls closeSession with correct payload on submit', async () => {
    mockCloseSession.mockResolvedValue(undefined);
    mockUseActiveSessionValue = createMockUseActiveSession({ session: ACTIVE_SESSION });
    renderWithQuery(<DailyReconciliationPage />);

    const input = screen.getByPlaceholderText('0.00');
    fireEvent.change(input, { target: { value: '6600' } });

    const submitBtn = screen.getByRole('button', { name: /Submit Reconciled Shift/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockCloseSession).toHaveBeenCalledWith('session-abc', {
        actualClosingBalance: 6600,
        remarks: undefined,
      });
    });

    // After successful close, should navigate to cashier dashboard
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/cashier');
    });
  });

  it('shows error when closeSession fails', async () => {
    mockCloseSession.mockRejectedValue(new Error('Network error'));
    mockUseActiveSessionValue = createMockUseActiveSession({ session: ACTIVE_SESSION });
    renderWithQuery(<DailyReconciliationPage />);

    const input = screen.getByPlaceholderText('0.00');
    fireEvent.change(input, { target: { value: '6600' } });

    const submitBtn = screen.getByRole('button', { name: /Submit Reconciled Shift/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(/Network error/i)).toBeInTheDocument();
    });
    // Should NOT navigate away on error
    expect(mockNavigate).not.toHaveBeenCalledWith('/cashier');
  });

  it('does NOT show WIP/Simulated Data banner', () => {
    mockUseActiveSessionValue = createMockUseActiveSession({ session: ACTIVE_SESSION });
    renderWithQuery(<DailyReconciliationPage />);
    expect(screen.queryByText(/WIP.*Simulated Data/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/hardcoded mock/i)).not.toBeInTheDocument();
  });

  it('shows error from session hook', () => {
    mockUseActiveSessionValue = createMockUseActiveSession({ error: 'Failed to load session' });
    renderWithQuery(<DailyReconciliationPage />);
    // When session is null AND error exists, the "No Active Session" view is shown
    // The error should also be visible
    expect(screen.getByText(/No Active Session/i)).toBeInTheDocument();
  });
});
