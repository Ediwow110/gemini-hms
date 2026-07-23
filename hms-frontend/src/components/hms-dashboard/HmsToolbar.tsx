import type { ReactNode } from 'react';
import { RefreshCw } from 'lucide-react';

interface HmsToolbarProps {
  branchName?: string;
  role?: string;
  lastRefreshed?: Date;
  onRefresh?: () => void;
  refreshing?: boolean;
  children?: ReactNode;
}

export const HmsToolbar = ({
  branchName,
  role,
  lastRefreshed,
  onRefresh,
  refreshing = false,
  children,
}: HmsToolbarProps) => (
  <div className="flex min-w-0 flex-col gap-3 rounded-md border border-slate-300 bg-white px-4 py-3 shadow-sm lg:flex-row lg:items-center lg:justify-between">
    <div className="flex min-w-0 flex-wrap items-center gap-x-4 gap-y-2">
      {branchName && (
        <div className="flex min-w-0 items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">Branch</span>
          <span className="truncate text-[12px] font-bold text-slate-800">
            {branchName}
          </span>
        </div>
      )}
      {role && (
        <span className="inline-flex min-h-6 items-center rounded-sm border border-sky-200 bg-sky-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-sky-800">
          {role}
        </span>
      )}
    </div>

    <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
      {children && <div className="flex min-w-0 flex-wrap items-end gap-2">{children}</div>}
      <div className="flex shrink-0 items-center gap-3">
        {lastRefreshed && (
          <span className="text-[10px] font-mono font-medium text-slate-400">
            Updated {lastRefreshed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        )}
        {onRefresh && (
          <button
            type="button"
            onClick={onRefresh}
            disabled={refreshing}
            className="inline-flex min-h-8 items-center gap-1.5 rounded-sm border border-slate-300 bg-white px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide text-slate-700 transition-colors hover:border-sky-400 hover:bg-sky-50 hover:text-sky-800 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Refresh dashboard data"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        )}
      </div>
    </div>
  </div>
);

export default HmsToolbar;
