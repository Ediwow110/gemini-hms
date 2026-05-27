import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

export type AnalyticsSeverity = 'info' | 'success' | 'warning' | 'critical';
export type AnalyticsTrendDirection = 'positive' | 'negative' | 'neutral';

export interface AnalyticsTrend {
  value: string;
  direction: AnalyticsTrendDirection;
  label?: string;
}

export interface AnalyticsMetric {
  title: string;
  value: string | number;
  description?: string;
  icon?: LucideIcon;
  trend?: AnalyticsTrend;
  severity?: AnalyticsSeverity;
  href?: string;
}

export interface TrendPoint {
  label: string;
  value: number;
  secondaryValue?: number;
  tertiaryValue?: number;
}

export interface StatusBreakdown {
  label: string;
  value: number;
  severity?: AnalyticsSeverity;
  color?: string;
}

export interface Insight {
  title: string;
  description: string;
  severity: AnalyticsSeverity;
  actionLabel?: string;
  actionTo?: string;
}

export interface ReportColumn<T extends ReportRow = ReportRow> {
  key: keyof T & string;
  header: string;
  render?: (row: T) => ReactNode;
  sortable?: boolean;
  priority?: 'primary' | 'secondary' | 'low';
}

export type ReportRow = Record<string, string | number | boolean | null | undefined> & { id?: string | number };

export interface DateRange {
  from: string;
  to: string;
}

export interface ScopeFilter {
  branch?: string;
  department?: string;
  tenant?: string;
  region?: string;
  reportType?: string;
}

export interface DashboardSummary {
  source: 'real' | 'mock' | 'sandbox' | 'wip';
  generatedAt: string;
  metrics: AnalyticsMetric[];
  insights: Insight[];
}

export interface HeatmapCell {
  row: string;
  column: string;
  value: number;
  label?: string;
}

export interface FunnelStep {
  label: string;
  value: number;
  description?: string;
}
