import React from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { PharmacyDashboard } from '../PharmacyDashboard';
import { pharmacyDashboardService } from '../../../services/pharmacy-dashboard.service';

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

vi.mock('../../../services/pharmacy-dashboard.service', () => ({
  pharmacyDashboardService: {
    getDashboardData: vi.fn(),
  },
}));

describe('PharmacyDashboard Unit Tests', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('renders successfully with live dashboard data', async () => {
    vi.mocked(pharmacyDashboardService.getDashboardData).mockResolvedValue({
      kpis: [
        { title: 'Total Inventory', value: 50, description: 'Unique medications', severity: 'info' },
        { title: 'Low Stock', value: 2, description: 'Below reorder level', severity: 'warning' },
        { title: 'Out of Stock', value: 1, description: 'Critical shortages', severity: 'critical' },
        { title: 'Dispense Queue', value: 4, description: 'Active prescriptions', severity: 'success' },
      ],
      alerts: [],
      stockDistribution: [
        { label: 'Healthy', value: 47 },
        { label: 'Low', value: 2 },
        { label: 'Out', value: 1 },
      ],
      lowestStock: [],
      isUnavailable: false,
    });

    render(
      <MemoryRouter>
        <PharmacyDashboard />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Pharmacy Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Total Inventory')).toBeInTheDocument();
      expect(screen.getByText(/Dispensing Throughput \(7d\)/)).toBeInTheDocument();
      expect(screen.queryByText(/Live source unavailable/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/Demo Preview/i)).not.toBeInTheDocument();
    });
  });

  it('uses honest branch labels that match the actual request scope', async () => {
    vi.mocked(pharmacyDashboardService.getDashboardData).mockResolvedValue({
      kpis: [],
      alerts: [],
      stockDistribution: [],
      lowestStock: [],
      isUnavailable: true,
    });

    render(
      <MemoryRouter>
        <PharmacyDashboard />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(pharmacyDashboardService.getDashboardData).toHaveBeenCalledWith('main-branch');
    });

    const branchSelect = screen.getByLabelText(/Select Branch/i);
    expect(screen.queryByRole('option', { name: /All Branches/i })).not.toBeInTheDocument();
    expect(screen.getAllByText(/Main Branch/i).length).toBeGreaterThan(0);

    fireEvent.change(branchSelect, { target: { value: 'north-clinic' } });

    await waitFor(() => {
      expect(pharmacyDashboardService.getDashboardData).toHaveBeenLastCalledWith('north-clinic');
    });
    expect(screen.getAllByText(/North Branch/i).length).toBeGreaterThan(0);
  });

  it('renders successfully with fallback demo data when API fails', async () => {
    vi.mocked(pharmacyDashboardService.getDashboardData).mockResolvedValue({
      kpis: [
        { title: 'Total Inventory', value: 124, description: 'Unique medications (Demo)', severity: 'info' },
        { title: 'Low Stock', value: 8, description: 'Below reorder level (Demo)', severity: 'warning' },
        { title: 'Out of Stock', value: 3, description: 'Critical shortages (Demo)', severity: 'critical' },
        { title: 'Dispense Queue', value: 6, description: 'Active prescriptions (Demo)', severity: 'success' },
      ],
      alerts: [],
      stockDistribution: [],
      lowestStock: [],
      isUnavailable: true,
    });

    render(
      <MemoryRouter>
        <PharmacyDashboard />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Pharmacy Dashboard')).toBeInTheDocument();
      expect(screen.getAllByText(/Live source unavailable/i).length).toBeGreaterThan(0);
      expect(screen.getByText(/Live dashboard data could not be loaded/i)).toBeInTheDocument();
      expect(screen.getByText(/Inventory & Dispense Key Metrics/)).toBeInTheDocument();
      expect(screen.getByText(/Prescriptions Waiting Dispense/)).toBeInTheDocument();
      expect(screen.getByText(/Lowest Stock Items/)).toBeInTheDocument();
      expect(screen.getByText(/Operational Risks/)).toBeInTheDocument();
    });
  });
});
