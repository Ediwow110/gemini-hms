import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { CriticalResultsPage } from '../CriticalResultsPage';
import { useCriticalResults } from '../../../hooks/use-lab';

vi.mock('../../../hooks/use-lab', () => ({
  useCriticalResults: vi.fn(),
}));

const mockAcknowledge = vi.fn();
const mockEscalate = vi.fn();

const mockCriticalResults = [
  {
    id: 'res-1',
    patientId: 'pat-1',
    patientName: 'John Doe',
    patientMrn: 'MRN-123',
    orderNumber: 'ORD-001',
    testNames: ['Potassium'],
    results: { potassium: '6.5' },
    criticalStatus: 'OPEN',
    encodedAt: '2026-06-08T10:00:00Z',
  },
  {
    id: 'res-2',
    patientId: 'pat-2',
    patientName: 'Jane Smith',
    patientMrn: 'MRN-456',
    orderNumber: 'ORD-002',
    testNames: ['Hemoglobin'],
    results: { hgb: '6.0' },
    criticalStatus: 'ACKNOWLEDGED',
    encodedAt: '2026-06-08T09:00:00Z',
    criticalAcknowledgedAt: '2026-06-08T09:30:00Z',
  }
];

describe('CriticalResultsPage Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useCriticalResults).mockReturnValue({
      criticalResults: mockCriticalResults,
      isLoading: false,
      error: null,
      acknowledge: mockAcknowledge,
      escalate: mockEscalate,
      acknowledgingId: null,
      escalatingId: null,
      refetch: vi.fn(),
      resolve: vi.fn(),
      resolvingId: null,
    } as unknown as ReturnType<typeof useCriticalResults>);
  });

  it('renders page header and honesty banner', () => {
    render(
      <MemoryRouter>
        <CriticalResultsPage />
      </MemoryRouter>
    );

    expect(screen.getByText('Critical Alerts & Notification Registry')).toBeInTheDocument();
    expect(screen.getByText(/Real — Partial/)).toBeInTheDocument();
    expect(screen.getByText('Live Panic Alerts')).toBeInTheDocument();
  });

  it('renders loading skeleton', () => {
    vi.mocked(useCriticalResults).mockReturnValue({
      criticalResults: [],
      isLoading: true,
      error: null,
    } as unknown as ReturnType<typeof useCriticalResults>);

    render(
      <MemoryRouter>
        <CriticalResultsPage />
      </MemoryRouter>
    );

    // HmsLoadingSkeleton creates several rows
    expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
  });

  it('renders data unavailable state on error', () => {
    vi.mocked(useCriticalResults).mockReturnValue({
      criticalResults: [],
      isLoading: false,
      error: 'API Error',
    } as unknown as ReturnType<typeof useCriticalResults>);

    render(
      <MemoryRouter>
        <CriticalResultsPage />
      </MemoryRouter>
    );

    expect(screen.getByText(/data not available yet/i)).toBeInTheDocument();
    expect(screen.getByText(/Critical Alerts Registry/)).toBeInTheDocument();
  });

  it('lists critical results with correct statuses', () => {
    render(
      <MemoryRouter>
        <CriticalResultsPage />
      </MemoryRouter>
    );

    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText(/MRN-123/)).toBeInTheDocument();
    expect(screen.getByText(/potassium: 6.5/)).toBeInTheDocument();

    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    
    // Check status chips (using getAllByText because they also appear in the filter dropdown)
    expect(screen.getAllByText('Open').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Acknowledged').length).toBeGreaterThan(0);
  });

  it('filters results by search query', () => {
    render(
      <MemoryRouter>
        <CriticalResultsPage />
      </MemoryRouter>
    );

    const searchInput = screen.getByPlaceholderText(/Search patient/i);
    fireEvent.change(searchInput, { target: { value: 'John' } });

    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument();
  });

  it('opens acknowledge modal and submits', async () => {
    render(
      <MemoryRouter>
        <CriticalResultsPage />
      </MemoryRouter>
    );

    const logContactButtons = screen.getAllByText('Log Contact');
    fireEvent.click(logContactButtons[0]);

    expect(screen.getByText('Log Physician Contact')).toBeInTheDocument();

    const textArea = screen.getByPlaceholderText(/Enter verbal orders/i);
    fireEvent.change(textArea, { target: { value: 'Notified Dr. Miller' } });

    // The modal submit button
    const submitButton = screen.getAllByRole('button', { name: 'Log Contact' }).find(b => b.getAttribute('type') === 'submit');
    if (submitButton) fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockAcknowledge).toHaveBeenCalledWith('res-1', 'Notified Dr. Miller');
    });
  });

  it('opens escalate modal and submits', async () => {
    render(
      <MemoryRouter>
        <CriticalResultsPage />
      </MemoryRouter>
    );

    const escalateButton = screen.getByText('Escalate');
    fireEvent.click(escalateButton);

    expect(screen.getByText('Escalate Critical Result')).toBeInTheDocument();

    const textArea = screen.getByPlaceholderText(/Why is this being escalated/i);
    fireEvent.change(textArea, { target: { value: 'Physician unreachable' } });

    const submitButton = screen.getByRole('button', { name: 'Confirm Escalation' });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockEscalate).toHaveBeenCalledWith('res-1', 'Physician unreachable');
    });
  });
});
