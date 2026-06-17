import React, { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { PageHeader } from '../../../components/ui/page-header';
import {
  AnalyticsMetricCard,
  ChartCard,
  ComparisonBarChart,
  DashboardFilterBar,
  InsightPanel,
  ReportTable,
  StatusDonutChart,
  TrendLineChart,
} from '../../../components/analytics';
import {
  HmsDashboardShell,
  HmsAuditFooter,
} from '../../../components/hms-dashboard';
import MarketplaceAdminShellNotice from './components/MarketplaceAdminShellNotice';
import MarketplaceAdminScopeFilter from './components/MarketplaceAdminScopeFilter';
import { defaultDateRange } from '../../../data/analytics/adminAnalytics.mock';
import {
  disputesByType,
  gmvTrend,
  marketplaceAdminMetrics,
  marketplaceInsights,
  marketplaceQueueColumns,
  marketplaceQueueRows,
  ordersByCategory,
  supplierRanking,
  warrantyClaimsTrend,
} from '../../../data/analytics/marketplaceAnalytics.mock';
import type { DateRange } from '../../../types/analytics';

export const MarketplaceAdminDashboard: React.FC = () => {
  const [dateRange, setDateRange] = useState<DateRange>(defaultDateRange);
  const [reportType, setReportType] = useState('governance');

  return (
    <HmsDashboardShell
      widthTier="full"
      footer={<HmsAuditFooter dataSource="Mock marketplace analytics (sandbox)" />}
    >
      <div className="space-y-6 pb-12">
        <MarketplaceAdminShellNotice />
        <PageHeader title="Marketplace Governance Command Center" description="Supplier approvals, listings, disputes, GMV, commission, fulfillment SLA, and warranty risk." actions={<button type="button" onClick={() => window.location.reload()} aria-label="Refresh marketplace dashboard" className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-black text-slate-700 hover:bg-slate-50"><RefreshCw className="h-4 w-4" /> Refresh</button>} />

        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs font-semibold text-amber-800" data-testid="marketplace-admin-sandbox-notice">
          <strong>Sandbox Notice:</strong> Marketplace governance metrics, trend charts, and queue drilldown on this page are mock analytics. No live supplier approvals, dispute resolutions, warranty claim decisions, commission/fee mutations, or fulfillment SLA signals are aggregated here. The live part of this module is the listing approval queue and KPI counts on the Listing Approval page.
        </div>

        <MarketplaceAdminScopeFilter />
        <DashboardFilterBar dateRange={dateRange} onDateRangeChange={setDateRange} reportType={reportType} onReportTypeChange={setReportType} reportTypeOptions={[{ label: 'Governance', value: 'governance' }, { label: 'Fulfillment', value: 'fulfillment' }, { label: 'Revenue', value: 'revenue' }]} />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-7">{marketplaceAdminMetrics.map(metric => <AnalyticsMetricCard key={metric.title} {...metric} />)}</div>
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <ChartCard title="GMV trend (mock)" description="Sandbox gross marketplace volume trend." height={300}><TrendLineChart data={gmvTrend} title="GMV trend" valueLabel="₱M" /></ChartCard>
          <ChartCard title="Orders by category (mock)" description="Demand split across device and supply categories." height={300}><ComparisonBarChart data={ordersByCategory} title="Orders by category" valueLabel="Orders" /></ChartCard>
          <ChartCard title="Supplier performance ranking (mock)" description="SLA ranking for marketplace governance." height={300}><ComparisonBarChart data={supplierRanking} title="Supplier performance ranking" valueLabel="SLA %" /></ChartCard>
          <ChartCard title="Disputes by type (mock)" description="Risk distribution by dispute class." height={300}><StatusDonutChart data={disputesByType} title="Disputes by type" /></ChartCard>
          <ChartCard title="Warranty claims trend (mock)" description="Weekly warranty claim volume." height={300}><TrendLineChart data={warrantyClaimsTrend} title="Warranty claims trend" valueLabel="Claims" /></ChartCard>
          <InsightPanel insights={marketplaceInsights} title="Marketplace fraud/SLA insights" />
        </div>
        <ReportTable columns={marketplaceQueueColumns} rows={marketplaceQueueRows} caption="Marketplace approval and dispute drilldown table (mock)" />
      </div>
    </HmsDashboardShell>
  );
};

export default MarketplaceAdminDashboard;
