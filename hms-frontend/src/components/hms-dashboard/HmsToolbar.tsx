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
  <div className="flex min-w-0 flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm lg:flex-row lg:items-center lg:justify-between">
    <div className="flex min-w-0 flex-wrap items-center gap-x-4 gap-y-2">
      {branchName && (
        <div className="flex min-w-0 items-center gap-1.5">
          <span className="text-[11px] font-medium text-slate-400">Branch</span>
          <span className="truncate text-xs font-semibold text-slate-700">
            {branchName}
          </span>
        </div>
      )}
      {role && (
        <span className="inline-flex min-h-7 items-center rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
          {role}
        </span>
      )}
    </div>

    <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
      {children && <div className="flex min-w-0 flex-wrap items-end gap-2">{children}</div>}
      <div className="flex shrink-0 items-center gap-3">
        {lastRefreshed && (
          <span className="text-[11px] font-mono text-slate-400">
            Updated {lastRefreshed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        )}
        {onRefresh && (
          <button
            type="button"
            onClick={onRefresh}
            disabled={refreshing}
            className="inline-flex min-h-9 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition-colors hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
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
