import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  HmsDashboardShell, 
  HmsToolbar, 
  HmsAuditFooter, 
  HmsBalanceSheet
} from '../../components/hms-dashboard';
import { HmsPageHeader, HmsFormContainer } from '../../components/hms-page';
import { CheckCircle, AlertTriangle, ArrowLeft, ClipboardList, Wallet, ShieldAlert } from 'lucide-react';
import { useUser } from '../../hooks/use-user';

export const DailyReconciliationPage = () => {
  const navigate = useNavigate();
  const user = useUser();
  
  // Starting float & expected collections
  const startingCash = 5000;
  const [collections] = useState({
    cash: 18450,
    card: 5120,
    online: 850,
    hmo: 15400,
  });

  const [actualCash, setActualCash] = useState<number>(23450);
  const [remarks, setRemarks] = useState<string>('');

  const totalCollections = collections.cash + collections.card + collections.online + collections.hmo;
  const expectedCashTotal = startingCash + collections.cash;
  const variance = actualCash - expectedCashTotal;

  const handleSubmitClosing = (e: React.FormEvent) => {
    e.preventDefault();

    if (variance !== 0 && !remarks.trim()) {
      alert('Error: Discrepancy remarks are strictly required for variance approvals.');
      return;
    }

    alert(`Shift drawer session reconciled successfully.\nVariance: ₱${variance.toFixed(2)}\nRemarks logged in audit history.`);
    navigate('/cashier');
  };

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
      footer={<HmsAuditFooter dataSource="Simulation Workflow Engine" />}
    >
      <HmsPageHeader 
        title="Daily Cashier Reconciliation" 
        description="Count physical cash-on-hand drawer balances and compare collections with POS payment ledger values before shift close."
        badge="Financial Audit"
        onBack={() => navigate('/cashier')}
      />

      {/* WIP Banner */}
      <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex gap-2.5 text-[12px] text-amber-800 animate-fade-in">
        <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
        <div>
          <h5 className="font-bold uppercase text-[10px] tracking-wider font-sans">Daily Reconciliation (WIP)</h5>
          <p className="font-medium font-sans">
            End-of-day reconciliation is simulated. Actual cashier session closing, variance logging, and shift audit posting are not yet wired to the backend.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmitClosing} className="space-y-4">
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          
          <HmsBalanceSheet title="Method Collections" icon={<ClipboardList className="h-3.5 w-3.5" />}>
            <HmsBalanceSheet.Item label="Cash Collections" value={collections.cash} />
            <HmsBalanceSheet.Item label="Card Payments" value={collections.card} />
            <HmsBalanceSheet.Item label="Digital / E-Wallet" value={collections.online} />
            <HmsBalanceSheet.Item label="HMO Allocations" value={collections.hmo} />
            <div className="pt-2">
              <HmsBalanceSheet.Item label="Total Payments" value={totalCollections} variant="highlight" />
            </div>
          </HmsBalanceSheet>

          <HmsBalanceSheet title="Drawer Balance" icon={<Wallet className="h-3.5 w-3.5" />}>
            <HmsBalanceSheet.Item label="Opening Float" value={startingCash} />
            <HmsBalanceSheet.Item label="Expected Cash Total" value={expectedCashTotal} />
            
            <div className="space-y-1 mt-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wide block font-sans">Actual Counted Cash</label>
              <input
                type="number"
                value={actualCash || ''}
                onChange={(e) => setActualCash(parseFloat(e.target.value) || 0)}
                placeholder="0.00"
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[13px] font-mono font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                step="0.01"
              />
            </div>

            <div className="pt-2 mt-2 border-t border-slate-100">
              <HmsBalanceSheet.Item 
                label="Reconciliation Variance" 
                value={variance} 
                variant={variance === 0 ? 'success' : 'critical'} 
              />
            </div>
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

            {variance === 0 ? (
              <div className="p-2 bg-emerald-50 border border-emerald-100 rounded text-emerald-700 font-bold text-[10px] flex items-center gap-1.5 font-sans">
                <CheckCircle className="h-3.5 w-3.5" />
                Balanced Ledger
              </div>
            ) : (
              <div className="p-2 bg-rose-50 border border-rose-100 rounded text-rose-700 font-bold text-[10px] flex items-center gap-1.5 animate-pulse font-sans">
                <ShieldAlert className="h-3.5 w-3.5" />
                Audit Required
              </div>
            )}
          </HmsFormContainer>

        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={() => navigate('/cashier')}
            className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-650 font-bold text-[12px] rounded-lg transition-all font-sans"
          >
            Cancel Draft
          </button>
          
          <button
            type="submit"
            className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[12px] rounded-lg shadow-sm flex items-center gap-1.5 transition-all font-sans"
          >
            <CheckCircle className="h-4 w-4" /> Submit Reconciled Shift
          </button>
        </div>

      </form>

    </HmsDashboardShell>
  );
};

export default DailyReconciliationPage;
