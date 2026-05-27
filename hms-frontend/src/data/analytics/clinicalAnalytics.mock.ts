import { Activity, AlertOctagon, ClipboardList, CreditCard, FileCheck2, FileText, FlaskConical, Pill, Wallet } from 'lucide-react';
import type { AnalyticsMetric, Insight, StatusBreakdown, TrendPoint } from '../../types/analytics';

export const labTrendData: TrendPoint[] = [
  { label: 'Mon', value: 118, secondaryValue: 96 }, { label: 'Tue', value: 132, secondaryValue: 110 }, { label: 'Wed', value: 128, secondaryValue: 112 }, { label: 'Thu', value: 146, secondaryValue: 121 }, { label: 'Fri', value: 139, secondaryValue: 118 },
];

export const labStatusBreakdown: StatusBreakdown[] = [
  { label: 'Pending', value: 24, color: '#f59e0b' },
  { label: 'In-process', value: 18, color: '#4f46e5' },
  { label: 'Validated', value: 12, color: '#10b981' },
  { label: 'Critical', value: 3, color: '#e11d48' },
];

export const labInsights: Insight[] = [
  { title: 'Validation queue needs attention', description: 'Critical-result validation should remain prioritized before routine releases.', severity: 'warning', actionLabel: 'Validation Queue', actionTo: '/lab/validation' },
  { title: 'No open critical notification failures', description: 'Current critical result panel has no failed-notification records from available APIs.', severity: 'success', actionLabel: 'Critical Results', actionTo: '/lab/critical-results' },
];

export const cashierVolumeTrend: TrendPoint[] = [
  { label: 'Mon', value: 186 }, { label: 'Tue', value: 210 }, { label: 'Wed', value: 198 }, { label: 'Thu', value: 225 }, { label: 'Fri', value: 214 },
];

export const paymentMethodBreakdown: StatusBreakdown[] = [
  { label: 'Cash', value: 48, color: '#10b981' },
  { label: 'Card', value: 36, color: '#4f46e5' },
  { label: 'HMO', value: 22, color: '#f59e0b' },
  { label: 'Bank', value: 14, color: '#64748b' },
];

export const cashierInsights: Insight[] = [
  { title: 'High-value unpaid invoices need review', description: 'Outstanding balance is concentrated in a small group of invoices. Prioritize branch finance review.', severity: 'warning', actionLabel: 'Open Invoices', actionTo: '/cashier/invoices' },
  { title: 'Session closure is a safety gate', description: 'Cashier closeout should remain explicit; no automated void/refund actions were added.', severity: 'info', actionLabel: 'Session', actionTo: '/cashier/session' },
];

export const doctorWorklistMetrics: AnalyticsMetric[] = [
  { title: 'Assigned Today', value: 16, icon: ClipboardList, description: 'Live queue + scheduled work', severity: 'info', href: '/doctor/queue' },
  { title: 'Critical Results', value: 1, icon: AlertOctagon, description: 'Requires chart review', severity: 'critical', href: '/doctor/results' },
  { title: 'Pending Notes', value: 4, icon: FileText, description: 'SOAP drafts unsigned', severity: 'warning', href: '/doctor/emr' },
  { title: 'Pending Orders', value: 7, icon: FileCheck2, description: 'Clinical order follow-up', severity: 'info', href: '/doctor/orders' },
];

export const nurseWorklistMetrics: AnalyticsMetric[] = [
  { title: 'Assigned Patients', value: 22, icon: ClipboardList, description: 'Active nursing queue', severity: 'info', href: '/nurse/triage' },
  { title: 'Vitals Due', value: 9, icon: Activity, description: 'Due in next 30 minutes', severity: 'warning', href: '/nurse/vitals' },
  { title: 'Medication Due', value: 6, icon: Pill, description: 'MAR integration WIP', severity: 'warning', href: '/nurse/tasks' },
  { title: 'Specimens', value: 5, icon: FlaskConical, description: 'Collection queue', severity: 'info', href: '/nurse/specimens' },
];

export const patientActionMetrics: AnalyticsMetric[] = [
  { title: 'Upcoming Appointment', value: 'None', icon: ClipboardList, description: 'Book a visit when needed', severity: 'info', href: '/patient/appointments' },
  { title: 'Latest Lab Result', value: 'View', icon: FileCheck2, description: 'Released results only', severity: 'success', href: '/patient/lab-results' },
  { title: 'Active Prescriptions', value: 0, icon: Pill, description: 'Check refill status', severity: 'info', href: '/patient/prescriptions' },
  { title: 'Outstanding Balance', value: 'View', icon: CreditCard, description: 'Receipts and invoices', severity: 'warning', href: '/patient/billing' },
  { title: 'Records Requests', value: 'Open', icon: FileText, description: 'Export/request workflows', severity: 'info', href: '/patient/medical-records' },
];

export const financeMetrics: AnalyticsMetric[] = [
  { title: 'Collections Today', value: '₱214K', icon: Wallet, description: 'From posted payments', severity: 'success', href: '/cashier/payments' },
  { title: 'Pending Invoices', value: 18, icon: FileText, description: 'Awaiting payment', severity: 'warning', href: '/cashier/invoices' },
  { title: 'HMO Claims Pending', value: 7, icon: CreditCard, description: 'Claim review queue', severity: 'warning', href: '/cashier/hmo-claims' },
];
