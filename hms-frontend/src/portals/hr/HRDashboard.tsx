import React, { useMemo, useState } from 'react';
import { ShieldAlert } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  AnalyticsMetricCard,
  ChartCard,
  ComparisonBarChart,
  InsightPanel,
  StatusDonutChart,
  TrendLineChart,
} from '../../components/analytics';
import { HmsPageHeader } from '../../components/hms-page';
import {
  HmsAuditFooter,
  HmsDashboardShell,
  HmsDataSourceBadge,
  HmsToolbar,
} from '../../components/hms-dashboard';
import HRScopeFilter from './components/HRScopeFilter';
import { EmployeeWorklist, type Employee } from './components/EmployeeWorklist';
import { LeaveQueuePanel, type LeaveRequest } from './components/LeaveQueuePanel';
import { LicenseMonitorPanel, type License } from './components/LicenseMonitorPanel';
import type { HrEmployeeStatus } from '../../services/hr.service';
import { useAnalytics } from '../../hooks/use-analytics';
import { useHr } from '../../hooks/use-hr';
import { demoHrDashboard } from '../../data/dashboard-demo';

const DASHBOARD_REFERENCE_TIME = Date.now();

const currencyFormatter = (value: number) =>
  new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    maximumFractionDigits: 0,
  }).format(value);

export const HRDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [department, setDepartment] = useState('all');

  const {
    hr: hrMetrics,
    isLoading: analyticsLoading,
    isFetching: analyticsFetching,
    demoByScope,
    refetchAll: refetchAnalytics,
  } = useAnalytics('hr');
  const {
    employees,
    leaveRequests,
    licenses,
    isLoading: hrLoading,
    refetchAll: refetchHr,
  } = useHr('');

  const isDemo = demoByScope.hr;
  const isLoading = analyticsLoading || hrLoading;

  const mappedEmployees: Employee[] = useMemo(() => {
    if (isDemo) return demoHrDashboard.employees;
    return (employees || []).map((employee) => ({
      id: employee.id,
      name: `${employee.firstName} ${employee.lastName}`,
      email: employee.email,
      role: employee.role,
      department: employee.department,
      branch: employee.branchId || 'Tenant-wide',
      status: employee.status as Employee['status'],
      rawStatus: employee.rawStatus as HrEmployeeStatus,
      joinedAt: employee.joinedAt,
    }));
  }, [employees, isDemo]);

  const mappedLeave: LeaveRequest[] = useMemo(() => {
    if (isDemo) return demoHrDashboard.leaveRequests;
    return (leaveRequests || []).map((request) => ({
      id: request.id,
      employeeName: `${request.employee.firstName} ${request.employee.lastName}`,
      type: request.type,
      startDate: request.startDate,
      endDate: request.endDate,
      days: request.days,
      status: request.status,
    }));
  }, [leaveRequests, isDemo]);

  const employeeNames = useMemo(
    () =>
      new Map(
        (employees || []).map((employee) => [
          employee.id,
          `${employee.firstName} ${employee.lastName}`,
        ]),
      ),
    [employees],
  );

  const mappedLicenses: License[] = useMemo(() => {
    if (isDemo) return demoHrDashboard.licenses;
    return (licenses || []).map((license) => {
      const daysRemaining = Math.ceil(
        (new Date(license.expiresAt).getTime() - DASHBOARD_REFERENCE_TIME) /
          86_400_000,
      );
      return {
        id: license.id,
        employeeName: employeeNames.get(license.employeeId) ?? 'Employee record',
        type: license.licenseType,
        licenseNumber: license.licenseNumber,
        expiryDate: license.expiresAt,
        daysRemaining,
        status: daysRemaining < 30 ? 'EXPIRING' : 'VALID',
      };
    });
  }, [employeeNames, isDemo, licenses]);

  const departments = useMemo(
    () => Array.from(new Set(mappedEmployees.map((employee) => employee.department))).sort(),
    [mappedEmployees],
  );

  const filteredEmployees = useMemo(
    () =>
      department === 'all'
        ? mappedEmployees
        : mappedEmployees.filter((employee) => employee.department === department),
    [department, mappedEmployees],
  );

  const expiringLicensesCount = mappedLicenses.filter(
    (license) => license.status === 'EXPIRING',
  ).length;

  const refresh = async () => {
    await Promise.all([refetchAnalytics(), refetchHr()]);
  };

  if (isLoading) {
    return (
      <HmsDashboardShell>
        <div className="min-h-80 animate-pulse rounded-2xl border border-slate-200 bg-white" />
      </HmsDashboardShell>
    );
  }

  return (
    <HmsDashboardShell
      toolbar={
        <HmsToolbar
          branchName="Tenant-wide workforce"
          role="HR Command Center"
          onRefresh={() => void refresh()}
          refreshing={analyticsFetching}
        >
          <label className="min-w-[180px] text-[11px] font-semibold text-slate-500">
            <span className="mb-1 block">Department</span>
            <select
              value={department}
              onChange={(event) => setDepartment(event.target.value)}
              className="min-h-10 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
            >
              <option value="all">All departments</option>
              {departments.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
          </label>
        </HmsToolbar>
      }
      footer={
        <HmsAuditFooter
          dataSource={isDemo ? 'Synthetic workforce scenario' : 'Live workforce records with synthetic trend context'}
        />
      }
    >
      <HmsPageHeader
        eyebrow="People operations"
        title="Workforce Command Center"
        description="Staffing, leave, credential risk and payroll context organized around the decisions HR must make next."
        actions={
          <HmsDataSourceBadge
            mode="demo"
            label={isDemo ? 'Synthetic workforce scenario' : 'Live records + synthetic trends'}
          />
        }
      />

      <HRScopeFilter />

      {expiringLicensesCount > 0 && (
        <div className="flex flex-col gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-rose-600" />
            <div>
              <p className="text-sm font-semibold text-rose-900">
                {expiringLicensesCount} clinical credential{expiringLicensesCount === 1 ? '' : 's'} require review
              </p>
              <p className="mt-0.5 text-xs leading-5 text-rose-700">
                Credentials enter the 30-day renewal window and may affect future scheduling.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => navigate('/hr/licenses')}
            className="min-h-10 rounded-xl border border-rose-300 bg-white px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-100"
          >
            Review credentials
          </button>
        </div>
      )}

      <div className="grid grid-cols-[repeat(auto-fit,minmax(190px,1fr))] gap-4">
        <AnalyticsMetricCard title="Total headcount" value={hrMetrics.headcount} />
        <AnalyticsMetricCard title="Pending leave" value={hrMetrics.pendingLeave} severity={hrMetrics.pendingLeave > 8 ? 'warning' : 'info'} />
        <AnalyticsMetricCard title="Expired licenses" value={hrMetrics.expiredLicenses} severity={hrMetrics.expiredLicenses > 0 ? 'critical' : 'success'} />
        <AnalyticsMetricCard title="Staffing gap" value={hrMetrics.staffingGap} severity={hrMetrics.staffingGap > 0 ? 'warning' : 'success'} />
      </div>

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 xl:col-span-8">
          <EmployeeWorklist employees={filteredEmployees} />
        </div>
        <div className="col-span-12 xl:col-span-4">
          <LeaveQueuePanel requests={mappedLeave} />
        </div>

        <div className="col-span-12 xl:col-span-7">
          <ChartCard
            title="Headcount trend"
            description="Six-month synthetic workforce growth used for capacity review."
            emphasis="primary"
          >
            <TrendLineChart
              data={demoHrDashboard.headcountTrend}
              title="Headcount trend"
              valueLabel="Headcount"
            />
          </ChartCard>
        </div>
        <div className="col-span-12 xl:col-span-5">
          <InsightPanel insights={demoHrDashboard.insights} title="Workforce decisions" />
        </div>

        <div className="col-span-12 xl:col-span-6">
          <LicenseMonitorPanel licenses={mappedLicenses} />
        </div>
        <div className="col-span-12 xl:col-span-6">
          <ChartCard
            title="Leave mix"
            description="Approved and pending leave composition in the displayed scenario."
          >
            <StatusDonutChart data={demoHrDashboard.leaveBreakdown} title="Leave mix" />
          </ChartCard>
        </div>

        <div className="col-span-12 xl:col-span-6">
          <ChartCard
            title="Attendance trend"
            description="Synthetic attendance percentage across the current week."
          >
            <TrendLineChart
              data={demoHrDashboard.attendanceTrend}
              title="Attendance trend"
              valueLabel="Attendance"
              valueFormatter={(value) => `${value}%`}
              yDomain={[80, 100]}
            />
          </ChartCard>
        </div>

        <div className="col-span-12 xl:col-span-6">
          <ChartCard
            title="Staffing gap by department"
            description="Estimated open full-time equivalents by service area."
          >
            <ComparisonBarChart
              data={demoHrDashboard.staffingGap}
              title="Staffing gap by department"
              valueLabel="FTE gap"
              horizontal
            />
          </ChartCard>
        </div>
        <div className="col-span-12 xl:col-span-6">
          <ChartCard
            title="Payroll trend"
            description="Synthetic monthly payroll used for layout and capacity review."
          >
            <TrendLineChart
              data={demoHrDashboard.payrollTrend}
              title="Payroll trend"
              valueLabel="Payroll"
              valueFormatter={currencyFormatter}
            />
          </ChartCard>
        </div>
      </div>
    </HmsDashboardShell>
  );
};

export default HRDashboard;
