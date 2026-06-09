import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { ResultReleasePage } from '../ResultReleasePage';
import { useReleasableResults, useReleaseResult } from '../../../hooks/use-lab';

vi.mock('../../../hooks/use-lab', () => ({
  useReleasableResults: vi.fn(),
  useReleaseResult: vi.fn(),
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
  const mockMutate = vi.fn();

  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(useReleasableResults).mockReturnValue({
      data: [mockResult],
      isLoading: false,
      error: null,
      refetch: mockRefetch,
    } as unknown as ReturnType<typeof useReleasableResults>);

    vi.mocked(useReleaseResult).mockReturnValue({
      mutate: mockMutate,
      isPending: false,
      error: null,
      variables: null,
    } as unknown as ReturnType<typeof useReleaseResult>);
  });


  it('renders releasable result work queue items', () => {
    render(<MemoryRouter><ResultReleasePage /></MemoryRouter>);

    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    expect(screen.getByText('MRN: MRN-456')).toBeInTheDocument();
    expect(screen.getByText('ORD-2026-001')).toBeInTheDocument();
    expect(screen.getByText('Complete Blood Count, Lipid Panel')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Release$/i })).toBeInTheDocument();
  });

  it('triggers release mutate call on action click', async () => {
    render(<MemoryRouter><ResultReleasePage /></MemoryRouter>);

    const releaseButton = screen.getByRole('button', { name: /Release$/i });
    fireEvent.click(releaseButton);

    expect(mockMutate).toHaveBeenCalledWith('result-123', expect.any(Object));
  });
});
