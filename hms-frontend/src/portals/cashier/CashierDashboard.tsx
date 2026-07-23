import { useMemo } from 'react';
import { Clock, CreditCard, FileText, TrendingUp, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  StatusDonutChart,
  TrendLineChart,
} from '../../components/analytics';
import { HmsPageHeader } from '../../components/hms-page';
import {
  HmsAuditFooter,
  HmsDashboardShell,
  HmsDataSourceBadge,
  HmsEmptyState,
  HmsKpiStrip,
  HmsQuickActions,
  HmsToolbar,
} from '../../components/hms-dashboard';
import { demoFinanceDashboard } from '../../data/dashboard-demo';
import { useActiveSession, useInvoices } from '../../hooks/use-billing';
import { safeMoney } from '../../lib/safe-money';

const peso = (value: number) =>
  new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    maximumFractionDigits: 0,
  }).format(value);

export const CashierDashboard = () => {
  const navigate = useNavigate();
  const {
    invoices,
    loading: invoicesLoading,
    error: invoicesError,
    refetch: refetchInvoices,
  } = useInvoices();
  const {
    session,
    loading: sessionLoading,
    error: sessionError,
    refetch: refetchSession,
  } = useActiveSession();

  const totalOutstanding = useMemo(
    () =>
      invoices.reduce(
        (sum, invoice) =>
          sum + safeMoney(invoice.totalAmount) - safeMoney(invoice.paidAmount),
        0,
      ),
    [invoices],
  );
  const pendingCount = useMemo(
    () =>
      invoices.filter(
        (invoice) => invoice.status === 'PENDING' || invoice.status === 'UNPAID',
      ).length,
    [invoices],
  );
  const paidCount = useMemo(
    () =>
      invoices.filter(
        (invoice) => invoice.status === 'PAID' || invoice.status === 'COMPLETED',
      ).length,
    [invoices],
  );

  const refresh = async () => {
    await Promise.all([refetchInvoices(), refetchSession()]);
  };

  return (
    <HmsDashboardShell
      toolbar={
        <HmsToolbar
          branchName="Active cashier branch"
          role="Cashier"
          onRefresh={() => void refresh()}
          refreshing={invoicesLoading || sessionLoading}
        />
      }
      footer={<HmsAuditFooter dataSource="Live invoices and session with synthetic trend context" />}
    >
      <HmsPageHeader
        eyebrow="Revenue operations"
        title="Cashier Workspace"
        description="Session status, receivables and the next billing actions, with analytics kept secondary to payment work."
        actions={<HmsDataSourceBadge mode="demo" label="Live records + synthetic trends" />}
      />

      {(invoicesError || sessionError) && (
        <div className="rounded-md border border-slate-300 border-l-[3px] border-l-amber-500 bg-white px-4 py-3 text-xs text-amber-800 shadow-sm">
          {invoicesError || sessionError}
        </div>
      )}

      {/* Session Status Alert */}
      <div className={`flex flex-col gap-3 rounded-md border border-slate-300 border-l-[3px] bg-white px-4 py-3 shadow-sm sm:flex-row sm:items-center sm:justify-between ${session ? 'border-l-emerald-600' : 'border-l-amber-500'}`}>
        <div className="flex items-start gap-3">
          <Clock className={`mt-0.5 h-5 w-5 shrink-0 ${session ? 'text-emerald-600' : 'text-amber-500'}`} />
          <div>
            <p className="text-sm font-bold text-slate-900">
              {sessionLoading
                ? 'Loading cashier session…'
                : session
                  ? `Session active since ${new Date(session.openedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                  : 'No active cashier session'}
            </p>
            <p className="mt-0.5 text-xs text-slate-600">
              {session
                ? 'Payments can be posted within the current branch session.'
                : 'Open a session before accepting or reconciling payments.'}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => navigate('/cashier/session')}
          className="min-h-10 rounded-md border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-sky-600 hover:bg-sky-50"
        >
          {session ? 'Manage session' : 'Open session'}
        </button>
      </div>

      {/* KPI Strip */}
      <HmsKpiStrip
        metrics={[
          { id: 'total-invoices', label: 'Total Invoices', value: invoicesLoading ? '—' : invoices.length, severity: 'info' as const, href: '/cashier/invoices' },
          { id: 'pending-payment', label: 'Pending Payment', value: invoicesLoading ? '—' : pendingCount, severity: (pendingCount > 0 ? 'warning' : 'success') as 'warning' | 'success', href: '/cashier/invoices' },
          { id: 'paid-invoices', label: 'Paid Invoices', value: invoicesLoading ? '—' : paidCount, severity: 'success' as const, href: '/cashier/payments' },
          { id: 'outstanding-balance', label: 'Outstanding Balance', value: invoicesLoading ? '—' : peso(totalOutstanding), severity: (totalOutstanding > 0 ? 'critical' : 'success') as 'critical' | 'success', href: '/cashier/invoices' },
        ]}
      />

      <div className="grid grid-cols-12 gap-5">
        <section className="col-span-12 xl:col-span-8" aria-labelledby="recent-invoices-heading">
          <div className="overflow-hidden rounded-md border border-slate-300 bg-white shadow-sm">
            <div className="flex items-center gap-2 border-b border-slate-300 bg-slate-50 px-4 py-3">
              <div className="h-4 w-1 rounded-full bg-sky-600" />
              <div>
                <h2 id="recent-invoices-heading" className="text-xs font-bold uppercase tracking-wide text-slate-800">Recent Invoices</h2>
                <p className="mt-0.5 text-[11px] text-slate-500">Live invoice records requiring collection or reconciliation.</p>
              </div>
            </div>
            {invoicesLoading ? (
              <div className="min-h-56 animate-pulse bg-slate-50" />
            ) : invoices.length === 0 ? (
              <div className="p-4">
                <HmsEmptyState title="No invoices found" description="Invoices will appear after billable services are posted." />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[680px] text-left text-xs">
                  <thead className="border-b border-slate-300 bg-slate-50 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                    <tr>
                      <th className="px-4 py-3">Invoice</th>
                      <th className="px-4 py-3">Created</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {invoices.slice(0, 8).map((invoice) => (
                      <tr key={invoice.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3 font-semibold text-slate-900">{invoice.invoiceNumber}</td>
                        <td className="px-4 py-3 text-slate-500">{new Date(invoice.createdAt).toLocaleDateString()}</td>
                        <td className="px-4 py-3">
                          <span className="rounded-md border border-slate-300 bg-slate-50 px-2 py-0.5 text-[10px] font-semibold uppercase text-slate-700">{invoice.status}</span>
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-bold text-slate-900">{peso(safeMoney(invoice.totalAmount))}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>

        <div className="col-span-12 xl:col-span-4">
          <HmsQuickActions
            title="Billing actions"
            actions={[
              { id: 'invoices', label: 'Invoice registry', icon: <FileText className="h-4 w-4" />, href: '/cashier/invoices' },
              { id: 'payments', label: 'Session receipts', icon: <CreditCard className="h-4 w-4" />, href: '/cashier/payments' },
              { id: 'patient', label: 'Patient billing', icon: <Users className="h-4 w-4" />, href: '/cashier/billing' },
              { id: 'reversals', label: 'Refunds and voids', icon: <TrendingUp className="h-4 w-4" />, href: '/cashier/refunds-voids' },
            ]}
          />
        </div>

        <div className="col-span-12 xl:col-span-7">
          <div className="rounded-md border border-slate-300 bg-white shadow-sm">
            <div className="flex items-center gap-2 border-b border-slate-300 bg-slate-50 px-4 py-3">
              <div className="h-4 w-1 rounded-full bg-sky-600" />
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wide text-slate-800">Collections Trend</h3>
                <p className="mt-0.5 text-[11px] text-slate-500">Synthetic daily collections used for dashboard layout review.</p>
              </div>
            </div>
            <div className="px-4 py-3">
              <TrendLineChart
                data={demoFinanceDashboard.revenueTrend}
                title="Collections trend"
                valueLabel="Collections"
                valueFormatter={peso}
              />
            </div>
          </div>
        </div>
        <div className="col-span-12 xl:col-span-5">
          <div className="rounded-md border border-slate-300 bg-white shadow-sm">
            <div className="flex items-center gap-2 border-b border-slate-300 bg-slate-50 px-4 py-3">
              <div className="h-4 w-1 rounded-full bg-sky-600" />
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wide text-slate-800">Payment Method Mix</h3>
                <p className="mt-0.5 text-[11px] text-slate-500">Synthetic settlement composition for closeout planning.</p>
              </div>
            </div>
            <div className="px-4 py-3">
              <StatusDonutChart
                data={demoFinanceDashboard.paymentMethods}
                title="Payment method mix"
              />
            </div>
          </div>
        </div>
      </div>
    </HmsDashboardShell>
  );
};

export default CashierDashboard;
