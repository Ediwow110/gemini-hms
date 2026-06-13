import React, { useState, useEffect } from 'react';
import { CalendarClock, RefreshCw } from 'lucide-react';
import { HmsPageHeader } from '../../components/hms-page';
import { HmsDashboardShell, HmsAuditFooter, HmsLoadingSkeleton } from '../../components/hms-dashboard';
import { AdminShellNotice } from './components/AdminShellNotice';
import {
  AnalyticsMetricCard,
  ChartCard,
  ComparisonBarChart,
  DashboardFilterBar,
  InsightPanel,
  ReportExportButton,
  ReportTable,
  StatusDonutChart,
  TrendLineChart,
  VolumeAreaChart,
} from '../../components/analytics';
import {
  adminInsights,
  adminReportMetrics,
  adminTenantOptions,
  backgroundJobColumns,
  backgroundJobRows,
  dbGrowthTrend,
  defaultDateRange,
  jobStatusBreakdown,
  systemHealthTrend,
  transactionVolumeTrend,
} from '../../data/analytics/adminAnalytics.mock';
import type { DateRange } from '../../types/analytics';

export const ReportsAnalyticsPage: React.FC = () => {
  const [dateRange, setDateRange] = useState<DateRange>(defaultDateRange);
  const [tenant, setTenant] = useState('all');
  const [branch, setBranch] = useState('all');
  const [reportType, setReportType] = useState('operations');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <HmsDashboardShell>
        <HmsLoadingSkeleton variant="kpi" />
        <HmsLoadingSkeleton variant="table" rows={4} />
      </HmsDashboardShell>
    );
  }

  return (
    <HmsDashboardShell widthTier="full"
      footer={<HmsAuditFooter dataSource="Mock analytics (sandbox)" />}
    >
      <AdminShellNotice />
      <HmsPageHeader
        title="System Reports & Performance Analytics"
        description="Operational reporting workspace for transactions, APIs, background jobs, storage, and export governance."
        badge="Sandbox"
        actions={(
          <div className="flex flex-wrap items-start gap-3">
            <ReportExportButton label="Export operations summary" sensitive requiresReason />
            <button type="button" disabled title="Schedule report backend is not available yet." className="inline-flex min-h-11 cursor-not-allowed items-center gap-2 rounded-xl border border-slate-200 bg-slate-100 px-4 py-2 text-xs font-black text-slate-400">
              <CalendarClock className="h-4 w-4" aria-hidden="true" /> Schedule WIP
            </button>
            <button type="button" onClick={() => window.location.reload()} aria-label="Refresh reports analytics" className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-black text-slate-700 hover:bg-slate-50">
              <RefreshCw className="h-4 w-4" aria-hidden="true" /> Refresh
            </button>
          </div>
        )}
      />
      <DashboardFilterBar
        dateRange={dateRange}
        onDateRangeChange={setDateRange}
        tenant={tenant}
        onTenantChange={setTenant}
        tenantOptions={adminTenantOptions}
        branch={branch}
        onBranchChange={setBranch}
        reportType={reportType}
        onReportTypeChange={setReportType}
        reportTypeOptions={[{ label: 'Operations', value: 'operations' }, { label: 'Security', value: 'security' }, { label: 'Storage', value: 'storage' }]}
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-6">
        {adminReportMetrics.map((metric) => <AnalyticsMetricCard key={metric.title} {...metric} />)}
      </div>
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <ChartCard title="Transaction volume trend" description="Operational volume for staffing and queue capacity planning." height={300}>
          <VolumeAreaChart data={transactionVolumeTrend} title="Transaction volume trend" valueLabel="Transactions" />
        </ChartCard>
        <ChartCard title="API latency / availability trend" description="Synthetic latency trend for service health review." height={300}>
          <TrendLineChart data={systemHealthTrend} title="API latency trend" valueLabel="API ms" secondaryLabel="DB pressure" />
        </ChartCard>
        <ChartCard title="Storage and database growth" description="Capacity trend used to identify tenant growth risks." height={300}>
          <ComparisonBarChart data={dbGrowthTrend} title="DB growth" valueLabel="GB" />
        </ChartCard>
        <ChartCard title="Background job status" description="Failed jobs should route to IT support and audit review." height={300}>
          <StatusDonutChart data={jobStatusBreakdown} title="Background job status" />
        </ChartCard>
      </div>
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div><InsightPanel insights={adminInsights} title="Report anomalies and recommendations" /></div>
        <div className="xl:col-span-2"><ReportTable columns={backgroundJobColumns} rows={backgroundJobRows} caption="Background jobs report table" /></div>
      </div>
    </HmsDashboardShell>
  );
};

export default ReportsAnalyticsPage;
