import React from 'react';
import { AlertCircle, ArrowRight, ExternalLink } from 'lucide-react';
import type { AnalyticsSeverity } from '../../types/analytics';

interface DashboardAlertCardProps {
  title: string;
  message: string;
  severity: AnalyticsSeverity;
  actionLabel?: string;
  actionHref?: string;
  actionOnClick?: () => void;
  timestamp?: string;
}

const severityStyles: Record<AnalyticsSeverity, { iconClass: string; bgClass: string; borderClass: string; textClass: string }> = {
  info: {
    iconClass: 'text-indigo-500',
    bgClass: 'bg-indigo-50',
    borderClass: 'border-indigo-100',
    textClass: 'text-indigo-700',
  },
  success: {
    iconClass: 'text-emerald-500',
    bgClass: 'bg-emerald-50',
    borderClass: 'border-emerald-100',
    textClass: 'text-emerald-700',
  },
  warning: {
    iconClass: 'text-amber-500',
    bgClass: 'bg-amber-50',
    borderClass: 'border-amber-100',
    textClass: 'text-amber-700',
  },
  critical: {
    iconClass: 'text-rose-500',
    bgClass: 'bg-rose-50',
    borderClass: 'border-rose-100',
    textClass: 'text-rose-700',
  },
};

const ActionButton = ({ 
  actionHref, 
  actionOnClick, 
  actionLabel 
}: { 
  actionHref?: string; 
  actionOnClick?: () => void; 
  actionLabel: string; 
}) => {
  if (actionHref) {
    return (
      <a href={actionHref} className="flex items-center gap-1 text-xs font-black uppercase tracking-wider hover:underline">
        {actionLabel} <ExternalLink className="h-3 w-3" />
      </a>
    );
  }
  if (actionOnClick) {
    return (
      <button
        type="button"
        onClick={actionOnClick}
        className="flex items-center gap-1 text-xs font-black uppercase tracking-wider hover:underline"
      >
        {actionLabel} <ArrowRight className="h-3 w-3" />
      </button>
    );
  }
  return null;
};

export const DashboardAlertCard: React.FC<DashboardAlertCardProps> = ({
  title,
  message,
  severity,
  actionLabel,
  actionHref,
  actionOnClick,
  timestamp,
}) => {
  const style = severityStyles[severity];

  return (
    <div className={`flex items-start gap-4 rounded-2xl border p-4 transition-all hover:shadow-sm ${style.bgClass} ${style.borderClass}`}>
      <div className={`rounded-full p-2 ${style.bgClass} ${style.borderClass} border`}>
        <AlertCircle className={`h-5 w-5 ${style.iconClass}`} aria-hidden="true" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <h3 className={`text-sm font-black tracking-tight ${style.textClass}`}>{title}</h3>
          {timestamp && <span className="text-[10px] font-medium text-slate-400">{timestamp}</span>}
        </div>
        <p className="mt-1 text-xs font-medium leading-relaxed text-slate-600">{message}</p>
        {actionLabel && (
          <div className="mt-3">
            <ActionButton 
              actionHref={actionHref} 
              actionOnClick={actionOnClick} 
              actionLabel={actionLabel} 
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardAlertCard;
