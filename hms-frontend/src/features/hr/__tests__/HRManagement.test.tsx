/* eslint-disable @typescript-eslint/no-explicit-any */
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { HRManagement } from '../HRManagement';
import { apiClient } from '../../../lib/api';

vi.mock('../../../lib/api', () => ({
  apiClient: {
    get: vi.fn(),
    patch: vi.fn(),
  },
}));

const renderWithRouter = (ui: React.ReactElement) => {
  return render(<BrowserRouter>{ui}</BrowserRouter>);
};

const employeeFixture = [
  {
    id: 'emp-1',
    staffNumber: 'EMP-001',
    firstName: 'Employee',
    lastName: '001',
    designation: 'Nurse',
    department: 'Ward',
    branch: 'Main',
    status: 'ACTIVE',
    paymentHistory: [],
  },
];

describe('HRManagement — real /v1/hr/* contract (post-fix)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('does NOT show the false read-only / not-available disclosure', async () => {
    (apiClient.get as any).mockResolvedValue({ data: employeeFixture });
    renderWithRouter(<HRManagement />);

    await waitFor(() => {
      expect(apiClient.get).toHaveBeenCalledWith('/v1/hr/employees');
    });

    expect(screen.queryByText(/read-only mode/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/not yet available in the live environment/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/currently in read-only mode/i)).not.toBeInTheDocument();
  });

  it('fetches employees from the real /v1/hr/employees endpoint', async () => {
    (apiClient.get as any).mockResolvedValue({ data: employeeFixture });
    renderWithRouter(<HRManagement />);

    await waitFor(() => {
      expect(apiClient.get).toHaveBeenCalledWith('/v1/hr/employees');
    });
  });

  it('opens the employee slide-over when "Manage Profile & Payroll" is clicked', async () => {
    (apiClient.get as any).mockResolvedValue({ data: employeeFixture });
    renderWithRouter(<HRManagement />);

    const manageBtn = await screen.findByText(/Manage Profile & Payroll/i);
    fireEvent.click(manageBtn);

    expect(await screen.findByTestId('hr-toggle-status')).toBeInTheDocument();
    expect(screen.getByText(/Employee Administration/i)).toBeInTheDocument();
  });

  it('status action button is now FUNCTIONAL (not disabled) and wires to PATCH /v1/hr/employees/:id/status', async () => {
    (apiClient.get as any).mockResolvedValue({ data: employeeFixture });
    (apiClient.patch as any).mockResolvedValue({ data: {} });

    renderWithRouter(<HRManagement />);

    const manageBtn = await screen.findByText(/Manage Profile & Payroll/i);
    fireEvent.click(manageBtn);

    const statusBtn = await screen.findByTestId('hr-toggle-status');
    expect(statusBtn).not.toBeDisabled();
    expect(statusBtn).toHaveTextContent(/Suspend Employee Credentials/i);

    fireEvent.click(statusBtn);

    await waitFor(() => {
      expect(apiClient.patch).toHaveBeenCalledWith(
        '/v1/hr/employees/emp-1/status',
        expect.objectContaining({ status: 'SUSPENDED' }),
      );
    });
  });

  it('uses the correct backend DTO (status only, NO client-trusted tenantId)', async () => {
    (apiClient.get as any).mockResolvedValue({ data: employeeFixture });
    (apiClient.patch as any).mockResolvedValue({ data: {} });

    renderWithRouter(<HRManagement />);

    fireEvent.click(await screen.findByText(/Manage Profile & Payroll/i));
    fireEvent.click(await screen.findByTestId('hr-toggle-status'));

    await waitFor(() => {
      expect(apiClient.patch).toHaveBeenCalled();
    });

    const [url, body] = (apiClient.patch as any).mock.calls[0];
    expect(url).toBe('/v1/hr/employees/emp-1/status');
    expect(body).toHaveProperty('status');
    expect(body).not.toHaveProperty('tenantId');
    expect(body).not.toHaveProperty('userId');
    expect(body).not.toHaveProperty('branchId');
  });

  it('surfaces backend rejection errors inline (no window.alert on save failure)', async () => {
    (apiClient.get as any).mockResolvedValue({ data: employeeFixture });
    (apiClient.patch as any).mockRejectedValue({
      response: { data: { message: 'forbidden: missing_role' } },
    });

    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
    renderWithRouter(<HRManagement />);

    fireEvent.click(await screen.findByText(/Manage Profile & Payroll/i));
    fireEvent.click(await screen.findByTestId('hr-toggle-status'));

    const errNode = await screen.findByTestId('hr-update-error');
    expect(errNode).toHaveTextContent(/forbidden: missing_role/);
    expect(alertSpy).not.toHaveBeenCalled();
    alertSpy.mockRestore();
  });

  it('does NOT introduce fabricated employee data when fetch fails', async () => {
    (apiClient.get as any).mockRejectedValue(new Error('Network Error'));
    renderWithRouter(<HRManagement />);

    expect(await screen.findByText(/Failed to fetch HR data/i)).toBeInTheDocument();
    expect(screen.queryByText(/Employee 001/i)).not.toBeInTheDocument();
  });
});
