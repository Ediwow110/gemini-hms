import React from 'react';
import { Star, Clock, Truck, ShieldCheck, TrendingUp } from 'lucide-react';

export const SupplierPerformanceScorecard: React.FC = () => {
  const metrics = [
    { label: 'Avg. Response Time', value: '2.4 Hrs', target: '< 4 Hrs', icon: Clock, color: 'indigo' },
    { label: 'On-Time Delivery', value: '98.2%', target: '95%', icon: Truck, color: 'emerald' },
    { label: 'Listing Quality', value: '94/100', target: '90+', icon: ShieldCheck, color: 'blue' },
  ];

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-6 shadow-sm">
      <div className="flex justify-between items-end">
        <div>
          <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest mb-1">Supplier Performance</h3>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className={`h-4 w-4 ${i < 4 ? 'text-amber-400 fill-amber-400' : 'text-slate-200'}`} />
              ))}
            </div>
            <span className="text-sm font-black text-slate-900">4.8 / 5.0</span>
          </div>
        </div>
        <div className="text-right">
           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Badges</p>
           <span className="bg-indigo-600 text-white text-[9px] font-black px-2 py-0.5 rounded-lg uppercase">Platinum Supplier</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {metrics.map((m) => (
          <div key={m.label} className="p-4 bg-slate-50 border border-slate-100 rounded-2xl space-y-1">
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-tight truncate">{m.label}</p>
             <p className="text-lg font-black text-slate-800">{m.value}</p>
             <p className="text-[9px] text-slate-500 font-bold uppercase tracking-tight">Target: {m.target}</p>
          </div>
        ))}
      </div>

      <div className="pt-4 border-t border-slate-100">
         <button className="w-full py-2 bg-slate-50 hover:bg-slate-100 text-slate-600 text-[10px] font-black uppercase rounded-xl transition-colors flex items-center justify-center gap-2">
           Full Performance Analytics <TrendingUp className="h-3 w-3" />
         </button>
      </div>
    </div>
  );
};

export default SupplierPerformanceScorecard;
