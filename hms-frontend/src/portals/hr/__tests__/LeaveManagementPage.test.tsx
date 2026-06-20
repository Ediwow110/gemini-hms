/* eslint-disable @typescript-eslint/no-explicit-any */
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { LeaveManagementPage } from '../LeaveManagementPage';
import { apiClient } from '../../../lib/api';

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
      <LeaveManagementPage />
    </BrowserRouter>,
  );

const leaveFixture = [
  {
    id: 'lr-001',
    employeeId: 'emp-001',
    tenantId: 'tenant-1',
    type: 'ANNUAL',
    startDate: '2026-05-25',
    endDate: '2026-06-05',
    status: 'PENDING',
    reason: 'Family vacation',
    employee: {
      id: 'emp-001',
      employeeNumber: 'EMP-0001',
      firstName: 'Alice',
      lastName: 'Anders',
      branchId: 'branch-1',
    },
  },
  {
    id: 'lr-002',
    employeeId: 'emp-002',
    tenantId: 'tenant-1',
    type: 'SICK',
    startDate: '2026-05-18',
    endDate: '2026-05-20',
    status: 'APPROVED',
    reason: 'Flu',
    employee: {
      id: 'emp-002',
      employeeNumber: 'EMP-0002',
      firstName: 'Bob',
      lastName: 'Brown',
      branchId: 'branch-1',
    },
  },
];

const employeesFixture = [
  {
    id: 'emp-001',
    branchId: 'branch-1',
    employeeNumber: 'EMP-0001',
    department: 'Nursing',
    position: 'Nurse',
    hireDate: '2025-01-01',
    status: 'ACTIVE',
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
    firstName: 'Alice',
    lastName: 'Anders',
  },
  {
    id: 'emp-002',
    branchId: 'branch-1',
    employeeNumber: 'EMP-0002',
    department: 'Pharmacy',
    position: 'Pharmacist',
    hireDate: '2025-02-01',
    status: 'ACTIVE',
    createdAt: '2025-02-01T00:00:00.000Z',
    updatedAt: '2025-02-01T00:00:00.000Z',
    firstName: 'Bob',
    lastName: 'Brown',
  },
];

describe('LeaveManagementPage — live backend wiring', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches /v1/hr/leave-requests on mount', async () => {
    (apiClient.get as any).mockResolvedValueOnce({ data: leaveFixture });
    renderPage();
    await waitFor(() => {
      expect(apiClient.get).toHaveBeenCalledWith(
        '/v1/hr/leave-requests',
        expect.any(Object),
      );
    });
  });

  it('renders real leave data from the API response', async () => {
    (apiClient.get as any).mockResolvedValueOnce({ data: leaveFixture });
    renderPage();
    await waitFor(() => {
      expect(screen.getByTestId('leave-employee-lr-001')).toHaveTextContent(
        'Alice Anders',
      );
    });
    expect(screen.getByTestId('leave-employee-lr-001')).toHaveTextContent(
      'Alice Anders',
    );
  });

  it('does NOT render any hardcoded mock leave fallback', async () => {
    (apiClient.get as any).mockResolvedValueOnce({ data: [] });
    renderPage();
    await waitFor(() => {
      expect(apiClient.get).toHaveBeenCalledWith(
        '/v1/hr/leave-requests',
        expect.any(Object),
      );
    });
    expect(screen.queryByText('Employee 004')).not.toBeInTheDocument();
    expect(screen.queryByText('Employee 005')).not.toBeInTheDocument();
    expect(screen.getByTestId('leave-empty')).toBeInTheDocument();
  });

  it('shows inline fetch error (no alert) when API fails', async () => {
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
    (apiClient.get as any).mockRejectedValueOnce(new Error('Network error'));
    renderPage();
    await waitFor(() => {
      expect(screen.getByTestId('leave-fetch-error')).toBeInTheDocument();
    });
    expect(alertSpy).not.toHaveBeenCalled();
    alertSpy.mockRestore();
  });

  it('shows success message and no sandbox notice once wired live', async () => {
    (apiClient.get as any).mockResolvedValueOnce({ data: leaveFixture });
    renderPage();
    await waitFor(() => {
      expect(screen.getByTestId('leave-approve-lr-001')).toBeInTheDocument();
    });
    expect(
      screen.queryByText(/Leave mutations are simulated/i),
    ).not.toBeInTheDocument();
  });

  it('opens create modal, validates required fields, and submits the correct DTO', async () => {
    (apiClient.get as any)
      .mockResolvedValueOnce({ data: leaveFixture })
      .mockResolvedValueOnce({ data: employeesFixture });
    (apiClient.post as any).mockResolvedValueOnce({
      data: { id: 'lr-003', status: 'PENDING' },
    });

    renderPage();

    fireEvent.click(await screen.findByTestId('leave-create'));
    const employeeSelect = await screen.findByTestId('leave-create-employee');
    fireEvent.change(employeeSelect, { target: { value: 'emp-001' } });

    fireEvent.change(screen.getByTestId('leave-create-start'), {
      target: { value: '2026-07-01' },
    });
    fireEvent.change(screen.getByTestId('leave-create-end'), {
      target: { value: '2026-07-05' },
    });
    fireEvent.change(screen.getByTestId('leave-create-reason'), {
      target: { value: 'Travel' },
    });

    fireEvent.click(screen.getByTestId('leave-create-submit'));

    await waitFor(() => {
      expect(apiClient.post).toHaveBeenCalledWith(
        '/v1/hr/leave-requests',
        expect.objectContaining({
          employeeId: 'emp-001',
          type: 'ANNUAL',
          startDate: '2026-07-01',
          endDate: '2026-07-05',
          reason: 'Travel',
        }),
      );
    });
  });

  it('rejects submit when required fields are missing', async () => {
    (apiClient.get as any)
      .mockResolvedValueOnce({ data: leaveFixture })
      .mockResolvedValueOnce({ data: employeesFixture });
    renderPage();

    fireEvent.click(await screen.findByTestId('leave-create'));
    fireEvent.click(await screen.findByTestId('leave-create-submit'));

    await waitFor(() => {
      expect(screen.getByTestId('leave-create-error')).toBeInTheDocument();
    });
    expect(apiClient.post).not.toHaveBeenCalled();
  });

  it('rejects submit when end date is before start date', async () => {
    (apiClient.get as any)
      .mockResolvedValueOnce({ data: leaveFixture })
      .mockResolvedValueOnce({ data: employeesFixture });
    renderPage();

    fireEvent.click(await screen.findByTestId('leave-create'));
    const employeeSelect = await screen.findByTestId('leave-create-employee');
    fireEvent.change(employeeSelect, { target: { value: 'emp-001' } });
    fireEvent.change(screen.getByTestId('leave-create-start'), {
      target: { value: '2026-07-10' },
    });
    fireEvent.change(screen.getByTestId('leave-create-end'), {
      target: { value: '2026-07-05' },
    });
    fireEvent.change(screen.getByTestId('leave-create-reason'), {
      target: { value: 'Trip' },
    });

    fireEvent.click(screen.getByTestId('leave-create-submit'));

    await waitFor(() => {
      expect(screen.getByTestId('leave-create-error')).toHaveTextContent(
        /End date must be on or after start date/i,
      );
    });
    expect(apiClient.post).not.toHaveBeenCalled();
  });

  it('does NOT send tenantId or branchId in the create payload (server-derived only)', async () => {
    (apiClient.get as any)
      .mockResolvedValueOnce({ data: leaveFixture })
      .mockResolvedValueOnce({ data: employeesFixture });
    (apiClient.post as any).mockResolvedValueOnce({
      data: { id: 'lr-003', status: 'PENDING' },
    });

    renderPage();
    fireEvent.click(await screen.findByTestId('leave-create'));
    const employeeSelect = await screen.findByTestId('leave-create-employee');
    fireEvent.change(employeeSelect, { target: { value: 'emp-001' } });
    fireEvent.change(screen.getByTestId('leave-create-start'), {
      target: { value: '2026-08-01' },
    });
    fireEvent.change(screen.getByTestId('leave-create-end'), {
      target: { value: '2026-08-03' },
    });
    fireEvent.change(screen.getByTestId('leave-create-reason'), {
      target: { value: 'Personal' },
    });
    fireEvent.click(screen.getByTestId('leave-create-submit'));

    await waitFor(() => expect(apiClient.post).toHaveBeenCalled());

    const payload = (apiClient.post as any).mock.calls[0][1];
    expect(payload).not.toHaveProperty('tenantId');
    expect(payload).not.toHaveProperty('branchId');
  });

  it('does NOT send tenantId or branchId as query params on list', async () => {
    (apiClient.get as any).mockResolvedValueOnce({ data: [] });
    renderPage();
    await waitFor(() => expect(apiClient.get).toHaveBeenCalled());
    const args = (apiClient.get as any).mock.calls[0];
    expect(args[0]).toBe('/v1/hr/leave-requests');
    const params = args[1]?.params ?? {};
    expect(params).not.toHaveProperty('tenantId');
    expect(params).not.toHaveProperty('branchId');
  });

  it('calls PATCH approve endpoint and refreshes the list on success', async () => {
    (apiClient.get as any)
      .mockResolvedValueOnce({ data: leaveFixture })
      .mockResolvedValueOnce({ data: leaveFixture });
    (apiClient.patch as any).mockResolvedValueOnce({
      data: { id: 'lr-001', status: 'APPROVED' },
    });

    renderPage();
    const approveBtn = await screen.findByTestId('leave-approve-lr-001');
    fireEvent.click(approveBtn);

    await waitFor(() => {
      expect(apiClient.patch).toHaveBeenCalledWith(
        '/v1/hr/leave-requests/lr-001/approve',
      );
    });
    await waitFor(() => {
      expect((apiClient.get as any).mock.calls.length).toBeGreaterThanOrEqual(
        2,
      );
    });
  });

  it('calls PATCH reject endpoint and refreshes the list on success', async () => {
    (apiClient.get as any)
      .mockResolvedValueOnce({ data: leaveFixture })
      .mockResolvedValueOnce({ data: leaveFixture });
    (apiClient.patch as any).mockResolvedValueOnce({
      data: { id: 'lr-001', status: 'REJECTED' },
    });

    renderPage();
    const rejectBtn = await screen.findByTestId('leave-reject-lr-001');
    fireEvent.click(rejectBtn);

    await waitFor(() => {
      expect(apiClient.patch).toHaveBeenCalledWith(
        '/v1/hr/leave-requests/lr-001/reject',
      );
    });
  });

  it('surfaces inline error when approve fails (no alert)', async () => {
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
    (apiClient.get as any).mockResolvedValueOnce({ data: leaveFixture });
    (apiClient.patch as any).mockRejectedValueOnce(new Error('Server error'));

    renderPage();
    const approveBtn = await screen.findByTestId('leave-approve-lr-001');
    fireEvent.click(approveBtn);

    await waitFor(() => {
      expect(screen.getByTestId('leave-action-error')).toBeInTheDocument();
    });
    expect(alertSpy).not.toHaveBeenCalled();
    alertSpy.mockRestore();
  });

  it('refreshes the list after a successful create', async () => {
    (apiClient.get as any)
      .mockResolvedValueOnce({ data: leaveFixture })
      .mockResolvedValueOnce({ data: employeesFixture })
      .mockResolvedValueOnce({ data: leaveFixture });
    (apiClient.post as any).mockResolvedValueOnce({
      data: { id: 'lr-003', status: 'PENDING' },
    });

    renderPage();
    fireEvent.click(await screen.findByTestId('leave-create'));
    const employeeSelect = await screen.findByTestId('leave-create-employee');
    fireEvent.change(employeeSelect, { target: { value: 'emp-001' } });
    fireEvent.change(screen.getByTestId('leave-create-start'), {
      target: { value: '2026-09-01' },
    });
    fireEvent.change(screen.getByTestId('leave-create-end'), {
      target: { value: '2026-09-02' },
    });
    fireEvent.change(screen.getByTestId('leave-create-reason'), {
      target: { value: 'Move' },
    });
    fireEvent.click(screen.getByTestId('leave-create-submit'));

    await waitFor(() => {
      expect((apiClient.get as any).mock.calls.length).toBeGreaterThanOrEqual(3);
    });
  });
});
