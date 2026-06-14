import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RetentionManagementPage } from '../RetentionManagementPage';
import { useRetentionStatus } from '../../../hooks/use-compliance';
import { BrowserRouter } from 'react-router-dom';

vi.mock('../../../hooks/use-compliance', () => ({
  useRetentionStatus: vi.fn(),
}));

if (typeof window !== 'undefined') {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window as any).ResizeObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  }));
}

const renderWithRouter = (ui: React.ReactElement) => {
  return render(ui, { wrapper: BrowserRouter });
};

describe('RetentionManagementPage Redesign Tests', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('renders standardized layout with real data stats row', () => {
    vi.mocked(useRetentionStatus).mockReturnValue({
      status: {
        patients: { active: 100, archived: 20 },
        encounters: { active: 200, archived: 50 },
      },
      loading: false,
      error: null,
      refetch: vi.fn(),
    });

    renderWithRouter(<RetentionManagementPage />);
    expect(screen.getByText('Data Retention & Archive Management')).toBeInTheDocument();
    
    // Total = 100+20+200+50 = 370
    expect(screen.getByText('370')).toBeInTheDocument();
    // Archived = 20+50 = 70
    expect(screen.getByText('70')).toBeInTheDocument();
  });

  it('shows loading placeholders in stats while fetching', () => {
    vi.mocked(useRetentionStatus).mockReturnValue({
      status: null,
      loading: true,
      error: null,
      refetch: vi.fn(),
    });

    renderWithRouter(<RetentionManagementPage />);
    const placeholders = screen.getAllByText('...');
    expect(placeholders.length).toBeGreaterThanOrEqual(2);
  });

  it('retains honest labeling for simulated policies', () => {
    vi.mocked(useRetentionStatus).mockReturnValue({
      status: { patients: { active: 0, archived: 0 } },
      loading: false,
      error: null,
      refetch: vi.fn(),
    });

    renderWithRouter(<RetentionManagementPage />);
    expect(screen.getByText(/Retention statistics are now derived from the live database/i)).toBeInTheDocument();
    expect(screen.getByText(/Sandbox Mode/i)).toBeInTheDocument();
  });
});
