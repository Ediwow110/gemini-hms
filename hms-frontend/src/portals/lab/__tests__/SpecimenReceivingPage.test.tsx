import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { SpecimenReceivingPage } from '../SpecimenReceivingPage';
import { usePendingSpecimens } from '../../../hooks/use-lab';

vi.mock('../../../hooks/use-lab', () => ({
  usePendingSpecimens: vi.fn(),
}));

describe('SpecimenReceivingPage Unit Tests', () => {
  const mockSpecimen = {
    id: 'specimen-1',
    orderId: 'order-1',
    orderNumber: 'ORD-001',
    patientId: 'pat-1',
    patientName: 'Jane Smith',
    patientMrn: 'MRN-456',
    specimenType: 'Blood',
    collectionMode: 'VENIPUNCTURE',
    collectedAt: '2026-06-07T12:00:00.000Z',
    status: 'COLLECTED',
    createdAt: '2026-06-07T11:00:00.000Z',
    testNames: ['Complete Blood Count'],
  };

  const mockReceiveSpecimen = vi.fn();
  const mockRefetch = vi.fn();

  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(usePendingSpecimens).mockReturnValue({
      specimens: [mockSpecimen],
      isLoading: false,
      error: null,
      refetch: mockRefetch,
      receiveSpecimen: mockReceiveSpecimen,
    });
  });

  it('renders pending specimen queue items and warning banner', () => {
    render(<SpecimenReceivingPage />);

    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    expect(screen.getByText('ORD-001')).toBeInTheDocument();
    expect(screen.getByText('Blood')).toBeInTheDocument();
    expect(screen.getByText('Specimen Receiving (Partial — Real)')).toBeInTheDocument();
  });

  it('allows selecting a specimen to view detailed information', () => {
    render(<SpecimenReceivingPage />);

    // Click on the patient name to select it
    const row = screen.getByText('Jane Smith');
    fireEvent.click(row);

    expect(screen.getByText('Specimen Intake Receipt')).toBeInTheDocument();
    expect(screen.getByText(/VENIPUNCTURE/)).toBeInTheDocument();
    expect(screen.getByText('Collected Date/Time')).toBeInTheDocument();
  });

  it('calls receiveSpecimen when Log Specimen Receipt is clicked in details', async () => {
    mockReceiveSpecimen.mockResolvedValueOnce(undefined);
    render(<SpecimenReceivingPage />);

    // Select the specimen first
    fireEvent.click(screen.getByText('Jane Smith'));

    const receiveBtn = screen.getByRole('button', { name: /Log Specimen Receipt/i });
    fireEvent.click(receiveBtn);

    expect(mockReceiveSpecimen).toHaveBeenCalledWith('specimen-1');
    await waitFor(() => {
      expect(screen.getByText(/Specimen received and logged successfully/i)).toBeInTheDocument();
    });
  });

  it('renders loading state when loading is true', () => {
    vi.mocked(usePendingSpecimens).mockReturnValue({
      specimens: [],
      isLoading: true,
      error: null,
      refetch: mockRefetch,
      receiveSpecimen: mockReceiveSpecimen,
    });

    render(<SpecimenReceivingPage />);
    const shimmer = document.querySelector('.animate-shimmer');
    expect(shimmer).toBeInTheDocument();
  });

  it('renders empty queue state when there are no specimens', () => {
    vi.mocked(usePendingSpecimens).mockReturnValue({
      specimens: [],
      isLoading: false,
      error: null,
      refetch: mockRefetch,
      receiveSpecimen: mockReceiveSpecimen,
    });

    render(<SpecimenReceivingPage />);
    expect(screen.getByText(/Pending Specimens — data not available yet/i)).toBeInTheDocument();
  });

  it('renders error alert when error is provided', () => {
    vi.mocked(usePendingSpecimens).mockReturnValue({
      specimens: [],
      isLoading: false,
      error: 'Network Timeout Exception',
      refetch: mockRefetch,
      receiveSpecimen: mockReceiveSpecimen,
    });

    render(<SpecimenReceivingPage />);
    expect(screen.getByText(/Specimen Receiving — data not available yet/i)).toBeInTheDocument();
    expect(screen.getByText(/GET \/api\/v1\/lab\/specimens\/pending/i)).toBeInTheDocument();
  });

  it('surfaces receiveSpecimen errors to the user instead of swallowing them', async () => {
    mockReceiveSpecimen.mockRejectedValueOnce(new Error('Network error'));
    render(<SpecimenReceivingPage />);

    fireEvent.click(screen.getByText('Jane Smith'));
    const receiveBtn = screen.getByRole('button', { name: /Log Specimen Receipt/i });
    fireEvent.click(receiveBtn);

    await waitFor(() => {
      expect(screen.getByText(/Failed to receive specimen/i)).toBeInTheDocument();
    });
  });
});
