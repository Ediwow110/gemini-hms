import React, { useState } from 'react';
import { CalendarClock } from 'lucide-react';
import { PageHeader } from '../../../components/ui/page-header';
import MarketplaceAdminShellNotice from './components/MarketplaceAdminShellNotice';
import {
  AnalyticsMetricCard,
  ChartCard,
  ComparisonBarChart,
  DashboardFilterBar,
  InsightPanel,
  ReportExportButton,
  ReportTable,
  TrendLineChart,
} from '../../../components/analytics';
import { defaultDateRange } from '../../../data/analytics/adminAnalytics.mock';
import {
  gmvTrend,
  marketplaceAdminMetrics,
  marketplaceInsights,
  marketplaceReportColumns,
  marketplaceReportRows,
  ordersByCategory,
  supplierRanking,
  warrantyClaimsTrend,
} from '../../../data/analytics/marketplaceAnalytics.mock';
import type { DateRange } from '../../../types/analytics';

export const MarketplaceReportsPage: React.FC = () => {
  const [dateRange, setDateRange] = useState<DateRange>(defaultDateRange);
  const [reportType, setReportType] = useState('marketplace-health');

  return (
    <div className="space-y-6 pb-12">
      <MarketplaceAdminShellNotice />
      <PageHeader
        title="Marketplace Reports"
        description="Governed marketplace analytics for GMV, category performance, supplier SLA, disputes, and warranty claims."
        breadcrumbs={[{ label: 'Marketplace Admin', to: '/marketplace-admin' }, { label: 'Reports' }]}
        actions={<div className="flex flex-wrap items-start gap-3"><ReportExportButton label="Export marketplace report" sensitive requiresReason /><button type="button" disabled title="Schedule report backend is not available yet." className="inline-flex min-h-11 cursor-not-allowed items-center gap-2 rounded-xl border border-slate-200 bg-slate-100 px-4 py-2 text-xs font-black text-slate-400"><CalendarClock className="h-4 w-4" /> Schedule WIP</button></div>}
      />
      <DashboardFilterBar dateRange={dateRange} onDateRangeChange={setDateRange} reportType={reportType} onReportTypeChange={setReportType} reportTypeOptions={[{ label: 'Marketplace health', value: 'marketplace-health' }, { label: 'Supplier SLA', value: 'supplier-sla' }, { label: 'Warranty', value: 'warranty' }]} />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">{marketplaceAdminMetrics.slice(0, 4).map(metric => <AnalyticsMetricCard key={metric.title} {...metric} />)}</div>
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <ChartCard title="GMV trend" description="Revenue trend for governance review." height={300}><TrendLineChart data={gmvTrend} title="GMV trend" valueLabel="₱M" /></ChartCard>
        <ChartCard title="Orders by category" description="Category volume to drive approvals and supplier monitoring." height={300}><ComparisonBarChart data={ordersByCategory} title="Orders by category" /></ChartCard>
        <ChartCard title="Supplier SLA ranking" description="Supplier performance table companion chart." height={300}><ComparisonBarChart data={supplierRanking} title="Supplier SLA ranking" valueLabel="SLA %" /></ChartCard>
        <ChartCard title="Warranty claims trend" description="Weekly claims requiring governance monitoring." height={300}><TrendLineChart data={warrantyClaimsTrend} title="Warranty claims trend" valueLabel="Claims" /></ChartCard>
      </div>
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3"><InsightPanel insights={marketplaceInsights} title="Marketplace report insights" /><div className="xl:col-span-2"><ReportTable columns={marketplaceReportColumns} rows={marketplaceReportRows} caption="Marketplace category performance report" /></div></div>
    </div>
  );
};

export default MarketplaceReportsPage;
