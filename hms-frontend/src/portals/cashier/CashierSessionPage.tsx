import React, { useState } from 'react';
import { PageHeader } from '../../components/ui/page-header';
import { Play, LogOut, Scale, ShieldCheck } from 'lucide-react';
import { useActiveSession } from '../../hooks/use-billing';
import { useUser } from '../../hooks/use-user';

export const CashierSessionPage: React.FC = () => {
  const user = useUser();
  const { session, loading, error, refetch, openSession, closeSession } = useActiveSession();

  const [openingBalance, setOpeningBalance] = useState<string>('5000');
  const [actualClosingBalance, setActualClosingBalance] = useState<string>('');
  const [remarks, setRemarks] = useState<string>('');
  const [submitError, setSubmitError] = useState<string>('');

  const cashPayments = session?.payments
    ?.filter((p) => p.paymentMethod === 'CASH' && p.status === 'POSTED')
    ?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;

  const expectedCash = Number(session?.openingBalance || 0) + cashPayments;

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
      <div className="card bg-white border border-slate-200/80 shadow-sm rounded-2xl p-12 text-center text-xs text-slate-400">
        Loading cashier session status...
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      <PageHeader 
        title="POS Teller Drawer Console" 
        description="Monitor current cash-in-drawer starting floats, reconcile drawer balances, and close cashier shifts." 
      />

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-750 font-bold">
          {error}
        </div>
      )}

      {session ? (
        /* Active session details */
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          <div className="card p-5 bg-white border border-slate-200/80 shadow-sm rounded-2xl space-y-4">
            <h4 className="font-bold text-slate-800 text-xs tracking-wider uppercase border-b border-slate-100 pb-3 flex items-center gap-1.5">
              <ShieldCheck className="h-4.5 w-4.5 text-indigo-500" />
              Active Shift Status
            </h4>
            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between font-semibold border-b border-slate-50 pb-1.5">
                <span className="text-slate-500">Session ID:</span>
                <span className="font-mono font-bold text-slate-800">{session.id}</span>
              </div>
              <div className="flex justify-between font-semibold border-b border-slate-50 pb-1.5">
                <span className="text-slate-500">Shift Started:</span>
                <span className="font-bold text-slate-800">{new Date(session.openedAt).toLocaleTimeString()}</span>
              </div>
              <div className="flex justify-between font-bold pt-1">
                <span className="text-slate-900">Current Status:</span>
                <span className="text-emerald-600 font-extrabold flex items-center gap-1 animate-pulse">
                  ● ACTIVE SHIFT
                </span>
              </div>
            </div>
          </div>

          <div className="card p-5 bg-white border border-slate-200/80 shadow-sm rounded-2xl space-y-4">
            <h4 className="font-bold text-slate-800 text-xs tracking-wider uppercase border-b border-slate-100 pb-3 flex items-center gap-1.5">
              <Scale className="h-4.5 w-4.5 text-indigo-500" />
              Collections Reconciliation
            </h4>
            <div className="space-y-2.5 text-xs font-semibold">
              <div className="flex justify-between border-b border-slate-50 pb-1.5">
                <span className="text-slate-500">Starting Drawer:</span>
                <span className="font-mono text-slate-800">₱{Number(session.openingBalance).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between border-b border-slate-50 pb-1.5">
                <span className="text-slate-500">CASH Payments:</span>
                <span className="font-mono text-slate-850">₱{cashPayments.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between font-bold pt-1.5 text-sm">
                <span className="text-slate-900">Expected Balance:</span>
                <span className="font-mono text-slate-900">₱{expectedCash.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>

          <div className="card p-5 bg-white border border-slate-200/80 shadow-sm rounded-2xl">
            <form onSubmit={handleCloseSession} className="space-y-4">
              <h4 className="font-bold text-slate-800 text-xs tracking-wider uppercase border-b border-slate-100 pb-3">
                Shift Closure Reconcile
              </h4>
              <div className="space-y-3.5 text-xs">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-450 uppercase block">Actual Counted Cash</label>
                  <input
                    type="number"
                    value={actualClosingBalance}
                    onChange={(e) => setActualClosingBalance(e.target.value)}
                    className="input font-mono font-bold text-slate-800 text-sm py-2 bg-slate-50 border border-slate-200 rounded-xl w-full"
                    step="0.01"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-455 uppercase block">Variance Remarks</label>
                  <textarea
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    placeholder="Enter reason for count discrepancy..."
                    className="input text-xs py-2 bg-slate-50 border border-slate-200 rounded-xl w-full min-h-[60px]"
                  />
                </div>

                {submitError && (
                  <p className="text-[10px] text-rose-600 font-extrabold uppercase tracking-wide">
                    {submitError}
                  </p>
                )}

                <button
                  type="submit"
                  className="btn bg-rose-600 hover:bg-rose-700 text-white text-xs font-black py-2.5 rounded-xl w-full flex items-center justify-center gap-1 shadow-sm"
                >
                  <LogOut className="h-4 w-4" /> Close Shift Session
                </button>
              </div>
            </form>
          </div>

        </div>
      ) : (
        /* Open Shift Form */
        <div className="card p-6 bg-white border border-slate-200/80 shadow-md rounded-3xl max-w-md mx-auto space-y-4">
          <h4 className="font-extrabold text-slate-800 text-sm tracking-wider uppercase border-b border-slate-100 pb-3 flex items-center gap-2">
            <Play className="h-4 w-4 text-indigo-500 fill-current" />
            Open Cashier Shift Drawer
          </h4>
          <form onSubmit={handleOpenSession} className="space-y-4 text-xs font-semibold text-slate-650">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-455 uppercase block">Starting Drawer Float (₱)</label>
              <input
                type="number"
                value={openingBalance}
                onChange={(e) => setOpeningBalance(e.target.value)}
                placeholder="5,000.00"
                className="input font-mono font-bold text-slate-800 text-sm py-2 bg-slate-50 border border-slate-200 rounded-xl w-full"
                step="0.01"
                required
              />
            </div>
            <div className="p-3 bg-indigo-50/50 border border-indigo-150/60 rounded-2xl text-[11px] text-slate-550 leading-relaxed font-semibold">
              Opening float defines starting cash in physical drawer. Opening shift triggers security audit logs for tracking teller drawer variance.
            </div>

            {submitError && (
              <p className="text-[10px] text-rose-600 font-extrabold uppercase tracking-wide">
                {submitError}
              </p>
            )}

            <button
              type="submit"
              className="btn btn-primary text-xs font-black py-2.5 rounded-xl w-full flex items-center justify-center gap-1.5"
            >
              <Play className="h-4 w-4 fill-current" /> Open Drawer Shift
            </button>
          </form>
        </div>
      )}

    </div>
  );
};

export default CashierSessionPage;
