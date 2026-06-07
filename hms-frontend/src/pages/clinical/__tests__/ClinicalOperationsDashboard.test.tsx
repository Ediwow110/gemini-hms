import React from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ClinicalOperationsDashboard } from '../ClinicalOperationsDashboard';
import { clinicalOpsDashboardService } from '../../../services/clinical-ops-dashboard.service';

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

vi.mock('../../../services/clinical-ops-dashboard.service', () => ({
  clinicalOpsDashboardService: {
    getDashboardData: vi.fn(),
  },
}));

describe('ClinicalOperationsDashboard Unit Tests', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('renders successfully with live dashboard data', async () => {
    vi.mocked(clinicalOpsDashboardService.getDashboardData).mockResolvedValue({
      kpis: [
        { title: 'Active Patients', value: 10, description: 'Currently in clinic', severity: 'info' },
        { title: 'Pending Triage', value: 2, description: 'Awaiting initial assessment', severity: 'success' },
        { title: 'Waiting for Doctor', value: 4, description: 'Ready for consultation', severity: 'warning' },
        { title: 'Nursing Tasks', value: 5, description: 'Open clinical actions', severity: 'info' },
      ],
      alerts: [],
      flowDistribution: [
        { label: 'Triage', value: 2 },
        { label: 'Waiting', value: 4 },
        { label: 'In Consultation', value: 4 },
        { label: 'Completed', value: 10 },
      ],
      workloadDistribution: [
        { label: 'General Practice', value: 100 },
      ],
      topDepartments: [],
      pendingQueue: [],
    });

    render(
      <MemoryRouter>
        <ClinicalOperationsDashboard />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Clinical Operations')).toBeInTheDocument();
      expect(screen.getByText('Active Patients')).toBeInTheDocument();
      expect(screen.getByText('Patient Flow Distribution')).toBeInTheDocument();
      expect(screen.getByText('Workload by Specialty')).toBeInTheDocument();
      expect(screen.queryByText('Demo Preview Mode')).not.toBeInTheDocument();
    });
  });

  it('renders successfully with fallback demo data when API fails', async () => {
    vi.mocked(clinicalOpsDashboardService.getDashboardData).mockRejectedValue(new Error('Network error'));

    render(
      <MemoryRouter>
        <ClinicalOperationsDashboard />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Clinical Operations')).toBeInTheDocument();
      expect(screen.getByText('Demo Preview Mode')).toBeInTheDocument();
      expect(screen.getByText('Demo analytics preview — sample data for client walkthrough')).toBeInTheDocument();
    });
  });
});
