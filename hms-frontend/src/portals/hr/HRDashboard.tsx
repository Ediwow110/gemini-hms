import React, { useState } from 'react';
import { ShieldAlert } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
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
import type { HrEmployeeStatus } from '../../services/hr.service';
import { LeaveQueuePanel, LeaveRequest } from './components/LeaveQueuePanel';
import { LicenseMonitorPanel, License } from './components/LicenseMonitorPanel';
import { useAnalytics } from '../../hooks/use-analytics';
import { useHr } from '../../hooks/use-hr';
import type { DateRange } from '../../types/analytics';
import {
  HmsDashboardShell,
  HmsToolbar,
  HmsAuditFooter,
} from '../../components/hms-dashboard';

export const HRDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [dateRange, setDateRange] = useState<DateRange>({ from: '2026-01-01', to: '2026-06-25' });
  const [department, setDepartment] = useState('all');

  const { hr: hrMetrics, isLoading: analyticsLoading } = useAnalytics();
  const { employees, leaveRequests, licenses, isLoading: hrLoading } = useHr('');

  if (analyticsLoading || hrLoading) {
    return <div className="p-10 text-center text-slate-400">Loading workforce data...</div>;
  }

  // Map real employees to Worklist shape
  const mappedEmployees: Employee[] = (employees || []).map(e => ({
    id: e.id,
    name: `${e.firstName} ${e.lastName}`,
    email: e.email,
    role: e.role,
    department: e.department,
    branch: 'All Branches',
    status: e.status as Employee['status'],
    rawStatus: e.rawStatus as HrEmployeeStatus,
    joinedAt: e.joinedAt,
  }));

  // Map real leave requests to Queue shape
  const mappedLeave: LeaveRequest[] = (leaveRequests || []).map(l => ({
    id: l.id,
    employeeName: `${l.employee.firstName} ${l.employee.lastName}`,
    type: l.type,
    startDate: l.startDate,
    endDate: l.endDate,
    days: l.days,
    status: l.status,
  }));

  // Map real licenses to Monitor shape
  const mappedLicenses: License[] = (licenses || []).map(l => {
    const diff = Math.ceil((new Date(l.expiresAt).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    return {
      id: l.id,
      employeeName: 'Employee', // Need employee join in API
      type: l.licenseType,
      licenseNumber: l.licenseNumber,
      expiryDate: l.expiresAt,
      daysRemaining: diff,
      status: diff < 30 ? 'EXPIRING' : 'VALID',
    };
  });

  const expiringLicensesCount = mappedLicenses.filter(l => l.status === 'EXPIRING').length;
  const expiringDescription = expiringLicensesCount > 0
    ? `${expiringLicensesCount} provider credentials expire within 30 days. Action is required to avoid scheduling blocks.`
    : 'No provider credentials are currently flagged as expiring.';

  return (
    <HmsDashboardShell widthTier="full"
      toolbar={
        <HmsToolbar
          branchName="All Branches"
          role="HR Command Center"
          onRefresh={() => window.location.reload()}
        />
      }
      footer={<HmsAuditFooter dataSource="Workforce HR Database" />}
    >
      <div className="space-y-6 pb-12">
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs font-semibold text-amber-800">
        </div>

        {/* Alert Strip: Expiring License Alerts */}
        <div className="rounded-xl border border-rose-200 bg-rose-50/50 px-4 py-3 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-rose-600 flex-shrink-0" />
            <div>
              <span className="text-[12px] font-bold text-rose-900 block">LICENSE COMPLIANCE NOTICE: {expiringLicensesCount} EXPIRING CLINICAL LICENSES</span>
              <span className="text-[10px] text-rose-700 font-semibold block mt-0.5">{expiringDescription}</span>
            </div>
          </div>
          <button
            onClick={() => navigate('/hr/licenses')}
            className="text-[11px] font-bold text-rose-700 bg-rose-100 hover:bg-rose-200 border border-rose-300 rounded-md px-2.5 py-1 cursor-pointer transition-colors"
          >
            Verify Credentials
          </button>
        </div>

        <HRScopeFilter />
        <DashboardFilterBar dateRange={dateRange} onDateRangeChange={setDateRange} department={department} onDepartmentChange={setDepartment} />

        <div className="grid grid-cols-12 gap-6">
          {/* KPI metrics - Use real metrics from useAnalytics */}
          <div className="col-span-12 sm:col-span-4 xl:col-span-2">
            <AnalyticsMetricCard title="Total Headcount" value={hrMetrics?.headcount || 0} trend={{ value: '+2%', direction: 'positive' }} />
          </div>
          <div className="col-span-12 sm:col-span-4 xl:col-span-2">
            <AnalyticsMetricCard title="Pending Leave" value={hrMetrics?.pendingLeave || 0} trend={{ value: '-10%', direction: 'positive' }} />
          </div>
          <div className="col-span-12 sm:col-span-4 xl:col-span-2">
            <AnalyticsMetricCard title="Expiring Licenses" value={hrMetrics?.expiredLicenses || 0} trend={{ value: '+5%', direction: 'negative' }} />
          </div>
          <div className="col-span-12 sm:col-span-4 xl:col-span-2">
            <AnalyticsMetricCard title="Staffing Gap" value={hrMetrics?.staffingGap || 0} trend={{ value: '0%', direction: 'neutral' }} />
          </div>

          {/* Primary Work Row: Employee List (XL Card) & Leave Approvals Queue (L Card) */}
          <div className="col-span-12 xl:col-span-8">
            <EmployeeWorklist employees={mappedEmployees} />
          </div>
          <div className="col-span-12 xl:col-span-4">
            <LeaveQueuePanel requests={mappedLeave} />
          </div>

          {/* Secondary Insight Row: Licensure Verification Panel (L Card) + Workforce insights (L Card) */}
          <div className="col-span-12 xl:col-span-6">
            <LicenseMonitorPanel licenses={mappedLicenses} />
          </div>
          <div className="col-span-12 xl:col-span-6">
            <InsightPanel insights={[]} title="Workforce insights" />
          </div>

          {/* Bottom Supporting Row: Trends & Charts - Still using mock for charts until a time-series API is implemented */}
          <div className="col-span-12 md:col-span-6 xl:col-span-4">
            <ChartCard title="Headcount trend" description="Workforce growth by month." height={280}>
              <TrendLineChart data={[]} title="Headcount trend" />
            </ChartCard>
          </div>
          <div className="col-span-12 md:col-span-6 xl:col-span-4">
            <ChartCard title="Attendance trend" description="Daily attendance percentage." height={280}>
              <TrendLineChart data={[]} title="Attendance trend" valueLabel="Attendance %" />
            </ChartCard>
          </div>
          <div className="col-span-12 md:col-span-6 xl:col-span-4">
            <ChartCard title="Leave type breakdown" description="Leave pressure by type." height={280}>
              <StatusDonutChart data={[]} title="Leave type breakdown" />
            </ChartCard>
          </div>
          <div className="col-span-12 md:col-span-6 xl:col-span-6">
            <ChartCard title="Staffing gap by department" description="FTE gap estimate by department." height={280}>
              <ComparisonBarChart data={[]} title="Staffing gap" valueLabel="FTE gap" />
            </ChartCard>
          </div>
          <div className="col-span-12 md:col-span-12 xl:col-span-6">
            <ChartCard title="Payroll trend" description="Payroll amount trend in millions." height={280}>
              <TrendLineChart data={[]} title="Payroll trend" valueLabel="₱M" />
            </ChartCard>
          </div>
        </div>
      </div>
    </HmsDashboardShell>
  );
};

export default HRDashboard;
