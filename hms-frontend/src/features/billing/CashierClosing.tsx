import { useState } from "react";
import { PageHeader } from "../../components/ui/page-header";
import { SectionCard, FormField } from "../../components/ui/section-card";
import { StatusBadge } from "../../components/ui/status-badge";
import { useNavigate } from "react-router-dom";
import { RequirePermission } from "../../components/ui/RequirePermission";
import { logger } from "../../lib/logger";
import { AlertTriangle } from "lucide-react";

export const CashierClosing = () => {
  const navigate = useNavigate();
  const [actualCash, setActualCash] = useState<string>("");
  const [remarks, setRemarks] = useState<string>("");
  const [error, setError] = useState<string>("");

  const openingCash = 5000;
  const cashPayments = 18450;
  const expectedCash = openingCash + cashPayments;
  const variance = actualCash ? parseFloat(actualCash) - expectedCash : 0;

  const handleSubmit = () => {
    setError("");
    if (variance !== 0 && !remarks.trim()) {
      setError("Remarks are strictly required when there is a cash variance.");
      return;
    }

    const payload = {
      actualClosingBalance: parseFloat(actualCash) || 0,
      remarks: remarks.trim()
    };
    
    logger.info("Legacy cashier closing form validated locally; redirecting to live Shift Closure panel:", payload);
    navigate('/cashier/session');
  };

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex gap-2.5 text-[12px] text-amber-800 animate-fade-in">
        <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
        <div>
          <h5 className="font-bold uppercase text-[10px] tracking-wider font-sans">Legacy Page — Redirects to Live Cashier Session</h5>
        </div>
      </div>

      <PageHeader title="Cashier Closing" description="Reconcile cashier collections before closing the session." />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="animate-slide-up stagger-1">
          <SectionCard title="Session Status">
            <div className="space-y-3 text-sm">
              <p className="flex justify-between border-b border-slate-100 pb-2">
                <span className="text-slate-500 font-medium">Cashier:</span> 
                <strong className="text-slate-900">Mark Santos</strong>
              </p>
              <p className="flex justify-between border-b border-slate-100 pb-2">
                <span className="text-slate-500 font-medium">Session ID:</span> 
                <strong className="text-slate-900 font-mono text-xs">SESS-2026-0509</strong>
              </p>
              <div className="flex justify-between items-center pt-1">
                <span className="text-slate-500 font-medium">Status:</span>
                <StatusBadge status="Active" />
              </div>
            </div>
          </SectionCard>
        </div>
        
        <div className="animate-slide-up stagger-2">
          <SectionCard title="Payment Summary">
            <div className="space-y-4">
              <div className="flex justify-between text-sm p-3 bg-slate-50 rounded-xl">
                <span className="font-semibold text-slate-600">Expected Cash</span>
                <span className="font-bold text-slate-900">₱{expectedCash.toFixed(2)}</span>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Actual Count</label>
                <input 
                  type="number" 
                  className="input text-lg font-bold" 
                  onChange={(e) => setActualCash(e.target.value)} 
                  placeholder="0.00"
                />
              </div>
              <div className="flex justify-between font-bold border-t border-slate-100 pt-4 text-sm items-baseline">
                <span>Variance</span>
                <span className={`text-xl ${variance !== 0 ? "text-rose-600" : "text-emerald-600"}`} style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                  ₱{variance.toFixed(2)}
                </span>
              </div>
            </div>
          </SectionCard>
        </div>

        <div className="animate-slide-up stagger-3">
          <SectionCard title="Reconciliation">
            <div className="space-y-4">
              <FormField label="Cashier Remarks" required={variance !== 0}>
                <textarea 
                  className={`input min-h-[140px] py-3 ${error ? 'border-rose-500 bg-rose-50' : ''}`}
                  placeholder={variance !== 0 ? "Please provide exact reason for variance (Required by Approval Engine)" : "No remarks required"} 
                  value={remarks}
                  onChange={(e) => {
                    setRemarks(e.target.value);
                    if (e.target.value.trim() && error) setError("");
                  }}
                />
              </FormField>
              {error && <p className="text-sm font-bold text-rose-600 animate-fade-in">{error}</p>}
            </div>
          </SectionCard>
        </div>
      </div>

      <div className="card overflow-hidden animate-slide-up stagger-4">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="font-bold text-slate-900" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Transaction List</h2>
        </div>
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50/80 text-slate-500 font-medium border-b border-slate-200">
            <tr>
              <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider">Time</th>
              <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider">Receipt</th>
              <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider">Patient</th>
              <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-right">Amount</th>
              <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-center">Method</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            <tr className="hover:bg-indigo-50/30 transition-colors cursor-pointer group">
              <td className="px-6 py-4 text-slate-500 font-medium text-xs">09:30 AM</td>
              <td className="px-6 py-4 font-mono font-bold text-indigo-600">RCP-001</td>
              <td className="px-6 py-4 font-semibold text-slate-900 group-hover:text-indigo-700 flex items-center gap-2">
                John Doe
                <span className="text-[8px] font-black px-1 py-0.5 bg-slate-200 text-slate-600 rounded uppercase tracking-tighter">Demo</span>
              </td>
              <td className="px-6 py-4 font-bold text-slate-900 text-right">₱50.00</td>
              <td className="px-6 py-4 text-center">
                <span className="text-[10px] font-bold px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200/60 rounded-lg uppercase tracking-wider">Cash</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="flex justify-end gap-3 pt-6 animate-fade-in stagger-4">
        <button onClick={() => navigate('/cashier/session')} className="btn btn-secondary px-6">Open Shift Closure</button>
        <RequirePermission permission="billing.payment.create">
          <button onClick={handleSubmit} className="btn btn-primary px-6">Review in Shift Closure</button>
        </RequirePermission>
      </div>
    </div>
  );
};
