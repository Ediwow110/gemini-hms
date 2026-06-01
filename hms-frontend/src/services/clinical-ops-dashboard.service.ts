import { demoData } from '../demo-data/dashboard-demo.data';
import { clinicalWorkflowService } from './clinicalWorkflow.service';
import { nursingService } from './nursing.service';
import type { 
  ClinicalOpsDashboardData,
  ClinicalOpsKpi,
  ClinicalOpsAlert
} from '../types/clinical-ops-dashboard';

export const clinicalOpsDashboardService = {
  async getDashboardData(branchId?: string): Promise<ClinicalOpsDashboardData> {
    try {
      const [summary, queue, tasks] = await Promise.all([
        clinicalWorkflowService.getDashboardSummary(branchId),
        clinicalWorkflowService.getWorkQueue(branchId),
        nursingService.listTasks({ status: 'OPEN' }),
      ]);

      const criticalTasks = tasks.filter(t => t.priority === 'URGENT' || t.priority === 'HIGH');
      const pendingTriage = summary.pendingTriage;
      const waitingForDoctor = summary.waitingForDoctor;

      return {
        kpis: [
          { 
            title: 'Active Patients', 
            value: summary.activePatients, 
            description: 'Currently in clinic', 
            severity: 'info' 
          },
          { 
            title: 'Pending Triage', 
            value: pendingTriage, 
            description: 'Awaiting initial assessment', 
            severity: pendingTriage > 5 ? 'warning' : 'success' 
          },
          { 
            title: 'Waiting for Doctor', 
            value: waitingForDoctor, 
            description: 'Ready for consultation', 
            severity: waitingForDoctor > 10 ? 'critical' : 'warning' 
          },
          { 
            title: 'Nursing Tasks', 
            value: tasks.length, 
            description: 'Open clinical actions', 
            severity: 'info' 
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
          ...queue.filter(q => q.category === 'EMERGENCY').slice(0, 2).map(q => ({
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
          { label: 'In Consultation', value: summary.activePatients - (pendingTriage + waitingForDoctor) },
          { label: 'Completed', value: summary.completedEncountersToday },
        ],
        workloadDistribution: demoData.clinicalOps.workloadDistribution,
        topDepartments: demoData.clinicalOps.topDepartments,
        pendingQueue: queue.slice(0, 10),
      };
    } catch (error) {
      console.error('Clinical Ops dashboard data fetch failed:', error);
      throw error;
    }
  },
};
