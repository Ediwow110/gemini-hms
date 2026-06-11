import React, { useState, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';
import { HmsPageHeader } from '../../components/hms-page';
import { HmsDashboardShell, HmsAuditFooter, HmsLoadingSkeleton } from '../../components/hms-dashboard';
import { AdminShellNotice } from './components/AdminShellNotice';
import {
  AnalyticsMetricCard,
  ChartCard,
  ComparisonBarChart,
  DashboardFilterBar,
  HeatmapGrid,
  InsightPanel,
  ReportTable,
  StatusDonutChart,
  TrendLineChart,
} from '../../components/analytics';
import {
  adminInsights,
  adminTenantOptions,
  branchLoadHeatmap,
  defaultDateRange,
  roleActivityComparison,
  securitySeverityBreakdown,
  superAdminMetrics,
  systemHealthTrend,
  tenantGrowthTrend,
  tenantHealthColumns,
  tenantHealthRows,
} from '../../data/analytics/adminAnalytics.mock';
import type { DateRange } from '../../types/analytics';

export const SuperAdminDashboard: React.FC = () => {
  const [dateRange, setDateRange] = useState<DateRange>(defaultDateRange);
  const [tenant, setTenant] = useState('all');
  const [branch, setBranch] = useState('all');
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
    <HmsDashboardShell
      footer={<HmsAuditFooter dataSource="Mock analytics (sandbox)" />}
    >
      <AdminShellNotice />
      <HmsPageHeader
        title="Platform Command Center"
        description="Multi-tenant operations, security posture, system health, and drilldown-ready governance signals."
        badge="Sandbox"
        actions={(
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => window.location.reload()} aria-label="Refresh platform command center" className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-black text-slate-700 hover:bg-slate-50">
              <RefreshCw className="h-4 w-4" aria-hidden="true" /> Refresh
            </button>
            <a href="/admin/reports" className="inline-flex min-h-11 items-center rounded-xl bg-indigo-600 px-4 py-2 text-xs font-black text-white hover:bg-indigo-700">View Reports</a>
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
      />
      <div className="grid grid-cols-12 gap-6">
        {/* KPI Band: 6x S Cards (3 cols desktop, 6 cols tablet, 12 cols mobile) */}
        {superAdminMetrics.map((metric) => (
          <div key={metric.title} className="col-span-12 md:col-span-6 xl:col-span-2">
            <AnalyticsMetricCard {...metric} />
          </div>
        ))}

        {/* Primary Work Row: Tenant growth & Active users charts (L Cards - 6 cols desktop) */}
        <div className="col-span-12 xl:col-span-6">
          <ChartCard title="Tenant growth and active users" description="Tracks tenant count against user growth to highlight scaling pressure." height={320}>
            <TrendLineChart data={tenantGrowthTrend} title="Tenant growth trend" valueLabel="Tenants" secondaryLabel="Active users" />
          </ChartCard>
        </div>
        <div className="col-span-12 xl:col-span-6">
          <ChartCard title="Active users by role" description="Role mix helps identify clinical workload and governance usage." height={320}>
            <ComparisonBarChart data={roleActivityComparison} title="Active users by role" valueLabel="Users" />
          </ChartCard>
        </div>

        {/* Secondary Insight Row: Security, Latency, and Heatmap (M/L Cards - 4 cols desktop) */}
        <div className="col-span-12 md:col-span-6 xl:col-span-4">
          <ChartCard title="Security events by severity" description="Prioritize critical/high-risk investigation queues." height={280}>
            <StatusDonutChart data={securitySeverityBreakdown} title="Security events by severity" />
          </ChartCard>
        </div>
        <div className="col-span-12 md:col-span-6 xl:col-span-4">
          <ChartCard title="API latency and DB pressure" description="Synthetic latency plus storage pressure trend for operations triage." height={280}>
            <TrendLineChart data={systemHealthTrend} title="API latency and DB pressure" valueLabel="API ms" secondaryLabel="DB GB delta" />
          </ChartCard>
        </div>
        <div className="col-span-12 md:col-span-12 xl:col-span-4">
          <ChartCard title="Branch/department load heatmap" description="Highlights where command-center attention is needed." height={280}>
            <HeatmapGrid data={branchLoadHeatmap} title="Branch department load" />
          </ChartCard>
        </div>

        {/* Bottom Supporting Row: Risk and Operations Insights (4 cols) & Tenant Health Drilldown Table (8 cols) */}
        <div className="col-span-12 xl:col-span-4">
          <InsightPanel insights={adminInsights} title="Risk and operations insights" />
        </div>
        <div className="col-span-12 xl:col-span-8">
          <ReportTable columns={tenantHealthColumns} rows={tenantHealthRows} caption="Tenant health drilldown table" />
        </div>
      </div>
    </HmsDashboardShell>
  );
};

export default SuperAdminDashboard;
