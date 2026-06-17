import { clinicalWorkflowService } from './clinicalWorkflow.service';
import { nursingService } from './nursing.service';
import type {
  ClinicalOpsDashboardData,
  ClinicalOpsKpi,
  ClinicalOpsAlert,
} from '../types/clinical-ops-dashboard';

export const clinicalOpsDashboardService = {
  async getDashboardData(branchId?: string): Promise<ClinicalOpsDashboardData> {
    const [summary, queue, tasks] = await Promise.all([
      clinicalWorkflowService.getDashboardSummary(branchId),
      clinicalWorkflowService.getWorkQueue(branchId),
      nursingService.listTasks({ status: 'OPEN' }),
    ]);

    const safeQueue = Array.isArray(queue) ? queue : [];
    const safeTasks = Array.isArray(tasks) ? tasks : [];
    const safeSummary =
      summary && typeof summary === 'object'
        ? summary
        : { activePatients: 0, pendingTriage: 0, waitingForDoctor: 0, completedEncountersToday: 0 };

    const criticalTasks = safeTasks.filter(t => t.priority === 'URGENT' || t.priority === 'HIGH');
    const pendingTriage = safeSummary.pendingTriage;
    const waitingForDoctor = safeSummary.waitingForDoctor;

    return {
      kpis: [
        {
          title: 'Active Patients',
          value: summary.activePatients,
          description: 'Currently in clinic',
          severity: 'info',
        },
        {
          title: 'Pending Triage',
          value: pendingTriage,
          description: 'Awaiting initial assessment',
          severity: pendingTriage > 5 ? 'warning' : 'success',
        },
        {
          title: 'Waiting for Doctor',
          value: waitingForDoctor,
          description: 'Ready for consultation',
          severity: waitingForDoctor > 10 ? 'critical' : 'warning',
        },
        {
          title: 'Nursing Tasks',
          value: safeTasks.length,
          description: 'Open clinical actions',
          severity: 'info',
        },
      ] as ClinicalOpsKpi[],
      alerts: [
        ...criticalTasks.slice(0, 3).map(t => ({
          id: t.id,
          title: 'Urgent Nursing Task',
          message: `${t.title} - Patient: ${t.patientName || 'N/A'}`,
          severity: t.priority === 'URGENT' ? 'critical' : 'warning',
          link: `/nurse/tasks`,
        })),
        ...safeQueue.filter(q => q.category === 'EMERGENCY').slice(0, 2).map(q => ({
          id: q.id,
          title: 'Emergency Patient',
          message: `Patient ${q.patientName} in ${q.serviceType} queue`,
          severity: 'critical',
          link: `/nurse/triage`,
        })),
      ] as ClinicalOpsAlert[],
      flowDistribution: [
        { label: 'Triage', value: pendingTriage },
        { label: 'Waiting', value: waitingForDoctor },
        { label: 'In Consultation', value: safeSummary.activePatients - (pendingTriage + waitingForDoctor) },
        { label: 'Completed', value: safeSummary.completedEncountersToday },
      ],
      workloadDistribution: [],
      topDepartments: [],
      pendingQueue: safeQueue.slice(0, 10),
    };
  },
};
