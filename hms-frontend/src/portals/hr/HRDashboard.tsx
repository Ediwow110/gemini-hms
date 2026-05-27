import React, { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { PageHeader } from '../../components/ui/page-header';
import {
  AnalyticsMetricCard,
  ChartCard,
  ComparisonBarChart,
  DashboardFilterBar,
  InsightPanel,
  StatusDonutChart,
  TrendLineChart,
} from '../../components/analytics';
import HRScopeFilter from './components/HRScopeFilter';
import { EmployeeWorklist, Employee } from './components/EmployeeWorklist';
import { LeaveQueuePanel, LeaveRequest } from './components/LeaveQueuePanel';
import { LicenseMonitorPanel, License } from './components/LicenseMonitorPanel';
import { defaultDateRange } from '../../data/analytics/adminAnalytics.mock';
import { attendanceTrend, headcountTrend, hrInsights, hrMetrics, leaveBreakdown, payrollTrend, staffingGapByDepartment } from '../../data/analytics/hrAnalytics.mock';
import type { DateRange } from '../../types/analytics';

const mockEmployees: Employee[] = [
  { id: '1', name: 'Dr. Gregory House', email: 'g.house@stjude.org', role: 'Chief Diagnostician', department: 'Clinical', branch: 'St. Jude Metro', status: 'ACTIVE', joinedAt: '2024-01-15' },
  { id: '2', name: 'Nurse Judy Hopps', email: 'j.hopps@stjude.org', role: 'Head Nurse', department: 'Nursing', branch: 'St. Jude Metro', status: 'ACTIVE', joinedAt: '2024-03-22' },
  { id: '3', name: 'Charles McGill', email: 'c.mcgill@stjude.org', role: 'Legal Counsel', department: 'Admin', branch: 'St. Jude North', status: 'TERMINATED', joinedAt: '2023-11-05' },
  { id: '4', name: 'James Wilson', email: 'j.wilson@stjude.org', role: 'Oncology Head', department: 'Clinical', branch: 'St. Jude Metro', status: 'ON_LEAVE', joinedAt: '2024-02-10' },
];

const mockLeaveRequests: LeaveRequest[] = [
  { id: 'LR-001', employeeName: 'James Wilson', type: 'ANNUAL', startDate: '2026-05-25', endDate: '2026-06-05', days: 10, status: 'PENDING' },
  { id: 'LR-002', employeeName: 'Lisa Cuddy', type: 'EMERGENCY', startDate: '2026-05-21', endDate: '2026-05-23', days: 2, status: 'PENDING' },
];

const mockLicenses: License[] = [
  { id: 'LIC-001', employeeName: 'Dr. Gregory House', type: 'Medical Board License', expiryDate: '2026-06-15', daysRemaining: 25, status: 'EXPIRING' },
  { id: 'LIC-002', employeeName: 'Nurse Judy Hopps', type: 'Nursing License', expiryDate: '2026-08-30', daysRemaining: 101, status: 'VALID' },
];

export const HRDashboard: React.FC = () => {
  const [dateRange, setDateRange] = useState<DateRange>(defaultDateRange);
  const [department, setDepartment] = useState('all');

  return (
    <div className="space-y-6 pb-12">
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs font-semibold text-amber-800"><strong>Sandbox Notice:</strong> Workforce analytics are mock data moved out of the page component. No real HR or payroll actions are performed.</div>
      <PageHeader title="HR Workforce Command Center" description="Headcount, attendance, leave, license compliance, payroll readiness, and offboarding risk." actions={<button type="button" onClick={() => window.location.reload()} aria-label="Refresh HR dashboard" className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-black text-slate-700 hover:bg-slate-50"><RefreshCw className="h-4 w-4" /> Refresh</button>} />
      <HRScopeFilter />
      <DashboardFilterBar dateRange={dateRange} onDateRangeChange={setDateRange} department={department} onDepartmentChange={setDepartment} />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-6">{hrMetrics.map(metric => <AnalyticsMetricCard key={metric.title} {...metric} />)}</div>
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <ChartCard title="Headcount trend" description="Workforce growth by month." height={280}><TrendLineChart data={headcountTrend} title="Headcount trend" /></ChartCard>
        <ChartCard title="Attendance trend" description="Daily attendance percentage." height={280}><TrendLineChart data={attendanceTrend} title="Attendance trend" valueLabel="Attendance %" /></ChartCard>
        <ChartCard title="Leave type breakdown" description="Leave pressure by type." height={280}><StatusDonutChart data={leaveBreakdown} title="Leave type breakdown" /></ChartCard>
        <ChartCard title="Staffing gap by department" description="FTE gap estimate by department." height={280}><ComparisonBarChart data={staffingGapByDepartment} title="Staffing gap" valueLabel="FTE gap" /></ChartCard>
        <ChartCard title="Payroll trend" description="Payroll amount trend in millions." height={280}><TrendLineChart data={payrollTrend} title="Payroll trend" valueLabel="₱M" /></ChartCard>
        <InsightPanel insights={hrInsights} title="Workforce insights" />
      </div>
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2"><EmployeeWorklist employees={mockEmployees} /></div>
        <div className="space-y-6"><LeaveQueuePanel requests={mockLeaveRequests} /><LicenseMonitorPanel licenses={mockLicenses} /></div>
      </div>
    </div>
  );
};

export default HRDashboard;
