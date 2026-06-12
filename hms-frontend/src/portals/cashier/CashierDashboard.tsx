import { useNavigate } from 'react-router-dom';
import { useMemo } from 'react';
import { CreditCard, FileText, Clock, Users, TrendingUp, ArrowRight, HelpCircle, DollarSign, AlertTriangle } from 'lucide-react';
import { PageHeader } from '../../components/ui/page-header';
import { ChartCard, InsightPanel, StatusDonutChart, VolumeAreaChart } from '../../components/analytics';
import { cashierInsights, cashierVolumeTrend, paymentMethodBreakdown } from '../../data/analytics/clinicalAnalytics.mock';
import { useInvoices, useActiveSession } from '../../hooks/use-billing';
import { safeMoney } from '../../lib/safe-money';
import { HmsDashboardShell, HmsToolbar, HmsAuditFooter } from '../../components/hms-dashboard';

export const CashierDashboard = () => {
  const navigate = useNavigate();
  const { invoices, loading: invLoading } = useInvoices();
  const { session, loading: sessLoading } = useActiveSession();

  const totalOutstanding = useMemo(() => invoices.reduce((sum, inv) => sum + safeMoney(inv.totalAmount) - safeMoney(inv.paidAmount), 0), [invoices]);
  const pendingCount = useMemo(() => invoices.filter(i => i.status === 'PENDING' || i.status === 'UNPAID').length, [invoices]);
  const paidCount = useMemo(() => invoices.filter(i => i.status === 'PAID' || i.status === 'COMPLETED').length, [invoices]);

  return (
    <HmsDashboardShell
      toolbar={<HmsToolbar role="Cashier" />}
      footer={<HmsAuditFooter dataSource="Live API (invoices, session)" />}
    >
      <PageHeader
        title="Cashier & Billing Workspace"
        description="Invoice management, payment processing, session control, and reconciliation"
      />

      <div className="grid grid-cols-12 gap-6">
        {/* Session Status Banner (Full-Width) */}
        <div className={`col-span-12 p-4 rounded-2xl border ${session ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200'} flex items-center justify-between`}>
          <div className="flex items-center gap-3">
            <Clock className={`h-5 w-5 ${session ? 'text-emerald-600' : 'text-amber-600'}`} />
            <div>
              <p className="text-xs font-bold text-slate-700">
                {sessLoading ? 'Loading...' : session ? `Session Active (Opened: ${new Date(session.openedAt).toLocaleTimeString()})` : 'No Active Session'}
              </p>
            </div>
          </div>
          <button onClick={() => navigate('/cashier/session')}
            className="text-xs font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer">
            {session ? 'Manage Session' : 'Open Session'}
          </button>
        </div>

        {/* KPI Metrics (4 S-size Cards) */}
        <div className="col-span-12 sm:col-span-6 xl:col-span-3">
          <div className="card bg-white border border-slate-200/80 shadow-sm rounded-2xl p-5 min-h-[110px] flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Invoices</p>
                <p className="text-2xl font-extrabold text-slate-800">{invLoading ? '...' : invoices.length}</p>
              </div>
              <div className="p-3 bg-indigo-50 rounded-xl"><FileText className="h-5 w-5 text-indigo-600" /></div>
            </div>
          </div>
        </div>

        <div className="col-span-12 sm:col-span-6 xl:col-span-3">
          <div className="card bg-white border border-slate-200/80 shadow-sm rounded-2xl p-5 min-h-[110px] flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pending Payment</p>
                <p className="text-2xl font-extrabold text-amber-600">{invLoading ? '...' : pendingCount}</p>
              </div>
              <div className="p-3 bg-amber-50 rounded-xl"><CreditCard className="h-5 w-5 text-amber-600" /></div>
            </div>
          </div>
        </div>

        <div className="col-span-12 sm:col-span-6 xl:col-span-3">
          <div className="card bg-white border border-slate-200/80 shadow-sm rounded-2xl p-5 min-h-[110px] flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Paid</p>
                <p className="text-2xl font-extrabold text-emerald-600">{invLoading ? '...' : paidCount}</p>
              </div>
              <div className="p-3 bg-emerald-50 rounded-xl"><DollarSign className="h-5 w-5 text-emerald-600" /></div>
            </div>
          </div>
        </div>

        <div className="col-span-12 sm:col-span-6 xl:col-span-3">
          <div className="card bg-white border border-slate-200/80 shadow-sm rounded-2xl p-5 min-h-[110px] flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Outstanding Balance</p>
                <p className="text-2xl font-extrabold text-rose-600">{invLoading ? '...' : `${totalOutstanding.toLocaleString()} ₱`}</p>
              </div>
              <div className="p-3 bg-rose-50 rounded-xl"><TrendingUp className="h-5 w-5 text-rose-600" /></div>
            </div>
          </div>
        </div>

        {/* Charts & Insights Row (L Cards - 4 cols desktop, 6/12 cols tablet/mobile) */}
        <div className="col-span-12">
          <div className="p-2 bg-amber-50 border border-amber-200 rounded-lg text-[10px] text-amber-700 flex items-center gap-1.5 font-bold mb-3">
            <AlertTriangle className="h-3 w-3 shrink-0" />
            Simulated Trend Data — Charts below show fabricated values and are not backed by the API.
          </div>
        </div>
        <div className="col-span-12 md:col-span-6 xl:col-span-4">
          <ChartCard title="Revenue by day" description="Sandbox trend for collection planning; invoice totals above are live API derived." height={280}>
            <VolumeAreaChart data={cashierVolumeTrend} title="Revenue by day" valueLabel="Payments" />
          </ChartCard>
        </div>

        <div className="col-span-12 md:col-span-6 xl:col-span-4">
          <ChartCard title="Payment method breakdown" description="Decision chart for cashier closeout and HMO aging follow-up." height={280}>
            <StatusDonutChart data={paymentMethodBreakdown} title="Payment method breakdown" />
          </ChartCard>
        </div>

        <div className="col-span-12 md:col-span-12 xl:col-span-4">
          <InsightPanel insights={cashierInsights} title="Billing and closeout alerts" />
        </div>

        {/* Work Area / Bottom Row: Actions (8 cols) & Recent Invoices (4 cols) */}
        <div className="col-span-12 xl:col-span-8 space-y-4">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider px-1">Billing Actions</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { label: 'Invoices', desc: 'View all invoices', icon: FileText, path: '/cashier/invoices', color: 'text-indigo-600 bg-indigo-50' },
              { label: 'Payments', desc: 'Process payments', icon: CreditCard, path: '/cashier/payments', color: 'text-emerald-600 bg-emerald-50' },
              { label: 'Patient Billing', desc: 'Search patient bills', icon: Users, path: '/cashier/billing', color: 'text-blue-600 bg-blue-50' },
              { label: 'Refunds & Voids', desc: 'Manage reversals (sandbox)', icon: TrendingUp, path: '/cashier/refunds-voids', color: 'text-rose-600 bg-rose-50' },
            ].map(item => (
              <button key={item.path} onClick={() => navigate(item.path)}
                className="card bg-white border border-slate-200/80 shadow-sm rounded-2xl p-5 text-left hover:border-indigo-300 transition-all cursor-pointer group"
              >
                <div className={`p-3 rounded-xl ${item.color} w-fit mb-3`}><item.icon className="h-5 w-5" /></div>
                <p className="text-sm font-bold text-slate-800">{item.label}</p>
                <p className="text-xs text-slate-500 mt-1">{item.desc}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="col-span-12 xl:col-span-4 space-y-4">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider px-1">Recent Invoices</h3>
          {invLoading ? (
            <div className="card bg-white border border-slate-200/80 shadow-sm rounded-2xl p-6 text-center text-xs text-slate-400">Loading...</div>
          ) : invoices.length === 0 ? (
            <div className="card bg-white border border-slate-200/80 shadow-sm rounded-2xl p-8 text-center text-slate-400 space-y-2">
              <HelpCircle className="h-6 w-6 mx-auto text-slate-300" />
              <p className="text-xs font-bold">No invoices found</p>
            </div>
          ) : (
            <div className="space-y-2">
              {invoices.slice(0, 5).map(inv => (
                <div key={inv.id} className="card bg-white border border-slate-200/80 shadow-sm rounded-xl p-3 flex justify-between items-center">
                  <div>
                    <p className="text-xs font-bold text-slate-700">{inv.invoiceNumber}</p>
                    <p className="text-[10px] text-slate-400">{new Date(inv.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-slate-700">{safeMoney(inv.totalAmount).toLocaleString()} ₱</p>
                    <p className="text-[10px] text-slate-400">{inv.status}</p>
                  </div>
                </div>
              ))}
              <button onClick={() => navigate('/cashier/invoices')}
                className="w-full text-xs font-bold text-indigo-600 flex items-center justify-center gap-1 py-2 cursor-pointer hover:text-indigo-800">
                View All <ArrowRight className="h-3 w-3" />
              </button>
            </div>
          )}
        </div>
      </div>
    </HmsDashboardShell>
  );
};

export default CashierDashboard;
