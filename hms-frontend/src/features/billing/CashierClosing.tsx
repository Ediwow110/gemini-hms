import { useState } from "react";
import { PageHeader } from "../../components/ui/page-header";
import { SectionCard } from "../../components/ui/section-card";
import { useNavigate } from "react-router-dom";
import { RequirePermission } from "../../components/ui/RequirePermission";
import { HmsDataUnavailable } from "../../components/hms-dashboard";
import { AlertTriangle } from "lucide-react";

export const CashierClosing = () => {
  const navigate = useNavigate();
  const [error, setError] = useState<string>("");

  const handleSubmit = () => {
    setError("");
    navigate('/cashier/session');
  };

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex gap-2.5 text-[12px] text-amber-800 animate-fade-in">
        <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
        <div>
          <h5 className="font-bold uppercase text-[10px] tracking-wider font-sans">Legacy Page — Redirects to Live Cashier Session</h5>
          <p className="text-[11px] mt-1">Transaction data below is unavailable. Use the live Shift Closure panel for accurate financial reconciliation.</p>
        </div>
      </div>

      <PageHeader title="Cashier Closing" description="Reconcile cashier collections before closing the session." />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="animate-slide-up stagger-1">
          <SectionCard title="Session Status">
            <HmsDataUnavailable
              sectionName="Cashier Session"
              expectedApi="GET /api/v1/billing/cashier-session/:id"
              expectedPhase="Shift Closure panel"
            />
          </SectionCard>
        </div>

        <div className="animate-slide-up stagger-2">
          <SectionCard title="Payment Summary">
            <HmsDataUnavailable
              sectionName="Payment Summary"
              expectedApi="GET /api/v1/billing/cashier-session/:id/summary"
              expectedPhase="Shift Closure panel"
            />
          </SectionCard>
        </div>

        <div className="animate-slide-up stagger-3">
          <SectionCard title="Reconciliation">
            <HmsDataUnavailable
              sectionName="Reconciliation"
              expectedApi="GET /api/v1/billing/cashier-session/:id/reconciliation"
              expectedPhase="Shift Closure panel"
            />
          </SectionCard>
        </div>
      </div>

      <div className="card overflow-hidden animate-slide-up stagger-4">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="font-bold text-slate-900">Transaction List</h2>
        </div>
        <HmsDataUnavailable
          sectionName="Transactions"
          expectedApi="GET /api/v1/billing/cashier-session/:id/transactions"
          expectedPhase="Shift Closure panel"
        />
      </div>

      {error && <p role="alert" className="text-sm font-bold text-rose-600">{error}</p>}

      <div className="flex justify-end gap-3 pt-6 animate-fade-in stagger-4">
        <button onClick={() => navigate('/cashier/session')} className="btn btn-secondary px-6">Open Shift Closure</button>
        <RequirePermission permission="billing.payment.create">
          <button onClick={handleSubmit} className="btn btn-primary px-6">Review in Shift Closure</button>
        </RequirePermission>
      </div>
    </div>
  );
};
