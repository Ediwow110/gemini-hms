import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { ResultReleasePage } from '../ResultReleasePage';
import { useReleasableResults } from '../../../hooks/use-lab';
import { apiClient } from '../../../lib/api';

vi.mock('../../../hooks/use-lab', () => ({
  useReleasableResults: vi.fn(),
}));

vi.mock('../../../lib/api', () => ({
  apiClient: {
    post: vi.fn(),
  },
}));

describe('ResultReleasePage Unit Tests', () => {
  const mockResult = {
    id: 'result-123',
    patientName: 'Jane Smith',
    patientMrn: 'MRN-456',
    orderNumber: 'ORD-2026-001',
    testNames: ['Complete Blood Count', 'Lipid Panel'],
    validatedById: 'supervisor-1',
    validatedAt: new Date().toISOString(),
  };

  const mockRefetch = vi.fn();

  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(useReleasableResults).mockReturnValue({
      results: [mockResult],
      isLoading: false,
      error: null,
      refetch: mockRefetch,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);
  });

  it('renders releasable result work queue items', () => {
    render(<MemoryRouter><ResultReleasePage /></MemoryRouter>);

    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    expect(screen.getByText('MRN: MRN-456')).toBeInTheDocument();
    expect(screen.getByText('ORD-2026-001')).toBeInTheDocument();
    expect(screen.getByText('Complete Blood Count, Lipid Panel')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Release$/i })).toBeInTheDocument();
  });

  it('triggers release post call on action click', async () => {
    vi.mocked(apiClient.post).mockResolvedValueOnce({ data: {} });

    render(<MemoryRouter><ResultReleasePage /></MemoryRouter>);

    const releaseButton = screen.getByRole('button', { name: /Release$/i });
    fireEvent.click(releaseButton);

    expect(apiClient.post).toHaveBeenCalledWith('/v1/lab/results/result-123/release');
    await waitFor(() => {
      expect(mockRefetch).toHaveBeenCalled();
    });
  });
});
