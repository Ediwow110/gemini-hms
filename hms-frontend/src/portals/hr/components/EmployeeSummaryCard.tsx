import React from 'react';
import { LucideIcon } from 'lucide-react';

interface EmployeeSummaryCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  description: string;
  trend?: {
    value: string;
    isUp: boolean;
  };
}

export const EmployeeSummaryCard: React.FC<EmployeeSummaryCardProps> = ({
  title,
  value,
  icon: Icon,
  description,
  trend
}) => {
  return (
    <div className="bg-white border border-slate-200/80 shadow-sm rounded-2xl p-5 space-y-3 hover:shadow-md transition-all group">
      <div className="flex justify-between items-start">
        <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl group-hover:bg-indigo-600 group-hover:text-white transition-colors">
          <Icon className="h-5 w-5" />
        </div>
        {trend && (
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border ${
            trend.isUp ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-rose-50 text-rose-700 border-rose-100'
          }`}>
            {trend.isUp ? '↑' : '↓'} {trend.value}
          </span>
        )}
      </div>
      <div>
        <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{title}</h3>
        <p className="text-2xl font-black text-slate-800 tracking-tight">{value}</p>
        <p className="text-[10px] text-slate-500 font-medium mt-1">{description}</p>
      </div>
    </div>
  );
};
