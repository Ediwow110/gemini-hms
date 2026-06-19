import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { EMRWorkspace } from '../EMRWorkspace';
import { apiClient } from '../../../lib/api';
import { AuthContext } from '../../../hooks/use-user';

vi.mock('../../../lib/api', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

const mockUser = {
  id: 'U123',
  email: 'doctor@hms.com',
  tenantId: 'T123',
  branchId: 'B123',
  roles: ['Doctor'],
  permissions: ['encounter.update', 'encounter.create'],
};

const MOCK_ENCOUNTER_ID = 'enc-1';

type MockQueueEntry = {
  id: string;
  queueNumber: string;
  status: string;
  patientId: string;
  encounterId: string | null;
  serviceType: string;
  patient: {
    id: string;
    patientNumber: string;
    firstName: string;
    lastName: string;
    dob: string;
  };
};

const MOCK_QUEUE_ENTRY: MockQueueEntry = {
  id: 'E123',
  queueNumber: 'C-01',
  status: 'WAITING',
  patientId: 'P123',
  encounterId: MOCK_ENCOUNTER_ID,
  serviceType: 'DOCTOR',
  patient: {
    id: 'P123',
    patientNumber: 'P001',
    firstName: 'John',
    lastName: 'Doe',
    dob: '1990-01-01',
  },
};

const setupWorklistGetMock = (entries: MockQueueEntry[] = [MOCK_QUEUE_ENTRY]) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (apiClient.get as any).mockImplementation(async (url: string) => {
    if (url === '/v1/queue/worklist') {
      return { data: entries };
    }
    throw new Error('Unknown endpoint');
  });
};

const renderWithAuth = (ui: React.ReactElement) => {
  return render(
    <AuthContext.Provider value={{ user: mockUser, isLoading: false, logout: vi.fn(), refetchUser: vi.fn() }}>
      <BrowserRouter>
        {ui}
      </BrowserRouter>
    </AuthContext.Provider>
  );
};

const selectJohnDoe = async () => {
  const patientBtn = await screen.findByText(/John Doe/i);
  fireEvent.click(patientBtn);
  await waitFor(() => {
    expect(screen.getByText(/Save Vitals Metrics/i)).not.toBeDisabled();
  });
};

const notePostCalls = () =>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (apiClient.post as any).mock.calls.filter(
    (call: [string, unknown]) =>
      typeof call[0] === 'string' && call[0].includes('/notes'),
  );

const openSoapAndTypeComplaint = (text: string) => {
  fireEvent.click(screen.getByText(/SOAP Notes/i));
  fireEvent.change(screen.getByPlaceholderText(/Subjective complaints/i), {
    target: { value: text },
  });
};

describe('EMRWorkspace Honesty Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupWorklistGetMock();
  });

  it('fetches worklist with serviceType DOCTOR', async () => {
    renderWithAuth(<EMRWorkspace />);

    await waitFor(() => {
      expect(apiClient.get).toHaveBeenCalledWith('/v1/queue/worklist', {
        params: { serviceType: 'DOCTOR' },
      });
    });
  });

  it('creates encounter via POST when queue entry has no encounterId', async () => {
    const entryWithoutEncounter: MockQueueEntry = { ...MOCK_QUEUE_ENTRY, encounterId: null };
    setupWorklistGetMock([entryWithoutEncounter]);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (apiClient.post as any).mockResolvedValue({ data: { id: 'enc-new' } });

    renderWithAuth(<EMRWorkspace />);
    await selectJohnDoe();

    await waitFor(() => {
      expect(apiClient.post).toHaveBeenCalledWith('/v1/emr/encounters', {
        patientId: 'P123',
        branchId: 'B123',
        reason: 'Clinical queue intake',
      });
    });
  });

  it('wires vitals capture and shows success on 200', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (apiClient.post as any).mockResolvedValue({ status: 200 });

    renderWithAuth(<EMRWorkspace />);
    await selectJohnDoe();

    fireEvent.change(screen.getByLabelText(/Temperature/i), { target: { value: '37.2' } });
    fireEvent.click(screen.getByText(/Save Vitals Metrics/i));

    await waitFor(() => {
      expect(apiClient.post).toHaveBeenCalledWith(
        `/v1/emr/encounters/${MOCK_ENCOUNTER_ID}/vitals`,
        expect.any(Object),
      );
      expect(screen.getByRole('status')).toHaveTextContent(/Vitals saved to the medical record/i);
    });
  });

  it('vitals POST uses the real /v1/emr/encounters/:id/vitals path (not /v1/clinical/encounters/...)', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (apiClient.post as any).mockResolvedValue({ status: 200 });

    renderWithAuth(<EMRWorkspace />);
    await selectJohnDoe();
    fireEvent.click(screen.getByText(/Save Vitals Metrics/i));

    await waitFor(() => {
      expect(apiClient.post).toHaveBeenCalled();
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const calledUrl = (apiClient.post as any).mock.calls[0][0];
    expect(calledUrl).toBe(`/v1/emr/encounters/${MOCK_ENCOUNTER_ID}/vitals`);
    expect(calledUrl).not.toMatch(/\/v1\/clinical\/encounters\//);
    expect(calledUrl).not.toContain('E123');
  });

  it('vitals POST payload does NOT contain client-trusted tenantId (post-fix)', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (apiClient.post as any).mockResolvedValue({ status: 200 });

    renderWithAuth(<EMRWorkspace />);
    await selectJohnDoe();

    fireEvent.change(screen.getByLabelText(/Temperature/i), { target: { value: '37.2' } });
    fireEvent.click(screen.getByText(/Save Vitals Metrics/i));

    await waitFor(() => {
      expect(apiClient.post).toHaveBeenCalled();
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const calledBody = (apiClient.post as any).mock.calls[0][1];
    expect(calledBody).toBeDefined();
    expect(calledBody).not.toHaveProperty('tenantId');
    expect(calledBody).not.toHaveProperty('branchId');
    expect(calledBody).not.toHaveProperty('userId');
  });

  it('vitals POST payload does NOT contain client-trusted branchId (post-fix)', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (apiClient.post as any).mockResolvedValue({ status: 200 });

    renderWithAuth(<EMRWorkspace />);
    await selectJohnDoe();

    fireEvent.change(screen.getByLabelText(/Heart Rate/i), { target: { value: '80' } });
    fireEvent.change(screen.getByLabelText(/Systolic BP/i), { target: { value: '120' } });
    fireEvent.click(screen.getByText(/Save Vitals Metrics/i));

    await waitFor(() => {
      expect(apiClient.post).toHaveBeenCalled();
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const calledBody = (apiClient.post as any).mock.calls[0][1];
    expect(calledBody).not.toHaveProperty('branchId');
    expect(calledBody).not.toHaveProperty('tenantId');
  });

  it('shows error message on vitals API failure', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (apiClient.post as any).mockRejectedValue({
      response: { data: { message: 'Database timeout' } },
    });

    renderWithAuth(<EMRWorkspace />);
    await selectJohnDoe();
    fireEvent.click(screen.getByText(/Save Vitals Metrics/i));

    await waitFor(() => {
      expect(screen.getByText(/Database timeout/i)).toBeInTheDocument();
    });
  });

  it('wires encounter finalization and locks UI on success', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (apiClient.patch as any).mockResolvedValue({ status: 200 });

    renderWithAuth(<EMRWorkspace />);
    await selectJohnDoe();

    fireEvent.click(screen.getByText(/Finalize & Close/i));
    fireEvent.click(screen.getByText(/Yes, Sign & Lock/i));

    await waitFor(() => {
      expect(apiClient.patch).toHaveBeenCalledWith(
        `/v1/clinical/encounters/${MOCK_ENCOUNTER_ID}/close`,
      );
      expect(screen.getByText(/Locked/i)).toBeInTheDocument();
    });
  });

  it('manual Save Clinical Notes posts each dirty section once', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (apiClient.post as any).mockResolvedValue({ status: 201 });

    renderWithAuth(<EMRWorkspace />);
    await selectJohnDoe();
    openSoapAndTypeComplaint('Chest pain x 2 days');

    fireEvent.click(screen.getByText(/Save Clinical Notes/i));

    await waitFor(() => {
      expect(notePostCalls()).toHaveLength(1);
      expect(apiClient.post).toHaveBeenCalledWith(
        `/v1/emr/encounters/${MOCK_ENCOUNTER_ID}/notes`,
        { noteType: 'CHIEF_COMPLAINT', content: 'Chest pain x 2 days' },
      );
    });
  });

  it('manual save then finalize does not duplicate already-saved SOAP notes', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (apiClient.post as any).mockResolvedValue({ status: 201 });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (apiClient.patch as any).mockResolvedValue({ status: 200 });

    renderWithAuth(<EMRWorkspace />);
    await selectJohnDoe();
    openSoapAndTypeComplaint('Chest pain x 2 days');

    fireEvent.click(screen.getByText(/Save Clinical Notes/i));
    await waitFor(() => {
      expect(notePostCalls()).toHaveLength(1);
    });

    fireEvent.click(screen.getByText(/Finalize & Close/i));
    fireEvent.click(screen.getByText(/Yes, Sign & Lock/i));

    await waitFor(() => {
      expect(notePostCalls()).toHaveLength(1);
      expect(apiClient.patch).toHaveBeenCalledWith(
        `/v1/clinical/encounters/${MOCK_ENCOUNTER_ID}/close`,
      );
      expect(screen.getByText(/Locked/i)).toBeInTheDocument();
    });
  });

  it('finalize with empty SOAP notes closes without note POSTs', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (apiClient.patch as any).mockResolvedValue({ status: 200 });

    renderWithAuth(<EMRWorkspace />);
    await selectJohnDoe();

    fireEvent.click(screen.getByText(/Finalize & Close/i));
    fireEvent.click(screen.getByText(/Yes, Sign & Lock/i));

    await waitFor(() => {
      expect(notePostCalls()).toHaveLength(0);
      expect(apiClient.patch).toHaveBeenCalledWith(
        `/v1/clinical/encounters/${MOCK_ENCOUNTER_ID}/close`,
      );
    });
  });

  it('chains unsaved SOAP notes to backend before finalize close', async () => {
    let closePatchInvoked = false;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (apiClient.post as any).mockImplementation(async (url: string) => {
      if (url.includes('/notes')) {
        expect(closePatchInvoked).toBe(false);
      }
      return { status: 201 };
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (apiClient.patch as any).mockImplementation(async (url: string) => {
      if (url.includes('/close')) {
        closePatchInvoked = true;
      }
      return { status: 200 };
    });

    renderWithAuth(<EMRWorkspace />);
    await selectJohnDoe();

    openSoapAndTypeComplaint('Chest pain x 2 days');

    fireEvent.click(screen.getByText(/Finalize & Close/i));
    fireEvent.click(screen.getByText(/Yes, Sign & Lock/i));

    await waitFor(() => {
      expect(apiClient.post).toHaveBeenCalledWith(
        `/v1/emr/encounters/${MOCK_ENCOUNTER_ID}/notes`,
        { noteType: 'CHIEF_COMPLAINT', content: 'Chest pain x 2 days' },
      );
      expect(apiClient.patch).toHaveBeenCalledWith(
        `/v1/clinical/encounters/${MOCK_ENCOUNTER_ID}/close`,
      );
      expect(closePatchInvoked).toBe(true);
    });
  });

  it('close PATCH sends no body payload (post-fix)', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (apiClient.patch as any).mockResolvedValue({ status: 200 });

    renderWithAuth(<EMRWorkspace />);
    await selectJohnDoe();

    fireEvent.click(screen.getByText(/Finalize & Close/i));
    fireEvent.click(screen.getByText(/Yes, Sign & Lock/i));

    await waitFor(() => {
      expect(apiClient.patch).toHaveBeenCalled();
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const patchCall = (apiClient.patch as any).mock.calls[0];
    expect(patchCall[0]).toBe(`/v1/clinical/encounters/${MOCK_ENCOUNTER_ID}/close`);
    expect(patchCall[1]).toBeUndefined();
    expect(patchCall[0]).not.toContain('E123');
  });

  it('does not lock UI on finalization failure', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (apiClient.patch as any).mockRejectedValue({
      response: { data: { message: 'Permission denied' } },
    });

    renderWithAuth(<EMRWorkspace />);
    await selectJohnDoe();

    fireEvent.click(screen.getByText(/Finalize & Close/i));
    fireEvent.click(screen.getByText(/Yes, Sign & Lock/i));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/Permission denied/i);
      expect(screen.queryByText(/Locked/i)).not.toBeInTheDocument();
    });
  });

  it('does NOT render the dead "Cache Notes" button (misleading save flow)', async () => {
    renderWithAuth(<EMRWorkspace />);
    await selectJohnDoe();

    fireEvent.click(screen.getByText(/SOAP Notes/i));

    expect(screen.queryByRole('button', { name: /cache notes/i })).not.toBeInTheDocument();
  });

  it('does NOT show hardcoded fallback patients when queue API fails', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (apiClient.get as any).mockImplementation(async (url: string) => {
      if (url === '/v1/queue/worklist') {
        throw new Error('Network error');
      }
      throw new Error('Unknown endpoint');
    });

    renderWithAuth(<EMRWorkspace />);

    await waitFor(() => {
      expect(screen.getByTestId('queue-error')).toBeInTheDocument();
    });

    expect(screen.queryByText(/Patient 001/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Patient 002/i)).not.toBeInTheDocument();
    expect(screen.getByText(/No Patient Selected/i)).toBeInTheDocument();
  });

  it('clears queue error when queue refetches successfully', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (apiClient.get as any)
      .mockImplementationOnce(async (url: string) => {
        if (url === '/v1/queue/worklist') {
          throw new Error('Network error');
        }
        throw new Error('Unknown endpoint');
      })
      .mockImplementation(async (url: string) => {
        if (url === '/v1/queue/worklist') {
          return {
            data: [{
              id: 'E456',
              queueNumber: 'C-03',
              status: 'WAITING',
              patientId: 'P456',
              encounterId: 'enc-2',
              serviceType: 'DOCTOR',
              patient: {
                id: 'P456',
                patientNumber: 'P002',
                firstName: 'Jane',
                lastName: 'Smith',
                dob: '1985-05-15',
              },
            }],
          };
        }
        throw new Error('Unknown endpoint');
      });

    renderWithAuth(<EMRWorkspace />);

    await waitFor(() => {
      expect(screen.getByTestId('queue-error')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText(/Retry/i));

    await waitFor(() => {
      expect(screen.queryByTestId('queue-error')).not.toBeInTheDocument();
    });

    expect(screen.getByText(/Jane Smith/i)).toBeInTheDocument();
  });
});

const openIcd10Tab = () => {
  fireEvent.click(screen.getByText(/ICD-10 Diagnostics/i));
};

const addDiagnosisFixture = async (diagId = 'diag-1') => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (apiClient.post as any).mockResolvedValue({
    data: {
      id: diagId,
      icd10Code: 'I10',
      description: 'Essential hypertension',
      isPrimary: false,
    },
  });

  openIcd10Tab();
  fireEvent.change(screen.getByPlaceholderText(/e\.g\. I10/i), {
    target: { value: 'I10' },
  });
  fireEvent.change(screen.getByPlaceholderText(/e\.g\. Essential hypertension/i), {
    target: { value: 'Essential hypertension' },
  });
  fireEvent.click(screen.getByText(/^Add$/i));

  await waitFor(() => {
    expect(screen.getByText('I10')).toBeInTheDocument();
  });
};

describe('EMRWorkspace diagnosis parity', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupWorklistGetMock();
  });

  it('removes a saved diagnosis via DELETE on the EMR encounters route', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (apiClient.delete as any).mockResolvedValue({ status: 200 });

    renderWithAuth(<EMRWorkspace />);
    await selectJohnDoe();
    await addDiagnosisFixture('diag-1');

    const row = screen.getByText('Essential hypertension').closest('tr');
    expect(row).not.toBeNull();
    fireEvent.click(row!.querySelector('button')!);

    await waitFor(() => {
      expect(apiClient.delete).toHaveBeenCalledWith(
        `/v1/emr/encounters/${MOCK_ENCOUNTER_ID}/diagnoses/diag-1`,
      );
      expect(screen.queryByText('Essential hypertension')).not.toBeInTheDocument();
    });
  });

  it('shows error when diagnosis DELETE fails and keeps the row visible', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (apiClient.delete as any).mockRejectedValue({
      response: { data: { message: 'Diagnosis not found' } },
    });

    renderWithAuth(<EMRWorkspace />);
    await selectJohnDoe();
    await addDiagnosisFixture('diag-2');

    const row = screen.getByText('Essential hypertension').closest('tr');
    fireEvent.click(row!.querySelector('button')!);

    await waitFor(() => {
      expect(screen.getByText(/Diagnosis not found/i)).toBeInTheDocument();
      expect(screen.getByText('Essential hypertension')).toBeInTheDocument();
    });
  });
});