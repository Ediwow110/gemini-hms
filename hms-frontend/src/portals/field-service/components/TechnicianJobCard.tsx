import React from 'react';
import { MapPin, Clock, ArrowRight, Truck, Wrench, ShieldCheck } from 'lucide-react';

interface TechnicianJobCardProps {
  id: string;
  type: 'DELIVERY' | 'INSTALLATION' | 'MAINTENANCE';
  customer: string;
  address: string;
  time: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
  onAction?: () => void;
}

export const TechnicianJobCard: React.FC<TechnicianJobCardProps> = ({ 
  id, type, customer, address, time, status, onAction 
}) => {
  const icons = {
    DELIVERY: Truck,
    INSTALLATION: Wrench,
    MAINTENANCE: ShieldCheck,
  };
  const Icon = icons[type];

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-5 space-y-4 hover:shadow-md transition-all group">
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-xl border ${
            type === 'DELIVERY' ? 'bg-blue-50 text-blue-600 border-blue-100' :
            type === 'INSTALLATION' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
            'bg-amber-50 text-amber-600 border-amber-100'
          }`}>
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{type}</p>
            <h4 className="text-sm font-black text-slate-800 tracking-tight">{id}</h4>
          </div>
        </div>
        <span className={`text-[9px] font-black px-2 py-0.5 rounded-lg border ${
          status === 'IN_PROGRESS' ? 'bg-indigo-50 text-indigo-700 border-indigo-100 animate-pulse' :
          status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
          'bg-slate-50 text-slate-400 border-slate-100'
        }`}>
          {status.replace('_', ' ')}
        </span>
      </div>

      <div className="space-y-2">
         <div className="flex items-start gap-2">
           <MapPin className="h-3.5 w-3.5 text-slate-300 mt-0.5" />
           <div>
             <p className="text-xs font-black text-slate-700">{customer}</p>
             <p className="text-[10px] text-slate-500 font-medium leading-relaxed">{address}</p>
           </div>
         </div>
         <div className="flex items-center gap-2">
           <Clock className="h-3.5 w-3.5 text-slate-300" />
           <p className="text-[10px] text-slate-600 font-bold uppercase">{time}</p>
         </div>
      </div>

      <button 
        onClick={onAction}
        className="w-full py-2.5 bg-slate-50 group-hover:bg-indigo-600 text-slate-600 group-hover:text-white rounded-xl text-[10px] font-black uppercase transition-all flex items-center justify-center gap-2 border border-slate-100 group-hover:border-indigo-600"
      >
        Open Job Details <ArrowRight className="h-3.5 w-3.5" />
      </button>
    </div>
  );
};

export default TechnicianJobCard;
