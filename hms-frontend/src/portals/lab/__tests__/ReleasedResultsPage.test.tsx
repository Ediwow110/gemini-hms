import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { ReleasedResultsPage } from '../ReleasedResultsPage';
import { useReleasedResults } from '../../../hooks/use-clinical-workflow';

vi.mock('../../../hooks/use-clinical-workflow', () => ({
  useReleasedResults: vi.fn(),
}));

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const mockResult = {
  id: 'released-1',
  orderId: 'order-1',
  orderNumber: 'ORD-2026-001',
  patientId: 'patient-1',
  patientName: 'Jane Smith',
  patientNumber: 'MRN-456',
  specimenId: 'specimen-1',
  specimenType: 'Blood',
  panelName: 'Complete Blood Count',
  validatedAt: new Date('2026-06-07T12:00:00Z'),
  validatedById: 'validator-1',
  releasedAt: new Date('2026-06-07T14:30:00Z'),
  releasedById: 'releaser-1',
  version: 1,
  status: 'RELEASED',
  timestamp: new Date('2026-06-07T14:30:00Z'),
  accessLabel: 'lab',
  isReadOnly: true,
};

const mockRefetch = vi.fn();

describe('ReleasedResultsPage Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useReleasedResults).mockReturnValue({
      data: [mockResult],
      isLoading: false,
      error: null,
      refetch: mockRefetch,
    } as unknown as ReturnType<typeof useReleasedResults>);
  });

  it('renders loading skeleton when data is loading', () => {
    vi.mocked(useReleasedResults).mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
      refetch: mockRefetch,
    } as unknown as ReturnType<typeof useReleasedResults>);

    render(
      <MemoryRouter>
        <ReleasedResultsPage />
      </MemoryRouter>
    );

    expect(screen.getByText('Released Results')).toBeInTheDocument();
    expect(screen.getByText(/LIS Registry/)).toBeInTheDocument();
  });

  it('renders access restricted state on 403 error', () => {
    const forbiddenError = new Error('Forbidden');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (forbiddenError as any).isAxiosError = true;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (forbiddenError as any).response = { status: 403 };
    vi.mocked(useReleasedResults).mockReturnValue({
      data: undefined,
      isLoading: false,
      error: forbiddenError,
      refetch: mockRefetch,
    } as unknown as ReturnType<typeof useReleasedResults>);

    render(
      <MemoryRouter>
        <ReleasedResultsPage />
      </MemoryRouter>
    );

    expect(screen.getByText(/Access Restricted/)).toBeInTheDocument();
    expect(screen.getByText(/You do not have permission/)).toBeInTheDocument();
  });

  it('renders connection error state on generic error', () => {
    vi.mocked(useReleasedResults).mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('Network Error'),
      refetch: mockRefetch,
    } as unknown as ReturnType<typeof useReleasedResults>);

    render(
      <MemoryRouter>
        <ReleasedResultsPage />
      </MemoryRouter>
    );

    expect(screen.getByText(/Connection Error/)).toBeInTheDocument();
    expect(screen.getByText(/Failed to load released results/)).toBeInTheDocument();
  });

  it('renders empty state when no results', () => {
    vi.mocked(useReleasedResults).mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
      refetch: mockRefetch,
    } as unknown as ReturnType<typeof useReleasedResults>);

    render(
      <MemoryRouter>
        <ReleasedResultsPage />
      </MemoryRouter>
    );

    expect(screen.getByText('No Released Results')).toBeInTheDocument();
    expect(screen.getByText(/Go to Pending Release/)).toBeInTheDocument();
  });

  it('renders released results in the table', () => {
    render(
      <MemoryRouter>
        <ReleasedResultsPage />
      </MemoryRouter>
    );

    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    expect(screen.getByText('MRN-456')).toBeInTheDocument();
    expect(screen.getByText('ORD-2026-001')).toBeInTheDocument();
    expect(screen.getByText('Complete Blood Count')).toBeInTheDocument();
    expect(screen.getByText('Blood')).toBeInTheDocument();
    const releasedEls = screen.getAllByText('Released');
    expect(releasedEls.length).toBeGreaterThanOrEqual(1);
  });

  it('navigates to detail on row click', () => {
    render(
      <MemoryRouter>
        <ReleasedResultsPage />
      </MemoryRouter>
    );

    const row = screen.getByText('Jane Smith');
    fireEvent.click(row);

    expect(mockNavigate).toHaveBeenCalledWith('/lab/released/patient-1/order-1');
  });

  it('displays scope notice about released results limitations', () => {
    render(
      <MemoryRouter>
        <ReleasedResultsPage />
      </MemoryRouter>
    );

    expect(screen.getByText(/released for clinical visibility/)).toBeInTheDocument();
  });
});
