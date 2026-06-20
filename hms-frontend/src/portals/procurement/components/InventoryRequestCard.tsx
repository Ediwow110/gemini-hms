import React from 'react';
import { Inbox } from 'lucide-react';

export interface InventoryRequest {
  id: string;
  source: string;
  targetWarehouse: string;
  items: string[];
  status: 'PENDING' | 'FULFILLED' | 'IN_TRANSIT';
  date: string;
}

interface InventoryRequestCardProps {
  requests: InventoryRequest[];
}

export const InventoryRequestCard: React.FC<InventoryRequestCardProps> = ({ requests }) => {
  return (
    <div className="bg-white border border-slate-200/80 shadow-sm rounded-2xl p-5 space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <Inbox className="h-4 w-4 text-indigo-500" />
            Inventory Requisitions
          </h3>
          <p className="text-[10px] text-slate-400 font-medium">Internal stock movement requests</p>
        </div>
      </div>

      <div className="space-y-3">
        {requests.map((r) => (
          <div key={r.id} className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-[10px] text-slate-400 font-bold uppercase">{r.source} &rarr; {r.targetWarehouse}</span>
              <span className="text-[9px] font-extrabold text-indigo-600">{r.status}</span>
            </div>
            <p className="text-xs font-bold text-slate-800">{r.items.join(', ')}</p>
            <div className="flex justify-between items-center pt-1">
              <span className="text-[9px] text-slate-500">{r.date}</span>
              <button className="text-[9px] text-indigo-600 font-black hover:underline cursor-pointer">Process Request</button>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 text-[10px] text-amber-800 font-semibold">
      </div>
    </div>
  );
};
