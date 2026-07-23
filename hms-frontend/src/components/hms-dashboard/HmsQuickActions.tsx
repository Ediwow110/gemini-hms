import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { RequirePermission } from '../ui/RequirePermission';

interface QuickAction {
  id: string;
  label: string;
  icon: ReactNode;
  href?: string;
  onClick?: () => void;
  variant?: 'default' | 'primary' | 'danger';
  permission?: string;
}

interface HmsQuickActionsProps {
  actions: QuickAction[];
  columns?: 1 | 2;
  title?: string;
}

const variantStyles: Record<string, string> = {
  default: 'border-slate-300 bg-white hover:bg-slate-50 hover:border-slate-400 text-slate-700',
  primary: 'border-sky-300 bg-sky-50 hover:bg-sky-100 hover:border-sky-400 text-sky-800',
  danger: 'border-red-300 bg-red-50 hover:bg-red-100 hover:border-red-400 text-red-800',
};

const iconColors: Record<string, string> = {
  default: 'text-slate-500',
  primary: 'text-sky-600',
  danger: 'text-red-600',
};

const ActionContent = ({ action }: { action: QuickAction }) => (
  <>
    <span className="flex min-w-0 items-center gap-2.5">
      <span className={`shrink-0 ${iconColors[action.variant ?? 'default']}`}>
        {action.icon}
      </span>
      <span className="truncate text-[12px] font-bold">{action.label}</span>
    </span>
    <ChevronRight
      className="h-3.5 w-3.5 shrink-0 text-slate-300 transition-colors group-hover:text-sky-600"
      aria-hidden="true"
    />
  </>
);

export const HmsQuickActions = ({
  actions,
  columns = 1,
  title,
}: HmsQuickActionsProps) => {
  if (actions.length === 0) return null;

  return (
    <section className="overflow-hidden rounded-md border border-slate-300 bg-white shadow-sm">
      {title && (
        <div className="flex items-center gap-2 border-b border-slate-200 bg-slate-50 px-4 py-2.5">
          <div className="h-4 w-1 rounded-full bg-sky-600" aria-hidden="true" />
          <h3 className="text-[13px] font-bold uppercase tracking-wide text-slate-800">{title}</h3>
        </div>
      )}
      <div className={`grid gap-2 p-3 ${columns === 2 ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'}`}>
        {actions.map((action) => {
          const className = `group flex min-h-10 items-center justify-between rounded-sm border px-3 py-2.5 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600 ${variantStyles[action.variant ?? 'default']}`;

          const control = action.href ? (
            <Link key={action.id} to={action.href} className={className}>
              <ActionContent action={action} />
            </Link>
          ) : (
            <button
              key={action.id}
              type="button"
              onClick={action.onClick}
              disabled={!action.onClick}
              className={`${className} disabled:cursor-not-allowed disabled:opacity-50`}
            >
              <ActionContent action={action} />
            </button>
          );

          if (action.permission) {
            return (
              <RequirePermission key={action.id} permission={action.permission}>
                {control}
              </RequirePermission>
            );
          }

          return control;
        })}
      </div>
    </section>
  );
};

export default HmsQuickActions;
