import React from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
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
      paymentMethodDistribution: [
        { label: 'Cash', value: 100 },
      ],
      highestOutstanding: [],
      recentPayments: [],
      revenueTrend: [
        { label: 'Mon', value: 5000 },
      ],
      isDemoData: false,
    });

    render(
      <MemoryRouter>
        <BillingDashboard />
      </MemoryRouter>
    );

    // Should display loader initially, then data
    await waitFor(() => {
      expect(screen.getByText('Billing & Finance Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Unpaid Invoices')).toBeInTheDocument();
      expect(screen.getByText('₱12,500')).toBeInTheDocument();
      expect(screen.getByText('Revenue Collection Trend (7d)')).toBeInTheDocument();
      expect(screen.queryByText('Demo Preview Mode')).not.toBeInTheDocument();
    });
  });

  it('renders successfully with fallback demo data when API fails', async () => {
    vi.mocked(billingDashboardService.getDashboardData).mockResolvedValue({
      kpis: [
        { title: 'Current Session', value: '₱42,500', description: 'Active cashier total (Demo)', severity: 'success' },
        { title: 'Unpaid Invoices', value: 18, description: 'Pending payment (Demo)', severity: 'warning' },
        { title: 'Overdue Bills', value: 5, description: 'Past due date (Demo)', severity: 'critical' },
        { title: 'Total Outstanding', value: '₱184,200', description: 'Total receivables (Demo)', severity: 'info' },
      ],
      alerts: [],
      invoiceStatusDistribution: [],
      paymentMethodDistribution: [],
      highestOutstanding: [],
      recentPayments: [],
      revenueTrend: [
        { label: 'Mon', value: 12500 },
      ],
      isDemoData: true,
    });

    render(
      <MemoryRouter>
        <BillingDashboard />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Billing & Finance Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Demo Preview Mode')).toBeInTheDocument();
      expect(screen.getByText('₱184,200')).toBeInTheDocument();
      expect(screen.getByText('Demo analytics preview — sample data for client walkthrough')).toBeInTheDocument();
    });
  });
});
