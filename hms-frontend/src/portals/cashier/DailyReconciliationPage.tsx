import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../../components/ui/page-header';
import { CheckCircle, AlertTriangle, ArrowLeft } from 'lucide-react';
import { ReconciliationSummary } from './components/ReconciliationSummary';

export const DailyReconciliationPage = () => {
  const navigate = useNavigate();
  
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
    <div className="space-y-6 pb-12 animate-fade-in">
      
      {/* WIP Banner */}
      <div className="p-4 bg-amber-50 border border-amber-150 rounded-2xl flex gap-3 text-xs text-amber-800">
        <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
        <div>
          <h5 className="font-extrabold uppercase text-[10px] tracking-wider">Daily Reconciliation (WIP)</h5>
          <p className="font-medium mt-0.5">
            End-of-day reconciliation is simulated. Actual cashier session closing, variance logging, and shift audit posting are not yet wired to the backend.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button 
          onClick={() => navigate('/cashier')}
          className="p-2 border border-slate-200 hover:bg-slate-50 text-slate-500 hover:text-slate-800 rounded-xl transition-all"
        >
          <ArrowLeft className="h-4.5 w-4.5" />
        </button>
        <PageHeader 
          title="Daily Cashier Reconciliation" 
          description="Count physical cash-on-hand drawer balances and compare collections with POS payment ledger values before shift close." 
        />
      </div>

      <form onSubmit={handleSubmitClosing} className="space-y-6">
        
        <ReconciliationSummary
          startingCash={startingCash}
          collections={collections}
          actualCash={actualCash}
          remarks={remarks}
          onRemarksChange={setRemarks}
          onActualCashChange={setActualCash}
        />

        <div className="flex justify-end gap-3 pt-4">
          <button
            type="button"
            onClick={() => navigate('/cashier')}
            className="btn border border-slate-200 hover:bg-slate-50 text-slate-650 font-bold px-6 py-2.5 rounded-xl"
          >
            Cancel Draft
          </button>
          
          <button
            type="submit"
            className="btn btn-success text-xs font-black px-6 py-2.5 rounded-xl shadow-md flex items-center gap-1.5"
          >
            <CheckCircle className="h-4.5 w-4.5" /> Submit Reconciled shift
          </button>
        </div>

      </form>

    </div>
  );
};

export default DailyReconciliationPage;
