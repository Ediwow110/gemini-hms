import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NurseDashboard } from '../NurseDashboard';
import { TestWrapper } from '../../../test/test-utils';
import { useClinicalDashboardSummary, useClinicalWorkQueue } from '../../../hooks/use-clinical-workflow';
import { useNursingTasks } from '../../../hooks/use-nursing-tasks';

vi.mock('../../../hooks/use-clinical-workflow', () => ({
  useClinicalDashboardSummary: vi.fn(),
  useClinicalWorkQueue: vi.fn(),
}));

vi.mock('../../../hooks/use-nursing-tasks', () => ({
  useNursingTasks: vi.fn(),
}));

const mockDashboardData = () => {
  vi.mocked(useClinicalDashboardSummary).mockReturnValue({
    data: {
      branchId: 'branch-1',
      activePatients: 6,
      pendingTriage: 2,
      waitingForDoctor: 4,
      pendingLabResults: 1,
      completedEncountersToday: 8,
      timestamp: new Date().toISOString(),
      accessLabel: 'PUBLIC',
      isReadOnly: true,
    },
    isLoading: false,
    error: null,
  } as unknown as ReturnType<typeof useClinicalDashboardSummary>);

  vi.mocked(useClinicalWorkQueue).mockReturnValue({
    data: [],
    isLoading: false,
    error: null,
  } as unknown as ReturnType<typeof useClinicalWorkQueue>);

  vi.mocked(useNursingTasks).mockReturnValue({
    tasks: [],
    isLoading: false,
  } as unknown as ReturnType<typeof useNursingTasks>);
};

describe('NurseDashboard route safety', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockDashboardData();
  });

  it('does not route nurse handoff metrics to the doctor-only queue', async () => {
    render(
      <TestWrapper>
        <NurseDashboard />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Ready for Doctor')).toBeInTheDocument();
    });

    expect(screen.getByText('Triage Waiting').closest('button')).not.toBeNull();
    expect(screen.getByText('Ready for Doctor').closest('button')).toBeNull();
    expect(screen.getByText('Handoff Ready').closest('[role="button"]')).toBeNull();
  });
});
