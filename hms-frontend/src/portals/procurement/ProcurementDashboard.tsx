import React, { useState } from 'react';
import { ShieldAlert } from 'lucide-react';
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
import {
  HmsDashboardShell,
  HmsToolbar,
  HmsAuditFooter,
} from '../../components/hms-dashboard';

export const ProcurementDashboard: React.FC = () => {
  const [dateRange, setDateRange] = useState<DateRange>(defaultDateRange);
  const [department, setDepartment] = useState('all');

  return (
    <HmsDashboardShell widthTier="full"
      toolbar={
        <HmsToolbar
          branchName="All Branches"
          role="Procurement Officer"
          onRefresh={() => window.location.reload()}
        />
      }
      footer={<HmsAuditFooter dataSource="Supply Chain Database (Simulated)" />}
    >
      <div className="space-y-6 pb-12">
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs font-semibold text-amber-800">
          <strong>Sandbox Notice:</strong> Supply-chain analytics are mock data. No financial commitments, purchase approvals, or stock mutations are performed.
        </div>

        {/* Alert Strip: Supply Chain Alert */}
        <div className="rounded-xl border border-rose-200 bg-rose-50/50 px-4 py-3 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-rose-600 flex-shrink-0" />
            <div>
              <span className="text-[12px] font-bold text-rose-900 block">SUPPLY CHAIN ALERT: CRITICAL STOCKOUTS DETECTED</span>
              <span className="text-[10px] text-rose-700 font-semibold block mt-0.5">3 inventory items are below threshold. RFQ creation is recommended.</span>
            </div>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="text-[11px] font-bold text-rose-700 bg-rose-100 hover:bg-rose-200 border border-rose-350 rounded-md px-2.5 py-1 cursor-pointer transition-colors"
          >
            Auto-Generate RFQs
          </button>
        </div>

        <ProcurementScopeFilter />
        <DashboardFilterBar dateRange={dateRange} onDateRangeChange={setDateRange} department={department} onDepartmentChange={setDepartment} />

        <div className="grid grid-cols-12 gap-6">
          {/* KPI metrics - 6 XS-size telemetry metrics (2 cols each on desktop) */}
          {procurementMetrics.map(metric => (
            <div key={metric.title} className="col-span-12 sm:col-span-4 xl:col-span-2">
              <AnalyticsMetricCard {...metric} />
            </div>
          ))}

          {/* Primary Work Row: Table (XL Card) & Insights/Alerts Panel (L Card) */}
          <div className="col-span-12 xl:col-span-8">
            <ReportTable columns={urgentPurchaseColumns} rows={urgentPurchaseRows} caption="Urgent purchase requests and delayed POs" />
          </div>
          <div className="col-span-12 xl:col-span-4">
            <InsightPanel insights={procurementInsights} title="Procurement alerts" />
          </div>

          {/* Secondary Insight Row: Funnel Steps (L Card) + Spend By Category (L Card) */}
          <div className="col-span-12 xl:col-span-6">
            <ChartCard title="PR → RFQ → PO → Receiving funnel" description="Identifies workflow drop-off between request and receiving." height={320}>
              <FunnelSteps data={procurementFunnel} title="Procurement workflow funnel" />
            </ChartCard>
          </div>
          <div className="col-span-12 xl:col-span-6">
            <ChartCard title="Spend by category" description="Budget pressure by sourcing category in millions." height={320}>
              <ComparisonBarChart data={spendByCategory} title="Spend by category" valueLabel="₱M" />
            </ChartCard>
          </div>

          {/* Bottom Supporting Row: Supplier SLA Comparison (L Card) + Delivery Delay Trend (L Card) */}
          <div className="col-span-12 xl:col-span-6">
            <ChartCard title="Supplier SLA comparison" description="On-time delivery by priority supplier." height={300}>
              <ComparisonBarChart data={supplierSlaComparison} title="Supplier SLA" valueLabel="SLA %" />
            </ChartCard>
          </div>
          <div className="col-span-12 xl:col-span-6">
            <ChartCard title="Delivery delay trend" description="Delayed delivery count by week." height={300}>
              <TrendLineChart data={deliveryDelayTrend} title="Delivery delay trend" valueLabel="Delays" />
            </ChartCard>
          </div>
        </div>
      </div>
    </HmsDashboardShell>
  );
};

export default ProcurementDashboard;
