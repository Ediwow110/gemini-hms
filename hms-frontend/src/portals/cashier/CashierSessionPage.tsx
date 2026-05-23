import { useState } from 'react';
import { PageHeader } from '../../components/ui/page-header';
import { Play, LogOut, Scale, AlertTriangle, ShieldCheck } from 'lucide-react';

export const CashierSessionPage = () => {
  const [session, setSession] = useState<{
    id: string;
    cashierName: string;
    status: 'Active' | 'Closed';
    startedAt: string;
    startingCash: number;
    expectedCash: number;
    actualCash: number;
  } | null>({
    id: 'SESS-2026-0521',
    cashierName: 'Mark Santos',
    status: 'Active',
    startedAt: 'Today, 08:00 AM',
    startingCash: 5000,
    expectedCash: 23450,
    actualCash: 23450,
  });

  const [openingCash, setOpeningCash] = useState<string>('5000');
  const [actualCash, setActualCash] = useState<string>('23450');
  const [remarks, setRemarks] = useState<string>('');
  const [error, setError] = useState<string>('');

  const handleOpenSession = (e: React.FormEvent) => {
    e.preventDefault();
    const floatAmount = parseFloat(openingCash) || 0;
    setSession({
      id: `SESS-2026-05${Math.floor(Math.random() * 90) + 10}`,
      cashierName: 'Mark Santos',
      status: 'Active',
      startedAt: 'Today, Just Now',
      startingCash: floatAmount,
      expectedCash: floatAmount,
      actualCash: floatAmount,
    });
    alert('Cash drawer session opened successfully.');
  };

  const handleCloseSession = (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) return;

    const actualFloat = parseFloat(actualCash) || 0;
    const variance = actualFloat - session.expectedCash;

    if (variance !== 0 && !remarks.trim()) {
      setError('Remarks are strictly required when there is a cash drawer variance.');
      return;
    }

    setError('');
    setSession(null);
    alert('Session successfully reconciled and closed. Drawer logs archived.');
  };

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      
      {/* Sandbox Warning Banner */}
      <div className="p-4 bg-amber-50 border border-amber-150 rounded-2xl flex gap-3 text-xs text-amber-800">
        <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
        <div>
          <h5 className="font-extrabold uppercase text-[10px] tracking-wider">UI Demonstration Sandbox Shell</h5>
          <p className="font-medium mt-0.5">
            This cash drawer manager simulates opening and closing sessions in local memory.
          </p>
        </div>
      </div>

      <PageHeader 
        title="POS Teller Drawer Console" 
        description="Monitor current cash-in-drawer starting floats, reconcile drawer balances, and close cashier shifts." 
      />

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
                <span className="text-slate-500">Cashier:</span>
                <span className="font-bold text-slate-850">{session.cashierName}</span>
              </div>
              <div className="flex justify-between font-semibold border-b border-slate-50 pb-1.5">
                <span className="text-slate-500">Shift Started:</span>
                <span className="font-bold text-slate-800">{session.startedAt}</span>
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
                <span className="font-mono text-slate-800">₱{session.startingCash.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between border-b border-slate-50 pb-1.5">
                <span className="text-slate-500">Expected Total:</span>
                <span className="font-mono text-slate-850">₱{session.expectedCash.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between font-bold pt-1.5 text-sm">
                <span className="text-slate-900">Expected Balance:</span>
                <span className="font-mono text-slate-900">₱{session.expectedCash.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
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
                    value={actualCash}
                    onChange={(e) => setActualCash(e.target.value)}
                    className="input font-mono font-bold text-slate-800 text-sm py-2 bg-slate-50 border border-slate-200 rounded-xl w-full"
                    step="0.01"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-450 uppercase block">Variance Remarks</label>
                  <textarea
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    placeholder="Enter reason for count discrepancy..."
                    className="input text-xs py-2 bg-slate-50 border border-slate-200 rounded-xl w-full min-h-[60px]"
                  />
                </div>

                {error && (
                  <p className="text-[10px] text-rose-600 font-extrabold uppercase tracking-wide animate-pulse">
                    {error}
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
              <label className="text-[10px] font-black text-slate-450 uppercase block">Starting Drawer Float (₱)</label>
              <input
                type="number"
                value={openingCash}
                onChange={(e) => setOpeningCash(e.target.value)}
                placeholder="5,000.00"
                className="input font-mono font-bold text-slate-800 text-sm py-2 bg-slate-50 border border-slate-200 rounded-xl w-full"
                step="0.01"
              />
            </div>
            <div className="p-3 bg-indigo-50/50 border border-indigo-150/60 rounded-2xl text-[11px] text-slate-550 leading-relaxed font-semibold">
              Opening float defines starting cash in physical drawer. Opening shift triggers security audit logs for tracking teller drawer variance.
            </div>
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
