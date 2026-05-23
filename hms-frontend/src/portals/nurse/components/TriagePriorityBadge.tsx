import { ShieldAlert, AlertTriangle, CheckCircle, Activity, Info } from 'lucide-react';

export type TriagePriorityLevel = 1 | 2 | 3 | 4 | 5;

interface TriagePriorityBadgeProps {
  level: TriagePriorityLevel;
  showIcon?: boolean;
  className?: string;
}

export const TriagePriorityBadge = ({ level, showIcon = true, className = '' }: TriagePriorityBadgeProps) => {
  const configs = {
    1: {
      label: 'Level 1 - Resuscitation',
      styles: 'bg-rose-50 border-rose-200 text-rose-700 shadow-sm shadow-rose-100/50',
      icon: ShieldAlert,
    },
    2: {
      label: 'Level 2 - Emergent',
      styles: 'bg-orange-50 border-orange-200 text-orange-700 shadow-sm shadow-orange-100/50',
      icon: AlertTriangle,
    },
    3: {
      label: 'Level 3 - Urgent',
      styles: 'bg-amber-50 border-amber-200 text-amber-700 shadow-sm shadow-amber-100/50',
      icon: Activity,
    },
    4: {
      label: 'Level 4 - Less Urgent',
      styles: 'bg-emerald-50 border-emerald-200 text-emerald-700 shadow-sm shadow-emerald-100/50',
      icon: CheckCircle,
    },
    5: {
      label: 'Level 5 - Non-Urgent',
      styles: 'bg-blue-50 border-blue-200 text-blue-700 shadow-sm shadow-blue-100/50',
      icon: Info,
    },
  };

  const config = configs[level];
  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl border text-xs font-bold transition-all duration-200 select-none ${config.styles} ${className}`}>
      {showIcon && <Icon className="h-3.5 w-3.5" />}
      {config.label}
    </span>
  );
};

export default TriagePriorityBadge;
