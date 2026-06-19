import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { CashierDashboard } from '../CashierDashboard';
import { useInvoices, useActiveSession } from '../../../hooks/use-billing';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('../../../hooks/use-billing', () => ({
  useInvoices: vi.fn(),
  useActiveSession: vi.fn(),
}));

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div data-testid="responsive-chart">{children}</div>,
  AreaChart: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Area: () => <div />,
  PieChart: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Pie: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Cell: () => <div />,
  CartesianGrid: () => <div />,
  Tooltip: () => <div />,
  XAxis: () => <div />,
  YAxis: () => <div />,
}));

describe('CashierDashboard truth labels', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(useInvoices).mockReturnValue({
      invoices: [],
      loading: false,
      error: null,
      refetch: vi.fn(),
    });
    vi.mocked(useActiveSession).mockReturnValue({
      session: null,
      loading: false,
      error: null,
      refetch: vi.fn(),
      openSession: vi.fn(),
      closeSession: vi.fn(),
    });
  });

  it('labels refunds and voids as live reversal workflow, not sandbox', () => {
    render(
      <MemoryRouter>
        <CashierDashboard />
      </MemoryRouter>
    );

    expect(screen.getByText('Refunds & Voids')).toBeInTheDocument();
    expect(screen.getByText('Manage live reversal requests')).toBeInTheDocument();
    expect(screen.queryByText(/Manage reversals \(sandbox\)/i)).not.toBeInTheDocument();
  });

  it('routes the refunds and voids action to the live reversal queue page', () => {
    render(
      <MemoryRouter>
        <CashierDashboard />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText('Refunds & Voids'));

    expect(mockNavigate).toHaveBeenCalledWith('/cashier/refunds-voids');
  });
});
