import { render, screen, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { DoctorDashboard } from '../DoctorDashboard';
import { TestWrapper } from '../../../test/test-utils';
import { apiClient } from '../../../lib/api';
import { AxiosError, AxiosResponse } from 'axios';

// Mock the apiClient
vi.mock('../../../lib/api', () => ({
  apiClient: {
    get: vi.fn(),
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() },
    },
  },
}));

// Mock the useUser hook
vi.mock('../../../hooks/use-user', () => ({
  useUser: () => ({
    id: 'doc-1',
    email: 'doctor@example.com',
    tenantId: 'tenant-1',
    branchId: 'branch-1',
    roles: ['Doctor'],
    permissions: ['view_clinical_dashboard'],
  }),
}));

describe('DoctorDashboard Runtime Tests', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('renders Access Restricted when 403 Forbidden is returned', async () => {
    const error = {
      isAxiosError: true,
      name: 'AxiosError',
      message: 'Forbidden',
      response: {
        status: 403,
        data: { message: 'Forbidden' },
      } as unknown as AxiosResponse,
    } as unknown as AxiosError;
    
    vi.mocked(apiClient.get).mockRejectedValue(error);

    render(
      <TestWrapper>
        <DoctorDashboard />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Access Restricted')).toBeInTheDocument();
    });

    // Verify it doesn't show clinical dashboard headings or elements
    expect(screen.queryByText('Assigned Patients')).not.toBeInTheDocument();
    expect(screen.queryByText('My Patient Queue')).not.toBeInTheDocument();
  });

  it('renders Access Restricted when 401 Unauthorized is returned', async () => {
    const error = {
      isAxiosError: true,
      name: 'AxiosError',
      message: 'Unauthorized',
      response: {
        status: 401,
        data: { message: 'Unauthorized' },
      } as unknown as AxiosResponse,
    } as unknown as AxiosError;
    
    vi.mocked(apiClient.get).mockRejectedValue(error);

    render(
      <TestWrapper>
        <DoctorDashboard />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Access Restricted')).toBeInTheDocument();
    });
  });

  it('renders Connection Error when a 500 error is returned', async () => {
    const error = {
      isAxiosError: true,
      name: 'AxiosError',
      message: 'Internal Server Error',
      response: {
        status: 500,
        data: {},
      } as unknown as AxiosResponse,
    } as unknown as AxiosError;
    
    vi.mocked(apiClient.get).mockRejectedValue(error);

    render(
      <TestWrapper>
        <DoctorDashboard />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Connection Error')).toBeInTheDocument();
    });
  });

  it('renders empty work queue state when queue is empty', async () => {
    // Mock dashboard summary
    vi.mocked(apiClient.get).mockResolvedValueOnce({
      data: {
        branchId: 'branch-1',
        activePatients: 0,
        pendingTriage: 0,
        waitingForDoctor: 0,
        pendingLabResults: 0,
        completedEncountersToday: 0,
        timestamp: new Date(),
        accessLabel: 'PUBLIC',
        isReadOnly: true,
      },
    });

    // Mock empty work queue list
    vi.mocked(apiClient.get).mockResolvedValueOnce({
      data: [],
    });

    render(
      <TestWrapper>
        <DoctorDashboard />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Assigned Patients')).toBeInTheDocument();
    });

    expect(screen.getByText('No active patients in queue')).toBeInTheDocument();
  });
});
