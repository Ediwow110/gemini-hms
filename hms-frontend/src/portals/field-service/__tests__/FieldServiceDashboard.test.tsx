import React from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { FieldServiceDashboard } from '../FieldServiceDashboard';
import { apiClient } from '../../../lib/api';

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

vi.mock('../../../lib/api', () => ({
  apiClient: {
    get: vi.fn(),
  },
}));

describe('FieldServiceDashboard Unit Tests', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('renders successfully with live dashboard data', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({
      data: {
        deliveries: [
          { id: 'del-1', customer: 'Hospital A', address: '123 St', status: 'IN_PROGRESS' },
        ],
        installations: [
          { id: 'ins-1', customer: 'Hospital B', address: '456 Rd', status: 'PENDING' },
        ],
      },
    });

    render(
      <MemoryRouter>
        <FieldServiceDashboard />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Field Service Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Job Completion Timeline')).toBeInTheDocument();
      expect(screen.getByText('SLA Response / Aging')).toBeInTheDocument();
      expect(screen.getByText('Handover Sync Posture')).toBeInTheDocument();
      expect(screen.queryByText('Demo Preview Mode')).not.toBeInTheDocument();
    });
  });

  it('renders successfully with fallback demo data when API fails', async () => {
    vi.mocked(apiClient.get).mockRejectedValue(new Error('Network error'));

    render(
      <MemoryRouter>
        <FieldServiceDashboard />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Field Service Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Demo Preview Mode')).toBeInTheDocument();
      expect(screen.getByText('Demo analytics preview — sample data for client walkthrough')).toBeInTheDocument();
    });
  });
});
