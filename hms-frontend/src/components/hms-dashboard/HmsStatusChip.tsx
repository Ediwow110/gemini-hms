import type { ReactNode } from 'react';

export type HmsStatusVariant = 'default' | 'success' | 'warning' | 'critical' | 'neutral';

interface HmsStatusChipProps {
  status: string;
  variant?: HmsStatusVariant;
  icon?: ReactNode;
  count?: number;
  className?: string;
}

const variantStyles: Record<HmsStatusVariant, string> = {
  default: 'bg-blue-50 text-blue-700 border-blue-200',
  success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  warning: 'bg-amber-50 text-amber-700 border-amber-200',
  critical: 'bg-rose-50 text-rose-700 border-rose-200',
  neutral: 'bg-slate-50 text-slate-600 border-slate-200',
};

export const HmsStatusChip = ({ status, variant = 'default', icon, count, className = '' }: HmsStatusChipProps) => (
  <span
    className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-semibold leading-none ${variantStyles[variant]} ${className}`}
  >
    {icon && <span className="flex-shrink-0">{icon}</span>}
    <span>{status}</span>
    {count !== undefined && count > 0 && (
      <span className="ml-0.5 inline-flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-current bg-opacity-20 px-1 text-[10px] font-bold leading-none text-inherit">
        {count}
      </span>
    )}
  </span>
);

export default HmsStatusChip;
