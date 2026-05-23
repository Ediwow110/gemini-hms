import React from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface DashboardCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ElementType;
  trend?: {
    value: number;
    isPositive: boolean;
    label?: string;
  };
  isLoading?: boolean;
}

export const DashboardCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  isLoading = false,
}: DashboardCardProps) => {
  if (isLoading) {
    return (
      <div className="card p-6 min-h-[140px] animate-shimmer flex flex-col justify-between">
        <div className="h-4 bg-slate-200 rounded w-1/3 mb-4" />
        <div className="h-8 bg-slate-200 rounded w-2/3 mb-2" />
        <div className="h-3 bg-slate-200 rounded w-1/2" />
      </div>
    );
  }

  return (
    <div className="card-hover p-6 flex flex-col justify-between min-h-[140px] animate-fade-in">
      <div className="flex items-start justify-between">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{title}</span>
        {Icon && (
          <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600">
            <Icon className="h-5 w-5" />
          </div>
        )}
      </div>

      <div className="mt-4">
        <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight leading-none" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          {value}
        </h3>
        {subtitle && <p className="text-xs text-slate-500 font-medium mt-1">{subtitle}</p>}
      </div>

      {trend && (
        <div className="mt-4 flex items-center gap-1.5 text-xs">
          <span
            className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-lg font-bold ${
              trend.isPositive
                ? 'bg-emerald-50 text-emerald-700'
                : 'bg-rose-50 text-rose-700'
            }`}
          >
            {trend.isPositive ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
            {trend.value}%
          </span>
          <span className="text-slate-400 font-semibold">{trend.label || 'vs last month'}</span>
        </div>
      )}
    </div>
  );
};
