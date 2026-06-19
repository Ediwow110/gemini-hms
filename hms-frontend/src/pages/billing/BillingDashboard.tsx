import React, { useState, useEffect } from 'react';
import { DollarSign, Coins, CreditCard, AlertCircle } from 'lucide-react';
import {
  HmsDashboardShell,
  HmsToolbar,
  HmsAuditFooter,
  HmsKpiStrip,
  HmsAlertRail,
  HmsWorkQueue,
  HmsDrilldownTable,
  HmsSlaPanel,
  HmsQuickActions,
  HmsDataUnavailable,
  HmsLoadingSkeleton,
} from '../../components/hms-dashboard';
import { billingDashboardService } from '../../services/billing-dashboard.service';
import type { BillingDashboardData } from '../../services/billing-dashboard.service';

const BRANCH_OPTIONS = [
  { value: 'main-branch', label: 'Main Branch' },
  { value: 'north-clinic', label: 'North Branch' },
];

const getBranchLabel = (branchId: string) =>
  BRANCH_OPTIONS.find((branch) => branch.value === branchId)?.label ?? branchId;

export const BillingDashboard: React.FC = () => {
  const [selectedBranch, setSelectedBranch] = useState('main-branch');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<BillingDashboardData | null>(null);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await billingDashboardService.getDashboardData(selectedBranch);
      setData(result);
      setLastUpdated(new Date());
    } catch {
      setError('Failed to load billing dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  /* eslint-disable react-hooks/exhaustive-deps */
  useEffect(() => {
    fetchData();
  }, [selectedBranch]);
  /* eslint-enable react-hooks/exhaustive-deps */

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center p-6 bg-slate-50">
        <div className="flex flex-col items-center gap-3 text-center max-w-md p-6 bg-white border border-slate-200 rounded-lg shadow-sm">
          <AlertCircle className="h-12 w-12 text-rose-500" />
          <h2 className="text-lg font-bold text-slate-900">{error}</h2>
          <button
            onClick={() => fetchData()}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Map alerts to AlertRail format
  const railAlerts = data?.alerts.map((alert) => ({
    id: alert.id,
    severity: (alert.severity === 'critical' || alert.severity === 'warning' || alert.severity === 'success')
      ? alert.severity
      : 'critical' as const,
    title: alert.title,
    message: alert.message,
    timestamp: 'Real-time',
  })) || [];

  // Map KPIs to KpiStrip format
  const kpis = data?.kpis.map((kpi, idx) => ({
    id: `kpi-${idx}`,
    label: kpi.title,
    value: kpi.value,
    severity: (kpi.severity === 'info' || kpi.severity === 'success' || kpi.severity === 'warning' || kpi.severity === 'critical')
      ? kpi.severity
      : 'info' as const,
  })) || [];

  const unpaidCount = Number(data?.kpis.find(k => k.title.includes('Unpaid'))?.value || 0);
  const overdueCount = Number(data?.kpis.find(k => k.title.includes('Overdue'))?.value || 0);

  return (
    <HmsDashboardShell
      toolbar={
        <HmsToolbar
          branchName={getBranchLabel(selectedBranch)}
          role="Billing & Finance Dashboard"
          lastRefreshed={lastUpdated}
          onRefresh={fetchData}
        >
          <div className="flex items-center gap-2">
            <label htmlFor="branch-select" className="text-[11px] font-medium text-slate-400">Select Branch:</label>
            <select
              id="branch-select"
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="rounded border border-slate-200 bg-white px-2 py-0.5 text-[11px] font-semibold text-slate-700 focus:border-blue-500 focus:outline-none"
            >
              {BRANCH_OPTIONS.map((branch) => (
                <option key={branch.value} value={branch.value}>{branch.label}</option>
              ))}
            </select>
          </div>
        </HmsToolbar>
      }
      footer={
        <HmsAuditFooter
          lastRefreshed={lastUpdated}
          dataSource={data?.isUnavailable ? 'Live source unavailable' : 'Live Billing/Cashier API'}
        />
      }
    >
      {data?.isUnavailable && (
        <div className="flex items-center justify-between rounded-lg border border-rose-200 bg-rose-50/50 px-3 py-2">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-rose-600" />
            <span className="text-[12px] font-semibold text-rose-700">Live dashboard data could not be loaded — showing unavailable state for unsupported sections</span>
          </div>
          <span className="text-[10px] font-bold text-rose-600 font-mono">OFFLINE</span>
        </div>
      )}

      {/* Top Alert Rail for overdue accounts */}
      <HmsAlertRail alerts={railAlerts} loading={loading} />

      {/* KPI Strip */}
      {data?.isUnavailable ? (
        <HmsDataUnavailable
          sectionName="Billing & Session Key Metrics"
          expectedApi="/v1/billing/invoices, /v1/billing/sessions/active"
        />
      ) : (
        <HmsKpiStrip metrics={kpis} loading={loading} />
      )}

      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          <div className="lg:col-span-2 space-y-3">
            <HmsLoadingSkeleton variant="table" />
            <HmsLoadingSkeleton variant="table" />
          </div>
          <div className="space-y-3">
            <HmsLoadingSkeleton variant="panel" />
            <HmsLoadingSkeleton variant="panel" />
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          {/* Main Content (2/3) */}
          <div className="lg:col-span-2 space-y-3">
            {/* Highest Outstanding Accounts */}
            {data?.isUnavailable ? (
              <HmsDataUnavailable
                sectionName="Highest Outstanding Bills"
                expectedApi="/v1/billing/invoices"
              />
            ) : (
              <HmsDrilldownTable
                title="Highest Outstanding Bills"
                description="Top billing accounts with largest pending receivables balances"
                data={data?.highestOutstanding || []}
                keyExtractor={(item) => item.id}
                columns={[
                  {
                    key: 'client',
                    header: 'Client / Patient',
                    render: (item) => <span className="font-semibold text-slate-800">{item.label}</span>
                  },
                  {
                    key: 'balance',
                    header: 'Outstanding Balance',
                    render: (item) => <span className="font-mono font-bold text-rose-600">{item.value}</span>
                  },
                  {
                    key: 'status',
                    header: 'Status',
                    render: (item) => (
                      <span className="inline-flex items-center rounded-md bg-rose-50 text-rose-700 border border-rose-200 px-2 py-0.5 text-[11px] font-semibold">
                        {item.trend || 'UNPAID'}
                      </span>
                    )
                  }
                ]}
                emptyMessage="No accounts with outstanding balances"
                maxRows={5}
                viewAllLink="/billing"
                viewAllLabel="Open Registry"
              />
            )}

            {/* Recent Payments (Active Session) */}
            {data?.isUnavailable ? (
              <HmsDataUnavailable
                sectionName="Recent Payments (Active Session)"
                expectedApi="/v1/billing/sessions/active"
              />
            ) : (
              <HmsWorkQueue
                title="Recent Payments (Active Session)"
                description="Payments logged in the current active cashier session"
                data={data?.recentPayments || []}
                keyExtractor={(item) => item.id}
                columns={[
                  {
                    key: 'invoice',
                    header: 'Invoice Number',
                    render: (item) => <span className="font-semibold text-slate-800">{item.label}</span>
                  },
                  {
                    key: 'amount',
                    header: 'Amount Paid',
                    render: (item) => <span className="font-mono font-bold text-emerald-600">{item.value}</span>
                  },
                  {
                    key: 'status',
                    header: 'Status',
                    render: (item) => (
                      <span className="inline-flex items-center rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 text-[11px] font-semibold">
                        {item.trend || 'POSTED'}
                      </span>
                    )
                  }
                ]}
                emptyMessage="No payments recorded in this session yet"
                maxRows={5}
                viewAllLink="/billing"
                viewAllLabel="Open Ledger"
              />
            )}

            {/* Cashier Variance — Unavailable */}
            <HmsDataUnavailable
              sectionName="Daily Cashier Variance Logs"
              expectedApi="/api/v1/billing/cashier/variance"
              expectedPhase="Phase 2"
            />

            {/* Reconciliation Issues — Unavailable */}
            <HmsDataUnavailable
              sectionName="Reconciliation Discrepancies"
              expectedApi="/api/v1/billing/reconciliation/issues"
              expectedPhase="Phase 2"
            />

            {/* Revenue Trend (7d) — Unavailable */}
            <HmsDataUnavailable
              sectionName="Revenue Collection Trend (7d)"
              expectedApi="/api/v1/billing/analytics/revenue-trend"
              expectedPhase="Phase 2"
            />
          </div>

          {/* SLA / Risk Sidebar (1/3) */}
          <div className="space-y-3">
            {/* SLA Panel */}
            {data?.isUnavailable ? (
              <HmsDataUnavailable
                sectionName="Collection Risk Thresholds"
                expectedApi="/v1/billing/invoices"
              />
            ) : (
              <HmsSlaPanel
                title="Collection Risk Thresholds"
                items={[
                  {
                    id: 'sla-unpaid',
                    label: 'Unpaid Invoices',
                    value: unpaidCount,
                    status: unpaidCount > 10 ? 'at_risk' : 'on_track',
                    drilldownHref: '/cashier/invoices',
                  },
                  {
                    id: 'sla-overdue',
                    label: 'Overdue Bills',
                    value: overdueCount,
                    status: overdueCount > 0 ? 'breached' : 'on_track',
                    drilldownHref: '/cashier/invoices',
                  }
                ]}
              />
            )}

            {/* Payment Method Distribution — Unavailable */}
            <HmsDataUnavailable
              sectionName="Payment Method Distribution"
              expectedApi="/api/v1/billing/analytics/payment-methods"
              expectedPhase="Phase 2"
            />

            {/* Quick Actions */}
            <HmsQuickActions
              title="Quick Actions"
              actions={[
                { id: 'inv-reg', label: 'Invoice Registry', icon: <DollarSign className="h-4 w-4 text-blue-500" />, href: '/cashier/invoices' },
                { id: 'cash-close', label: 'Cashier closing', icon: <Coins className="h-4 w-4 text-amber-500" />, href: '/cashier/session' },
                { id: 'claims-db', label: 'Claims Dashboard', icon: <CreditCard className="h-4 w-4 text-emerald-500" />, href: '/claims' },
              ]}
            />
          </div>
        </div>
      )}
    </HmsDashboardShell>
  );
};

export default BillingDashboard;
