import React from 'react';
import { Truck, Clock, AlertTriangle } from 'lucide-react';

export const FulfillmentSLAWidget: React.FC = () => {
  const items = [
    { id: 'ORD-2026-9918', supplier: 'Global Med Systems', status: 'PACKED', sla: '24h', courier: 'MedLogistics Express', delayed: false },
    { id: 'ORD-2026-9812', supplier: 'PharmaTech Solutions', status: 'SHIPPED', sla: '48h', courier: 'HealthFreight', delayed: false },
    { id: 'ORD-2026-9756', supplier: 'BioEquip International', status: 'PENDING_PACK', sla: 'OVERDUE', courier: 'TBD', delayed: true },
  ];

  return (
    <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
      <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
        <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
          <Truck className="h-4 w-4 text-indigo-500" />
          Fulfillment Pipeline (Mock)
        </h3>
      </div>
      <div className="divide-y divide-slate-100">
        {items.map((item) => (
          <div key={item.id} className={`p-5 hover:bg-slate-50 transition-colors flex items-center justify-between ${item.delayed ? 'bg-rose-50/30' : ''}`}>
            <div className="flex items-center gap-4">
              {item.delayed && <AlertTriangle className="h-5 w-5 text-rose-500" />}
              <div>
                <h4 className="text-sm font-black text-slate-800">{item.id}</h4>
                <p className="text-[10px] text-slate-400 font-bold uppercase">{item.supplier} · {item.courier}</p>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <span className={`text-[9px] font-black px-2 py-0.5 rounded-lg ${
                item.status === 'PACKED' ? 'bg-amber-50 text-amber-600' :
                item.status === 'SHIPPED' ? 'bg-blue-50 text-blue-600' :
                'bg-slate-100 text-slate-500'
              }`}>
                {item.status.replace('_', ' ')}
              </span>
              <div className={`flex items-center gap-1.5 text-xs font-black ${item.sla === 'OVERDUE' ? 'text-rose-600' : 'text-slate-500'}`}>
                <Clock className="h-3.5 w-3.5" /> {item.sla}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FulfillmentSLAWidget;
