import React, { useState } from 'react';
import { Play, LogOut, Scale, ShieldCheck, AlertTriangle } from 'lucide-react';
import { useActiveSession } from '../../hooks/use-billing';
import { useUser } from '../../hooks/use-user';
import { HmsDashboardShell, HmsToolbar, HmsAuditFooter } from '../../components/hms-dashboard';
import { HmsPageHeader, HmsFormContainer } from '../../components/hms-page';
import { safeMoney } from '../../lib/safe-money';

export const CashierSessionPage: React.FC = () => {
  const user = useUser();
  const { session, loading, error, refetch, openSession, closeSession } = useActiveSession();

  const [openingBalance, setOpeningBalance] = useState<string>('5000');
  const [actualClosingBalance, setActualClosingBalance] = useState<string>('');
  const [remarks, setRemarks] = useState<string>('');
  const [submitError, setSubmitError] = useState<string>('');
  const [lastUpdated, setLastUpdated] = useState<Date | undefined>(undefined);

  React.useEffect(() => {
    if (!loading) {
      setLastUpdated(new Date());
    }
  }, [loading]);

  const cashPayments = session?.payments
    ?.filter((p) => p.paymentMethod === 'CASH' && p.status === 'POSTED')
    ?.reduce((sum, p) => sum + safeMoney(p.amount), 0) || 0;

  const expectedCash = safeMoney(session?.openingBalance) + cashPayments;

  const handleOpenSession = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');
    if (!user?.branchId) {
      setSubmitError('Active branch context is required to open a session.');
      return;
    }
    try {
      await openSession({
        branchId: user.branchId,
        openingBalance: parseFloat(openingBalance) || 0,
      });
      refetch();
    } catch (err) {
      setSubmitError((err as Error).message || 'Failed to open session');
    }
  };

  const handleCloseSession = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');
    if (!session) return;

    const actual = parseFloat(actualClosingBalance);
    if (isNaN(actual)) {
      setSubmitError('Please enter a valid actual closing balance.');
      return;
    }

    const variance = actual - expectedCash;
    if (variance !== 0 && !remarks.trim()) {
      setSubmitError('Remarks are strictly required when there is a cash drawer variance.');
      return;
    }

    try {
      await closeSession(session.id, {
        actualClosingBalance: actual,
        remarks: remarks.trim() || undefined,
      });
      setActualClosingBalance('');
      setRemarks('');
      refetch();
    } catch (err) {
      setSubmitError((err as Error).message || 'Failed to close session');
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center bg-white border border-slate-200 rounded-lg shadow-sm space-y-3 max-w-sm mx-auto mt-12 animate-fade-in">
        <div className="animate-spin mx-auto w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full" />
        <p className="text-xs text-slate-500 font-medium tracking-wide animate-pulse font-sans">Loading cashier session status...</p>
      </div>
    );
  }

  const content = () => {
    if (session) {
      const actualVal = parseFloat(actualClosingBalance);
      const isVariance = !isNaN(actualVal) && actualVal !== expectedCash;
      const varianceAmount = !isNaN(actualVal) ? actualVal - expectedCash : 0;

      return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          {/* Shift Details */}
          <div className="bg-white border border-slate-200 p-4 rounded-lg shadow-sm space-y-3.5">
            <h4 className="font-bold text-slate-900 text-[10px] tracking-wider uppercase border-b border-slate-100 pb-1.5 flex items-center gap-1 font-sans">
              <ShieldCheck className="h-4 w-4 text-blue-500" />
              Active Shift Status
            </h4>
            <div className="space-y-2 text-xs font-sans">
              <div className="flex justify-between font-semibold border-b border-slate-50 pb-1">
                <span className="text-slate-550">Session ID:</span>
                <span className="font-mono font-bold text-slate-800 break-all text-right max-w-[150px]">{session.id}</span>
              </div>
              <div className="flex justify-between font-semibold border-b border-slate-50 pb-1">
                <span className="text-slate-550">Shift Started:</span>
                <span className="font-mono font-bold text-slate-800">{new Date(session.openedAt).toLocaleTimeString()}</span>
              </div>
              <div className="flex justify-between font-bold pt-1">
                <span className="text-slate-900">Current Status:</span>
                <span className="text-emerald-600 font-extrabold flex items-center gap-1 animate-pulse">
                  ● ACTIVE SHIFT
                </span>
              </div>
            </div>
          </div>

          {/* Collections Reconciliation */}
          <div className="bg-white border border-slate-200 p-4 rounded-lg shadow-sm space-y-3.5">
            <h4 className="font-bold text-slate-900 text-[10px] tracking-wider uppercase border-b border-slate-100 pb-1.5 flex items-center gap-1 font-sans">
              <Scale className="h-4 w-4 text-blue-500" />
              Collections Reconciliation
            </h4>
            <div className="space-y-2 text-xs font-sans">
              <div className="flex justify-between border-b border-slate-550/10 pb-1 font-semibold">
                <span className="text-slate-550">Starting Float:</span>
                <span className="font-mono text-slate-800">{`₱${safeMoney(session.openingBalance).toLocaleString('en-US', { minimumFractionDigits: 2 })}`}</span>
              </div>
              <div className="flex justify-between border-b border-slate-550/10 pb-1 font-semibold">
                <span className="text-slate-550">CASH Payments:</span>
                <span className="font-mono text-slate-850">{`₱${cashPayments.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}</span>
              </div>
              <div className="flex justify-between font-bold pt-1 text-slate-900">
                <span>Expected Drawer:</span>
                <span className="font-mono">{`₱${expectedCash.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}</span>
              </div>
            </div>
          </div>

          {/* Reconcile and Close Form */}
          <HmsFormContainer
            title="Shift Closure Reconcile"
            description="Declare physical cash drawer count and remarks to commit closing audit log."
            onSubmit={handleCloseSession}
            columns={1}
            error={submitError}
            actions={
              <button
                type="submit"
                className="w-full py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg flex items-center justify-center gap-1 shadow-sm transition-colors font-sans"
              >
                <LogOut className="h-3.5 w-3.5" /> Close Shift Session
              </button>
            }
          >
            <div className="space-y-1.5">
              <label htmlFor="actual-closing-balance" className="text-[10px] font-bold text-slate-500 uppercase block font-sans">Actual Counted Cash (₱) <span className="text-rose-500">*</span></label>
              <input
                id="actual-closing-balance"
                type="number"
                value={actualClosingBalance}
                onChange={(e) => setActualClosingBalance(e.target.value)}
                className="font-mono font-bold text-slate-800 text-sm p-2 bg-slate-50 border border-slate-200 rounded-lg w-full focus:outline-none focus:ring-1 focus:ring-rose-500"
                step="0.01"
                required
                placeholder="0.00"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="variance-remarks" className="text-[10px] font-bold text-slate-500 uppercase block font-sans">
                Variance Remarks {isVariance && <span className="text-rose-500 font-extrabold">* (Required due to variance)</span>}
              </label>
              <textarea
                id="variance-remarks"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Describe reason for cash drawer discrepancy..."
                className="text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg w-full min-h-[60px] focus:outline-none focus:ring-1 focus:ring-rose-500 font-sans"
              />
            </div>

            {isVariance && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg flex gap-1.5 text-[11px] text-rose-800 font-bold font-sans">
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-rose-600" />
                <div>
                  <span className="block uppercase tracking-wider text-[9px]">Drawer Discrepancy Detected</span>
                  <span className="font-normal block text-slate-700 mt-0.5">
                    Counted cash differs from expected balance by <strong className="font-mono">{`${varianceAmount > 0 ? '+' : ''}₱${varianceAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}</strong>. Variance remarks are strictly required.
                  </span>
                </div>
              </div>
            )}
          </HmsFormContainer>
        </div>
      );
    }

    /* Open Shift Form */
    return (
      <div className="max-w-md mx-auto">
        <HmsFormContainer
          title="Open Cashier Shift Drawer"
          description="Initialize your cashier shift drawer float. Opening a drawer registers a security audit footprint."
          onSubmit={handleOpenSession}
          columns={1}
          error={submitError}
          actions={
            <button
              type="submit"
              className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-colors font-sans shadow-sm"
            >
              <Play className="h-3.5 w-3.5 fill-current" /> Open Drawer Shift
            </button>
          }
        >
          <div className="space-y-1.5">
            <label htmlFor="opening-balance" className="text-[10px] font-bold text-slate-500 uppercase block font-sans">Starting Drawer Float (₱) <span className="text-rose-500">*</span></label>
            <input
              id="opening-balance"
              type="number"
              value={openingBalance}
              onChange={(e) => setOpeningBalance(e.target.value)}
              placeholder="5,000.00"
              className="font-mono font-bold text-slate-800 text-sm p-2 bg-slate-50 border border-slate-200 rounded-lg w-full focus:outline-none focus:ring-1 focus:ring-blue-500"
              step="0.01"
              required
            />
          </div>
          <div className="p-2.5 bg-blue-50/50 border border-blue-150/60 rounded-lg text-[11px] text-slate-600 leading-relaxed font-semibold font-sans">
            Opening float defines starting cash in physical drawer. Opening shift triggers security audit logs for tracking teller drawer variance.
          </div>
        </HmsFormContainer>
      </div>
    );
  };

  return (
    <HmsDashboardShell
      toolbar={
        <HmsToolbar 
          branchName={user?.branchId || undefined} 
          role={user?.roles?.join(', ') || 'Cashier Teller'} 
          lastRefreshed={lastUpdated}
        />
      }
      footer={<HmsAuditFooter lastRefreshed={lastUpdated} dataSource="Cash Drawer Console API" version="v2.1" />}
    >
      <HmsPageHeader 
        title="POS Teller Drawer Console" 
        description="Monitor current cash-in-drawer starting floats, reconcile drawer balances, and close cashier shifts." 
      />

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 font-bold font-sans">
          {error}
        </div>
      )}

      {content()}
    </HmsDashboardShell>
  );
};

export default CashierSessionPage;
