import { ReactNode } from 'react';

interface HmsBalanceItemProps {
  label: string;
  value: string | number;
  subValue?: string;
  variant?: 'default' | 'highlight' | 'critical' | 'success';
}

const HmsBalanceItem = ({ label, value, subValue, variant = 'default' }: HmsBalanceItemProps) => {
  const styles = {
    default: 'text-slate-700',
    highlight: 'text-indigo-600 font-bold',
    critical: 'text-rose-600 font-black animate-pulse',
    success: 'text-emerald-600 font-black',
  };

  return (
    <div className="flex justify-between items-baseline border-b border-slate-50 pb-1.5 last:border-0 last:pb-0">
      <div className="flex flex-col">
        <span className="text-[11px] font-medium text-slate-500 uppercase tracking-tight font-sans">{label}</span>
        {subValue && <span className="text-[10px] text-slate-400 font-mono italic">{subValue}</span>}
      </div>
      <span className={`font-mono text-[13px] ${styles[variant]}`}>
        {typeof value === 'number' ? `₱${value.toLocaleString('en-US', { minimumFractionDigits: 2 })}` : value}
      </span>
    </div>
  );
};

interface HmsBalanceSheetProps {
  title: string;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
}

export const HmsBalanceSheet = ({ title, icon, children, className = '' }: HmsBalanceSheetProps) => (
  <div className={`bg-white border border-slate-200 rounded-lg p-3.5 shadow-sm space-y-3 ${className}`}>
    <div className="flex items-center gap-1.5 border-b border-slate-100 pb-2 mb-1">
      {icon && <span className="text-slate-400 shrink-0">{icon}</span>}
      <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-wider font-sans">{title}</h4>
    </div>
    <div className="space-y-2 font-sans">
      {children}
    </div>
  </div>
);

HmsBalanceSheet.Item = HmsBalanceItem;

export default HmsBalanceSheet;
