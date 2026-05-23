import React from 'react';
import ProcurementScopeFilter from './components/ProcurementScopeFilter';
import { InventoryRequestCard, InventoryRequest } from './components/InventoryRequestCard';
import { Inbox, Plus } from 'lucide-react';

export const InventoryRequestsPage: React.FC = () => {
  const mockRequests: InventoryRequest[] = [
    { id: 'IR-101', source: 'St. Jude North', targetWarehouse: 'Metro Central Pharmacy', items: ['Amoxicillin 500mg', 'Paracetamol'], status: 'PENDING', date: '2026-05-21' },
    { id: 'IR-102', source: 'Emergency Dept', targetWarehouse: 'Metro Medical Supply', items: ['Latex Gloves', 'Syringes 5ml'], status: 'IN_TRANSIT', date: '2026-05-20' },
    { id: 'IR-103', source: 'Radiology', targetWarehouse: 'North General WH', items: ['Contrast Agent'], status: 'FULFILLED', date: '2026-05-18' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-800 tracking-tight" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Internal Inventory Requisitions
          </h2>
          <p className="text-xs text-slate-500 font-medium">Manage stock movement requests between departments and warehouses</p>
        </div>
        <button className="btn bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer shadow-sm shadow-indigo-100 transition-all">
          <Plus className="h-4 w-4" /> New Request
        </button>
      </div>

      <ProcurementScopeFilter />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <InventoryRequestCard requests={mockRequests} />
        
        <div className="lg:col-span-2 space-y-6">
          <div className="card bg-white border border-slate-200/80 shadow-sm rounded-2xl p-5 space-y-4">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <Inbox className="h-4 w-4 text-indigo-500" />
              Logical Stock Availability Shell
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
                  <tr className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 pl-2 font-bold text-slate-800">Amoxicillin 500mg (Box/100)</td>
                    <td className="py-3 text-slate-600">450</td>
                    <td className="py-3 text-amber-600">120</td>
                    <td className="py-3 font-black text-slate-900">330</td>
                    <td className="py-3 text-right pr-2">
                      <button className="text-[10px] text-indigo-600 font-bold hover:underline cursor-pointer">Transfer</button>
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 pl-2 font-bold text-slate-800">Latex Gloves - Medium (Box/100)</td>
                    <td className="py-3 text-slate-600">1,200</td>
                    <td className="py-3 text-amber-600">400</td>
                    <td className="py-3 font-black text-slate-900">800</td>
                    <td className="py-3 text-right pr-2">
                      <button className="text-[10px] text-indigo-600 font-bold hover:underline cursor-pointer">Transfer</button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 text-[10px] text-amber-800 font-semibold">
        <strong>Sandbox Notice:</strong> Inventory requisitions are logical shells. No real stock movement or sub-ledger entries are triggered.
      </div>
    </div>
  );
};

export default InventoryRequestsPage;
