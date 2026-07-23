import React from 'react';
import {
  DollarSign,
  FileText,
  Package,
  ShieldCheck,
  ShoppingBag,
  Truck,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  AnalyticsMetricCard,
  ChartCard,
  InsightPanel,
  StatusDonutChart,
  TrendLineChart,
} from '../../../components/analytics';
import { HmsPageHeader } from '../../../components/hms-page';
import {
  HmsAuditFooter,
  HmsDashboardShell,
  HmsDataSourceBadge,
  HmsQuickActions,
  HmsToolbar,
} from '../../../components/hms-dashboard';
import { demoSupplierDashboard } from '../../../data/dashboard-demo';
import ListingHealthPanel from './components/ListingHealthPanel';
import RFQInboxTable from './components/RFQInboxTable';
import SupplierOrderQueue from './components/SupplierOrderQueue';
import SupplierPerformanceScorecard from './components/SupplierPerformanceScorecard';
import SupplierScopeFilter from './components/SupplierScopeFilter';
import SupplierShellNotice from './components/SupplierShellNotice';

const peso = (value: number) =>
  new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    maximumFractionDigits: 0,
  }).format(value);

export const SupplierDashboard: React.FC = () => (
  <HmsDashboardShell
    toolbar={
      <HmsToolbar branchName="Supplier organization" role="Supplier Operations">
        <SupplierScopeFilter />
      </HmsToolbar>
    }
    footer={
      <HmsAuditFooter dataSource="Live supplier queues with synthetic summary analytics" />
    }
  >
    <HmsPageHeader
      eyebrow="Supplier operations"
      title="Supplier Command Center"
      description="RFQ response, order fulfillment, listing health and warranty pressure organized around the next supplier action."
      actions={
        <>
          <HmsDataSourceBadge mode="demo" label="Live queues + synthetic summary" />
          <Link
            to="/supplier/listings"
            className="inline-flex min-h-10 items-center rounded-md bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700"
          >
            New listing
          </Link>
        </>
      }
    />

    <SupplierShellNotice />

    <div className="grid grid-cols-[repeat(auto-fit,minmax(190px,1fr))] gap-4">
      <AnalyticsMetricCard
        title="Active listings"
        value={demoSupplierDashboard.metrics.activeListings}
        icon={Package}
        severity="info"
        href="/supplier/listings"
      />
      <AnalyticsMetricCard
        title="RFQs pending"
        value={demoSupplierDashboard.metrics.pendingRfqs}
        icon={FileText}
        severity="warning"
        href="/supplier/rfq-inbox"
      />
      <AnalyticsMetricCard
        title="Orders pending"
        value={demoSupplierDashboard.metrics.pendingOrders}
        icon={ShoppingBag}
        severity="warning"
        href="/supplier/orders"
      />
      <AnalyticsMetricCard
        title="Warranty claims"
        value={demoSupplierDashboard.metrics.warrantyClaims}
        icon={ShieldCheck}
        severity={demoSupplierDashboard.metrics.warrantyClaims > 0 ? 'critical' : 'success'}
        href="/supplier/warranty-claims"
      />
      <AnalyticsMetricCard
        title="Scenario revenue"
        value={peso(demoSupplierDashboard.metrics.revenue)}
        icon={DollarSign}
        severity="success"
        description="Synthetic commercial context"
      />
      <AnalyticsMetricCard
        title="Pending payout"
        value={peso(demoSupplierDashboard.metrics.pendingPayout)}
        icon={DollarSign}
        severity="info"
        description="Synthetic settlement context"
        href="/supplier/payouts"
      />
    </div>

    <div className="grid grid-cols-12 gap-6">
      <div className="col-span-12 xl:col-span-8">
        <ChartCard
          title="Revenue trajectory"
          description="Deterministic synthetic revenue used to review commercial dashboard density."
          emphasis="primary"
        >
          <TrendLineChart
            data={demoSupplierDashboard.revenueTrend}
            title="Supplier revenue trajectory"
            valueLabel="Revenue"
            valueFormatter={peso}
          />
        </ChartCard>
      </div>
      <div className="col-span-12 xl:col-span-4">
        <InsightPanel
          insights={demoSupplierDashboard.insights}
          title="Supplier decisions"
        />
      </div>

      <div className="col-span-12 xl:col-span-7">
        <SupplierOrderQueue />
      </div>
      <div className="col-span-12 xl:col-span-5">
        <RFQInboxTable />
      </div>

      <div className="col-span-12 xl:col-span-7">
        <ChartCard
          title="Operational status mix"
          description="Synthetic listings, active orders, shipped items and claims."
        >
          <StatusDonutChart
            data={demoSupplierDashboard.statusBreakdown}
            title="Supplier operational status"
          />
        </ChartCard>
      </div>
      <div className="col-span-12 xl:col-span-5">
        <HmsQuickActions
          title="Supplier workflows"
          actions={[
            { id: 'listings', label: 'Listings', icon: <Package className="h-4 w-4" />, href: '/supplier/listings' },
            { id: 'rfqs', label: 'RFQ inbox', icon: <FileText className="h-4 w-4" />, href: '/supplier/rfq-inbox' },
            { id: 'orders', label: 'Order queue', icon: <ShoppingBag className="h-4 w-4" />, href: '/supplier/orders' },
            { id: 'fulfillment', label: 'Fulfillment', icon: <Truck className="h-4 w-4" />, href: '/supplier/fulfillment' },
            { id: 'warranty', label: 'Warranty claims', icon: <ShieldCheck className="h-4 w-4" />, href: '/supplier/warranty-claims' },
            { id: 'payouts', label: 'Payout ledger', icon: <DollarSign className="h-4 w-4" />, href: '/supplier/payouts' },
          ]}
          columns={2}
        />
      </div>

      <div className="col-span-12 xl:col-span-6">
        <ListingHealthPanel />
      </div>
      <div className="col-span-12 xl:col-span-6">
        <SupplierPerformanceScorecard />
      </div>
    </div>
  </HmsDashboardShell>
);

export default SupplierDashboard;
