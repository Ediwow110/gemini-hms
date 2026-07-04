import React from 'react';
import ProcurementScopeFilter from './components/ProcurementScopeFilter';
import { InventoryRequestCard } from './components/InventoryRequestCard';
import { Inbox, Plus } from 'lucide-react';
import { HmsDashboardShell } from '../../components/hms-dashboard';
import { HmsPageHeader } from '../../components/hms-page';
import { useProcurement } from '../../hooks/use-procurement';
import { useUser } from '../../hooks/use-user';

export const InventoryRequestsPage: React.FC = () => {
  const user = useUser();
  const branchId = (user as any)?.primaryBranchId;
  const { requests, isLoading } = useProcurement(branchId);

  if (!branchId) return <div className="p-10 text-center text-slate-500">No primary branch assigned.</div>;
  if (isLoading) return <div className="p-10 text-center text-slate-400">Loading requests...</div>;

  return (
    <HmsDashboardShell widthTier="full">
      <HmsPageHeader
        title="Internal Inventory Requisitions"
        description="Manage stock movement requests between departments and warehouses"
        actions={(
          <button className="btn bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer shadow-sm shadow-indigo-100 transition-all">
            <Plus className="h-4 w-4" /> New Request
          </button>
        )}
      />

      <ProcurementScopeFilter />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <InventoryRequestCard requests={requests || []} />
        
        <div className="lg:col-span-2 space-y-6">
          <div className="card bg-white border border-slate-200/80 shadow-sm rounded-2xl p-5 space-y-4">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <Inbox className="h-4 w-4 text-indigo-500" />
              Logical Stock Availability
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                    <th className="pb-3 pl-2">Item Name</th>
                    <th className="pb-3">In-Stock</th>
                    <th className="pb-3">Committed</th>
                    <th className="pb-3">Available</th>
                    <th className="pb-3 text-right pr-2">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {/* This table still requires a real 'SStockAvailability' API endpoint to be fully real */}
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400 text-xs italic">
                      Real-time stock availability API is being wired.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </HmsDashboardShell>
  );
};

export default InventoryRequestsPage;
