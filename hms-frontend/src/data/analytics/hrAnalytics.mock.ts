import { Calendar, FileWarning, ShieldCheck, UserMinus, Users, Wallet } from 'lucide-react';
import type { AnalyticsMetric, Insight, StatusBreakdown, TrendPoint } from '../../types/analytics';

export const hrMetrics: AnalyticsMetric[] = [
  { title: 'Headcount', value: '1,240', icon: Users, description: 'Active staff in sandbox roster', trend: { value: '+12', direction: 'positive' }, severity: 'info', href: '/hr/employees' },
  { title: 'Attendance Rate', value: '93.4%', icon: Calendar, description: 'Today across all branches', trend: { value: '-1.8%', direction: 'negative' }, severity: 'warning', href: '/hr/attendance' },
  { title: 'On Leave', value: 18, icon: UserMinus, description: 'Approved leave today', trend: { value: '+4', direction: 'negative' }, severity: 'info', href: '/hr/leave' },
  { title: 'Expiring Licenses', value: 14, icon: ShieldCheck, description: 'Within 30 days', trend: { value: '+3', direction: 'negative' }, severity: 'critical', href: '/hr/licenses' },
  { title: 'Payroll Pending', value: '₱12.4M', icon: Wallet, description: 'Cycle May 16-31', trend: { value: '10 days', direction: 'neutral' }, severity: 'warning', href: '/hr/payroll' },
  { title: 'Open Offboarding', value: 3, icon: FileWarning, description: 'Exit checklists pending', trend: { value: 'stable', direction: 'neutral' }, severity: 'info', href: '/hr/termination' },
];

export const headcountTrend: TrendPoint[] = [
  { label: 'Jan', value: 1168 }, { label: 'Feb', value: 1182 }, { label: 'Mar', value: 1205 }, { label: 'Apr', value: 1228 }, { label: 'May', value: 1240 },
];

export const attendanceTrend: TrendPoint[] = [
  { label: 'Mon', value: 95 }, { label: 'Tue', value: 94 }, { label: 'Wed', value: 93 }, { label: 'Thu', value: 92 }, { label: 'Fri', value: 93 },
];

export const leaveBreakdown: StatusBreakdown[] = [
  { label: 'Annual', value: 10, color: '#4f46e5' },
  { label: 'Sick', value: 5, color: '#f59e0b' },
  { label: 'Emergency', value: 3, color: '#e11d48' },
];

export const staffingGapByDepartment: TrendPoint[] = [
  { label: 'Nursing', value: 8 }, { label: 'ER', value: 5 }, { label: 'Lab', value: 3 }, { label: 'Cashier', value: 2 }, { label: 'Admin', value: 1 },
];

export const payrollTrend: TrendPoint[] = [
  { label: 'Jan', value: 11.2 }, { label: 'Feb', value: 11.5 }, { label: 'Mar', value: 11.7 }, { label: 'Apr', value: 12.1 }, { label: 'May', value: 12.4 },
];

export const hrInsights: Insight[] = [
  { title: 'License renewal risk', description: 'Fourteen clinical licenses expire within 30 days; three are tied to ER coverage.', severity: 'critical', actionLabel: 'Review Licenses', actionTo: '/hr/licenses' },
  { title: 'Nursing gap on PM shift', description: 'Nursing is projected 8 FTE short on PM shift if current leave requests are approved.', severity: 'warning', actionLabel: 'Attendance', actionTo: '/hr/attendance' },
  { title: 'Payroll cycle readiness', description: 'Payroll pending amount is expected for the current cycle; validate attendance exceptions before processing.', severity: 'info', actionLabel: 'Payroll', actionTo: '/hr/payroll' },
];
