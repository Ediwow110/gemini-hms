/* eslint-disable @typescript-eslint/no-explicit-any */
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { EmployeesPage } from '../EmployeesPage';
import { apiClient } from '../../../lib/api';
import { AuthContext } from '../../../hooks/use-user';

vi.mock('../../../lib/api', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
  },
}));

const renderPage = () =>
  render(
    <BrowserRouter>
      <EmployeesPage />
    </BrowserRouter>,
  );

const renderWithAuth = (
  user: {
    id: string;
    email: string;
    tenantId: string;
    branchId?: string;
    roles: string[];
    permissions: string[];
  } | null,
) =>
  render(
    <AuthContext.Provider
      value={{ user, isLoading: false, logout: vi.fn(), refetchUser: vi.fn() }}
    >
      <BrowserRouter>
        <EmployeesPage />
      </BrowserRouter>
    </AuthContext.Provider>,
  );

const superAdminUser = {
  id: 'U-admin',
  email: 'admin@hms.com',
  tenantId: 'T-001',
  roles: ['Super Admin'],
  permissions: ['hr.employee.manage'],
};

const branchAdminUser = {
  id: 'U-branch',
  email: 'branch@hms.com',
  tenantId: 'T-001',
  branchId: 'BR-001',
  roles: ['Branch Admin'],
  permissions: ['hr.employee.manage'],
};

const employeeFixture = [
  {
    id: 'emp-1',
    userId: null,
    branchId: 'branch-1',
    employeeNumber: 'EMP-001',
    department: 'Clinical Medicine',
    position: 'Head Nurse',
    hireDate: '2024-01-15T00:00:00.000Z',
    status: 'ACTIVE',
    createdAt: '2024-01-15T00:00:00.000Z',
    updatedAt: '2024-01-15T00:00:00.000Z',
    firstName: 'Alice',
    lastName: 'Anderson',
    salary: '5000.00',
  },
];

const branchesFixture = {
  data: [
    { id: 'branch-1', name: 'St. Jude Metro', code: 'SJM', createdAt: '2024-01-01', updatedAt: '2024-01-01' },
    { id: 'branch-2', name: 'St. Jude North', code: 'SJN', createdAt: '2024-01-01', updatedAt: '2024-01-01' },
  ],
  total: 2,
  page: 1,
  limit: 200,
};

const setupApiGetMocks = (opts?: {
  employees?: () => unknown;
  employeesError?: unknown;
}) => {
  (apiClient.get as any).mockImplementation((url: string) => {
    if (typeof url !== 'string') {
      return Promise.reject(new Error(`Invalid URL type: ${typeof url}`));
    }
    if (url.startsWith('/v1/hr/employees')) {
      if (opts?.employeesError !== undefined) {
        return Promise.reject(opts.employeesError);
      }
      return Promise.resolve({
        data: opts?.employees ? opts.employees() : employeeFixture,
      });
    }
    if (url.startsWith('/v1/admin/branches')) {
      return Promise.resolve({ data: branchesFixture });
    }
    return Promise.reject(new Error(`Unmocked GET ${url}`));
  });
};

describe('EmployeesPage — live backend wiring (post-fix)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  it('fetches /v1/hr/employees on mount', async () => {
    setupApiGetMocks();
    renderPage();
    await waitFor(() => {
      expect(apiClient.get).toHaveBeenCalledWith('/v1/hr/employees');
    });
    expect(apiClient.get).toHaveBeenCalledWith('/v1/admin/branches', expect.any(Object));
  });

  it('renders real employee data from API response', async () => {
    setupApiGetMocks();
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('Alice Anderson')).toBeInTheDocument();
    });
    expect(screen.getByText('EMP-001')).toBeInTheDocument();
    expect(screen.getByText('Head Nurse')).toBeInTheDocument();
    expect(screen.getByText('Clinical Medicine')).toBeInTheDocument();
  });

  it('does NOT render any hardcoded mock employee fallback', async () => {
    setupApiGetMocks({ employees: () => [] });
    renderPage();
    await waitFor(() => {
      expect(apiClient.get).toHaveBeenCalledWith('/v1/hr/employees');
    });
    expect(screen.queryByText(/employee001@sandbox.local/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/employee002@sandbox.local/i)).not.toBeInTheDocument();
    expect(screen.getByText(/No employees match the current filters/i)).toBeInTheDocument();
  });

  it('shows inline fetch error (no alert) when API fails', async () => {
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
    setupApiGetMocks({ employeesError: new Error('Network error') });
    renderPage();
    await waitFor(() => {
      expect(screen.getByText(/Network error/i)).toBeInTheDocument();
    });
    expect(alertSpy).not.toHaveBeenCalled();
    alertSpy.mockRestore();
  });

  it('opens create modal and validates required fields', async () => {
    setupApiGetMocks();
    renderPage();

    const registerBtn = await screen.findByTestId('employees-register');
    fireEvent.click(registerBtn);

    const submitBtn = await screen.findByTestId('employees-create-submit');
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(
        screen.getByText(/Branch, department, position, and hire date are required/i),
      ).toBeInTheDocument();
    });
    expect(apiClient.post).not.toHaveBeenCalled();
  });

  it('submits POST /v1/hr/employees with correct DTO (no client-trusted tenantId)', async () => {
    setupApiGetMocks({ employees: () => [] });
    (apiClient.post as any).mockResolvedValue({
      data: { ...employeeFixture[0], id: 'new-emp', employeeNumber: 'EMP-002' },
    });

    renderPage();
    fireEvent.click(await screen.findByTestId('employees-register'));

    fireEvent.change(await screen.findByTestId('employees-create-firstName'), {
      target: { value: 'Bob' },
    });
    fireEvent.change(screen.getByTestId('employees-create-lastName'), {
      target: { value: 'Brown' },
    });
    fireEvent.change(screen.getByTestId('employees-create-department'), {
      target: { value: 'Radiology' },
    });
    fireEvent.change(screen.getByTestId('employees-create-position'), {
      target: { value: 'Tech' },
    });
    fireEvent.change(screen.getByTestId('employees-create-hireDate'), {
      target: { value: '2026-06-01' },
    });
    fireEvent.change(screen.getByTestId('employees-create-salary'), {
      target: { value: '7500' },
    });
    fireEvent.change(screen.getByTestId('employees-create-branch'), {
      target: { value: 'branch-1' },
    });

    fireEvent.click(screen.getByTestId('employees-create-submit'));

    await waitFor(() => {
      expect(apiClient.post).toHaveBeenCalledWith(
        '/v1/hr/employees',
        expect.objectContaining({
          branchId: 'branch-1',
          department: 'Radiology',
          position: 'Tech',
          hireDate: expect.stringMatching(/^2026-06-01T/),
          firstName: 'Bob',
          lastName: 'Brown',
          salary: 7500,
        }),
      );
    });

    const callArgs = (apiClient.post as any).mock.calls[0];
    const body = callArgs[1];
    expect(body).not.toHaveProperty('tenantId');
    expect(body).not.toHaveProperty('userId');
  });

  it('submits with optional fields omitted when blank', async () => {
    setupApiGetMocks({ employees: () => [] });
    (apiClient.post as any).mockResolvedValue({ data: { id: 'new-emp' } });

    renderPage();
    fireEvent.click(await screen.findByTestId('employees-register'));

    fireEvent.change(screen.getByTestId('employees-create-department'), {
      target: { value: 'Admin' },
    });
    fireEvent.change(screen.getByTestId('employees-create-position'), {
      target: { value: 'Clerk' },
    });
    fireEvent.change(screen.getByTestId('employees-create-hireDate'), {
      target: { value: '2026-06-01' },
    });
    fireEvent.change(screen.getByTestId('employees-create-branch'), {
      target: { value: 'branch-1' },
    });

    fireEvent.click(screen.getByTestId('employees-create-submit'));

    await waitFor(() => {
      expect(apiClient.post).toHaveBeenCalled();
    });

    const body = (apiClient.post as any).mock.calls[0][1];
    expect(body).toHaveProperty('branchId', 'branch-1');
    expect(body).toHaveProperty('department', 'Admin');
    expect(body).toHaveProperty('position', 'Clerk');
    expect(body).not.toHaveProperty('firstName');
    expect(body).not.toHaveProperty('lastName');
    expect(body).not.toHaveProperty('salary');
  });

  it('refreshes the employee list after successful create', async () => {
    setupApiGetMocks({ employees: () => [] });
    (apiClient.post as any).mockResolvedValue({
      data: { ...employeeFixture[0], id: 'new-emp', employeeNumber: 'EMP-NEW' },
    });

    renderPage();
    fireEvent.click(await screen.findByTestId('employees-register'));

    fireEvent.change(screen.getByTestId('employees-create-department'), {
      target: { value: 'Nursing' },
    });
    fireEvent.change(screen.getByTestId('employees-create-position'), {
      target: { value: 'Nurse' },
    });
    fireEvent.change(screen.getByTestId('employees-create-hireDate'), {
      target: { value: '2026-06-01' },
    });
    fireEvent.change(screen.getByTestId('employees-create-branch'), {
      target: { value: 'branch-1' },
    });

    fireEvent.click(screen.getByTestId('employees-create-submit'));

    await waitFor(() => {
      expect(screen.getByTestId('employees-create-success')).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(apiClient.get).toHaveBeenCalledTimes(3);
    });
  });

  it('surfaces backend rejection inline (no window.alert)', async () => {
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
    setupApiGetMocks({ employees: () => [] });
    (apiClient.post as any).mockRejectedValue({
      response: { data: { message: 'forbidden: hr.employee.manage required' } },
    });

    renderPage();
    fireEvent.click(await screen.findByTestId('employees-register'));
    fireEvent.change(screen.getByTestId('employees-create-department'), {
      target: { value: 'X' },
    });
    fireEvent.change(screen.getByTestId('employees-create-position'), {
      target: { value: 'Y' },
    });
    fireEvent.change(screen.getByTestId('employees-create-hireDate'), {
      target: { value: '2026-06-01' },
    });
    fireEvent.change(screen.getByTestId('employees-create-branch'), {
      target: { value: 'branch-1' },
    });
    fireEvent.click(screen.getByTestId('employees-create-submit'));

    const errNode = await screen.findByTestId('employees-create-error');
    expect(errNode).toHaveTextContent(/forbidden/i);
    expect(alertSpy).not.toHaveBeenCalled();
    alertSpy.mockRestore();
  });
});

describe('EmployeesPage — employee status-toggle (live wire)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the status select for Super Admin and lists all 5 backend values', async () => {
    setupApiGetMocks();

    renderWithAuth(superAdminUser);

    const select = await screen.findByTestId('employees-status-select-emp-1');
    expect(select).toBeInTheDocument();
    const options = Array.from(select.querySelectorAll('option')).map((o) => o.textContent);
    expect(options).toEqual(['ACTIVE', 'ON_LEAVE', 'SUSPENDED', 'RESIGNED', 'TERMINATED']);
    expect((select as HTMLSelectElement).value).toBe('ACTIVE');
  });

  it('does NOT render the status select for Branch Admin (backend would 403)', async () => {
    setupApiGetMocks();

    renderWithAuth(branchAdminUser);

    await screen.findByText('Alice Anderson');
    expect(screen.queryByTestId('employees-status-select-emp-1')).not.toBeInTheDocument();
  });

  it('does NOT render the status select when user is not signed in', async () => {
    setupApiGetMocks();

    renderWithAuth(null);

    await screen.findByText('Alice Anderson');
    expect(screen.queryByTestId('employees-status-select-emp-1')).not.toBeInTheDocument();
  });

  it('submits PATCH /v1/hr/employees/:id/status with correct DTO (no client-trusted tenantId)', async () => {
    setupApiGetMocks();
    (apiClient.patch as any).mockResolvedValue({
      data: { ...employeeFixture[0], status: 'SUSPENDED' },
    });

    renderWithAuth(superAdminUser);

    const select = await screen.findByTestId('employees-status-select-emp-1');
    fireEvent.change(select, { target: { value: 'SUSPENDED' } });

    await waitFor(() => {
      expect(apiClient.patch).toHaveBeenCalledWith(
        '/v1/hr/employees/emp-1/status',
        expect.objectContaining({ status: 'SUSPENDED' }),
      );
    });

    const callArgs = (apiClient.patch as any).mock.calls[0];
    expect(callArgs[0]).toBe('/v1/hr/employees/emp-1/status');
    expect(callArgs[1]).toEqual({ status: 'SUSPENDED' });
    expect(callArgs[1]).not.toHaveProperty('tenantId');
    expect(callArgs[1]).not.toHaveProperty('userId');
    expect(callArgs[1]).not.toHaveProperty('id');
  });

  it('refreshes the employee list after successful status update', async () => {
    setupApiGetMocks();
    (apiClient.patch as any).mockResolvedValue({
      data: { ...employeeFixture[0], status: 'SUSPENDED' },
    });

    renderWithAuth(superAdminUser);

    const select = await screen.findByTestId('employees-status-select-emp-1');
    fireEvent.change(select, { target: { value: 'SUSPENDED' } });

    await waitFor(() => {
      expect(apiClient.patch).toHaveBeenCalled();
    });
    await waitFor(() => {
      expect(apiClient.get).toHaveBeenCalledTimes(3);
    });
  });

  it('disables the status select while the PATCH is in flight (no double-submit)', async () => {
    setupApiGetMocks();
    (apiClient.patch as any).mockImplementation(
      () => new Promise(() => {}),
    );

    renderWithAuth(superAdminUser);

    const select = await screen.findByTestId('employees-status-select-emp-1') as HTMLSelectElement;
    expect(select.disabled).toBe(false);

    fireEvent.change(select, { target: { value: 'SUSPENDED' } });

    await waitFor(() => {
      expect(apiClient.patch).toHaveBeenCalledTimes(1);
    });

    await waitFor(() => {
      expect(
        (screen.getByTestId('employees-status-select-emp-1') as HTMLSelectElement).disabled,
      ).toBe(true);
    });
  });

  it('surfaces backend rejection inline (no window.alert) and keeps the row editable', async () => {
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
    const promptSpy = vi.spyOn(window, 'prompt').mockReturnValue('DEACTIVATE');
    setupApiGetMocks();
    (apiClient.patch as any).mockRejectedValue({
      response: { data: { message: 'forbidden: insufficient role' } },
    });

    renderWithAuth(superAdminUser);

    const select = await screen.findByTestId('employees-status-select-emp-1');
    fireEvent.change(select, { target: { value: 'TERMINATED' } });

    const errNode = await screen.findByTestId('employees-status-error');
    expect(errNode).toHaveTextContent(/forbidden/i);
    expect(alertSpy).not.toHaveBeenCalled();
    expect(promptSpy).toHaveBeenCalledTimes(1);
    expect((screen.getByTestId('employees-status-select-emp-1') as HTMLSelectElement).disabled).toBe(false);
    alertSpy.mockRestore();
    promptSpy.mockRestore();
  });

  describe('EmployeesPage — destructive status confirmation (RESIGNED / TERMINATED)', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('asks for window.prompt with DEACTIVATE before PATCH when status is RESIGNED', async () => {
      const promptSpy = vi.spyOn(window, 'prompt').mockReturnValue('DEACTIVATE');
      setupApiGetMocks();
      (apiClient.patch as any).mockResolvedValue({ data: employeeFixture[0] });

      renderWithAuth(superAdminUser);

      const select = await screen.findByTestId('employees-status-select-emp-1');
      fireEvent.change(select, { target: { value: 'RESIGNED' } });

      await waitFor(() => {
        expect(apiClient.patch).toHaveBeenCalledTimes(1);
      });
      expect(promptSpy).toHaveBeenCalledTimes(1);
      expect(promptSpy.mock.calls[0][0]).toMatch(/RESIGNED/);
      expect(promptSpy.mock.calls[0][0]).toMatch(/Alice Anderson/);
      expect(promptSpy.mock.calls[0][0]).toMatch(/deactivate/i);
      expect(promptSpy.mock.calls[0][0]).toMatch(/Type DEACTIVATE to confirm/i);
      promptSpy.mockRestore();
    });

    it('asks for window.prompt with DEACTIVATE before PATCH when status is TERMINATED', async () => {
      const promptSpy = vi.spyOn(window, 'prompt').mockReturnValue('DEACTIVATE');
      setupApiGetMocks();
      (apiClient.patch as any).mockResolvedValue({ data: employeeFixture[0] });

      renderWithAuth(superAdminUser);

      const select = await screen.findByTestId('employees-status-select-emp-1');
      fireEvent.change(select, { target: { value: 'TERMINATED' } });

      await waitFor(() => {
        expect(apiClient.patch).toHaveBeenCalledTimes(1);
      });
      expect(promptSpy).toHaveBeenCalledTimes(1);
      expect(promptSpy.mock.calls[0][0]).toMatch(/TERMINATED/);
      expect(promptSpy.mock.calls[0][0]).toMatch(/Type DEACTIVATE to confirm/i);
      promptSpy.mockRestore();
    });

    it('does NOT call PATCH when user cancels the destructive prompt', async () => {
      const promptSpy = vi.spyOn(window, 'prompt').mockReturnValue(null);
      setupApiGetMocks();
      (apiClient.patch as any).mockResolvedValue({ data: employeeFixture[0] });

      renderWithAuth(superAdminUser);

      const select = await screen.findByTestId('employees-status-select-emp-1');
      fireEvent.change(select, { target: { value: 'RESIGNED' } });

      await new Promise((r) => setTimeout(r, 50));
      expect(promptSpy).toHaveBeenCalledTimes(1);
      expect(apiClient.patch).not.toHaveBeenCalled();
      expect((screen.getByTestId('employees-status-select-emp-1') as HTMLSelectElement).disabled).toBe(false);
      promptSpy.mockRestore();
    });

    it('does NOT call PATCH when user enters wrong confirmation text for TERMINATED', async () => {
      const promptSpy = vi.spyOn(window, 'prompt').mockReturnValue('deactivate');
      setupApiGetMocks();
      (apiClient.patch as any).mockResolvedValue({ data: employeeFixture[0] });

      renderWithAuth(superAdminUser);

      const select = await screen.findByTestId('employees-status-select-emp-1');
      fireEvent.change(select, { target: { value: 'TERMINATED' } });

      await new Promise((r) => setTimeout(r, 50));
      expect(promptSpy).toHaveBeenCalledTimes(1);
      expect(apiClient.patch).not.toHaveBeenCalled();
      promptSpy.mockRestore();
    });

    it('proceeds with PATCH when user types DEACTIVATE for RESIGNED', async () => {
      const promptSpy = vi.spyOn(window, 'prompt').mockReturnValue('DEACTIVATE');
      setupApiGetMocks();
      (apiClient.patch as any).mockResolvedValue({ data: employeeFixture[0] });

      renderWithAuth(superAdminUser);

      const select = await screen.findByTestId('employees-status-select-emp-1');
      fireEvent.change(select, { target: { value: 'RESIGNED' } });

      await waitFor(() => {
        expect(apiClient.patch).toHaveBeenCalledTimes(1);
      });
      expect(apiClient.patch).toHaveBeenCalledWith(
        '/v1/hr/employees/emp-1/status',
        expect.objectContaining({ status: 'RESIGNED' }),
      );
      await waitFor(() => {
        expect(apiClient.get).toHaveBeenCalledTimes(3);
      });
      promptSpy.mockRestore();
    });

    it.each(['ACTIVE', 'ON_LEAVE', 'SUSPENDED'])(
      'does NOT ask for confirmation when status is %s (non-destructive)',
      async (nonDestructiveStatus) => {
        const promptSpy = vi.spyOn(window, 'prompt');
        setupApiGetMocks();
        (apiClient.patch as any).mockResolvedValue({ data: employeeFixture[0] });

        renderWithAuth(superAdminUser);

        const select = await screen.findByTestId('employees-status-select-emp-1');
        fireEvent.change(select, { target: { value: nonDestructiveStatus } });

        await waitFor(() => {
          expect(apiClient.patch).toHaveBeenCalledTimes(1);
        });
        expect(promptSpy).not.toHaveBeenCalled();
        expect(apiClient.patch).toHaveBeenCalledWith(
          '/v1/hr/employees/emp-1/status',
          expect.objectContaining({ status: nonDestructiveStatus }),
        );
        promptSpy.mockRestore();
      },
    );
  });
});
