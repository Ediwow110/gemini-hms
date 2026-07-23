import React from 'react';
import { PackageCheck, ShoppingBag, Store, WalletCards } from 'lucide-react';
import {
  AnalyticsMetricCard,
  ChartCard,
  ComparisonBarChart,
  InsightPanel,
  StatusDonutChart,
  TrendLineChart,
} from '../../../components/analytics';
import { HmsPageHeader } from '../../../components/hms-page';
import {
  HmsAuditFooter,
  HmsDashboardShell,
  HmsDataSourceBadge,
  HmsToolbar,
} from '../../../components/hms-dashboard';
import MarketplaceAdminScopeFilter from './components/MarketplaceAdminScopeFilter';
import { useAnalytics } from '../../../hooks/use-analytics';
import { demoMarketplaceDashboard } from '../../../data/dashboard-demo';

const peso = (value: number) =>
  new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    maximumFractionDigits: 0,
  }).format(value);

export const MarketplaceAdminDashboard: React.FC = () => {
  const {
    marketplace,
    isLoading,
    isFetching,
    demoByScope,
    refetchAll,
  } = useAnalytics('marketplace');

  return (
    <HmsDashboardShell
      toolbar={
        <HmsToolbar
          branchName="Tenant marketplace"
          role="Marketplace Governance"
          onRefresh={() => void refetchAll()}
          refreshing={isFetching}
        />
      }
      footer={
        <HmsAuditFooter
          dataSource={
            demoByScope.marketplace
              ? 'Synthetic marketplace scenario'
              : 'Live marketplace metrics with synthetic trend context'
          }
        />
      }
    >
      <HmsPageHeader
        eyebrow="Marketplace governance"
        title="Marketplace Command Center"
        description="Revenue, supplier quality, demand and dispute risk arranged around governance decisions."
        actions={
          <HmsDataSourceBadge
            mode="demo"
            label={
              demoByScope.marketplace
                ? 'Synthetic marketplace scenario'
                : 'Live metrics + synthetic trends'
            }
          />
        }
      />

      <MarketplaceAdminScopeFilter />

      <div className="grid grid-cols-[repeat(auto-fit,minmax(190px,1fr))] gap-4">
        <AnalyticsMetricCard
          title="Gross merchandise value"
          value={isLoading ? '—' : peso(marketplace.gmv)}
          icon={WalletCards}
          severity="success"
        />
        <AnalyticsMetricCard
          title="Total orders"
          value={isLoading ? '—' : marketplace.totalOrders.toLocaleString()}
          icon={ShoppingBag}
          severity="info"
        />
        <AnalyticsMetricCard
          title="Approved listings"
          value={isLoading ? '—' : marketplace.approvedListings.toLocaleString()}
          icon={PackageCheck}
          severity="success"
        />
        <AnalyticsMetricCard
          title="Platform revenue"
          value={isLoading ? '—' : peso(marketplace.revenue)}
          icon={Store}
          severity="info"
        />
      </div>

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 xl:col-span-8">
          <ChartCard
            title="GMV trend"
            description="Six-month synthetic marketplace volume used to review commercial performance."
            emphasis="primary"
          >
            <TrendLineChart
              data={demoMarketplaceDashboard.gmvTrend}
              title="GMV trend"
              valueLabel="GMV"
              valueFormatter={peso}
            />
          </ChartCard>
        </div>
        <div className="col-span-12 xl:col-span-4">
          <InsightPanel
            insights={demoMarketplaceDashboard.insights}
            title="Governance decisions"
          />
        </div>

        <div className="col-span-12 xl:col-span-7">
          <ChartCard
            title="Orders by category"
            description="Synthetic demand distribution across marketplace categories."
          >
            <ComparisonBarChart
              data={demoMarketplaceDashboard.ordersByCategory}
              title="Orders by category"
              valueLabel="Orders"
              horizontal
            />
          </ChartCard>
        </div>
        <div className="col-span-12 xl:col-span-5">
          <ChartCard
            title="Dispute mix"
            description="Synthetic disputes grouped by operational cause."
          >
            <StatusDonutChart
              data={demoMarketplaceDashboard.disputes}
              title="Disputes by type"
            />
          </ChartCard>
        </div>

        <div className="col-span-12 xl:col-span-7">
          <ChartCard
            title="Supplier SLA ranking"
            description="On-time fulfillment percentage by supplier."
          >
            <ComparisonBarChart
              data={demoMarketplaceDashboard.supplierPerformance}
              title="Supplier SLA ranking"
              valueLabel="SLA"
              valueFormatter={(value) => `${value}%`}
              yDomain={[0, 100]}
              horizontal
            />
          </ChartCard>
        </div>
        <div className="col-span-12 xl:col-span-5">
          <ChartCard
            title="Warranty claims"
            description="Synthetic claim volume across the current week."
          >
            <TrendLineChart
              data={demoMarketplaceDashboard.warrantyTrend}
              title="Warranty claims trend"
              valueLabel="Claims"
            />
          </ChartCard>
        </div>
      </div>
    </HmsDashboardShell>
  );
};

export default MarketplaceAdminDashboard;
