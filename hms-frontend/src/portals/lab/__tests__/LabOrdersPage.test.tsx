import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { LabOrdersPage } from '../LabOrdersPage';
import { 
  useClinicalWorkQueue, 
  usePatientLabResults, 
  useReceiveLabOrder,
  usePatientClinicalSummary
} from '../../../hooks/use-clinical-workflow';

vi.mock('../../../hooks/use-clinical-workflow', () => ({
  useClinicalWorkQueue: vi.fn(),
  usePatientLabResults: vi.fn(),
  useReceiveLabOrder: vi.fn(),
  usePatientClinicalSummary: vi.fn(),
}));

const mockNavigate = vi.fn();
let mockSearchParamsValue = new URLSearchParams();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useSearchParams: () => [mockSearchParamsValue, vi.fn()],
  };
});

// Mock queue data item factory
function createQueueItem(overrides: Record<string, unknown> = {}) {
  return {
    id: 'queue-1',
    patientId: 'patient-1',
    patientName: 'Jane Smith',
    patientNumber: 'MRN-456',
    queueNumber: 'Q-001',
    category: 'REGULAR',
    serviceType: 'LABORATORY',
    status: 'WAITING',
    waitTimeMinutes: 10,
    timestamp: new Date('2026-06-07T10:00:00Z'),
    branchId: 'branch-1',
    tenantId: 'tenant-1',
    accessLabel: 'lab',
    isReadOnly: false,
    ...overrides,
  };
}

const mockLabResults = [
  {
    id: 'result-1',
    orderNumber: 'ORD-2026-001',
    approvedBy: 'Dr. House',
    isReleased: true,
  },
];

const mockPatientSummary = {
  id: 'patient-1',
  patientId: 'patient-1',
  patientName: 'Jane Smith',
  patientNumber: 'MRN-456',
  dob: new Date('1990-05-15'),
  gender: 'Female',
  recentEncounters: 2,
  activePrescriptions: 1,
  pendingLabResults: 0,
  status: 'ACTIVE',
  timestamp: new Date(),
  accessLabel: 'standard',
  isReadOnly: false,
};

const mockReceiveMutateAsync = vi.fn();

function createMutation(overrides: Record<string, unknown> = {}) {
  return {
    mutateAsync: mockReceiveMutateAsync,
    isPending: false,
    isSuccess: false,
    isError: false,
    error: null,
    data: undefined,
    variables: undefined,
    isIdle: true,
    status: 'idle' as const,
    mutate: vi.fn(),
    reset: vi.fn(),
    context: undefined,
    failureCount: 0,
    failureReason: null,
    ...overrides,
  } as unknown as ReturnType<typeof useReceiveLabOrder>;
}

describe('LabOrdersPage Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSearchParamsValue = new URLSearchParams();

    vi.mocked(useClinicalWorkQueue).mockReturnValue({
      data: [createQueueItem()],
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof useClinicalWorkQueue>);

    vi.mocked(usePatientLabResults).mockReturnValue({
      data: mockLabResults,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof usePatientLabResults>);

    vi.mocked(usePatientClinicalSummary).mockReturnValue({
      data: mockPatientSummary,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof usePatientClinicalSummary>);

    vi.mocked(useReceiveLabOrder).mockReturnValue(createMutation());
  });

  it('renders loading skeleton when queue data is loading', () => {
    vi.mocked(useClinicalWorkQueue).mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof useClinicalWorkQueue>);

    render(
      <MemoryRouter>
        <LabOrdersPage />
      </MemoryRouter>
    );

    expect(screen.getByText('Lab Orders Intake Queue')).toBeInTheDocument();
    expect(screen.getByText(/LIS Intake/)).toBeInTheDocument();
  });

  it('renders access restricted state on 403 error', () => {
    const forbiddenError = new Error('Forbidden');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (forbiddenError as any).isAxiosError = true;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (forbiddenError as any).response = { status: 403 };
    vi.mocked(useClinicalWorkQueue).mockReturnValue({
      data: undefined,
      isLoading: false,
      error: forbiddenError,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof useClinicalWorkQueue>);

    render(
      <MemoryRouter>
        <LabOrdersPage />
      </MemoryRouter>
    );

    expect(screen.getByText(/Access Restricted/)).toBeInTheDocument();
  });

  it('renders connection error state on generic error', () => {
    vi.mocked(useClinicalWorkQueue).mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('Network Error'),
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof useClinicalWorkQueue>);

    render(
      <MemoryRouter>
        <LabOrdersPage />
      </MemoryRouter>
    );

    expect(screen.getByText(/Connection Error/)).toBeInTheDocument();
  });

  it('renders honesty banner and orders list', () => {
    render(
      <MemoryRouter>
        <LabOrdersPage />
      </MemoryRouter>
    );

    // Honesty banner
    expect(screen.getByText(/LIS Intake Workspace \(Real — Partial\)/)).toBeInTheDocument();
    expect(screen.getByText(/enriched from the clinical summary/)).toBeInTheDocument();

    // Orders list
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    expect(screen.getByText('LIS-Q-001')).toBeInTheDocument();
    
    // Status filter has "Ordered"
    const orderedFilterOption = screen.getByRole('option', { name: 'Ordered' });
    expect(orderedFilterOption).toBeInTheDocument();

    // Production badge
    expect(screen.getByText('LIS Production Interface')).toBeInTheDocument();
  });

  it('filters orders by search text', () => {
    vi.mocked(useClinicalWorkQueue).mockReturnValue({
      data: [
        createQueueItem({ id: 'q1', patientName: 'Alice' }),
        createQueueItem({ id: 'q2', patientName: 'Bob' }),
      ],
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof useClinicalWorkQueue>);

    render(
      <MemoryRouter>
        <LabOrdersPage />
      </MemoryRouter>
    );

    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();

    const searchInput = screen.getByPlaceholderText(/Search patient/i);
    fireEvent.change(searchInput, { target: { value: 'Alice' } });

    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.queryByText('Bob')).not.toBeInTheDocument();
  });

  it('renders no-orders message when filtered list is empty', () => {
    vi.mocked(useClinicalWorkQueue).mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof useClinicalWorkQueue>);

    render(
      <MemoryRouter>
        <LabOrdersPage />
      </MemoryRouter>
    );

    expect(screen.getByText(/No orders match current criteria/)).toBeInTheDocument();
  });

  it('displays order detail panel with enriched demographics when patientId is in search params', () => {
    mockSearchParamsValue = new URLSearchParams('patientId=queue-1');

    render(
      <MemoryRouter>
        <LabOrdersPage />
      </MemoryRouter>
    );

    // Enriched demographics (1990-05-15 should be ~36 years old in 2026)
    expect(screen.getByText(/36Y \/ Female/)).toBeInTheDocument();
    expect(screen.getByText(/DOB: 1990-05-15/)).toBeInTheDocument();

    // Sections
    expect(screen.getByText(/Diagnostic Panel Authorization/)).toBeInTheDocument();
    expect(screen.getByText(/Portal Specimen & Intake Actions/)).toBeInTheDocument();

    // Receive Specimen button for Ordered status
    expect(screen.getByText('Receive Specimen')).toBeInTheDocument();
  });

  it('shows Encode Results button when status is Received', () => {
    mockSearchParamsValue = new URLSearchParams('patientId=queue-2');
    vi.mocked(useClinicalWorkQueue).mockReturnValue({
      data: [createQueueItem({ id: 'queue-2', status: 'SERVING' })],
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof useClinicalWorkQueue>);

    render(
      <MemoryRouter>
        <LabOrdersPage />
      </MemoryRouter>
    );

    expect(screen.getByText('Encode Results')).toBeInTheDocument();
  });

  it('opens receive modal and submits specimen receipt', async () => {
    mockSearchParamsValue = new URLSearchParams('patientId=queue-1');
    mockReceiveMutateAsync.mockResolvedValueOnce({});

    render(
      <MemoryRouter>
        <LabOrdersPage />
      </MemoryRouter>
    );

    // Open receive modal
    const receiveButton = screen.getByText('Receive Specimen');
    fireEvent.click(receiveButton);

    // Modal appears
    expect(screen.getByText('Receive Lab Specimen')).toBeInTheDocument();

    // Select specimen type
    const selects = screen.getAllByRole('combobox');
    // selects[0] is status filter, selects[1] is specimen type
    fireEvent.change(selects[1], { target: { value: 'Whole Blood' } });

    // Confirm
    const confirmButton = screen.getByText('Confirm Specimen Receipt');
    fireEvent.click(confirmButton);

    expect(mockReceiveMutateAsync).toHaveBeenCalledWith({
      patientId: 'patient-1',
      orderId: 'queue-1',
      data: {
        specimenType: 'Whole Blood',
        accessionNumber: undefined,
        collectionMode: 'ROUTINE',
      },
    });
  });

  it('shows unselected state when no order is selected', () => {
    render(
      <MemoryRouter>
        <LabOrdersPage />
      </MemoryRouter>
    );

    expect(screen.getByText(/Select an intake request/)).toBeInTheDocument();
  });

  it('displays STAT badge for urgent items', () => {
    vi.mocked(useClinicalWorkQueue).mockReturnValue({
      data: [
        createQueueItem({
          id: 'queue-stat',
          category: 'EMERGENCY',
          patientName: 'Urgent Patient',
        }),
      ],
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof useClinicalWorkQueue>);

    render(
      <MemoryRouter>
        <LabOrdersPage />
      </MemoryRouter>
    );

    expect(screen.getByText('STAT')).toBeInTheDocument();
  });
});
