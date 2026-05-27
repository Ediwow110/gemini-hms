import { AlertOctagon, Cpu, Database, Eye, Lock, Server, ShieldAlert, Ticket, Users } from 'lucide-react';
import type { AnalyticsMetric, Insight, ReportColumn, ReportRow, StatusBreakdown, TrendPoint } from '../../types/analytics';

export const complianceTrend: TrendPoint[] = [
  { label: 'Mon', value: 42, secondaryValue: 1 },
  { label: 'Tue', value: 58, secondaryValue: 0 },
  { label: 'Wed', value: 51, secondaryValue: 2 },
  { label: 'Thu', value: 66, secondaryValue: 1 },
  { label: 'Fri', value: 49, secondaryValue: 0 },
];

export const complianceStatusBreakdown: StatusBreakdown[] = [
  { label: 'Routine', value: 120, color: '#10b981' },
  { label: 'Reviewed', value: 14, color: '#4f46e5' },
  { label: 'Flagged', value: 4, color: '#f59e0b' },
  { label: 'Critical', value: 1, color: '#e11d48' },
];

export const complianceInsights: Insight[] = [
  { title: 'PHI review remains priority', description: 'Flagged PHI access events should be reviewed before periodic report previews are generated.', severity: 'warning', actionLabel: 'PHI Access Monitor', actionTo: '/compliance/phi-access' },
  { title: 'Export governance enforced', description: 'Sensitive report exports remain disabled until permission, reason capture, and audit strategy are wired.', severity: 'success', actionLabel: 'Export Logs', actionTo: '/compliance/export-logs' },
];

export const complianceReportRows: ReportRow[] = [
  { id: 'CMP-1', control: 'PHI access review', owner: 'Compliance', status: 'Open', risk: 'Medium' },
  { id: 'CMP-2', control: 'Audit-chain verification', owner: 'Security', status: 'Healthy', risk: 'Low' },
  { id: 'CMP-3', control: 'Export logs reconciliation', owner: 'Privacy', status: 'WIP', risk: 'High' },
];

export const complianceReportColumns: ReportColumn[] = [
  { key: 'control', header: 'Control', sortable: true },
  { key: 'owner', header: 'Owner', sortable: true },
  { key: 'status', header: 'Status', sortable: true },
  { key: 'risk', header: 'Risk', sortable: true },
];

export const itMetrics: AnalyticsMetric[] = [
  { title: 'Open Tickets', value: 0, icon: Ticket, description: 'Updated from ticket stats when available', severity: 'info', href: '/it/user-support' },
  { title: 'Urgent Incidents', value: 0, icon: AlertOctagon, description: 'Incident escalation queue', severity: 'success', href: '/it/incidents' },
  { title: 'System Health', value: 'Online', icon: Cpu, description: 'Simulated infrastructure telemetry', severity: 'success', href: '/it/system-health' },
  { title: 'Background Jobs', value: 'Review', icon: Server, description: 'Job failures and retry status', severity: 'warning', href: '/it/background-jobs' },
  { title: 'Backups', value: 'WIP', icon: Database, description: 'Download disabled until real endpoint exists', severity: 'warning', href: '/it/backup-restore' },
  { title: 'Active Sessions', value: 'Review', icon: Users, description: 'Session activity monitor', severity: 'info', href: '/it/sessions' },
];

export const itLatencyTrend: TrendPoint[] = [
  { label: '00:00', value: 44, secondaryValue: 99 },
  { label: '04:00', value: 39, secondaryValue: 99 },
  { label: '08:00', value: 62, secondaryValue: 98 },
  { label: '12:00', value: 76, secondaryValue: 98 },
  { label: '16:00', value: 55, secondaryValue: 99 },
];

export const jobBreakdown: StatusBreakdown[] = [
  { label: 'Healthy', value: 22, color: '#10b981' },
  { label: 'Retrying', value: 3, color: '#f59e0b' },
  { label: 'Failed', value: 1, color: '#e11d48' },
];

export const itInsights: Insight[] = [
  { title: 'Backup download remains disabled', description: 'Backup artifacts are sensitive operational exports; enable only after signed endpoint and audit policy exist.', severity: 'warning', actionLabel: 'Backup & Recovery', actionTo: '/it/backup-restore' },
  { title: 'Ticket queue drives IT dashboard', description: 'Live support tickets remain the primary real data source while system telemetry is sandboxed.', severity: 'info', actionLabel: 'Ticket Queue', actionTo: '/it/user-support' },
];

export const supplierInsights: Insight[] = [
  { title: 'RFQ response risk', description: 'Four pending RFQs need action before buyer SLA windows close.', severity: 'warning', actionLabel: 'RFQ Inbox', actionTo: '/supplier/rfq-inbox' },
  { title: 'Payout exports disabled', description: 'Statements require a governed financial export endpoint before downloads are enabled.', severity: 'info', actionLabel: 'Payout Ledger', actionTo: '/supplier/payouts' },
];

export const supplierRevenueTrend: TrendPoint[] = [
  { label: 'Jan', value: 3.8 },
  { label: 'Feb', value: 4.4 },
  { label: 'Mar', value: 5.1 },
  { label: 'Apr', value: 5.8 },
  { label: 'May', value: 6.4 },
];

export const supplierStatusBreakdown: StatusBreakdown[] = [
  { label: 'Listings', value: 18, color: '#4f46e5' },
  { label: 'Orders', value: 5, color: '#f59e0b' },
  { label: 'Shipped', value: 23, color: '#10b981' },
  { label: 'Claims', value: 2, color: '#e11d48' },
];

export const exportSafetyMetrics: AnalyticsMetric[] = [
  { title: 'PHI Export Safety', value: 'Disabled', icon: ShieldAlert, description: 'Requires audit reason', severity: 'critical' },
  { title: 'Audit Review', value: 'Required', icon: Eye, description: 'No raw rows exported', severity: 'warning' },
  { title: 'Signed Endpoint', value: 'Missing', icon: Lock, description: 'Backend not available', severity: 'info' },
];
