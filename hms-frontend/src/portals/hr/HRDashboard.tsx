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
import { LeaveQueuePanel, LeaveRequest } from './components/LeaveQueuePanel';
import { LicenseMonitorPanel, License } from './components/LicenseMonitorPanel';
import { defaultDateRange } from '../../data/analytics/adminAnalytics.mock';
import { attendanceTrend, headcountTrend, hrInsights, hrMetrics, leaveBreakdown, payrollTrend, staffingGapByDepartment } from '../../data/analytics/hrAnalytics.mock';
import type { DateRange } from '../../types/analytics';
import {
  HmsDashboardShell,
  HmsToolbar,
  HmsAuditFooter,
} from '../../components/hms-dashboard';

const mockEmployees: Employee[] = [
  { id: '1', name: 'Employee 001', email: 'employee001@sandbox.local', role: 'Chief Diagnostician', department: 'Clinical', branch: 'St. Jude Metro', status: 'ACTIVE', rawStatus: 'ACTIVE', joinedAt: '2024-01-15' },
  { id: '2', name: 'Employee 002', email: 'employee002@sandbox.local', role: 'Head Nurse', department: 'Nursing', branch: 'St. Jude Metro', status: 'ACTIVE', rawStatus: 'ACTIVE', joinedAt: '2024-03-22' },
  { id: '3', name: 'Employee 003', email: 'employee003@sandbox.local', role: 'Legal Counsel', department: 'Admin', branch: 'St. Jude North', status: 'TERMINATED', rawStatus: 'TERMINATED', joinedAt: '2023-11-05' },
  { id: '4', name: 'Employee 004', email: 'employee004@sandbox.local', role: 'Oncology Head', department: 'Clinical', branch: 'St. Jude Metro', status: 'ON_LEAVE', rawStatus: 'ON_LEAVE', joinedAt: '2024-02-10' },
];

const mockLeaveRequests: LeaveRequest[] = [
  { id: 'LR-001', employeeName: 'Employee 004', type: 'ANNUAL', startDate: '2026-05-25', endDate: '2026-06-05', days: 10, status: 'PENDING' },
  { id: 'LR-002', employeeName: 'Employee 005', type: 'EMERGENCY', startDate: '2026-05-21', endDate: '2026-05-23', days: 2, status: 'PENDING' },
];

const mockLicenses: License[] = [
  { id: 'LIC-001', employeeName: 'Employee 001', type: 'Medical Board License', expiryDate: '2026-06-15', daysRemaining: 25, status: 'EXPIRING' },
  { id: 'LIC-002', employeeName: 'Employee 002', type: 'Nursing License', expiryDate: '2026-08-30', daysRemaining: 101, status: 'VALID' },
];

export const HRDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [dateRange, setDateRange] = useState<DateRange>(defaultDateRange);
  const [department, setDepartment] = useState('all');

  const expiringLicensesCount = mockLicenses.filter(l => l.status === 'EXPIRING').length;
  const expiringDescription = expiringLicensesCount > 0
    ? `${expiringLicensesCount} provider credentials expire within 30 days. Action is required to avoid scheduling blocks.`
    : 'No provider credentials are currently flagged as expiring. The sandbox roster is illustrative.';

  return (
    <HmsDashboardShell widthTier="full"
      toolbar={
        <HmsToolbar
          branchName="All Branches"
          role="HR Command Center"
          onRefresh={() => window.location.reload()}
        />
      }
      footer={<HmsAuditFooter dataSource="Workforce HR Database (Simulated)" />}
    >
      <div className="space-y-6 pb-12">
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs font-semibold text-amber-800">
          <strong>Sandbox Notice:</strong> Workforce analytics are mock data moved out of the page component. No real HR or payroll actions are performed.
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
          {/* KPI metrics - 6 XS-size telemetry metrics (2 cols each on desktop) */}
          {hrMetrics.map(metric => (
            <div key={metric.title} className="col-span-12 sm:col-span-4 xl:col-span-2">
              <AnalyticsMetricCard {...metric} />
            </div>
          ))}

          {/* Primary Work Row: Employee List (XL Card) & Leave Approvals Queue (L Card) */}
          <div className="col-span-12 xl:col-span-8">
            <EmployeeWorklist employees={mockEmployees} />
          </div>
          <div className="col-span-12 xl:col-span-4">
            <LeaveQueuePanel requests={mockLeaveRequests} />
          </div>

          {/* Secondary Insight Row: Licensure Verification Panel (L Card) + Workforce insights (L Card) */}
          <div className="col-span-12 xl:col-span-6">
            <LicenseMonitorPanel licenses={mockLicenses} />
          </div>
          <div className="col-span-12 xl:col-span-6">
            <InsightPanel insights={hrInsights} title="Workforce insights" />
          </div>

          {/* Bottom Supporting Row: Trends & Charts */}
          <div className="col-span-12 md:col-span-6 xl:col-span-4">
            <ChartCard title="Headcount trend" description="Workforce growth by month." height={280}>
              <TrendLineChart data={headcountTrend} title="Headcount trend" />
            </ChartCard>
          </div>
          <div className="col-span-12 md:col-span-6 xl:col-span-4">
            <ChartCard title="Attendance trend" description="Daily attendance percentage." height={280}>
              <TrendLineChart data={attendanceTrend} title="Attendance trend" valueLabel="Attendance %" />
            </ChartCard>
          </div>
          <div className="col-span-12 md:col-span-6 xl:col-span-4">
            <ChartCard title="Leave type breakdown" description="Leave pressure by type." height={280}>
              <StatusDonutChart data={leaveBreakdown} title="Leave type breakdown" />
            </ChartCard>
          </div>
          <div className="col-span-12 md:col-span-6 xl:col-span-6">
            <ChartCard title="Staffing gap by department" description="FTE gap estimate by department." height={280}>
              <ComparisonBarChart data={staffingGapByDepartment} title="Staffing gap" valueLabel="FTE gap" />
            </ChartCard>
          </div>
          <div className="col-span-12 md:col-span-12 xl:col-span-6">
            <ChartCard title="Payroll trend" description="Payroll amount trend in millions." height={280}>
              <TrendLineChart data={payrollTrend} title="Payroll trend" valueLabel="₱M" />
            </ChartCard>
          </div>
        </div>
      </div>
    </HmsDashboardShell>
  );
};

export default HRDashboard;
