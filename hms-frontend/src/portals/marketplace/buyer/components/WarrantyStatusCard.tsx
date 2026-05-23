import React from 'react';
import { ShieldCheck, Calendar, FileText } from 'lucide-react';

export interface Warranty {
  id: string;
  item: string;
  expires: string;
  status: 'ACTIVE' | 'EXPIRING_SOON';
  coverage: string;
}

interface WarrantyStatusCardProps {
  warranty: Warranty;
}

export const WarrantyStatusCard: React.FC<WarrantyStatusCardProps> = ({ warranty }) => {
  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:shadow-md transition-all group">
      <div className="flex items-center gap-4">
        <div className={`h-12 w-12 rounded-2xl flex items-center justify-center border ${
          warranty.status === 'ACTIVE' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : 'bg-amber-50 text-amber-600 border-amber-100'
        }`}>
          <ShieldCheck className="h-6 w-6" />
        </div>
        <div>
          <h4 className="text-sm font-black text-slate-800">{warranty.item}</h4>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">{warranty.id} · {warranty.coverage}</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-8 md:text-right">
        <div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Expiration</p>
          <div className="flex items-center gap-1.5 md:justify-end">
            <Calendar className="h-3.5 w-3.5 text-slate-400" />
            <p className="text-xs font-black text-slate-700">{warranty.expires}</p>
          </div>
        </div>
        <div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Status</p>
          <span className={`text-[9px] font-black px-2 py-0.5 rounded-lg uppercase border ${
            warranty.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-amber-100 text-amber-700 border-amber-200'
          }`}>
            {warranty.status.replace('_', ' ')}
          </span>
        </div>
        <button className="flex items-center gap-2 bg-slate-50 hover:bg-indigo-600 text-slate-600 hover:text-white px-4 py-2 rounded-xl text-[10px] font-black transition-all border border-slate-200 hover:border-indigo-600 shadow-sm">
          View Certificate <FileText className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
};

export default WarrantyStatusCard;
