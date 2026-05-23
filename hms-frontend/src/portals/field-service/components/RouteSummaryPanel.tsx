import React from 'react';
import { Map, Navigation } from 'lucide-react';

export const RouteSummaryPanel: React.FC = () => {
  const steps = [
    { label: 'Depot Start', status: 'COMPLETED' },
    { label: 'Delivery ORD-9918', status: 'IN_PROGRESS' },
    { label: 'Installation GE-V10', status: 'PENDING' },
    { label: 'PM Visit RO-C311', status: 'PENDING' },
    { label: 'Return to Base', status: 'PENDING' },
  ];

  return (
    <div className="bg-slate-900 rounded-[2rem] p-6 text-white space-y-6 shadow-xl relative overflow-hidden">
      <div className="relative z-10 space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Live Route Plan</h3>
          <div className="flex items-center gap-2 text-emerald-400">
             <Navigation className="h-4 w-4 animate-pulse" />
             <span className="text-[10px] font-black uppercase">On Schedule</span>
          </div>
        </div>

        <div className="relative pl-6 space-y-8">
           <div className="absolute left-[9px] top-2 bottom-2 w-0.5 bg-white/10" />
           {steps.map((step, i) => (
             <div key={i} className="relative">
                <div className={`absolute -left-6 top-1 h-2.5 w-2.5 rounded-full border-2 border-slate-900 ${
                  step.status === 'COMPLETED' ? 'bg-emerald-500' :
                  step.status === 'IN_PROGRESS' ? 'bg-indigo-500 animate-ping' :
                  'bg-white/20'
                }`} />
                <p className={`text-xs font-black uppercase tracking-tight ${step.status === 'PENDING' ? 'text-slate-500' : 'text-white'}`}>
                  {step.label}
                </p>
             </div>
           ))}
        </div>
      </div>
      <Map className="absolute -right-8 -bottom-8 h-48 w-48 text-white/5 rotate-12" />
    </div>
  );
};

export default RouteSummaryPanel;
