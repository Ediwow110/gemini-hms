import React from 'react';
import { ShoppingBag, Clock, AlertTriangle } from 'lucide-react';

export const OrderMonitorTable: React.FC = () => {
  const orders = [
    { id: 'ORD-2026-9918', buyer: 'M*** C*** Hospital', supplier: 'Global Med Systems', status: 'PENDING_FULFILLMENT', payment: 'PAID', sla: '24h', risk: false },
    { id: 'ORD-2026-9812', buyer: 'S*** J*** Medical', supplier: 'PharmaTech Solutions', status: 'IN_TRANSIT', payment: 'PAID', sla: '48h', risk: false },
    { id: 'ORD-2026-9756', buyer: 'C*** D*** Clinic', supplier: 'BioEquip International', status: 'DISPUTED', payment: 'HELD', sla: 'OVERDUE', risk: true },
  ];

  return (
    <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
      <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
        <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
          <ShoppingBag className="h-4 w-4 text-indigo-500" />
          Order Monitor (Mock)
        </h3>
      </div>
      <table className="w-full text-left border-collapse">
        <thead className="bg-slate-50/50 border-b border-slate-100">
          <tr>
            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Order</th>
            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Buyer</th>
            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Supplier</th>
            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Payment</th>
            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">SLA</th>
            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {orders.map((o) => (
            <tr key={o.id} className={`hover:bg-slate-50/50 transition-colors group ${o.risk ? 'bg-rose-50/30' : ''}`}>
              <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                  {o.risk && <AlertTriangle className="h-4 w-4 text-rose-500" />}
                  <span className="text-xs font-black text-slate-800">{o.id}</span>
                </div>
              </td>
              <td className="px-6 py-4 text-[10px] font-bold text-slate-500">{o.buyer}</td>
              <td className="px-6 py-4 text-[10px] font-bold text-slate-500">{o.supplier}</td>
              <td className="px-6 py-4">
                <span className={`text-[9px] font-black px-2 py-0.5 rounded-lg border ${
                  o.status === 'PENDING_FULFILLMENT' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                  o.status === 'IN_TRANSIT' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                  'bg-rose-50 text-rose-700 border-rose-100'
                }`}>
                  {o.status.replace('_', ' ')}
                </span>
              </td>
              <td className="px-6 py-4">
                <span className={`text-[9px] font-black px-2 py-0.5 rounded-lg ${
                  o.payment === 'PAID' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                }`}>
                  {o.payment}
                </span>
              </td>
              <td className="px-6 py-4">
                <div className={`flex items-center gap-1.5 text-xs font-black ${o.sla === 'OVERDUE' ? 'text-rose-600' : 'text-slate-500'}`}>
                  <Clock className="h-3.5 w-3.5" /> {o.sla}
                </div>
              </td>
              <td className="px-6 py-4 text-right">
                <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button className="px-3 py-1.5 bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100 rounded-lg text-[10px] font-black uppercase">View (Shell)</button>
                  {o.risk && (
                    <button className="px-3 py-1.5 bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100 rounded-lg text-[10px] font-black uppercase">Escalate (Shell)</button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default OrderMonitorTable;
