import { describe, expect, it, vi, beforeEach } from 'vitest';

vi.mock('../clinicalWorkflow.service', () => ({
  clinicalWorkflowService: {
    getDashboardSummary: vi.fn(),
    getWorkQueue: vi.fn(),
  },
}));

vi.mock('../nursing.service', () => ({
  nursingService: {
    listTasks: vi.fn(),
  },
}));

vi.mock('../../demo-data/dashboard-demo.data', () => {
  throw new Error(
    'clinical-ops-dashboard.service must not import demo-data; demoData would be a fake source of truth.',
  );
});

import { clinicalOpsDashboardService } from '../clinical-ops-dashboard.service';
import { clinicalWorkflowService } from '../clinicalWorkflow.service';
import { nursingService } from '../nursing.service';

describe('clinicalOpsDashboardService — no demoData mixing (post-fix)', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('returns empty workloadDistribution (no fabricated departments)', async () => {
    vi.mocked(clinicalWorkflowService.getDashboardSummary).mockResolvedValue({
      branchId: 'branch-1',
      activePatients: 12,
      pendingTriage: 2,
      waitingForDoctor: 3,
      pendingLabResults: 0,
      completedEncountersToday: 4,
      timestamp: new Date(),
      accessLabel: 'BRANCH',
      isReadOnly: false,
    });
    vi.mocked(clinicalWorkflowService.getWorkQueue).mockResolvedValue([]);
    vi.mocked(nursingService.listTasks).mockResolvedValue([]);

    const data = await clinicalOpsDashboardService.getDashboardData();
    expect(data.workloadDistribution).toEqual([]);
  });

  it('returns empty topDepartments (no fabricated departmental pressure)', async () => {
    vi.mocked(clinicalWorkflowService.getDashboardSummary).mockResolvedValue({
      branchId: 'branch-1',
      activePatients: 0,
      pendingTriage: 0,
      waitingForDoctor: 0,
      pendingLabResults: 0,
      completedEncountersToday: 0,
      timestamp: new Date(),
      accessLabel: 'BRANCH',
      isReadOnly: false,
    });
    vi.mocked(clinicalWorkflowService.getWorkQueue).mockResolvedValue([]);
    vi.mocked(nursingService.listTasks).mockResolvedValue([]);

    const data = await clinicalOpsDashboardService.getDashboardData();
    expect(data.topDepartments).toEqual([]);
  });

  it('still surfaces real KPIs sourced from the live clinical workflow service', async () => {
    vi.mocked(clinicalWorkflowService.getDashboardSummary).mockResolvedValue({
      branchId: 'branch-1',
      activePatients: 21,
      pendingTriage: 4,
      waitingForDoctor: 7,
      pendingLabResults: 0,
      completedEncountersToday: 9,
      timestamp: new Date(),
      accessLabel: 'BRANCH',
      isReadOnly: false,
    });
    vi.mocked(clinicalWorkflowService.getWorkQueue).mockResolvedValue([]);
    vi.mocked(nursingService.listTasks).mockResolvedValue([]);

    const data = await clinicalOpsDashboardService.getDashboardData();
    const activePatients = data.kpis.find((k) => k.title === 'Active Patients');
    const pendingTriage = data.kpis.find((k) => k.title === 'Pending Triage');
    const waitingForDoctor = data.kpis.find(
      (k) => k.title === 'Waiting for Doctor',
    );
    expect(activePatients?.value).toBe(21);
    expect(pendingTriage?.value).toBe(4);
    expect(waitingForDoctor?.value).toBe(7);
  });
});
