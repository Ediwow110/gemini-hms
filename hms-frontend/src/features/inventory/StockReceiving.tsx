import { PageHeader } from "../../components/ui/page-header";
import { Trash2, AlertTriangle, FlaskConical, Inbox } from "lucide-react";
import { HmsDashboardShell, HmsAuditFooter } from "../../components/hms-dashboard";

export const StockReceiving = () => {
  return (
    <HmsDashboardShell
      widthTier="compact"
      footer={<HmsAuditFooter dataSource="Mock receiving form (sandbox)" />}
    >
      <div className="space-y-6 pb-12">
        <PageHeader title="Stock Receiving" description="Record incoming shipments from suppliers." />

        <div
          className="card p-5 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3"
          role="status"
        >
          <div className="p-2 bg-amber-100 rounded-lg flex-shrink-0">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
          </div>
          <div className="text-sm text-amber-900">
            <p className="font-bold mb-1">Stock receiving UI is not yet wired to the backend.</p>
            <p>
              The backend exposes the receive endpoint (
              <code className="font-mono text-[11px]">POST /api/v1/inventory/items/:id/receive</code>
              ) and the inventory catalog (
              <code className="font-mono text-[11px]">GET /api/v1/inventory/catalog</code>
              ), but the form below is a static sandbox shell. The item row, supplier name,
              reference number, and quantities shown are hardcoded mock data and
              <strong> are not persisted</strong>. Submitting this form has no effect.
            </p>
            <div className="mt-3 flex items-center gap-2 text-xs text-amber-700">
              <FlaskConical className="h-4 w-4" />
              <span>UI demo shell only. No mutations are sent to the HMS backend API.</span>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <h2 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <Inbox className="h-4 w-4 text-slate-400" />
            Supplier Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input className="input" placeholder="Supplier Name" disabled aria-disabled="true" />
            <input className="input" placeholder="Reference No." disabled aria-disabled="true" />
          </div>

          <h2 className="font-semibold text-slate-900 mt-8 mb-4">Received Items</h2>
          <div className="overflow-hidden rounded-lg border border-slate-200">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Item</th>
                  <th className="px-4 py-3">Batch</th>
                  <th className="px-4 py-3">Qty</th>
                  <th className="px-4 py-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                <tr className="bg-slate-50/50">
                  <td className="px-4 py-3 font-medium text-slate-900">CBC Reagent</td>
                  <td className="px-4 py-3 text-slate-600">B2026-01</td>
                  <td className="px-4 py-3 text-slate-900">20</td>
                  <td className="px-4 py-3 text-center">
                    <button
                      type="button"
                      disabled
                      aria-disabled="true"
                      className="text-slate-300 cursor-not-allowed text-xs font-medium flex items-center gap-1 mx-auto"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Remove
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <button
              type="button"
              disabled
              aria-disabled="true"
              className="btn btn-secondary opacity-50 cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled
              aria-disabled="true"
              className="btn btn-primary opacity-50 cursor-not-allowed"
            >
              Post Receiving
            </button>
          </div>
        </div>
      </div>
    </HmsDashboardShell>
  );
};

export default StockReceiving;
