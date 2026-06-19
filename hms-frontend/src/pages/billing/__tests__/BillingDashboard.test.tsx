import React from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { BillingDashboard } from '../BillingDashboard';
import { billingDashboardService } from '../../../services/billing-dashboard.service';

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div data-testid="responsive-chart">{children}</div>,
  AreaChart: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Area: () => <div />,
  PieChart: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Pie: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Cell: () => <div />,
  BarChart: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Bar: () => <div />,
  CartesianGrid: () => <div />,
  Tooltip: () => <div />,
  XAxis: () => <div />,
  YAxis: () => <div />,
}));

vi.mock('../../../services/billing-dashboard.service', () => ({
  billingDashboardService: {
    getDashboardData: vi.fn(),
  },
}));

const mockNavigate = vi.hoisted(() => vi.fn());

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('BillingDashboard Unit Tests', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('renders successfully with live dashboard data', async () => {
    vi.mocked(billingDashboardService.getDashboardData).mockResolvedValue({
      kpis: [
        { title: 'Current Session', value: '₱5,000', description: 'Active cashier total', severity: 'success' },
        { title: 'Unpaid Invoices', value: 3, description: 'Pending payment', severity: 'warning' },
        { title: 'Overdue Bills', value: 1, description: 'Past due date', severity: 'critical' },
        { title: 'Total Outstanding', value: '₱12,500', description: 'Total receivables', severity: 'info' },
      ],
      alerts: [],
      invoiceStatusDistribution: [
        { label: 'Paid', value: 10 },
        { label: 'Unpaid', value: 3 },
        { label: 'Overdue', value: 1 },
      ],
      highestOutstanding: [],
      recentPayments: [],
      isUnavailable: false,
    });

    render(
      <MemoryRouter>
        <BillingDashboard />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Billing & Finance Dashboard')).toBeInTheDocument();
      expect(screen.getAllByText('Unpaid Invoices').length).toBeGreaterThan(0);
      expect(screen.getByText('₱12,500')).toBeInTheDocument();
      expect(screen.getByText(/Revenue Collection Trend \(7d\)/)).toBeInTheDocument();
      expect(screen.queryByText(/Live source unavailable/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/Demo Preview/i)).not.toBeInTheDocument();
    });
  });

  it('routes invoice drilldowns to the live cashier invoice registry, not the legacy billing placeholder', async () => {
    vi.mocked(billingDashboardService.getDashboardData).mockResolvedValue({
      kpis: [
        { title: 'Current Session', value: '₱5,000', description: 'Active cashier total', severity: 'success' },
        { title: 'Unpaid Invoices', value: 3, description: 'Pending payment', severity: 'warning' },
        { title: 'Overdue Bills', value: 1, description: 'Past due date', severity: 'critical' },
        { title: 'Total Outstanding', value: '₱12,500', description: 'Total receivables', severity: 'info' },
      ],
      alerts: [],
      invoiceStatusDistribution: [],
      highestOutstanding: [],
      recentPayments: [],
      isUnavailable: false,
    });

    render(
      <MemoryRouter>
        <BillingDashboard />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Invoice Registry')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Invoice Registry'));
    expect(mockNavigate).toHaveBeenCalledWith('/cashier/invoices');
    expect(mockNavigate).not.toHaveBeenCalledWith('/billing');

    mockNavigate.mockClear();
    const unpaidDrilldown = screen
      .getAllByText('Unpaid Invoices')
      .map((element) => element.closest('[role="button"]'))
      .find((element): element is HTMLElement => element !== null);

    if (!unpaidDrilldown) {
      throw new Error('Expected Unpaid Invoices drilldown to be interactive');
    }

    fireEvent.click(unpaidDrilldown);
    expect(mockNavigate).toHaveBeenCalledWith('/cashier/invoices');
    expect(mockNavigate).not.toHaveBeenCalledWith('/billing');
  });

  it('uses honest branch labels that match the actual request scope', async () => {
    vi.mocked(billingDashboardService.getDashboardData).mockResolvedValue({
      kpis: [],
      alerts: [],
      invoiceStatusDistribution: [],
      highestOutstanding: [],
      recentPayments: [],
      isUnavailable: true,
    });

    render(
      <MemoryRouter>
        <BillingDashboard />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(billingDashboardService.getDashboardData).toHaveBeenCalledWith('main-branch');
    });

    const branchSelect = screen.getByLabelText(/Select Branch/i);
    expect(screen.queryByRole('option', { name: /All Branches/i })).not.toBeInTheDocument();
    expect(screen.getAllByText(/Main Branch/i).length).toBeGreaterThan(0);

    fireEvent.change(branchSelect, { target: { value: 'north-clinic' } });

    await waitFor(() => {
      expect(billingDashboardService.getDashboardData).toHaveBeenLastCalledWith('north-clinic');
    });
    expect(screen.getAllByText(/North Branch/i).length).toBeGreaterThan(0);
  });

  it('renders successfully with fallback demo data when API fails', async () => {
    vi.mocked(billingDashboardService.getDashboardData).mockResolvedValue({
      kpis: [],
      alerts: [],
      invoiceStatusDistribution: [],
      highestOutstanding: [],
      recentPayments: [],
      isUnavailable: true,
    });

    render(
      <MemoryRouter>
        <BillingDashboard />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Billing & Finance Dashboard')).toBeInTheDocument();
      expect(screen.getAllByText(/Live source unavailable/i).length).toBeGreaterThan(0);
      expect(screen.getByText(/Live dashboard data could not be loaded/i)).toBeInTheDocument();
      expect(screen.getByText(/Billing & Session Key Metrics/)).toBeInTheDocument();
      expect(screen.getByText(/Highest Outstanding Bills/)).toBeInTheDocument();
      expect(screen.getByText(/Recent Payments \(Active Session\)/)).toBeInTheDocument();
      expect(screen.getByText(/Collection Risk Thresholds/)).toBeInTheDocument();
    });
  });
});
