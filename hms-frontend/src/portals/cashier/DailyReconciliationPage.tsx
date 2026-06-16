import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  HmsDashboardShell,
  HmsToolbar,
  HmsAuditFooter,
  HmsBalanceSheet,
} from '../../components/hms-dashboard';
import { HmsPageHeader, HmsFormContainer } from '../../components/hms-page';
import { CheckCircle, AlertTriangle, ArrowLeft, ClipboardList, Wallet, ShieldAlert } from 'lucide-react';
import { useUser } from '../../hooks/use-user';
import { useActiveSession } from '../../hooks/use-billing';
import { safeMoney } from '../../lib/safe-money';

export const DailyReconciliationPage = () => {
  const navigate = useNavigate();
  const user = useUser();
  const { session, loading, error, closeSession } = useActiveSession();

  const [actualCash, setActualCash] = useState<string>('');
  const [remarks, setRemarks] = useState<string>('');
  const [submitError, setSubmitError] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ── Real per-method payment totals from live session ──────────────────────
  const cashPayments = session?.payments
    ?.filter((p) => p.paymentMethod === 'CASH' && p.status === 'POSTED')
    ?.reduce((sum, p) => {
      const refunds = p.reversals
        ?.filter((r) => r.type === 'REFUND')
        ?.reduce((rSum, r) => rSum + safeMoney(r.amount), 0) || 0;
      return sum + safeMoney(p.amount) - refunds;
    }, 0) || 0;

  const cardPayments = session?.payments
    ?.filter((p) => p.paymentMethod === 'CARD' && p.status === 'POSTED')
    ?.reduce((sum, p) => sum + safeMoney(p.amount), 0) || 0;

  const onlinePayments = session?.payments
    ?.filter((p) => p.paymentMethod === 'ONLINE' && p.status === 'POSTED')
    ?.reduce((sum, p) => sum + safeMoney(p.amount), 0) || 0;

  const hmoPayments = session?.payments
    ?.filter((p) => p.paymentMethod === 'HMO' && p.status === 'POSTED')
    ?.reduce((sum, p) => sum + safeMoney(p.amount), 0) || 0;

  const totalCollections = cashPayments + cardPayments + onlinePayments + hmoPayments;
  const openingBalance = safeMoney(session?.openingBalance);
  const expectedCashTotal = openingBalance + cashPayments;

  const actualCashNum = parseFloat(actualCash) || 0;
  const variance = actualCashNum - expectedCashTotal;

  // ── Submit: calls real backend closeSession ───────────────────────────────
  const handleSubmitClosing = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');

    if (!session) return;

    if (isNaN(parseFloat(actualCash))) {
      setSubmitError('Please enter a valid actual cash count.');
      return;
    }

    if (variance !== 0 && !remarks.trim()) {
      setSubmitError('Discrepancy remarks are strictly required for variance approvals.');
      return;
    }

    setIsSubmitting(true);
    try {
      await closeSession(session.id, {
        actualClosingBalance: actualCashNum,
        remarks: remarks.trim() || undefined,
      });
      // Session is now closed — redirect to cashier dashboard
      navigate('/cashier');
    } catch (err) {
      setSubmitError((err as Error).message || 'Failed to submit reconciliation');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Loading state ────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="p-8 text-center bg-white border border-slate-200 rounded-lg shadow-sm space-y-3 max-w-sm mx-auto mt-12 animate-fade-in">
        <div className="animate-spin mx-auto w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full" />
        <p className="text-xs text-slate-500 font-medium tracking-wide animate-pulse font-sans">Loading session data…</p>
      </div>
    );
  }

  // ── No active session ────────────────────────────────────────────────────
  if (!session) {
    return (
      <HmsDashboardShell
        toolbar={
          <HmsToolbar
            branchName={user?.branchId ? `Branch ID: ${user.branchId}` : 'Main Clinic'}
            role={user?.roles?.join(', ')}
          >
            <button
              onClick={() => navigate('/cashier')}
              className="flex items-center gap-1 text-[11px] font-bold text-slate-500 hover:text-slate-800 transition-all"
            >
              <ArrowLeft className="h-3 w-3" /> Back to Cashier
            </button>
          </HmsToolbar>
        }
        footer={<HmsAuditFooter dataSource="Cash Drawer Console API" />}
      >
        <HmsPageHeader
          title="Daily Cashier Reconciliation"
          description="Count physical cash-on-hand drawer balances and compare collections with POS payment ledger values before shift close."
          badge="Financial Audit"
          onBack={() => navigate('/cashier')}
        />
        <div className="p-6 bg-slate-50 border border-slate-200 rounded-lg text-center max-w-md mx-auto animate-fade-in">
          <Wallet className="h-8 w-8 text-slate-400 mx-auto mb-3" />
          <h4 className="text-sm font-bold text-slate-700 font-sans">No Active Session</h4>
          <p className="text-xs text-slate-500 mt-1 font-sans">
            Open a cashier drawer session from the Session Console before reconciling.
          </p>
          <button
            onClick={() => navigate('/cashier/session')}
            className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-colors font-sans"
          >
            Go to Session Console
          </button>
        </div>
      </HmsDashboardShell>
    );
  }

  // ── Main reconciliation form (live data) ──────────────────────────────────
  return (
    <HmsDashboardShell
      toolbar={
        <HmsToolbar
          branchName={user?.branchId ? `Branch ID: ${user.branchId}` : 'Main Clinic'}
          role={user?.roles?.join(', ')}
        >
          <button
            onClick={() => navigate('/cashier')}
            className="flex items-center gap-1 text-[11px] font-bold text-slate-500 hover:text-slate-800 transition-all"
          >
            <ArrowLeft className="h-3 w-3" /> Back to Cashier
          </button>
        </HmsToolbar>
      }
      footer={<HmsAuditFooter dataSource="Cash Drawer Console API" />}
    >
      <HmsPageHeader
        title="Daily Cashier Reconciliation"
        description="Count physical cash-on-hand drawer balances and compare collections with POS payment ledger values before shift close."
        badge="Financial Audit"
        onBack={() => navigate('/cashier')}
      />

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex gap-2.5 text-[12px] text-rose-800 font-medium font-sans">
          <AlertTriangle className="h-4 w-4 text-rose-600 mt-0.5 shrink-0" />
          {error}
        </div>
      )}

      <form onSubmit={handleSubmitClosing} className="space-y-4">

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

          <HmsBalanceSheet title="Method Collections" icon={<ClipboardList className="h-3.5 w-3.5" />}>
            <HmsBalanceSheet.Item label="Cash Collections" value={cashPayments} />
            <HmsBalanceSheet.Item label="Card Payments" value={cardPayments} />
            <HmsBalanceSheet.Item label="Digital / E-Wallet" value={onlinePayments} />
            <HmsBalanceSheet.Item label="HMO Allocations" value={hmoPayments} />
            <div className="pt-2">
              <HmsBalanceSheet.Item label="Total Payments" value={totalCollections} variant="highlight" />
            </div>
          </HmsBalanceSheet>

          <HmsBalanceSheet title="Drawer Balance" icon={<Wallet className="h-3.5 w-3.5" />}>
            <HmsBalanceSheet.Item label="Opening Float" value={openingBalance} />
            <HmsBalanceSheet.Item label="Expected Cash Total" value={expectedCashTotal} />

            <div className="space-y-1 mt-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wide block font-sans">Actual Counted Cash</label>
              <input
                type="number"
                value={actualCash || ''}
                onChange={(e) => setActualCash(e.target.value)}
                placeholder="0.00"
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[13px] font-mono font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                step="0.01"
                required
              />
            </div>

            {actualCash !== '' && (
              <div className="pt-2 mt-2 border-t border-slate-100">
                <HmsBalanceSheet.Item
                  label="Reconciliation Variance"
                  value={variance}
                  variant={variance === 0 ? 'success' : 'critical'}
                />
              </div>
            )}
          </HmsBalanceSheet>

          <HmsFormContainer
            title="Variance Remarks"
            description="Detail any discrepancies found during counting."
            columns={1}
          >
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wide block font-sans">
                Audit Notes {variance !== 0 && <span className="text-rose-600">(Required)</span>}
              </label>
              <textarea
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder={variance !== 0 ? "Explain reasons for discrepancy..." : "Reconciliation remarks (optional)..."}
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[12px] font-medium min-h-[110px] focus:outline-none focus:ring-1 focus:ring-blue-500 font-sans"
              />
            </div>

            {actualCash !== '' && (variance === 0 ? (
              <div className="p-2 bg-emerald-50 border border-emerald-100 rounded text-emerald-700 font-bold text-[10px] flex items-center gap-1.5 font-sans">
                <CheckCircle className="h-3.5 w-3.5" />
                Balanced Ledger
              </div>
            ) : (
              <div className="p-2 bg-rose-50 border border-rose-100 rounded text-rose-700 font-bold text-[10px] flex items-center gap-1.5 animate-pulse font-sans">
                <ShieldAlert className="h-3.5 w-3.5" />
                Audit Required
              </div>
            ))}
          </HmsFormContainer>

        </div>

        {submitError && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex gap-2.5 text-[12px] text-rose-800 font-medium font-sans">
            <AlertTriangle className="h-4 w-4 text-rose-600 mt-0.5 shrink-0" />
            {submitError}
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={() => navigate('/cashier')}
            className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-650 font-bold text-[12px] rounded-lg transition-all font-sans"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={isSubmitting || actualCash === ''}
            className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold text-[12px] rounded-lg shadow-sm flex items-center gap-1.5 transition-all font-sans"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                Submitting…
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4" /> Submit Reconciled Shift
              </>
            )}
          </button>
        </div>

      </form>

    </HmsDashboardShell>
  );
};

export default DailyReconciliationPage;
