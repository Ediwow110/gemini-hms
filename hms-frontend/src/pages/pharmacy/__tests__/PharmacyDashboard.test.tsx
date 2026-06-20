import React from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { PharmacyDashboard } from '../PharmacyDashboard';
import { pharmacyDashboardService } from '../../../services/pharmacy-dashboard.service';
import type { PharmacyDashboardData } from '../../../services/pharmacy-dashboard.service';

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

const mockNavigate = vi.hoisted(() => vi.fn());
const mockHasPermission = vi.hoisted(() => vi.fn<(permission: string) => boolean>(() => true));

vi.mock('../../../hooks/use-user', () => ({
  usePermissions: () => ({ hasPermission: mockHasPermission }),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const liveDashboardFixture = {
  kpis: [
    { title: 'Total Inventory', value: 50, description: 'Unique medications', severity: 'info' as const },
    { title: 'Low Stock', value: 1, description: 'Below reorder level', severity: 'warning' as const },
  ],
  alerts: [],
  stockDistribution: [],
  lowestStock: [{ id: 'med-1', label: 'Amoxicillin', value: 0 }],
  activePrescriptions: [{
    id: 'rx-1',
    patientName: 'Patient 001',
    patientNumber: 'P-001',
    medicationName: 'Amoxicillin',
    dosage: '500mg',
    frequency: 'BID',
    prescribedBy: 'provider-1',
    prescribedByName: 'Provider 001',
  }],
  isUnavailable: false,
} as unknown as PharmacyDashboardData;

describe('PharmacyDashboard Unit Tests', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockHasPermission.mockReturnValue(true);
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

  it('hides dispense hub shortcuts from users without dispense permission', async () => {
    mockHasPermission.mockImplementation((permission: string) => permission !== 'inventory.stock.dispense');
    vi.mocked(pharmacyDashboardService.getDashboardData).mockResolvedValue(liveDashboardFixture);

    render(
      <MemoryRouter>
        <PharmacyDashboard />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Prescriptions Waiting Dispense')).toBeInTheDocument();
    });

    expect(screen.queryByRole('button', { name: /Dispense →/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Dispense Queue' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Drug Inventory' })).not.toBeInTheDocument();
    expect(screen.queryByText('Open Dispense Hub')).not.toBeInTheDocument();
    expect(screen.queryByText('Open Inventory Manager')).not.toBeInTheDocument();
    expect(screen.getByText('Dispense Queue Backlog')).toBeInTheDocument();
    expect(mockHasPermission).toHaveBeenCalledWith('inventory.stock.dispense');
  });

  it('allows navigating to dispense hub only when dispense permission is present', async () => {
    mockHasPermission.mockReturnValue(true);
    vi.mocked(pharmacyDashboardService.getDashboardData).mockResolvedValue(liveDashboardFixture);

    render(
      <MemoryRouter>
        <PharmacyDashboard />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Dispense Queue' })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /Dispense →/i }));
    expect(mockNavigate).toHaveBeenCalledWith('/pharmacy');

    fireEvent.click(screen.getByRole('button', { name: 'Dispense Queue' }));
    expect(mockNavigate).toHaveBeenCalledWith('/pharmacy');
  });
});
