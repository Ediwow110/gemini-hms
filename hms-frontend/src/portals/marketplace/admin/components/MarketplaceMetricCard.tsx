import React from 'react';
import { LucideIcon } from 'lucide-react';

interface MarketplaceMetricCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  trendType?: 'positive' | 'negative' | 'neutral';
  color?: string;
}

export const MarketplaceMetricCard: React.FC<MarketplaceMetricCardProps> = ({
  label,
  value,
  icon: Icon,
  trend,
  trendType = 'neutral',
  color = 'indigo',
}) => {
  const colorMap: Record<string, string> = {
    indigo: 'text-indigo-600 bg-indigo-50 border-indigo-100',
    emerald: 'text-emerald-600 bg-emerald-50 border-emerald-100',
    amber: 'text-amber-600 bg-amber-50 border-amber-100',
    rose: 'text-rose-600 bg-rose-50 border-rose-100',
    blue: 'text-blue-600 bg-blue-50 border-blue-100',
    violet: 'text-violet-600 bg-violet-50 border-violet-100',
  };

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-5 space-y-4 hover:shadow-md transition-all">
      <div className="flex justify-between items-start">
        <div className={`p-2.5 rounded-2xl border ${colorMap[color]}`}>
          <Icon className="h-5 w-5" />
        </div>
        {trend && (
          <span className={`text-[10px] font-black px-2 py-0.5 rounded-lg ${
            trendType === 'positive' ? 'bg-emerald-50 text-emerald-600' :
            trendType === 'negative' ? 'bg-rose-50 text-rose-600' :
            'bg-slate-50 text-slate-400'
          }`}>
            {trend}
          </span>
        )}
      </div>
      <div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
        <p className="text-2xl font-black text-slate-900 tracking-tight">{value}</p>
      </div>
    </div>
  );
};

export default MarketplaceMetricCard;
