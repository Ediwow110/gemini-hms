import { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { PageHeader } from '../../components/ui/page-header';
import {
  AnalyticsMetricCard,
  ChartCard,
  DashboardFilterBar,
  InsightPanel,
  ReportExportButton,
  ReportTable,
  StatusDonutChart,
  VolumeAreaChart,
} from '../../components/analytics';
import { defaultDateRange } from '../../data/analytics/adminAnalytics.mock';
import {
  branchInsights,
  branchMetrics,
  delayedPatientColumns,
  delayedPatientRows,
  patientVolumeByHour,
  queueByDepartment,
} from '../../data/analytics/branchAnalytics.mock';
import type { DateRange } from '../../types/analytics';

export const Reports = () => {
  const [dateRange, setDateRange] = useState<DateRange>(defaultDateRange);
  const [department, setDepartment] = useState('all');

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs font-semibold text-amber-800">
        <strong>Branch reports sandbox:</strong> Report metrics are mock analytics. Export is disabled until a governed backend endpoint with reason capture and audit logging exists.
      </div>
      <PageHeader
        title="Branch Reports & Analytics"
        description="Operational report filters, queue trends, exception insights, and drilldown tables for branch administrators."
        breadcrumbs={[{ label: 'Reports' }]}
        actions={(
          <div className="flex flex-wrap items-start gap-3">
            <ReportExportButton label="Export branch report" sensitive requiresReason />
            <button type="button" onClick={() => window.location.reload()} aria-label="Refresh branch reports" className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-black text-slate-700 hover:bg-slate-50"><RefreshCw className="h-4 w-4" /> Refresh</button>
          </div>
        )}
      />
      <DashboardFilterBar dateRange={dateRange} onDateRangeChange={setDateRange} department={department} onDepartmentChange={setDepartment} />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-6">{branchMetrics.map(metric => <AnalyticsMetricCard key={metric.title} {...metric} />)}</div>
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <ChartCard title="Patient volume trend" description="Supports hour-by-hour staffing decisions." height={300}><VolumeAreaChart data={patientVolumeByHour} title="Patient volume trend" /></ChartCard>
        <ChartCard title="Queue status breakdown" description="Highlights departments with operational backlog." height={300}><StatusDonutChart data={queueByDepartment} title="Queue status breakdown" /></ChartCard>
      </div>
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <InsightPanel insights={branchInsights} title="Branch report insights" />
        <div className="xl:col-span-2"><ReportTable columns={delayedPatientColumns} rows={delayedPatientRows} caption="Branch exception report table" /></div>
      </div>
    </div>
  );
};
