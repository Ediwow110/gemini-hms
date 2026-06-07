import React from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AdminExecutiveDashboard } from '../AdminExecutiveDashboard';
import { dashboardService } from '../../../services/dashboard.service';

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div data-testid="responsive-chart">{children}</div>,
  AreaChart: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Area: () => <div />,
  LineChart: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Line: () => <div />,
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

vi.mock('../../../services/dashboard.service', () => ({
  dashboardService: {
    getAdminSummary: vi.fn(),
    getAdminTrends: vi.fn(),
    getAdminAlerts: vi.fn(),
    getAdminTopLists: vi.fn(),
  },
}));

describe('AdminExecutiveDashboard Unit Tests', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('renders successfully with live dashboard data', async () => {
    vi.mocked(dashboardService.getAdminSummary).mockResolvedValue({
      activePatients: 500,
      todaysAppointments: 20,
      pendingLabs: 5,
      lowStock: 2,
      revenue: 15000,
      securityAlerts: 0,
    });
    vi.mocked(dashboardService.getAdminTrends).mockResolvedValue([
      { label: 'Mon', value: 20 },
    ]);
    vi.mocked(dashboardService.getAdminAlerts).mockResolvedValue({
      lowStock: [],
      criticalLabs: [],
    });
    vi.mocked(dashboardService.getAdminTopLists).mockResolvedValue({
      busiestDepts: [
        { id: 'dept-1', label: 'General Medicine', value: '42%' },
      ],
      unpaidBills: [],
    });

    render(
      <MemoryRouter>
        <AdminExecutiveDashboard />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Executive Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Active Patients')).toBeInTheDocument();
      expect(screen.getByText('Patient Volume Trend')).toBeInTheDocument();
      expect(screen.getByText('Revenue Trend')).toBeInTheDocument();
      expect(screen.queryByText('Demo Preview Mode')).not.toBeInTheDocument();
    });
  });

  it('renders successfully with fallback mock data when API fails', async () => {
    vi.mocked(dashboardService.getAdminSummary).mockRejectedValue(new Error('Network error'));

    render(
      <MemoryRouter>
        <AdminExecutiveDashboard />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Executive Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Demo Preview Mode')).toBeInTheDocument();
      expect(screen.getByText('Demo analytics preview — sample data for client walkthrough')).toBeInTheDocument();
    });
  });
});
