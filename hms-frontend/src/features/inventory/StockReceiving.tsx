import { PageHeader } from "../../components/ui/page-header";
import { Trash2 } from "lucide-react";

export const StockReceiving = () => {
  return (
    <div className="space-y-6 pb-12">
      <PageHeader title="Stock Receiving" description="Record incoming shipments from suppliers." />
      
      <div className="card p-6">
        <h2 className="font-semibold text-slate-900 mb-4">Supplier Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input className="input" placeholder="Supplier Name" />
          <input className="input" placeholder="Reference No." />
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
              <tr className="hover:bg-slate-50 transition-colors">
                <td className="px-4 py-3 font-medium text-slate-900">CBC Reagent</td>
                <td className="px-4 py-3 text-slate-600">B2026-01</td>
                <td className="px-4 py-3 text-slate-900">20</td>
                <td className="px-4 py-3 text-center">
                  <button className="text-rose-600 hover:text-rose-800 text-xs font-medium flex items-center gap-1 mx-auto">
                    <Trash2 className="h-3.5 w-3.5" />
                    Remove
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button className="btn btn-secondary">Cancel</button>
          <button className="btn btn-primary">Post Receiving</button>
        </div>
      </div>
    </div>
  );
};
