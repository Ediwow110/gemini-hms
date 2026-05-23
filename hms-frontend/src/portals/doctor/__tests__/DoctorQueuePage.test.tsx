import { render, screen, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { DoctorQueuePage } from '../DoctorQueuePage';
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
    permissions: ['view_clinical_queue'],
  }),
}));

describe('DoctorQueuePage Runtime Tests', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('renders Access Restricted when 403 Forbidden is returned and does not leak raw details', async () => {
    const error = {
      isAxiosError: true,
      name: 'AxiosError',
      message: 'Forbidden Access Error',
      response: { 
        status: 403, 
        data: { 
          secretErrorCode: 'ERR_403_DB_INTERNAL_LEAK',
          details: 'Internal clinical read-only policy violation at backend'
        },
      } as unknown as AxiosResponse
    } as unknown as AxiosError;
    
    vi.mocked(apiClient.get).mockRejectedValue(error);

    render(
      <TestWrapper>
        <DoctorQueuePage />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Access Restricted')).toBeInTheDocument();
    });

    // Ensure raw error data details are NOT leaked to the screen
    expect(screen.queryByText('ERR_403_DB_INTERNAL_LEAK')).not.toBeInTheDocument();
    expect(screen.queryByText('Internal clinical read-only policy violation')).not.toBeInTheDocument();
    expect(screen.queryByText('Forbidden Access Error')).not.toBeInTheDocument();
  });

  it('renders empty queue state when queue is empty', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce({
      data: [],
    });

    render(
      <TestWrapper>
        <DoctorQueuePage />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Clinical Worklist Queue')).toBeInTheDocument();
    });

    expect(screen.getByText('No patients match search terms or active queue is empty.')).toBeInTheDocument();
  });
});
