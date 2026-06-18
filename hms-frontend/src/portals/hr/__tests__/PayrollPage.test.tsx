/* eslint-disable @typescript-eslint/no-explicit-any */
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { PayrollPage } from '../PayrollPage';
import { apiClient } from '../../../lib/api';
import { AuthContext } from '../../../hooks/use-user';

vi.mock('../../../lib/api', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
  },
}));

const defaultMockUser = {
  id: '00000000-0000-0000-0000-0000000000a1',
  email: 'hr.admin@example.com',
  tenantId: '00000000-0000-0000-0000-0000000000b1',
  branchId: '00000000-0000-0000-0000-0000000000c1',
  roles: ['HR Manager'],
  permissions: [],
};

const renderPage = (user = defaultMockUser) =>
  render(
    <AuthContext.Provider
      value={{
        user,
        isLoading: false,
        authError: null,
        logout: () => {},
        refetchUser: async () => {},
      }}
    >
      <BrowserRouter>
        <PayrollPage />
      </BrowserRouter>
    </AuthContext.Provider>,
  );

const payslipsFixture = [
  {
    id: 'ps-001',
    tenantId: '00000000-0000-0000-0000-0000000000b1',
    branchId: '00000000-0000-0000-0000-0000000000c1',
    employeeId: '00000000-0000-0000-0000-0000000000d1',
    periodStart: '2026-05-01',
    periodEnd: '2026-05-15',
    basicSalary: 50000,
    totalAllowances: 5000,
    totalDeductions: 7000,
    netSalary: 48000,
    status: 'PAID',
    createdAt: '2026-05-16T08:00:00.000Z',
    employee: {
      id: '00000000-0000-0000-0000-0000000000d1',
      employeeNumber: 'EMP-0001',
      firstName: 'Alice',
      lastName: 'Anders',
      branchId: '00000000-0000-0000-0000-0000000000c1',
    },
  },
  {
    id: 'ps-002',
    tenantId: '00000000-0000-0000-0000-0000000000b1',
    branchId: '00000000-0000-0000-0000-0000000000c1',
    employeeId: '00000000-0000-0000-0000-0000000000d2',
    periodStart: '2026-05-16',
    periodEnd: '2026-05-31',
    basicSalary: 40000,
    totalAllowances: 0,
    totalDeductions: 5000,
    netSalary: 35000,
    status: 'DRAFT',
    createdAt: '2026-06-01T08:00:00.000Z',
    employee: {
      id: '00000000-0000-0000-0000-0000000000d2',
      employeeNumber: 'EMP-0002',
      firstName: 'Bob',
      lastName: 'Brown',
      branchId: '00000000-0000-0000-0000-0000000000c1',
    },
  },
];

describe('PayrollPage — live backend wiring', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches /v1/hr/payslips on mount', async () => {
    (apiClient.get as any).mockResolvedValueOnce({ data: [] });
    renderPage();
    await waitFor(() => {
      expect(apiClient.get).toHaveBeenCalledWith(
        '/v1/hr/payslips',
        expect.any(Object),
      );
    });
  });

  it('renders real payslip data from the API response', async () => {
    (apiClient.get as any).mockResolvedValueOnce({ data: payslipsFixture });
    renderPage();
    await waitFor(() => {
      expect(screen.getByTestId('payroll-row-ps-001')).toBeInTheDocument();
    });
    expect(screen.getByTestId('payroll-employee-ps-001')).toHaveTextContent(
      'Alice Anders',
    );
    expect(screen.getByTestId('payroll-net-ps-001')).toHaveTextContent(
      '48,000',
    );
    expect(screen.getByTestId('payroll-status-ps-001')).toHaveTextContent(
      'Paid',
    );
    expect(screen.getByTestId('payroll-status-ps-002')).toHaveTextContent(
      'Draft',
    );
  });

  it('does NOT render any hardcoded mock payroll cycle fallback', async () => {
    (apiClient.get as any).mockResolvedValueOnce({ data: [] });
    renderPage();
    await waitFor(() => {
      expect(apiClient.get).toHaveBeenCalledWith(
        '/v1/hr/payslips',
        expect.any(Object),
      );
    });
    expect(
      screen.queryByText(/May 16 - May 31, 2026/),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText(/May 01 - May 15, 2026/),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText(/April 16 - April 30, 2026/),
    ).not.toBeInTheDocument();
    expect(screen.queryByText('12,450,000')).not.toBeInTheDocument();
    expect(screen.queryByText('12,380,000')).not.toBeInTheDocument();
    expect(screen.queryByText('12,350,000')).not.toBeInTheDocument();
    expect(screen.queryByText('1240 Employees')).not.toBeInTheDocument();
    expect(
      screen.queryByText('Employee 001'),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText('Employee 002'),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText('Disbursed'),
    ).not.toBeInTheDocument();
    expect(screen.queryByText('PENDING')).not.toBeInTheDocument();
    expect(screen.queryByText('COMPLETED')).not.toBeInTheDocument();
    expect(screen.getByTestId('payroll-empty')).toBeInTheDocument();
  });

  it('does NOT contain the old "Sandbox Notice" wording once live', async () => {
    (apiClient.get as any).mockResolvedValueOnce({ data: payslipsFixture });
    renderPage();
    await waitFor(() => {
      expect(screen.getByTestId('payroll-row-ps-001')).toBeInTheDocument();
    });
    expect(
      screen.queryByText(/Payroll data is simulated/i),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText(/Recent Payroll Activity Shell/i),
    ).not.toBeInTheDocument();
  });

  it('shows inline fetch error (no alert) when API fails', async () => {
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
    (apiClient.get as any).mockRejectedValueOnce(new Error('Network error'));
    renderPage();
    await waitFor(() => {
      expect(screen.getByTestId('payroll-fetch-error')).toBeInTheDocument();
    });
    expect(alertSpy).not.toHaveBeenCalled();
    alertSpy.mockRestore();
  });

  it('derives summary stats (Total / Paid / Draft) from real status data', async () => {
    (apiClient.get as any).mockResolvedValueOnce({ data: payslipsFixture });
    renderPage();
    await waitFor(() => {
      expect(screen.getByTestId('payroll-stat-total')).toBeInTheDocument();
    });
    expect(screen.getByTestId('payroll-stat-total')).toHaveTextContent('2');
    expect(screen.getByTestId('payroll-stat-paid')).toHaveTextContent('1');
    expect(screen.getByTestId('payroll-stat-draft')).toHaveTextContent('1');
  });

  it('does NOT compute or display any fake aggregated total amount (no backend basis)', async () => {
    (apiClient.get as any).mockResolvedValueOnce({ data: payslipsFixture });
    renderPage();
    await waitFor(() => {
      expect(screen.getByTestId('payroll-row-ps-001')).toBeInTheDocument();
    });
    // The page must not show a sum-of-payslip-amounts widget or any fabricated
    // "Net Disbursement" total that the backend does not provide as a single
    // aggregated field. The per-row net pay is shown, but no aggregate.
    expect(screen.queryByText(/Net Disbursement/i)).not.toBeInTheDocument();
  });

  it('does NOT send any tenantId or branchId as query params on the list call', async () => {
    (apiClient.get as any).mockResolvedValueOnce({ data: [] });
    renderPage();
    await waitFor(() => expect(apiClient.get).toHaveBeenCalled());
    const args = (apiClient.get as any).mock.calls[0];
    expect(args[0]).toBe('/v1/hr/payslips');
    const params = args[1]?.params ?? {};
    expect(params).not.toHaveProperty('tenantId');
  });

  it('keeps the Generate Pay Slips button honestly WIP (no fake wiring)', async () => {
    (apiClient.get as any).mockResolvedValueOnce({ data: payslipsFixture });
    renderPage();
    await waitFor(() => {
      expect(screen.getByTestId('payroll-row-ps-001')).toBeInTheDocument();
    });
    const generateBtn = screen.getByRole('button', {
      name: /Generate Pay Slips WIP/i,
    });
    expect(generateBtn).toBeDisabled();
  });

  it('does NOT render pop-culture employee or supplier names from old mock data', async () => {
    (apiClient.get as any).mockResolvedValueOnce({ data: payslipsFixture });
    renderPage();
    await waitFor(() => {
      expect(screen.getByTestId('payroll-row-ps-001')).toBeInTheDocument();
    });
    expect(screen.queryByText(/Dr\. House/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Nurse Hopps/i)).not.toBeInTheDocument();
  });

  it('refreshes the list when the refresh button is clicked', async () => {
    (apiClient.get as any)
      .mockResolvedValueOnce({ data: payslipsFixture })
      .mockResolvedValueOnce({ data: payslipsFixture });
    renderPage();
    await waitFor(() => {
      expect(screen.getByTestId('payroll-row-ps-001')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByTestId('payroll-refresh'));
    await waitFor(() => {
      expect((apiClient.get as any).mock.calls.length).toBeGreaterThanOrEqual(
        2,
      );
    });
  });
});
