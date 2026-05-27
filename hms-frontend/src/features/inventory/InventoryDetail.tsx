import { useState } from "react";
import { PageHeader } from "../../components/ui/page-header";
import { Link } from "react-router-dom";
import { ReasonModal } from "../../components/ui/approval-modals";

const MOCK_ITEM = { 
  id: "S001", name: "CBC Reagent", cat: "Lab", branch: "Main", batch: "B2026-01", qty: 5, reorder: 10, expiry: "2026-12-31", status: "Low", supplier: "MedSupply Co" 
};

export const InventoryDetail = () => {
  const [showAdj, setShowAdj] = useState(false);

  const breadcrumbs = [
    { label: "Inventory", to: "/inventory" },
    { label: MOCK_ITEM.name, current: true }
  ];

  return (
    <div className="space-y-6 pb-12">
      <PageHeader 
        title={MOCK_ITEM.name} 
        description={`Code: ${MOCK_ITEM.id} • Branch: ${MOCK_ITEM.branch}`} 
        backFallback="/inventory"
        backLabel="Back to Inventory"
        breadcrumbs={breadcrumbs}
      />
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="card p-6">
            <h3 className="font-bold text-slate-900 mb-4">Stock Ledger</h3>
            <div className="overflow-hidden rounded-lg border border-slate-200">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3">Qty</th>
                    <th className="px-4 py-3">User</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  <tr className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 text-slate-600">2026-05-09 09:00</td>
                    <td className="px-4 py-3 text-slate-700">Receive</td>
                    <td className="px-4 py-3 text-emerald-600 font-medium">+20</td>
                    <td className="px-4 py-3 text-slate-600">Admin</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="card p-6 h-fit space-y-4">
            <h3 className="font-bold text-slate-900 border-b pb-4">Actions</h3>
            <div className="grid grid-cols-1 gap-3">
              <button 
                onClick={() => setShowAdj(true)} 
                className="btn btn-warning w-full"
              >
                Adjust Stock
              </button>
              <Link to="/inventory/receiving" className="btn btn-secondary w-full justify-center">
                Receive Stock
              </Link>
            </div>
          </div>

          <div className="card p-6">
            <h3 className="font-bold text-slate-900 mb-4">Item Details</h3>
            <div className="space-y-4">
              <div className="space-y-1">
                <p className="text-xs font-medium text-slate-500 uppercase">Category</p>
                <p className="text-sm font-medium text-slate-900">{MOCK_ITEM.cat}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium text-slate-500 uppercase">Batch</p>
                <p className="text-sm font-medium text-slate-900">{MOCK_ITEM.batch}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium text-slate-500 uppercase">Expiry Date</p>
                <p className="text-sm font-medium text-slate-900">{MOCK_ITEM.expiry}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium text-slate-500 uppercase">Supplier</p>
                <p className="text-sm font-medium text-slate-900">{MOCK_ITEM.supplier}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ReasonModal isOpen={showAdj} title="Adjust Stock" guidance="Enter adjustment reason (Required)" onConfirm={() => setShowAdj(false)} onClose={() => setShowAdj(false)} />
    </div>
  );
};
