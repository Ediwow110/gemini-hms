import React, { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { PageHeader } from '../../components/ui/page-header';
import {
  AnalyticsMetricCard,
  ChartCard,
  ComparisonBarChart,
  DashboardFilterBar,
  FunnelSteps,
  InsightPanel,
  ReportTable,
  TrendLineChart,
} from '../../components/analytics';
import ProcurementScopeFilter from './components/ProcurementScopeFilter';
import { defaultDateRange } from '../../data/analytics/adminAnalytics.mock';
import {
  deliveryDelayTrend,
  procurementFunnel,
  procurementInsights,
  procurementMetrics,
  spendByCategory,
  supplierSlaComparison,
  urgentPurchaseColumns,
  urgentPurchaseRows,
} from '../../data/analytics/procurementAnalytics.mock';
import type { DateRange } from '../../types/analytics';

export const ProcurementDashboard: React.FC = () => {
  const [dateRange, setDateRange] = useState<DateRange>(defaultDateRange);
  const [department, setDepartment] = useState('all');

  return (
    <div className="space-y-6 pb-12">
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs font-semibold text-amber-800"><strong>Sandbox Notice:</strong> Supply-chain analytics are mock data. No financial commitments, purchase approvals, or stock mutations are performed.</div>
      <PageHeader title="Procurement Intelligence Center" description="PR/RFQ/PO funnel, spend pressure, supplier SLA, delivery delays, and urgent purchase worklists." actions={<button type="button" onClick={() => window.location.reload()} aria-label="Refresh procurement dashboard" className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-black text-slate-700 hover:bg-slate-50"><RefreshCw className="h-4 w-4" /> Refresh</button>} />
      <ProcurementScopeFilter />
      <DashboardFilterBar dateRange={dateRange} onDateRangeChange={setDateRange} department={department} onDepartmentChange={setDepartment} />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-6">{procurementMetrics.map(metric => <AnalyticsMetricCard key={metric.title} {...metric} />)}</div>
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <ChartCard title="PR → RFQ → PO → Receiving funnel" description="Identifies workflow drop-off between request and receiving." height={320}><FunnelSteps data={procurementFunnel} title="Procurement workflow funnel" /></ChartCard>
        <ChartCard title="Spend by category" description="Budget pressure by sourcing category in millions." height={320}><ComparisonBarChart data={spendByCategory} title="Spend by category" valueLabel="₱M" /></ChartCard>
        <ChartCard title="Supplier SLA comparison" description="On-time delivery by priority supplier." height={300}><ComparisonBarChart data={supplierSlaComparison} title="Supplier SLA" valueLabel="SLA %" /></ChartCard>
        <ChartCard title="Delivery delay trend" description="Delayed delivery count by week." height={300}><TrendLineChart data={deliveryDelayTrend} title="Delivery delay trend" valueLabel="Delays" /></ChartCard>
      </div>
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <InsightPanel insights={procurementInsights} title="Procurement alerts" />
        <div className="xl:col-span-2"><ReportTable columns={urgentPurchaseColumns} rows={urgentPurchaseRows} caption="Urgent purchase requests and delayed POs" /></div>
      </div>
    </div>
  );
};

export default ProcurementDashboard;
