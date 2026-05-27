import { Banknote, Clock, DoorOpen, UserCheck, Users } from 'lucide-react';
import type { AnalyticsMetric, HeatmapCell, Insight, ReportColumn, ReportRow, StatusBreakdown, TrendPoint } from '../../types/analytics';

export const branchMetrics: AnalyticsMetric[] = [
  { title: "Today's Patients", value: 186, icon: Users, description: 'Registered across OPD/ER', trend: { value: '+12%', direction: 'positive' }, severity: 'info', href: '/queue' },
  { title: 'Queue Length', value: 34, icon: Clock, description: '8 delayed beyond target', trend: { value: '+5', direction: 'negative' }, severity: 'warning', href: '/queue' },
  { title: 'Average Wait', value: '28m', icon: Clock, description: 'Target is under 20m', trend: { value: '+6m', direction: 'negative' }, severity: 'warning' },
  { title: 'Open Rooms', value: 22, icon: DoorOpen, description: '5 ready for assignment', trend: { value: 'stable', direction: 'neutral' }, severity: 'success', href: '/branch-admin/rooms' },
  { title: 'Staff On Duty', value: 74, icon: UserCheck, description: '12 departments covered', trend: { value: '-3', direction: 'negative' }, severity: 'info', href: '/branch-admin/staff' },
  { title: 'Unpaid Invoices', value: '₱248K', icon: Banknote, description: 'High-value accounts need review', trend: { value: '+9%', direction: 'negative' }, severity: 'critical', href: '/reports' },
];

export const patientVolumeByHour: TrendPoint[] = [
  { label: '08', value: 16 }, { label: '09', value: 28 }, { label: '10', value: 36 }, { label: '11', value: 31 }, { label: '12', value: 20 }, { label: '13', value: 34 }, { label: '14', value: 21 },
];

export const queueByDepartment: StatusBreakdown[] = [
  { label: 'ER', value: 9, color: '#e11d48' },
  { label: 'OPD', value: 14, color: '#4f46e5' },
  { label: 'Lab', value: 7, color: '#f59e0b' },
  { label: 'Billing', value: 4, color: '#10b981' },
];

export const roomOccupancy: TrendPoint[] = [
  { label: 'ER', value: 86 }, { label: 'OPD', value: 62 }, { label: 'Imaging', value: 48 }, { label: 'Ward', value: 74 }, { label: 'OR', value: 52 },
];

export const staffWorkloadHeatmap: HeatmapCell[] = [
  { row: 'Doctors', column: 'AM', value: 78 }, { row: 'Doctors', column: 'PM', value: 64 }, { row: 'Doctors', column: 'Night', value: 42 },
  { row: 'Nurses', column: 'AM', value: 91 }, { row: 'Nurses', column: 'PM', value: 73 }, { row: 'Nurses', column: 'Night', value: 68 },
  { row: 'Lab', column: 'AM', value: 69 }, { row: 'Lab', column: 'PM', value: 58 }, { row: 'Lab', column: 'Night', value: 24 },
];

export const branchInsights: Insight[] = [
  { title: 'ER wait time above target', description: 'Emergency average wait has exceeded the 20-minute target for two consecutive hours.', severity: 'critical', actionLabel: 'Open Queue', actionTo: '/queue' },
  { title: 'Lab queue nearing bottleneck', description: 'Seven lab patients are waiting; consider pulling one technician from encoding to specimen intake.', severity: 'warning', actionLabel: 'View Lab', actionTo: '/lab' },
  { title: 'Rooms available for surge', description: 'Five rooms are open and ready if OPD queue remains elevated.', severity: 'success', actionLabel: 'Rooms', actionTo: '/branch-admin/rooms' },
];

export const delayedPatientRows: ReportRow[] = [
  { id: 'Q-101', patient: 'Patient A', department: 'ER', wait: '54m', status: 'Delayed', owner: 'Triage' },
  { id: 'Q-102', patient: 'Patient B', department: 'Laboratory', wait: '41m', status: 'Awaiting specimen', owner: 'Lab' },
  { id: 'Q-103', patient: 'Patient C', department: 'Billing', wait: '33m', status: 'Invoice review', owner: 'Cashier' },
];

export const delayedPatientColumns: ReportColumn[] = [
  { key: 'patient', header: 'Patient', sortable: true },
  { key: 'department', header: 'Department', sortable: true },
  { key: 'wait', header: 'Wait' },
  { key: 'status', header: 'Status', sortable: true },
  { key: 'owner', header: 'Owner', sortable: true },
];
