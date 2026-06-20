/* eslint-disable @typescript-eslint/no-explicit-any */
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { DepartmentsPage } from '../DepartmentsPage';
import { apiClient } from '../../../lib/api';

vi.mock('../../../lib/api', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

const renderPage = () =>
  render(
    <BrowserRouter>
      <DepartmentsPage />
    </BrowserRouter>,
  );

const departmentsFixture = [
  {
    id: 'dept-1',
    tenantId: 'tenant-1',
    name: 'Clinical Medicine',
    code: 'CLIN-MED',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    _count: { employees: 42 },
  },
  {
    id: 'dept-2',
    tenantId: 'tenant-1',
    name: 'Pharmacy',
    code: 'PHARM',
    createdAt: '2024-02-01T00:00:00.000Z',
    updatedAt: '2024-02-01T00:00:00.000Z',
    _count: { employees: 8 },
  },
];

describe('DepartmentsPage — live backend wiring (post-fix)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches /v1/hr/departments on mount', async () => {
    (apiClient.get as any).mockResolvedValueOnce({ data: departmentsFixture });
    renderPage();
    await waitFor(() => {
      expect(apiClient.get).toHaveBeenCalledWith('/v1/hr/departments');
    });
  });

  it('renders real department data from API response', async () => {
    (apiClient.get as any).mockResolvedValueOnce({ data: departmentsFixture });
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('Clinical Medicine')).toBeInTheDocument();
    });
    expect(screen.getByText('Pharmacy')).toBeInTheDocument();
    expect(screen.getByText(/CODE: CLIN-MED/i)).toBeInTheDocument();
    expect(screen.getByText('42 Personnel')).toBeInTheDocument();
    expect(screen.getByText('8 Personnel')).toBeInTheDocument();
  });

  it('does NOT render any hardcoded mock department fallback', async () => {
    (apiClient.get as any).mockResolvedValueOnce({ data: [] });
    renderPage();
    await waitFor(() => {
      expect(apiClient.get).toHaveBeenCalledWith('/v1/hr/departments');
    });
    expect(screen.queryByText('Legal & Compliance')).not.toBeInTheDocument();
    expect(screen.queryByText('St. Jude Metro')).not.toBeInTheDocument();
    expect(screen.getByText(/No departments found/i)).toBeInTheDocument();
  });

  it('shows inline fetch error (no alert) when API fails', async () => {
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
    (apiClient.get as any).mockRejectedValueOnce(new Error('Network error'));
    renderPage();
    await waitFor(() => {
      expect(screen.getByText(/Failed to load department directory/i)).toBeInTheDocument();
    });
    expect(alertSpy).not.toHaveBeenCalled();
    alertSpy.mockRestore();
  });

  it('opens create modal and validates required fields', async () => {
    (apiClient.get as any).mockResolvedValueOnce({ data: departmentsFixture });
    renderPage();

    fireEvent.click(await screen.findByTestId('departments-create'));
    const submitBtn = await screen.findByTestId('departments-create-submit');
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(
        screen.getByText(/Department name and code are required/i),
      ).toBeInTheDocument();
    });
    expect(apiClient.post).not.toHaveBeenCalled();
  });

  it('submits POST /v1/hr/departments with correct DTO (no client-trusted tenantId)', async () => {
    (apiClient.get as any).mockResolvedValueOnce({ data: [] });
    (apiClient.post as any).mockResolvedValue({
      data: {
        id: 'dept-new',
        tenantId: 'tenant-1',
        name: 'Radiology',
        code: 'RAD',
        createdAt: '2026-06-18T00:00:00.000Z',
        updatedAt: '2026-06-18T00:00:00.000Z',
        _count: { employees: 0 },
      },
    });

    renderPage();
    fireEvent.click(await screen.findByTestId('departments-create'));

    fireEvent.change(screen.getByTestId('departments-create-name'), {
      target: { value: 'Radiology' },
    });
    fireEvent.change(screen.getByTestId('departments-create-code'), {
      target: { value: 'RAD' },
    });

    fireEvent.click(screen.getByTestId('departments-create-submit'));

    await waitFor(() => {
      expect(apiClient.post).toHaveBeenCalledWith(
        '/v1/hr/departments',
        expect.objectContaining({
          name: 'Radiology',
          code: 'RAD',
        }),
      );
    });

    const body = (apiClient.post as any).mock.calls[0][1];
    expect(body).not.toHaveProperty('tenantId');
    expect(body).not.toHaveProperty('branchId');
  });

  it('refreshes the department list after successful create', async () => {
    (apiClient.get as any)
      .mockResolvedValueOnce({ data: [] })
      .mockResolvedValueOnce({
        data: [
          {
            id: 'dept-new',
            tenantId: 'tenant-1',
            name: 'Radiology',
            code: 'RAD',
            createdAt: '2026-06-18T00:00:00.000Z',
            updatedAt: '2026-06-18T00:00:00.000Z',
            _count: { employees: 0 },
          },
        ],
      });
    (apiClient.post as any).mockResolvedValue({
      data: {
        id: 'dept-new',
        tenantId: 'tenant-1',
        name: 'Radiology',
        code: 'RAD',
        createdAt: '2026-06-18T00:00:00.000Z',
        updatedAt: '2026-06-18T00:00:00.000Z',
        _count: { employees: 0 },
      },
    });

    renderPage();
    fireEvent.click(await screen.findByTestId('departments-create'));

    fireEvent.change(screen.getByTestId('departments-create-name'), {
      target: { value: 'Radiology' },
    });
    fireEvent.change(screen.getByTestId('departments-create-code'), {
      target: { value: 'RAD' },
    });

    fireEvent.click(screen.getByTestId('departments-create-submit'));

    await waitFor(() => {
      expect(screen.getByTestId('departments-create-success')).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(apiClient.get).toHaveBeenCalledTimes(2);
    });
  });

  it('surfaces backend rejection inline (no window.alert)', async () => {
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
    (apiClient.get as any).mockResolvedValueOnce({ data: [] });
    (apiClient.post as any).mockRejectedValue({
      response: {
        data: { message: 'unique constraint failed on department code' },
      },
    });

    renderPage();
    fireEvent.click(await screen.findByTestId('departments-create'));
    fireEvent.change(screen.getByTestId('departments-create-name'), {
      target: { value: 'Pharmacy' },
    });
    fireEvent.change(screen.getByTestId('departments-create-code'), {
      target: { value: 'PHARM' },
    });
    fireEvent.click(screen.getByTestId('departments-create-submit'));

    const errNode = await screen.findByTestId('departments-create-error');
    expect(errNode).toHaveTextContent(/unique constraint failed/i);
    expect(alertSpy).not.toHaveBeenCalled();
    alertSpy.mockRestore();
  });
});
