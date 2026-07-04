import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useHr } from '../use-hr';
import { apiClient } from '../../lib/api';

vi.mock('../../lib/api', () => ({
  apiClient: {
    get: vi.fn(),
  },
}));

const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

describe('useHr', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queryClient.clear();
  });

  it('calls /v1/hr/employees (not /hr/employees)', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: [] });

    const Probe = () => {
      const { employees, isLoading } = useHr('branch-1');
      if (isLoading) return <div>loading</div>;
      return <div data-testid="count">{employees ? employees.length : 'empty'}</div>;
    };

    render(<Probe />, { wrapper });
    await waitFor(() => expect(screen.getByTestId('count')).toHaveTextContent('0'));

    const employeeCalls = vi.mocked(apiClient.get).mock.calls.filter(
      ([url]: [string]) => url.includes('/hr/employees')
    );
    expect(employeeCalls.length).toBeGreaterThan(0);
    expect(employeeCalls[0][0]).toBe('/v1/hr/employees');
  });

  it('calls /v1/hr/leave (not /hr/leave)', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: [] });

    const Probe = () => {
      const { leaveRequests, isLoading } = useHr('branch-1');
      if (isLoading) return <div>loading</div>;
      return <div data-testid="count">{leaveRequests ? leaveRequests.length : 'empty'}</div>;
    };

    render(<Probe />, { wrapper });
    await waitFor(() => expect(screen.getByTestId('count')).toHaveTextContent('0'));

    const leaveCalls = vi.mocked(apiClient.get).mock.calls.filter(
      ([url]: [string]) => url.includes('/hr/leave')
    );
    expect(leaveCalls.length).toBeGreaterThan(0);
    expect(leaveCalls[0][0]).toBe('/v1/hr/leave');
  });

  it('calls /v1/hr/assignments?branchId= (not /hr/assignments)', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: [] });

    const Probe = () => {
      const { assignments, isLoading } = useHr('branch-1');
      if (isLoading) return <div>loading</div>;
      return <div data-testid="count">{assignments ? assignments.length : 'empty'}</div>;
    };

    render(<Probe />, { wrapper });
    await waitFor(() => expect(screen.getByTestId('count')).toHaveTextContent('0'));

    const assignmentCalls = vi.mocked(apiClient.get).mock.calls.filter(
      ([url]: [string]) => url.includes('/hr/assignments')
    );
    expect(assignmentCalls.length).toBeGreaterThan(0);
    expect(assignmentCalls[0][0]).toBe('/v1/hr/assignments?branchId=branch-1');
  });

  it('calls /v1/hr/attendance?branchId= (not /hr/attendance)', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: [] });

    const Probe = () => {
      const { attendance, isLoading } = useHr('branch-1');
      if (isLoading) return <div>loading</div>;
      return <div data-testid="count">{attendance ? attendance.length : 'empty'}</div>;
    };

    render(<Probe />, { wrapper });
    await waitFor(() => expect(screen.getByTestId('count')).toHaveTextContent('0'));

    const attendanceCalls = vi.mocked(apiClient.get).mock.calls.filter(
      ([url]: [string]) => url.includes('/hr/attendance')
    );
    expect(attendanceCalls.length).toBeGreaterThan(0);
    expect(attendanceCalls[0][0]).toBe('/v1/hr/attendance?branchId=branch-1');
  });

  it('fetchLicenses calls /v1/hr/licenses/:id (not /hr/licenses/)', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: [] });

    const Probe = () => {
      const { fetchLicenses } = useHr('branch-1');
      return <button onClick={async () => { await fetchLicenses('lic-1'); }} data-testid="btn">fetch</button>;
    };

    render(<Probe />, { wrapper });
    screen.getByTestId('btn').click();

    await waitFor(() => {
      const licenseCalls = vi.mocked(apiClient.get).mock.calls.filter(
        ([url]: [string]) => url.includes('/hr/licenses/')
      );
      expect(licenseCalls.length).toBeGreaterThan(0);
      expect(licenseCalls[0][0]).toBe('/v1/hr/licenses/lic-1');
    });
  });
});
