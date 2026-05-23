import { ShieldAlert, ArrowDown, ArrowUp, Check } from 'lucide-react';

export type ResultFlag = 'Normal' | 'High' | 'Low' | 'Critical';

interface ResultFlagBadgeProps {
  flag: ResultFlag;
  className?: string;
}

export const ResultFlagBadge = ({ flag, className = '' }: ResultFlagBadgeProps) => {
  const configs = {
    Normal: {
      label: 'Normal',
      styles: 'bg-slate-50 border-slate-200 text-slate-600 shadow-sm shadow-slate-100/50',
      icon: Check,
    },
    Low: {
      label: 'Low',
      styles: 'bg-blue-50 border-blue-200 text-blue-700 shadow-sm shadow-blue-100/50',
      icon: ArrowDown,
    },
    High: {
      label: 'High',
      styles: 'bg-amber-50 border-amber-200 text-amber-700 shadow-sm shadow-amber-100/50',
      icon: ArrowUp,
    },
    Critical: {
      label: 'Critical Alert',
      styles: 'bg-rose-50 border-rose-300 text-rose-700 font-extrabold animate-pulse shadow-sm shadow-rose-100',
      icon: ShieldAlert,
    },
  };

  const config = configs[flag] || configs.Normal;
  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl border text-[10px] uppercase font-bold tracking-wider select-none ${config.styles} ${className}`}>
      <Icon className="h-3.5 w-3.5" />
      {config.label}
    </span>
  );
};

export default ResultFlagBadge;
