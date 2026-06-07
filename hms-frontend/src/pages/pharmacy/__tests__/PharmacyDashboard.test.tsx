import React from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
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
      categoryDistribution: [],
      topDispensed: [],
      lowestStock: [],
      dispenseTrend: [
        { label: 'Mon', value: 142 },
      ],
      isDemoData: false,
    });

    render(
      <MemoryRouter>
        <PharmacyDashboard />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Pharmacy Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Total Inventory')).toBeInTheDocument();
      expect(screen.getByText('Dispensing Throughput (7d)')).toBeInTheDocument();
      expect(screen.queryByText('Demo Preview Mode')).not.toBeInTheDocument();
    });
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
      categoryDistribution: [],
      topDispensed: [],
      lowestStock: [],
      dispenseTrend: [
        { label: 'Mon', value: 142 },
      ],
      isDemoData: true,
    });

    render(
      <MemoryRouter>
        <PharmacyDashboard />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Pharmacy Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Demo Preview Mode')).toBeInTheDocument();
      expect(screen.getByText('Demo analytics preview — sample data for client walkthrough')).toBeInTheDocument();
    });
  });
});
