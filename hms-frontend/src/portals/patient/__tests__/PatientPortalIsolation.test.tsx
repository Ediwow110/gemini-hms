import { render, screen, waitFor } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';
import { PatientDashboard } from '../PatientDashboard';
import { TestWrapper } from '../../../test/test-utils';
import { apiClient } from '../../../lib/api';

// Mock patient portal API responses (not staff clinical APIs)
vi.mock('../../../lib/api', () => ({
  apiClient: {
    get: vi.fn().mockImplementation((url: string) => {
      // Patient portal endpoints return empty data
      if (url.includes('/patient-portal/profile')) {
        return Promise.resolve({ data: null });
      }
      if (url.includes('/patient-portal/lab-results')) {
        return Promise.resolve({ data: [] });
      }
      if (url.includes('/patient-portal/prescriptions')) {
        return Promise.resolve({ data: [] });
      }
      return Promise.resolve({ data: null });
    }),
    post: vi.fn(),
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() },
    },
  },
}));

describe('PatientDashboard Isolation Tests', () => {
  it('renders PatientDashboard home view successfully and confirms isolation from staff clinical APIs', async () => {
    const { container } = render(
      <TestWrapper>
        <PatientDashboard />
      </TestWrapper>
    );

    // Wait for loading to complete — the heading shows "Hello, Welcome Back" when profile is null
    await waitFor(() => {
      expect(screen.getByText(/Hello, Welcome Back/i)).toBeInTheDocument();
    });

    // Verify key dashboard elements exist
    expect(screen.getByText('Quick Actions')).toBeInTheDocument();

    // CONFIRM ISOLATION: Patient dashboard calls ONLY patient-portal endpoints,
    // NEVER staff clinical APIs (which live under /api/v1/clinical, /api/v1/patients, etc.)
    const apiCalls = (apiClient.get as ReturnType<typeof vi.fn>).mock.calls;
    apiCalls.forEach((call: string[]) => {
      expect(call[0]).toMatch(/\/patient-portal\//);
    });

    // Verify the dashboard renders meaningful content (not just an empty div)
    expect(container.innerHTML.length).toBeGreaterThan(100);
  });
});
