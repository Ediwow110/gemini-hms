import type { ClinicalWorkQueueDto } from '../services/clinicalWorkflow.service';

export interface ClinicalOpsKpi {
  title: string;
  value: string | number;
  description: string;
  trend?: {
    value: string;
    direction: 'positive' | 'negative' | 'neutral';
  };
  severity: 'info' | 'success' | 'warning' | 'critical';
}

export interface ClinicalOpsAlert {
  id: string;
  title: string;
  message: string;
  severity: 'info' | 'success' | 'warning' | 'critical';
  link?: string;
}

export interface ClinicalOpsTopListEntry {
  id: string;
  label: string;
  value: string | number;
  trend?: string;
}

export interface ClinicalOpsDashboardData {
  kpis: ClinicalOpsKpi[];
  alerts: ClinicalOpsAlert[];
  flowDistribution: { label: string; value: number }[];
  workloadDistribution: { label: string; value: number }[];
  topDepartments: ClinicalOpsTopListEntry[];
  pendingQueue: ClinicalWorkQueueDto[];
}
