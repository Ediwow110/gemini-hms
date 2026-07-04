import React from 'react';
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
import { useInvoices, useActiveSession } from '../../hooks/use-billing';
import { usePermissions } from '../../hooks/use-user';

const formatCurrency = (amount: number): string =>
  `₱${amount.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export const BillingDashboard: React.FC = () => {
  const { hasPermission } = usePermissions();

  const { invoices, loading: invoicesLoading, error: invoicesError, refetch: refetchInvoices } = useInvoices();
  const { session, loading: sessionLoading, error: sessionError, refetch: refetchSession } = useActiveSession();

  const isLoading = invoicesLoading || sessionLoading;
  const errorObj = invoicesError || sessionError;

  const handleRetry = () => {
    refetchInvoices();
    refetchSession();
  };

  if (errorObj && !isLoading) {
    return (
      <div className="flex h-screen items-center justify-center p-6 bg-slate-50">
        <div className="flex flex-col items-center gap-3 text-center max-w-md p-6 bg-white border border-slate-200 rounded-lg shadow-sm">
          <AlertCircle className="h-12 w-12 text-rose-500" />
          <h2 className="text-lg font-bold text-slate-900">Failed to load billing dashboard data.</h2>
          <button
            onClick={handleRetry}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // ── Derived KPIs ──
  const unpaidInvoices = invoices.filter(
    inv => (inv.balance ?? inv.totalAmount - inv.paidAmount) > 0
  );
  const paidInvoices = invoices.filter(
    inv => inv.status === 'PAID' || (inv.balance ?? inv.totalAmount - inv.paidAmount) <= 0
  );
  const totalOutstanding = unpaidInvoices.reduce(
    (sum, inv) => sum + (inv.balance ?? inv.totalAmount - inv.paidAmount), 0
  );
  const sessionTotal = session
    ? session.payments.reduce((sum, p) => sum + p.amount, 0)
    : 0;

  const highestOutstanding = [...invoices]
    .sort((a, b) => (b.balance ?? b.totalAmount - b.paidAmount) - (a.balance ?? a.totalAmount - a.paidAmount))
    .slice(0, 5)
    .map(inv => ({
      id: inv.id,
      label: inv.order?.patient
        ? `${inv.order.patient.firstName} ${inv.order.patient.lastName}`
        : inv.invoiceNumber,
      value: formatCurrency(inv.balance ?? inv.totalAmount - inv.paidAmount),
      trend: inv.status,
    }));

  const recentPayments = (session?.payments ?? [])
    .slice(0, 5)
    .map(p => ({
      id: p.id,
      label: p.invoice.invoiceNumber,
      value: formatCurrency(p.amount),
      trend: p.status,
    }));

  // ── KPIs for strip ──
  const kpis = [
    {
      id: 'session',
      label: 'Active Session',
      value: session ? formatCurrency(sessionTotal) : '—',
      severity: session ? 'success' as const : 'info' as const,
    },
    {
      id: 'unpaid',
      label: 'Unpaid Invoices',
      value: unpaidInvoices.length,
      severity: unpaidInvoices.length > 5 ? 'critical' as const : unpaidInvoices.length > 0 ? 'warning' as const : 'success' as const,
    },
    {
      id: 'outstanding',
      label: 'Total Outstanding',
      value: formatCurrency(totalOutstanding),
      severity: totalOutstanding > 10000 ? 'critical' as const : totalOutstanding > 0 ? 'warning' as const : 'success' as const,
    },
    {
      id: 'paid',
      label: 'Paid Invoices',
      value: paidInvoices.length,
      severity: 'success' as const,
    },
  ];

  // ── Collecton risk thresholds ──
  const unpaidCount = unpaidInvoices.length;
  const slaItems = [
    {
      id: 'sla-unpaid',
      label: 'Unpaid Invoices',
      value: unpaidCount,
      status: unpaidCount > 10 ? 'at_risk' as const : 'on_track' as const,
      drilldownHref: '/cashier/invoices',
    },
    {
      id: 'sla-overdue',
      label: 'Overdue Bills',
      value: unpaidCount,
      status: unpaidCount > 0 ? 'breached' as const : 'on_track' as const,
      drilldownHref: '/cashier/invoices',
    },
  ];

  // ── Alerts from unpaid invoices ──
  const railAlerts = unpaidInvoices.slice(0, 3).map(inv => ({
    id: `unpaid-${inv.id}`,
    severity: (inv.balance ?? inv.totalAmount - inv.paidAmount) > 5000 ? 'critical' as const : 'warning' as const,
    title: `Unpaid: ${inv.invoiceNumber}`,
    message: `${inv.patientName || inv.order?.patient?.firstName || 'Unknown'} — ${formatCurrency(inv.balance ?? inv.totalAmount - inv.paidAmount)}`,
  }));

  const lastUpdated = new Date();

  return (
    <HmsDashboardShell
      toolbar={
        <HmsToolbar
          role="Billing & Finance Dashboard"
          lastRefreshed={lastUpdated}
          onRefresh={handleRetry}
        />
      }
      footer={
        <HmsAuditFooter
          lastRefreshed={lastUpdated}
          dataSource="Live Billing Invoices & Session API"
        />
      }
    >
      {/* Top Alert Rail for overdue accounts */}
      <HmsAlertRail alerts={railAlerts} loading={isLoading} />

      {/* KPI Strip */}
      <HmsKpiStrip metrics={kpis} loading={isLoading} />

      {isLoading ? (
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
            {highestOutstanding.length > 0 ? (
              <HmsDrilldownTable
                title="Highest Outstanding Bills"
                description="Top billing accounts with largest pending receivables balances"
                data={highestOutstanding}
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
            ) : (
              <HmsDataUnavailable
                sectionName="Highest Outstanding Bills"
                expectedApi="/v1/billing/invoices"
                expectedPhase="No outstanding invoices"
              />
            )}

            {/* Recent Payments (Active Session) */}
            {recentPayments.length > 0 ? (
              <HmsWorkQueue
                title="Recent Payments (Active Session)"
                description="Payments logged in the current active cashier session"
                data={recentPayments}
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
            ) : (
              <HmsDataUnavailable
                sectionName="Recent Payments (Active Session)"
                expectedApi="/v1/billing/sessions/active"
                expectedPhase="No active session payments"
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
            <HmsSlaPanel
              title="Collection Risk Thresholds"
              items={slaItems}
            />

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
                ...(hasPermission('billing.claim.view') ? [{ id: 'claims-db', label: 'Claims Dashboard', icon: <CreditCard className="h-4 w-4 text-emerald-500" />, href: '/claims' }] : []),
              ]}
            />
          </div>
        </div>
      )}
    </HmsDashboardShell>
  );
};

export default BillingDashboard;
