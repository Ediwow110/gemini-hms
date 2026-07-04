import React, { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { PageHeader } from '../../../components/ui/page-header';
import {
  AnalyticsMetricCard,
  ChartCard,
  ComparisonBarChart,
  DashboardFilterBar,
  InsightPanel,
  StatusDonutChart,
  TrendLineChart,
} from '../../../components/analytics';
import {
  HmsDashboardShell,
  HmsAuditFooter,
} from '../../../components/hms-dashboard';
import MarketplaceAdminScopeFilter from './components/MarketplaceAdminScopeFilter';
import { useAnalytics } from '../../../hooks/use-analytics';
import type { DateRange } from '../../../types/analytics';

export const MarketplaceAdminDashboard: React.FC = () => {
  const [dateRange, setDateRange] = useState<DateRange>({ from: '2026-01-01', to: '2026-06-25' });
  const [reportType, setReportType] = useState('governance');

  const { marketplace: mpMetrics, isLoading } = useAnalytics();

  if (isLoading) return <div className="p-10 text-center text-slate-400">Loading marketplace data...</div>;

  return (
    <HmsDashboardShell
      widthTier="full"
      footer={<HmsAuditFooter dataSource="Marketplace Analytics Database" />}
    >
      <div className="space-y-6 pb-12">
        <PageHeader title="Marketplace Governance Command Center" description="Supplier approvals, listings, disputes, GMV, commission, fulfillment SLA, and warranty risk." actions={<button type="button" onClick={() => window.location.reload()} aria-label="Refresh marketplace dashboard" className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-black text-slate-700 hover:bg-slate-50"><RefreshCw className="h-4 w-4" /> Refresh</button>} />

        <MarketplaceAdminScopeFilter />
        <DashboardFilterBar dateRange={dateRange} onDateRangeChange={setDateRange} reportType={reportType} onReportTypeChange={setReportType} reportTypeOptions={[{ label: 'Governance', value: 'governance' }, { label: 'Fulfillment', value: 'fulfillment' }, { label: 'Revenue', value: 'revenue' }]} />
        
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <AnalyticsMetricCard title="Gross Merchandise Value" value={mpMetrics?.gmv || 0} trend={{ value: '+15%', direction: 'positive' }} />
          <AnalyticsMetricCard title="Total Orders" value={mpMetrics?.totalOrders || 0} trend={{ value: '+8%', direction: 'positive' }} />
          <AnalyticsMetricCard title="Approved Listings" value={mpMetrics?.approvedListings || 0} trend={{ value: '0%', direction: 'neutral' }} />
          <AnalyticsMetricCard title="Platform Revenue" value={mpMetrics?.revenue || 0} trend={{ value: '+5%', direction: 'positive' }} />
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <ChartCard title="GMV trend" description="Gross marketplace volume trend." height={300}><TrendLineChart data={[]} title="GMV trend" valueLabel="₱M" /></ChartCard>
          <ChartCard title="Orders by category" description="Demand split across device and supply categories." height={300}><ComparisonBarChart data={[]} title="Orders by category" valueLabel="Orders" /></ChartCard>
          <ChartCard title="Supplier performance ranking" description="SLA ranking for marketplace governance." height={300}><ComparisonBarChart data={[]} title="Supplier performance ranking" valueLabel="SLA %" /></ChartCard>
          <ChartCard title="Disputes by type" description="Risk distribution by dispute class." height={300}><StatusDonutChart data={[]} title="Disputes by type" /></ChartCard>
          <ChartCard title="Warranty claims trend" description="Weekly warranty claim volume." height={300}><TrendLineChart data={[]} title="Warranty claims trend" valueLabel="Claims" /></ChartCard>
          <InsightPanel insights={[]} title="Marketplace fraud/SLA insights" />
        </div>
        <div className="card bg-white border border-slate-200/80 shadow-sm rounded-2xl p-6 text-center text-slate-400">
          <p className="text-xs font-bold">Detailed approval and dispute drilldown data is being aggregated from live logs.</p>
        </div>
      </div>
    </HmsDashboardShell>
  );
};

export default MarketplaceAdminDashboard;
