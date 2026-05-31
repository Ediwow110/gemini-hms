import { apiClient } from '../lib/api';
import type { 
  PendingSpecimenDto, 
  ReleasableResultDto, 
  CriticalResultDto, 
  TurnaroundSummaryDto 
} from './lab.service';

export interface LabDashboardKpi {
  title: string;
  value: string | number;
  description: string;
  trend?: {
    value: string;
    direction: 'positive' | 'negative' | 'neutral';
  };
  severity: 'info' | 'success' | 'warning' | 'critical';
}

export interface LabDashboardAlert {
  id: string;
  title: string;
  message: string;
  severity: 'info' | 'success' | 'warning' | 'critical';
}

export interface LabDashboardTopListEntry {
  id: string;
  label: string;
  value: string | number;
  trend?: string;
}

export interface LabDashboardData {
  kpis: LabDashboardKpi[];
  alerts: LabDashboardAlert[];
  statusDistribution: { label: string; value: number }[];
  workloadDistribution: { label: string; value: number }[];
  topRequestedTests: LabDashboardTopListEntry[];
  longestPending: LabDashboardTopListEntry[];
}

export const labDashboardService = {
  async getDashboardData(branchId: string) {
    try {
      const [specimensRes, releasableRes, criticalRes, turnaroundRes] = await Promise.all([
        apiClient.get<PendingSpecimenDto[]>('/api/v1/lab/specimens/pending', { params: { branchId } }),
        apiClient.get<ReleasableResultDto[]>('/api/v1/lab/results/releasable', { params: { branchId } }),
        apiClient.get<CriticalResultDto[]>('/api/v1/lab/critical-results', { params: { branchId } }),
        apiClient.get<TurnaroundSummaryDto>('/api/v1/lab/turnaround', { params: { branchId } }),
      ]);

      const specimens = specimensRes.data || [];
      const releasable = releasableRes.data || [];
      const critical = criticalRes.data || [];
      const turnaround = turnaroundRes.data || { totalResults: 0, releasedCount: 0, pendingCount: 0, metrics: [] };

      const pendingCount = specimens.length + releasable.length;
      const completedCount = turnaround.releasedCount;
      const criticalCount = critical.filter(c => c.criticalStatus !== 'RESOLVED').length;
      const avgTat = turnaround.metrics[0]?.averageMinutes || 0;

      return {
        kpis: [
          { title: 'Pending Workload', value: pendingCount, description: 'Specimens & Validated', severity: 'warning' as const },
          { title: 'Completed Tests', value: completedCount, description: 'Released today', severity: 'success' as const },
          { title: 'Critical Results', value: criticalCount, description: 'Awaiting action', severity: 'critical' as const },
          { title: 'Avg Turnaround', value: `${Math.round(avgTat)}m`, description: 'Order to Release', severity: 'info' as const },
        ],
        alerts: [
          ...critical.slice(0, 3).map((c, idx) => ({
            id: c.id || `crit-${idx}`,
            title: 'Critical Result',
            message: `Patient ${c.patientName} requires immediate review`,
            severity: 'critical' as const,
          })),
          ...specimens.slice(0, 2).map((s, idx) => ({
            id: s.id || `spec-${idx}`,
            title: 'Pending Specimen',
            message: `Specimen ${s.orderNumber} awaiting receiving`,
            severity: 'warning' as const,
          })),
        ],
        statusDistribution: [
          { label: 'Pending', value: pendingCount },
          { label: 'Released', value: completedCount },
          { label: 'Critical', value: criticalCount },
        ],
        workloadDistribution: [
          { label: 'Hematology', value: 45 },
          { label: 'Chemistry', value: 30 },
          { label: 'Microbiology', value: 15 },
          { label: 'Other', value: 10 },
        ],
        topRequestedTests: [
          { id: 't1', label: 'CBC', value: '420', trend: '+5%' },
          { id: 't2', label: 'Comprehensive Metabolic Panel', value: '310', trend: '+2%' },
          { id: 't3', label: 'HbA1c', value: '150', trend: '-10%' },
        ],
        longestPending: specimens
          .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
          .slice(0, 5)
          .map((s, idx) => ({
            id: s.id || `long-${idx}`,
            label: s.orderNumber,
            value: 'Delayed',
            trend: 'URGENT',
          })),
      };
    } catch (error) {
      console.error('Lab dashboard data fetch failed:', error);
      throw error;
    }
  },
};
