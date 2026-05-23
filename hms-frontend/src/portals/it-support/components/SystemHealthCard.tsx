import React from 'react';
import { LucideIcon, Activity } from 'lucide-react';
import { StatusBadge } from '../../../components/feedback/StatusBadge';

interface SystemHealthCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  status: 'HEALTHY' | 'DEGRADED' | 'CRITICAL';
  description?: string;
  metricLabel?: string;
  onActionClick?: () => void;
}

export const SystemHealthCard: React.FC<SystemHealthCardProps> = ({
  title,
  value,
  icon: Icon,
  status,
  description,
  metricLabel,
  onActionClick,
}) => {
  const getStatusType = (currentStatus: string) => {
    switch (currentStatus) {
      case 'HEALTHY':
        return 'success';
      case 'DEGRADED':
        return 'warning';
      default:
        return 'danger';
    }
  };

  const getStatusBg = (currentStatus: string) => {
    switch (currentStatus) {
      case 'CRITICAL':
        return 'bg-rose-50/60 border-rose-200/80';
      case 'DEGRADED':
        return 'bg-amber-50/60 border-amber-200/80';
      default:
        return 'bg-slate-50 border-slate-200';
    }
  };

  return (
    <div className={`p-5 rounded-2xl border shadow-sm transition-all duration-200 hover:shadow-md ${getStatusBg(status)}`}>
      <div className="flex justify-between items-start">
        <div className="p-2.5 rounded-xl bg-white border border-slate-200 shadow-sm text-slate-700">
          <Icon className="h-5 w-5" />
        </div>
        <StatusBadge status={status} type={getStatusType(status)} />
      </div>

      <div className="mt-4 space-y-1">
        <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{title}</h4>
        <p className="text-2xl font-extrabold text-slate-800 tracking-tight" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          {value}
        </p>
        {description && <p className="text-xs text-slate-500 font-medium">{description}</p>}
      </div>

      {metricLabel && (
        <button
          onClick={onActionClick}
          className="mt-4 w-full py-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <Activity className="h-4 w-4 text-indigo-500 animate-pulse" />
          {metricLabel}
        </button>
      )}
    </div>
  );
};

export default SystemHealthCard;
