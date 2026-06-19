import React from 'react';
import { Globe } from 'lucide-react';

export const IntegrationScopeFilter: React.FC = () => {
  return (
    <div
      className="flex items-center gap-2 px-3.5 py-2 bg-slate-50/80 rounded-xl border border-slate-200/80 text-sm text-slate-600"
      aria-label="Integration scope (display only — not wired)"
      title="Scope filter is not wired in this release"
      data-testid="integration-scope-filter"
    >
      <Globe className="h-4 w-4 text-slate-400" />
      <span className="font-medium text-xs">Cross-Domain (Tenant-Wide)</span>
      <span className="text-[10px] text-amber-600 font-semibold bg-amber-50 border border-amber-200 rounded-lg px-2 py-0.5">
        Display only
      </span>
    </div>
  );
};

export default IntegrationScopeFilter;
