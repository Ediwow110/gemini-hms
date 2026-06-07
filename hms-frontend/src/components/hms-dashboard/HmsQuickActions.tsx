import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

interface QuickAction {
  id: string;
  label: string;
  icon: ReactNode;
  href?: string;
  onClick?: () => void;
  variant?: 'default' | 'primary' | 'danger';
}

interface HmsQuickActionsProps {
  actions: QuickAction[];
  columns?: 1 | 2;
  title?: string;
}

const variantStyles: Record<string, string> = {
  default: 'bg-slate-50 hover:bg-slate-100 border-slate-200/60 text-slate-700',
  primary: 'bg-blue-50 hover:bg-blue-100 border-blue-200/60 text-blue-700',
  danger: 'bg-rose-50 hover:bg-rose-100 border-rose-200/60 text-rose-700',
};

const iconColors: Record<string, string> = {
  default: 'text-blue-500',
  primary: 'text-blue-600',
  danger: 'text-rose-600',
};

export const HmsQuickActions = ({ actions, columns = 1, title }: HmsQuickActionsProps) => {
  const navigate = useNavigate();

  if (actions.length === 0) return null;

  return (
    <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
      {title && (
        <div className="border-b border-slate-100 px-3 py-2.5">
          <h3 className="text-[14px] font-bold text-slate-800">{title}</h3>
        </div>
      )}
      <div className={`p-2 grid ${columns === 2 ? 'grid-cols-2' : 'grid-cols-1'} gap-1.5`}>
        {actions.map((a) => {
          const handleClick = () => {
            if (a.href) navigate(a.href);
            else a.onClick?.();
          };

          return (
            <button
              key={a.id}
              type="button"
              onClick={handleClick}
              className={`flex items-center justify-between rounded-md border px-3 py-2.5 text-left text-[12px] font-semibold transition-colors group ${variantStyles[a.variant ?? 'default']}`}
            >
              <span className="flex items-center gap-2 min-w-0">
                <span className={`flex-shrink-0 ${iconColors[a.variant ?? 'default']}`}>{a.icon}</span>
                <span className="truncate">{a.label}</span>
              </span>
              <ChevronRight className="h-3.5 w-3.5 text-slate-400 flex-shrink-0 group-hover:text-blue-500 transition-colors" aria-hidden="true" />
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default HmsQuickActions;
