import { PageHeader } from '../../components/ui/page-header';
import { HmsDataSourceBadge } from '../../components/hms-dashboard';
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

export const Reports = () => {
  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs font-semibold text-amber-800">
        <strong>Branch reports:</strong> Report metrics use local analytics data. Export is disabled until a governed backend endpoint with reason capture and audit logging exists.
      </div>
      <PageHeader
        title="Branch Reports & Analytics"
        description="Operational report filters, queue trends, exception insights, and drilldown tables for branch administrators."
        breadcrumbs={[{ label: 'Reports' }]}
        statusBadge={<HmsDataSourceBadge mode="prototype" label="Synthetic branch report" />}
        actions={<ReportExportButton label="Export branch report" sensitive requiresReason />}
      />
      <DashboardFilterBar
        dateRange={defaultDateRange}
        onDateRangeChange={() => undefined}
        department="all"
        onDepartmentChange={() => undefined}
        disabled
        disabledReason="Filters are disabled because this report currently uses a fixed synthetic scenario rather than a queryable analytics endpoint."
      />
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
