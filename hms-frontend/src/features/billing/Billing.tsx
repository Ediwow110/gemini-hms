import { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { AlertTriangle, CreditCard, Receipt } from 'lucide-react';
import { PageHeader } from '../../components/ui/page-header';
import { useAuth } from '../../hooks/use-user';

export const Billing = () => {
  const location = useLocation();
  const { user } = useAuth();
  const userRoles = user?.roles ?? [];
  const isCashierOrFinance = userRoles.some((r) =>
    ['Cashier', 'Finance', 'Super Admin', 'Branch Admin'].includes(r),
  );

  useEffect(() => {
    if (typeof window !== 'undefined') {
      console.warn(
        '[Billing] /billing route rendered. The legacy prototype at this path has been replaced with an honest notice. Real billing surfaces live at /billing/dashboard, /cashier/billing, and /patient/billing. See hms-frontend/src/features/billing/Billing.tsx for context.',
      );
    }
  }, [location.pathname]);

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      <PageHeader
        title="Billing & Payment"
        description="This legacy prototype surface has been replaced by live billing surfaces."
      />

      <div
        role="alert"
        className="card p-6 bg-amber-50 border border-amber-200 rounded-2xl flex gap-3"
        data-testid="billing-prototype-notice"
      >
        <AlertTriangle className="h-6 w-6 text-amber-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-amber-900">
          <p className="font-bold mb-1">This page is not the production billing surface.</p>
          <p>
            The form, patient search, and &ldquo;Process Payment&rdquo; button on this route were
            a UI prototype. No payment is processed here &mdash; clicking the old button
            previously fired a fake success alert. Use one of the live surfaces below
            instead.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <a
          href="/billing/dashboard"
          className="card p-5 bg-white border border-slate-200 rounded-2xl hover:border-indigo-300 hover:shadow-sm transition-all"
          data-testid="link-billing-dashboard"
        >
          <div className="flex items-start gap-3">
            <div className="p-2 bg-indigo-50 rounded-lg">
              <Receipt className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900">Billing &amp; Finance Dashboard</h3>
              <p className="text-xs text-slate-500 mt-1">
                Live KPIs, outstanding balances, recent payments, and reconciliation alerts.
                Calls <code className="font-mono text-[11px]">/v1/billing/invoices</code> and
                <code className="font-mono text-[11px]"> /v1/billing/sessions/active</code>.
              </p>
            </div>
          </div>
        </a>

        {isCashierOrFinance && (
          <a
            href="/cashier/billing"
            className="card p-5 bg-white border border-slate-200 rounded-2xl hover:border-emerald-300 hover:shadow-sm transition-all"
            data-testid="link-cashier-billing"
          >
            <div className="flex items-start gap-3">
              <div className="p-2 bg-emerald-50 rounded-lg">
                <CreditCard className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900">Cashier Billing Workspace</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Real cashier payment processing, draft autosave, and invoice settlement.
                  Gated to Cashier / Finance / Branch Admin / Super Admin.
                </p>
              </div>
            </div>
          </a>
        )}
      </div>

      <Navigate to="/billing/dashboard" replace />
    </div>
  );
};

export default Billing;
