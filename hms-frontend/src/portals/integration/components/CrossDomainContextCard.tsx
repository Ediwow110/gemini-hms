import React from 'react';
import { Globe } from 'lucide-react';

interface CrossDomainContextCardProps {
  title: string;
  value: string;
  source: string;
  icon: React.ElementType;
  color: string;
  isMock?: boolean;
}

export const CrossDomainContextCard: React.FC<CrossDomainContextCardProps> = ({ title, value, source, icon: Icon, color, isMock }) => {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 hover:shadow-md transition-all">
      <div className="flex items-center justify-between mb-2">
        <div className={`p-2 rounded-xl ${color}`}>
          <Icon className="h-4 w-4" />
        </div>
        <div className="flex items-center gap-2">
          {isMock && <span className="text-[8px] font-black bg-slate-100 text-slate-400 px-1 py-0.5 rounded tracking-tighter">MOCK</span>}
          <div className="flex items-center gap-1 text-[10px] text-slate-400 font-bold">
            <Globe className="h-3 w-3" /> {source}
          </div>
        </div>
      </div>
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{title}</p>
      <p className="text-xl font-black text-slate-900 tracking-tight">{value}</p>
    </div>
  );
};

export default CrossDomainContextCard;
