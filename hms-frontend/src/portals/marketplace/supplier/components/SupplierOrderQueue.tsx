import React from 'react';
import { Package, Clock, ArrowRight, Check, X } from 'lucide-react';

export const SupplierOrderQueue: React.FC = () => {
  const orders = [
    { id: 'ORD-2026-9918', buyer: 'M*** C*** Hospital', items: 'GE Voluson E10, Probes (x2)', total: 4550000, status: 'PENDING', sla: '24h' },
    { id: 'ORD-2026-9812', buyer: 'S*** J*** Medical', items: 'Roche cobas c 311', total: 1850000, status: 'CONFIRMED', sla: '48h' },
  ];

  return (
    <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
      <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
        <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">Order Queue</h3>
      </div>
      <div className="divide-y divide-slate-100">
        {orders.map((order) => (
          <div key={order.id} className="p-5 hover:bg-slate-50 transition-colors flex items-center justify-between group cursor-pointer">
            <div className="flex items-center gap-4">
              <div className={`h-10 w-10 rounded-xl flex items-center justify-center border ${
                order.status === 'PENDING' ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-indigo-50 text-indigo-600 border-indigo-100'
              }`}>
                <Package className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-black text-slate-800">{order.items}</h4>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">{order.id} · {order.buyer}</p>
              </div>
            </div>

            <div className="flex items-center gap-6">
              <div className="text-right">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">SLA Timer</p>
                <div className={`flex items-center gap-1.5 text-xs font-black ${order.status === 'PENDING' ? 'text-rose-600' : 'text-slate-500'}`}>
                  <Clock className="h-3.5 w-3.5" />
                  {order.sla}
                </div>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total</p>
                <p className="text-xs font-black text-slate-800">₱{order.total.toLocaleString()}</p>
              </div>
              {order.status === 'PENDING' && (
                <div className="flex items-center gap-2">
                  <button className="p-2 bg-emerald-50 text-emerald-600 border border-emerald-200 hover:bg-emerald-100 rounded-xl transition-all" title="Confirm Order (Shell)">
                    <Check className="h-4 w-4" />
                  </button>
                  <button className="p-2 bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100 rounded-xl transition-all" title="Cancel Order (Shell)">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}
              <ArrowRight className="h-5 w-5 text-slate-300 group-hover:text-indigo-600 transition-colors" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SupplierOrderQueue;
