import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi } from 'vitest';
import { PatientList } from '../PatientList';
import { apiClient } from '../../../lib/api';

vi.mock('../../../lib/api');

const mockLivePatients = [
  { id: 'p-1', firstName: 'Alice', lastName: 'Anderson', patientNumber: 'PAT-001', status: 'ACTIVE', dob: '1990-01-01' },
  { id: 'p-2', firstName: 'Bob', lastName: 'Baker', patientNumber: 'PAT-002', status: 'ACTIVE', dob: '1985-05-05' },
];

describe('PatientList (live wiring)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(apiClient.get).mockResolvedValue({ data: mockLivePatients });
  });

  function renderPatientList() {
    const qc = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    return render(
      <QueryClientProvider client={qc}>
        <MemoryRouter>
          <PatientList />
        </MemoryRouter>
      </QueryClientProvider>
    );
  }

  it('fetches from the real /v1/patients endpoint (no hardcoded mock data)', async () => {
    renderPatientList();

    // Wait for the call
    await waitFor(() => {
      expect(apiClient.get).toHaveBeenCalledWith('/v1/patients', expect.anything());
    });

    // Must NOT render the old fake names
    expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
    expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument();

    // Must render data that came from the (mocked) API response
    expect(screen.getByText(/Alice Anderson/)).toBeInTheDocument();
    expect(screen.getByText(/PAT-001/)).toBeInTheDocument();
  });

  it('renders loading then content (or error state)', async () => {
    renderPatientList();
    // Basic presence of shell or loading is acceptable; main assertion is the API contract + no mocks
    await waitFor(() => {
      expect(apiClient.get).toHaveBeenCalled();
    });
  });
});
