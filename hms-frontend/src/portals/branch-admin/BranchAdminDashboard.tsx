import React, { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { PageHeader } from '../../components/ui/page-header';
import {
  AnalyticsMetricCard,
  ChartCard,
  ComparisonBarChart,
  DashboardFilterBar,
  HeatmapGrid,
  InsightPanel,
  ReportTable,
  StatusDonutChart,
  VolumeAreaChart,
} from '../../components/analytics';
import {
  branchInsights,
  branchMetrics,
  delayedPatientColumns,
  delayedPatientRows,
  patientVolumeByHour,
  queueByDepartment,
  roomOccupancy,
  staffWorkloadHeatmap,
} from '../../data/analytics/branchAnalytics.mock';
import { defaultDateRange } from '../../data/analytics/adminAnalytics.mock';
import type { DateRange } from '../../types/analytics';

export const BranchAdminDashboard: React.FC = () => {
  const [dateRange, setDateRange] = useState<DateRange>(defaultDateRange);
  const [department, setDepartment] = useState('all');

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs font-semibold text-amber-800">
        <strong>Branch sandbox analytics:</strong> Branch operation signals are mock data until branch command-center APIs are available. Drilldowns link only to existing routes.
      </div>
      <PageHeader
        title="Branch Operations Command Center"
        description="Patient flow, queue delays, room utilization, staffing coverage, revenue risk, and operational alerts."
        breadcrumbs={[{ label: 'Branch Admin', to: '/branch-admin' }, { label: 'Dashboard' }]}
        actions={<button type="button" onClick={() => window.location.reload()} aria-label="Refresh branch dashboard" className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-black text-slate-700 hover:bg-slate-50"><RefreshCw className="h-4 w-4" /> Refresh</button>}
      />
      <DashboardFilterBar dateRange={dateRange} onDateRangeChange={setDateRange} department={department} onDepartmentChange={setDepartment} />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-6">{branchMetrics.map(metric => <AnalyticsMetricCard key={metric.title} {...metric} />)}</div>
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <ChartCard title="Patient volume by hour" description="Shows surge windows for queue/staffing decisions." height={300}><VolumeAreaChart data={patientVolumeByHour} title="Patient volume by hour" /></ChartCard>
        <ChartCard title="Queue status by department" description="Department queue split for immediate escalation." height={300}><StatusDonutChart data={queueByDepartment} title="Queue by department" /></ChartCard>
        <ChartCard title="Room occupancy" description="Utilization across service areas." height={300}><ComparisonBarChart data={roomOccupancy} title="Room occupancy" valueLabel="Occupancy %" /></ChartCard>
        <ChartCard title="Staff workload heatmap" description="Shift-based staffing load view." height={300}><HeatmapGrid data={staffWorkloadHeatmap} title="Staff workload heatmap" /></ChartCard>
      </div>
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <InsightPanel insights={branchInsights} title="Branch alerts and decisions" />
        <div className="xl:col-span-2"><ReportTable columns={delayedPatientColumns} rows={delayedPatientRows} caption="Delayed patients drilldown table" /></div>
      </div>
    </div>
  );
};

export default BranchAdminDashboard;
