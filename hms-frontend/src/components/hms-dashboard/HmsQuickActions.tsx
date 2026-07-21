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
  default: 'bg-slate-50 hover:bg-slate-100 border-slate-200/60 text-slate-700',
  primary: 'bg-blue-50 hover:bg-blue-100 border-blue-200/60 text-blue-700',
  danger: 'bg-rose-50 hover:bg-rose-100 border-rose-200/60 text-rose-700',
};

const iconColors: Record<string, string> = {
  default: 'text-blue-500',
  primary: 'text-blue-600',
  danger: 'text-rose-600',
};

const ActionContent = ({ action }: { action: QuickAction }) => (
  <>
    <span className="flex min-w-0 items-center gap-2">
      <span className={`shrink-0 ${iconColors[action.variant ?? 'default']}`}>
        {action.icon}
      </span>
      <span className="truncate">{action.label}</span>
    </span>
    <ChevronRight
      className="h-3.5 w-3.5 shrink-0 text-slate-400 transition-colors group-hover:text-blue-500"
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
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      {title && (
        <div className="border-b border-slate-100 px-5 py-4">
          <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
        </div>
      )}
      <div className={`grid gap-2 p-3 ${columns === 2 ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'}`}>
        {actions.map((action) => {
          const className = `group flex min-h-10 items-center justify-between rounded-xl border px-3 py-2.5 text-left text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${variantStyles[action.variant ?? 'default']}`;

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
              className={`${className} disabled:cursor-not-allowed disabled:opacity-60`}
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
