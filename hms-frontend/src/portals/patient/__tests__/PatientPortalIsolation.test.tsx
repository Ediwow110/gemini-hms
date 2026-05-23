import { render, screen } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';
import { PatientDashboard } from '../PatientDashboard';
import { TestWrapper } from '../../../test/test-utils';
import { apiClient } from '../../../lib/api';

// PatientDashboard uses only static mock data (no API calls).
// We mock apiClient to assert isolation but it should never be called.
vi.mock('../../../lib/api', () => ({
  apiClient: {
    get: vi.fn().mockResolvedValue({ data: null }),
    post: vi.fn(),
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() },
    },
  },
}));

describe('PatientDashboard Isolation Tests', () => {
  it('renders PatientDashboard home view successfully and confirms isolation from staff clinical APIs', () => {
    const { container } = render(
      <TestWrapper>
        <PatientDashboard />
      </TestWrapper>
    );

    // Verify PatientDashboard header exists
    expect(screen.getByText(/Hello, Welcome Back/i)).toBeInTheDocument();
    expect(screen.getByText(/Quick Actions/i)).toBeInTheDocument();

    // Verify elements are visible
    expect(screen.getByText('Outstanding Balance')).toBeInTheDocument();
    expect(screen.getByText('Active Prescriptions')).toBeInTheDocument();
    expect(screen.getByText('Unread Messages')).toBeInTheDocument();

    // CONFIRM ISOLATION: Patient dashboard uses only static data, never contacts API
    // Using the mocked import directly instead of require()
    expect(apiClient.get).not.toHaveBeenCalled();

    // Verify the dashboard renders meaningful content (not just an empty div)
    expect(container.innerHTML.length).toBeGreaterThan(100);
  });
});
