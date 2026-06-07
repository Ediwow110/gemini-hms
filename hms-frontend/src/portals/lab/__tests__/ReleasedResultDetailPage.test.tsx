import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { ReleasedResultDetailPage } from '../ReleasedResultDetailPage';
import { useReleasedLabResultDetail } from '../../../hooks/use-clinical-workflow';

vi.mock('../../../hooks/use-clinical-workflow', () => ({
  useReleasedLabResultDetail: vi.fn(),
}));

const mockNavigate = vi.fn();
const mockParams = { patientId: 'patient-1', orderId: 'order-1' };

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => mockParams,
  };
});

const mockResult = {
  id: 'detail-1',
  orderId: 'order-1',
  status: 'RELEASED',
  version: 2,
  results: {
    Hemoglobin: 14.2,
    WBC: 7.5,
    Neutrophils: 65,
  },
  remarks: 'All parameters within normal range.',
  validatedById: 'validator-1',
  validatedAt: new Date('2026-06-07T12:00:00Z'),
  releasedById: 'releaser-1',
  releasedAt: new Date('2026-06-07T14:30:00Z'),
  createdAt: new Date('2026-06-07T10:00:00Z'),
  timestamp: new Date('2026-06-07T14:30:00Z'),
  accessLabel: 'lab',
  isReadOnly: true,
};

describe('ReleasedResultDetailPage Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockParams.patientId = 'patient-1';
    mockParams.orderId = 'order-1';
    vi.mocked(useReleasedLabResultDetail).mockReturnValue({
      data: mockResult,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof useReleasedLabResultDetail>);
  });

  it('renders loading skeleton when data is loading', () => {
    vi.mocked(useReleasedLabResultDetail).mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof useReleasedLabResultDetail>);

    render(
      <MemoryRouter>
        <ReleasedResultDetailPage />
      </MemoryRouter>
    );

    expect(screen.getByText('Released Lab Result')).toBeInTheDocument();
    expect(screen.getByText(/LIS Registry/)).toBeInTheDocument();
  });

  it('renders access restricted state on 403 error', () => {
    const forbiddenError = new Error('Forbidden');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (forbiddenError as any).isAxiosError = true;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (forbiddenError as any).response = { status: 403 };
    vi.mocked(useReleasedLabResultDetail).mockReturnValue({
      data: undefined,
      isLoading: false,
      error: forbiddenError,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof useReleasedLabResultDetail>);

    render(
      <MemoryRouter>
        <ReleasedResultDetailPage />
      </MemoryRouter>
    );

    expect(screen.getByText(/Access Restricted/)).toBeInTheDocument();
    expect(screen.getByText(/You do not have permission/)).toBeInTheDocument();
  });

  it('renders not found state on 404 error', () => {
    const notFoundError = new Error('Not Found');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (notFoundError as any).isAxiosError = true;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (notFoundError as any).response = { status: 404 };
    vi.mocked(useReleasedLabResultDetail).mockReturnValue({
      data: undefined,
      isLoading: false,
      error: notFoundError,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof useReleasedLabResultDetail>);

    render(
      <MemoryRouter>
        <ReleasedResultDetailPage />
      </MemoryRouter>
    );

    expect(screen.getByText(/Result Not Found/)).toBeInTheDocument();
    expect(screen.getByText(/may have been archived/)).toBeInTheDocument();
  });

  it('renders connection error state on generic error', () => {
    vi.mocked(useReleasedLabResultDetail).mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('Network Error'),
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof useReleasedLabResultDetail>);

    render(
      <MemoryRouter>
        <ReleasedResultDetailPage />
      </MemoryRouter>
    );

    expect(screen.getByText(/Connection Error/)).toBeInTheDocument();
    expect(screen.getByText(/Failed to load released result/)).toBeInTheDocument();
  });

  it('renders no-result state when data is null', () => {
    vi.mocked(useReleasedLabResultDetail).mockReturnValue({
      data: null,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof useReleasedLabResultDetail>);

    render(
      <MemoryRouter>
        <ReleasedResultDetailPage />
      </MemoryRouter>
    );

    expect(screen.getByText(/No Result Found/)).toBeInTheDocument();
    expect(screen.getByText(/This released lab result is not available/)).toBeInTheDocument();
  });

  it('renders result values, remarks, and timeline', () => {
    render(
      <MemoryRouter>
        <ReleasedResultDetailPage />
      </MemoryRouter>
    );

    // Result values
    expect(screen.getByText('Result Values')).toBeInTheDocument();
    expect(screen.getByText('Hemoglobin')).toBeInTheDocument();
    expect(screen.getByText('14.2')).toBeInTheDocument();
    expect(screen.getByText('WBC')).toBeInTheDocument();
    expect(screen.getByText('7.5')).toBeInTheDocument();

    // Remarks
    expect(screen.getByText('Remarks')).toBeInTheDocument();
    expect(screen.getByText(/All parameters within normal range/)).toBeInTheDocument();

    // Status chip and timeline labels both contain "Released"
    const releasedLabels = screen.getAllByText('Released');
    expect(releasedLabels.length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText(/v2/)).toBeInTheDocument();

    // Timeline labels
    expect(screen.getByText('Validated')).toBeInTheDocument();
    // "Released" appears in both status chip and timeline label
    const releasedInstances = screen.getAllByText('Released');
    expect(releasedInstances.length).toBeGreaterThanOrEqual(2);
  });

  it('renders empty message when no result values', () => {
    vi.mocked(useReleasedLabResultDetail).mockReturnValue({
      data: { ...mockResult, results: {} },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof useReleasedLabResultDetail>);

    render(
      <MemoryRouter>
        <ReleasedResultDetailPage />
      </MemoryRouter>
    );

    expect(screen.getByText('No result values recorded.')).toBeInTheDocument();
  });

  it('navigates back to released list on back button click', () => {
    render(
      <MemoryRouter>
        <ReleasedResultDetailPage />
      </MemoryRouter>
    );

    const backButton = screen.getByText(/← Back to Released Results/);
    fireEvent.click(backButton);

    expect(mockNavigate).toHaveBeenCalledWith('/lab/released');
  });

  it('shows scope notice about clinical visibility', () => {
    render(
      <MemoryRouter>
        <ReleasedResultDetailPage />
      </MemoryRouter>
    );

    // Scope notice spans text nodes, match across the parent
    expect(screen.getByText(/This result has been/)).toBeInTheDocument();
    expect(screen.getByText(/separate workflows/)).toBeInTheDocument();
  });
});
