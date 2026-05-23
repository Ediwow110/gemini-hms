import { 
  Clipboard, 
  FlaskConical, 
  CheckSquare, 
  FileCheck2, 
  FileText, 
  Send 
} from 'lucide-react';

export type LabStatus = 'Ordered' | 'Collected' | 'Received' | 'Encoded' | 'Validated' | 'Released';

interface LabStatusBadgeProps {
  status: LabStatus;
  showIcon?: boolean;
  className?: string;
}

export const LabStatusBadge = ({ status, showIcon = true, className = '' }: LabStatusBadgeProps) => {
  const configs = {
    Ordered: {
      label: 'Ordered',
      styles: 'bg-slate-50 border-slate-200 text-slate-600 shadow-sm shadow-slate-100/50',
      icon: Clipboard,
    },
    Collected: {
      label: 'Collected',
      styles: 'bg-amber-50 border-amber-200 text-amber-700 shadow-sm shadow-amber-100/50',
      icon: FlaskConical,
    },
    Received: {
      label: 'Received',
      styles: 'bg-blue-50 border-blue-200 text-blue-700 shadow-sm shadow-blue-100/50',
      icon: CheckSquare,
    },
    Encoded: {
      label: 'Encoded',
      styles: 'bg-violet-50 border-violet-200 text-violet-700 shadow-sm shadow-violet-100/50',
      icon: FileText,
    },
    Validated: {
      label: 'Validated',
      styles: 'bg-indigo-50 border-indigo-200 text-indigo-700 shadow-sm shadow-indigo-100/50',
      icon: FileCheck2,
    },
    Released: {
      label: 'Released',
      styles: 'bg-emerald-50 border-emerald-200 text-emerald-700 shadow-sm shadow-emerald-100/50',
      icon: Send,
    },
  };

  const config = configs[status] || configs.Ordered;
  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl border text-xs font-bold transition-all duration-200 select-none ${config.styles} ${className}`}>
      {showIcon && <Icon className="h-3.5 w-3.5" />}
      {config.label}
    </span>
  );
};

export default LabStatusBadge;
