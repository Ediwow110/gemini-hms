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

  it('renders truthful error state (NOT fake demo data) when API fails', async () => {
    vi.mocked(clinicalOpsDashboardService.getDashboardData).mockRejectedValue(new Error('Network error'));

    render(
      <MemoryRouter>
        <ClinicalOperationsDashboard />
      </MemoryRouter>
    );

    // Must show truthful error message
    await waitFor(() => {
      expect(
        screen.getByText('Unable to load clinical operations data. Please retry.'),
      ).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
    });

    // Must NOT show any fabricated operational content
    expect(screen.queryByText('Demo Preview Mode')).not.toBeInTheDocument();
    expect(screen.queryByText('Demo analytics preview — sample data for client walkthrough')).not.toBeInTheDocument();
    expect(screen.queryByText('Currently in clinic (Demo)')).not.toBeInTheDocument();
    expect(screen.queryByText('Awaiting initial assessment (Demo)')).not.toBeInTheDocument();
    expect(screen.queryByText('Ready for consultation (Demo)')).not.toBeInTheDocument();
    expect(screen.queryByText('Open clinical actions (Demo)')).not.toBeInTheDocument();
    expect(screen.queryByText('Demo Patient A')).not.toBeInTheDocument();
    expect(screen.queryByText('Demo Patient B')).not.toBeInTheDocument();
    expect(screen.queryByText('Administer IV meds - Patient: Demo Patient A')).not.toBeInTheDocument();
    expect(screen.queryByText('Patient Demo Patient B in Urgent Care queue')).not.toBeInTheDocument();
    // Fake KPI values must not appear
    expect(screen.queryByText('48')).not.toBeInTheDocument();
    expect(screen.queryByText('3')).not.toBeInTheDocument();
    expect(screen.queryByText('12')).not.toBeInTheDocument();
    expect(screen.queryByText('15')).not.toBeInTheDocument();
    // Fake queue rows must not appear
    expect(screen.queryByText('Q-001')).not.toBeInTheDocument();
    expect(screen.queryByText('Q-002')).not.toBeInTheDocument();
    // Fake department pressure must not appear
    expect(screen.queryByText('General Practice')).not.toBeInTheDocument();
    expect(screen.queryByText('Pediatrics')).not.toBeInTheDocument();
    // Header and real sections must NOT show on error
    expect(screen.queryByText('Patient Flow Distribution')).not.toBeInTheDocument();
    expect(screen.queryByText('Workload by Specialty')).not.toBeInTheDocument();
    expect(screen.queryByText('Active Patient Queue')).not.toBeInTheDocument();
  });
});
