import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { TurnaroundMonitorPage } from '../TurnaroundMonitorPage';
import { useTurnaroundMetrics } from '../../../hooks/use-lab';

vi.mock('../../../hooks/use-lab', () => ({
  useTurnaroundMetrics: vi.fn(),
}));

const mockData = {
  totalResults: 100,
  releasedCount: 80,
  pendingCount: 20,
  metrics: [
    {
      label: 'Order → Specimen',
      field: 'orderToSpecimen',
      count: 100,
      averageMinutes: 45,
      minMinutes: 10,
      maxMinutes: 120,
      missingTimestampCount: 5,
    },
    {
      label: 'Specimen → Release',
      field: 'specimenToRelease',
      count: 80,
      averageMinutes: 180,
      minMinutes: 90,
      maxMinutes: 600,
      missingTimestampCount: 2,
    }
  ],
  detailRows: [
    {
      resultId: 'res-1',
      orderNumber: 'ORD-001',
      patientName: 'John Doe',
      status: 'RELEASED',
      specimenToReleaseMinutes: 150,
      specimenReceivedAt: '2026-06-08T10:00:00Z',
      releasedAt: '2026-06-08T12:30:00Z',
    }
  ]
};

describe('TurnaroundMonitorPage Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useTurnaroundMetrics).mockReturnValue({
      data: mockData,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof useTurnaroundMetrics>);
  });

  it('renders page header and honesty banner', () => {
    render(
      <MemoryRouter>
        <TurnaroundMonitorPage />
      </MemoryRouter>
    );

    expect(screen.getByText('Lab Turnaround Time (TAT) Monitor')).toBeInTheDocument();
    expect(screen.getByText(/Real — Partial/)).toBeInTheDocument();
    expect(screen.getByText('Clinical Efficiency Audit')).toBeInTheDocument();
  });

  it('renders KPI metrics', () => {
    render(
      <MemoryRouter>
        <TurnaroundMonitorPage />
      </MemoryRouter>
    );

    // KPI section has these values
    expect(screen.getAllByText('100')[0]).toBeInTheDocument(); // Results Analyzed KPI
    expect(screen.getByText('180 min')).toBeInTheDocument(); // Avg Specimen -> Release
    expect(screen.getByText('7')).toBeInTheDocument(); // Missing Timestamps (5 + 2)
  });

  it('renders operational performance table', () => {
    render(
      <MemoryRouter>
        <TurnaroundMonitorPage />
      </MemoryRouter>
    );

    expect(screen.getByText('Order → Specimen')).toBeInTheDocument();
    expect(screen.getByText('Specimen → Release')).toBeInTheDocument();
    
    // Average in the table
    const tableAverages = screen.getAllByText('180');
    expect(tableAverages.length).toBeGreaterThan(0);
    
    expect(screen.getByText('600')).toBeInTheDocument(); // Max
  });

  it('toggles detail registry', () => {
    render(
      <MemoryRouter>
        <TurnaroundMonitorPage />
      </MemoryRouter>
    );

    expect(screen.queryByText('Raw TAT Registry')).not.toBeInTheDocument();

    const toggleButton = screen.getByText(/Show Detail Registry/);
    fireEvent.click(toggleButton);

    expect(screen.getByText('Raw TAT Registry')).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('150m')).toBeInTheDocument();
  });

  it('renders loading skeleton', () => {
    vi.mocked(useTurnaroundMetrics).mockReturnValue({
      data: null,
      isLoading: true,
      error: null,
    } as unknown as ReturnType<typeof useTurnaroundMetrics>);

    render(
      <MemoryRouter>
        <TurnaroundMonitorPage />
      </MemoryRouter>
    );

    // HmsLoadingSkeleton creates several rows
    expect(screen.queryByText('Results Analyzed')).not.toBeInTheDocument();
  });

  it('renders data unavailable on error', () => {
    vi.mocked(useTurnaroundMetrics).mockReturnValue({
      data: null,
      isLoading: false,
      error: 'API Error',
    } as unknown as ReturnType<typeof useTurnaroundMetrics>);

    render(
      <MemoryRouter>
        <TurnaroundMonitorPage />
      </MemoryRouter>
    );

    expect(screen.getByText(/data not available yet/i)).toBeInTheDocument();
    expect(screen.getByText(/TAT Monitor/)).toBeInTheDocument();
  });

  it('renders no data available state', () => {
    vi.mocked(useTurnaroundMetrics).mockReturnValue({
      data: { totalResults: 0, metrics: [], detailRows: [] },
      isLoading: false,
      error: null,
    } as unknown as ReturnType<typeof useTurnaroundMetrics>);

    render(
      <MemoryRouter>
        <TurnaroundMonitorPage />
      </MemoryRouter>
    );

    expect(screen.getByText('No lab results yet')).toBeInTheDocument();
  });
});
