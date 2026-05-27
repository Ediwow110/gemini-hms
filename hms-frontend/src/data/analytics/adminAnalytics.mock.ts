import { Activity, BriefcaseBusiness, Building2, Clock, Database, Server, ShieldAlert, Users } from 'lucide-react';
import type { AnalyticsMetric, HeatmapCell, Insight, ReportColumn, ReportRow, StatusBreakdown, TrendPoint } from '../../types/analytics';

export const defaultDateRange = { from: '2026-05-01', to: '2026-05-27' };

export const adminTenantOptions = [
  { label: 'All tenants', value: 'all' },
  { label: 'St. Jude Hospital Network', value: 'st-jude' },
  { label: 'MediClinics Group', value: 'mediclinics' },
];

export const superAdminMetrics: AnalyticsMetric[] = [
  { title: 'Total Tenants', value: 12, icon: Building2, description: '2 degraded tenants need follow-up', trend: { value: '+2 QoQ', direction: 'positive' }, severity: 'info', href: '/admin/tenants' },
  { title: 'Active Branches', value: 38, icon: BriefcaseBusiness, description: 'Across 5 operating regions', trend: { value: '+4', direction: 'positive' }, severity: 'success', href: '/admin/branches' },
  { title: 'Active Users', value: 312, icon: Users, description: '68 clinical staff active now', trend: { value: '+7%', direction: 'positive' }, severity: 'info', href: '/admin/users' },
  { title: 'Security Incidents', value: 2, icon: ShieldAlert, description: 'High-risk events in last 24h', trend: { value: '+1', direction: 'negative' }, severity: 'critical', href: '/admin/security' },
  { title: 'System Uptime', value: '99.98%', icon: Server, description: 'Sandbox SLA model, not live telemetry', trend: { value: 'stable', direction: 'neutral' }, severity: 'success' },
  { title: 'Background Jobs', value: '1 failed', icon: Clock, description: 'Audit export retry queue delayed', trend: { value: '-3 ok', direction: 'negative' }, severity: 'warning', href: '/it/background-jobs' },
];

export const tenantGrowthTrend: TrendPoint[] = [
  { label: 'Jan', value: 7, secondaryValue: 182 },
  { label: 'Feb', value: 8, secondaryValue: 204 },
  { label: 'Mar', value: 9, secondaryValue: 231 },
  { label: 'Apr', value: 10, secondaryValue: 268 },
  { label: 'May', value: 12, secondaryValue: 312 },
];

export const roleActivityComparison: TrendPoint[] = [
  { label: 'Doctor', value: 94 },
  { label: 'Nurse', value: 118 },
  { label: 'Lab', value: 32 },
  { label: 'Cashier', value: 24 },
  { label: 'Admin', value: 18 },
];

export const securitySeverityBreakdown: StatusBreakdown[] = [
  { label: 'Info', value: 24, severity: 'info', color: '#4f46e5' },
  { label: 'Warning', value: 9, severity: 'warning', color: '#f59e0b' },
  { label: 'Critical', value: 2, severity: 'critical', color: '#e11d48' },
];

export const systemHealthTrend: TrendPoint[] = [
  { label: '00:00', value: 112, secondaryValue: 16 },
  { label: '04:00', value: 104, secondaryValue: 13 },
  { label: '08:00', value: 148, secondaryValue: 22 },
  { label: '12:00', value: 176, secondaryValue: 28 },
  { label: '16:00', value: 132, secondaryValue: 18 },
];

export const adminInsights: Insight[] = [
  { title: 'Failed login spike isolated', description: 'MediClinics had a 3x failed-login increase from a single ASN. Review IP reputation and MFA posture.', severity: 'critical', actionLabel: 'Open Security Center', actionTo: '/admin/security' },
  { title: 'Storage growth needs forecast review', description: 'St. Jude imaging-related storage grew 18% this period. Capacity plan before next month-end load.', severity: 'warning', actionLabel: 'View Reports', actionTo: '/admin/reports' },
  { title: 'Audit chain healthy', description: 'Latest sandbox audit integrity check has no broken hash-chain samples.', severity: 'success', actionLabel: 'Review Audit Logs', actionTo: '/admin/audit-logs' },
];

export const tenantHealthRows: ReportRow[] = [
  { id: 'TEN-001', tenant: 'St. Jude Hospital Network', branches: 8, users: 142, status: 'Healthy', latency: '42ms', storage: '42.5 GB' },
  { id: 'TEN-002', tenant: 'MediClinics Group', branches: 3, users: 48, status: 'Degraded', latency: '188ms', storage: '12.8 GB' },
  { id: 'TEN-003', tenant: 'Apex Healthcare Services', branches: 2, users: 37, status: 'Healthy', latency: '65ms', storage: '4.2 GB' },
];

export const tenantHealthColumns: ReportColumn[] = [
  { key: 'tenant', header: 'Tenant', sortable: true },
  { key: 'branches', header: 'Branches', sortable: true },
  { key: 'users', header: 'Users', sortable: true },
  { key: 'status', header: 'Status', sortable: true },
  { key: 'latency', header: 'API latency' },
  { key: 'storage', header: 'Storage' },
];

export const adminReportMetrics: AnalyticsMetric[] = [
  { title: 'Transactions', value: '1,420', icon: Activity, description: 'Sandbox operations in 24h', trend: { value: '+4.2%', direction: 'positive' }, severity: 'info' },
  { title: 'API availability', value: '99.98%', icon: Server, description: 'Synthetic availability target', trend: { value: 'SLA met', direction: 'positive' }, severity: 'success' },
  { title: 'Queue delivery', value: '482', icon: Clock, description: 'SMTP/event queue deliveries', trend: { value: '0 failed', direction: 'positive' }, severity: 'success' },
  { title: 'DB growth', value: '+6.4 GB', icon: Database, description: 'Projected monthly storage delta', trend: { value: '+18%', direction: 'negative' }, severity: 'warning' },
  { title: 'Failed jobs', value: 1, icon: ShieldAlert, description: 'Requires retry review', trend: { value: '+1', direction: 'negative' }, severity: 'critical', href: '/it/background-jobs' },
  { title: 'Export volume', value: 0, icon: BriefcaseBusiness, description: 'Export endpoint not enabled', trend: { value: 'WIP', direction: 'neutral' }, severity: 'info' },
];

export const transactionVolumeTrend: TrendPoint[] = [
  { label: 'Mon', value: 980 },
  { label: 'Tue', value: 1220 },
  { label: 'Wed', value: 1188 },
  { label: 'Thu', value: 1420 },
  { label: 'Fri', value: 1325 },
];

export const dbGrowthTrend: TrendPoint[] = [
  { label: 'Jan', value: 44 },
  { label: 'Feb', value: 49 },
  { label: 'Mar', value: 53 },
  { label: 'Apr', value: 58 },
  { label: 'May', value: 64 },
];

export const jobStatusBreakdown: StatusBreakdown[] = [
  { label: 'Completed', value: 42, color: '#10b981' },
  { label: 'Running', value: 6, color: '#4f46e5' },
  { label: 'Failed', value: 1, color: '#e11d48' },
];

export const backgroundJobRows: ReportRow[] = [
  { id: 'JOB-1', job: 'patient_index_refresh', owner: 'Clinical', status: 'Stable', lastRun: '5 min ago', failures: 0 },
  { id: 'JOB-2', job: 'hmo_claims_reconciliation', owner: 'Finance', status: 'Stable', lastRun: '4h ago', failures: 0 },
  { id: 'JOB-3', job: 'audit_integrity_check', owner: 'Compliance', status: 'Retry needed', lastRun: '18 min ago', failures: 1 },
];

export const backgroundJobColumns: ReportColumn[] = [
  { key: 'job', header: 'Job', sortable: true },
  { key: 'owner', header: 'Owner', sortable: true },
  { key: 'status', header: 'Status', sortable: true },
  { key: 'lastRun', header: 'Last run' },
  { key: 'failures', header: 'Failures', sortable: true },
];

export const branchLoadHeatmap: HeatmapCell[] = [
  { row: 'Metro', column: 'ER', value: 92 }, { row: 'Metro', column: 'Lab', value: 76 }, { row: 'Metro', column: 'Billing', value: 52 },
  { row: 'North', column: 'ER', value: 38 }, { row: 'North', column: 'Lab', value: 46 }, { row: 'North', column: 'Billing', value: 31 },
  { row: 'South', column: 'ER', value: 65 }, { row: 'South', column: 'Lab', value: 59 }, { row: 'South', column: 'Billing', value: 42 },
];

