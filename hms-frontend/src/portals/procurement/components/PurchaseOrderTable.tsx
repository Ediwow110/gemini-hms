import React from 'react';
import { ShoppingBag, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  supplier: string;
  amount: number;
  date: string;
  status: 'ISSUED' | 'SHIPPED' | 'RECEIVED' | 'CANCELLED';
  deliveryStatus: 'ON_TIME' | 'DELAYED' | 'PENDING';
}

interface PurchaseOrderTableProps {
  orders: PurchaseOrder[];
}

export const PurchaseOrderTable: React.FC<PurchaseOrderTableProps> = ({ orders }) => {
  return (
    <div className="bg-white border border-slate-200/80 shadow-sm rounded-2xl p-5 space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <ShoppingBag className="h-4 w-4 text-indigo-500" />
            Active Purchase Orders
          </h3>
          <p className="text-[10px] text-slate-400 font-medium">Tracking issued procurement orders</p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
              <th className="pb-3 pl-2">PO #</th>
              <th className="pb-3">Supplier</th>
              <th className="pb-3">Amount</th>
              <th className="pb-3">Status</th>
              <th className="pb-3 text-right pr-2">Tracking</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {orders.map((po) => (
              <tr key={po.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="py-3 pl-2 font-mono font-bold text-slate-600">{po.poNumber}</td>
                <td className="py-3 font-bold text-slate-800">{po.supplier}</td>
                <td className="py-3 font-black text-slate-900">₱{po.amount.toLocaleString()}</td>
                <td className="py-3">
                  <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded border ${
                    po.status === 'ISSUED' ? 'bg-indigo-50 text-indigo-700 border-indigo-100' :
                    po.status === 'SHIPPED' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                    po.status === 'RECEIVED' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                    'bg-slate-50 text-slate-500 border-slate-200'
                  }`}>
                    {po.status}
                  </span>
                </td>
                <td className="py-3 text-right pr-2">
                  <div className="flex items-center justify-end gap-1.5 font-bold">
                    {po.deliveryStatus === 'ON_TIME' ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                    ) : po.deliveryStatus === 'DELAYED' ? (
                      <AlertTriangle className="h-3.5 w-3.5 text-rose-500" />
                    ) : (
                      <Clock className="h-3.5 w-3.5 text-slate-400" />
                    )}
                    <span className="text-[10px] text-slate-500">{po.deliveryStatus}</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 text-[10px] text-amber-800 font-semibold">
        <strong>Simulation Notice:</strong> Purchase order generation is mock-only. No real PDF generation or electronic data interchange (EDI) occurs.
      </div>
    </div>
  );
};
