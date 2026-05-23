import React from 'react';
import { LucideIcon } from 'lucide-react';

interface PatientHomeCardProps {
  title: string;
  value?: string | number;
  icon: LucideIcon;
  description: string;
  type?: 'info' | 'success' | 'warning' | 'error';
  actionLabel?: string;
  onClick?: () => void;
}

export const PatientHomeCard: React.FC<PatientHomeCardProps> = ({
  title,
  value,
  icon: Icon,
  description,
  type = 'info',
  actionLabel,
  onClick
}) => {
  const getColorClasses = () => {
    switch (type) {
      case 'success': return 'bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white';
      case 'warning': return 'bg-amber-50 text-amber-600 group-hover:bg-amber-600 group-hover:text-white';
      case 'error': return 'bg-rose-50 text-rose-600 group-hover:bg-rose-600 group-hover:text-white';
      default: return 'bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white';
    }
  };

  return (
    <div className="bg-white border border-slate-200/80 shadow-sm rounded-2xl p-5 space-y-4 hover:shadow-md transition-all group flex flex-col justify-between">
      <div className="space-y-3">
        <div className={`p-2.5 rounded-xl transition-colors w-fit ${getColorClasses()}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{title}</h3>
          {value && <p className="text-xl font-black text-slate-800 tracking-tight mt-0.5">{value}</p>}
          <p className="text-[11px] text-slate-500 font-medium mt-1 leading-relaxed">{description}</p>
        </div>
      </div>
      
      {actionLabel && (
        <button 
          onClick={onClick}
          className="w-full mt-4 py-2 px-4 bg-slate-50 hover:bg-indigo-600 text-slate-600 hover:text-white border border-slate-200 hover:border-indigo-600 rounded-xl text-[10px] font-bold transition-all cursor-pointer"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};

export default PatientHomeCard;
