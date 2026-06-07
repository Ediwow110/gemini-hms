import { RefreshCw } from 'lucide-react';

interface HmsToolbarProps {
  branchName?: string;
  role?: string;
  lastRefreshed?: Date;
  onRefresh?: () => void;
  children?: React.ReactNode;
}

export const HmsToolbar = ({ branchName, role, lastRefreshed, onRefresh, children }: HmsToolbarProps) => (
  <div className="flex items-center justify-between border-b border-slate-200 pb-2 mb-1">
    <div className="flex items-center gap-4">
      {branchName && (
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-medium text-slate-400">Branch:</span>
          <span className="text-[12px] font-semibold text-slate-700">{branchName}</span>
        </div>
      )}
      {role && (
        <span className="inline-flex items-center rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
          {role}
        </span>
      )}
    </div>

    <div className="flex items-center gap-3">
      {children}
      {lastRefreshed && (
        <span className="text-[11px] font-mono text-slate-400">
          {lastRefreshed.toLocaleTimeString()}
        </span>
      )}
      {onRefresh && (
        <button
          type="button"
          onClick={onRefresh}
          className="flex items-center gap-1 text-[11px] font-medium text-blue-600 hover:text-blue-700 transition-colors"
          aria-label="Refresh dashboard data"
        >
          <RefreshCw className="h-3 w-3" />
          Refresh
        </button>
      )}
    </div>
  </div>
);

export default HmsToolbar;
