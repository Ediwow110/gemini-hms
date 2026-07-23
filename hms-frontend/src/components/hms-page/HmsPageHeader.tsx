import type { ReactNode } from 'react';
import { ArrowLeft } from 'lucide-react';

interface HmsPageHeaderProps {
  title: string;
  description?: string;
  badge?: string;
  eyebrow?: string;
  onBack?: () => void;
  actions?: ReactNode;
  metadata?: ReactNode;
}

export const HmsPageHeader = ({
  title,
  description,
  badge,
  eyebrow,
  onBack,
  actions,
  metadata,
}: HmsPageHeaderProps) => (
  <header className="flex min-w-0 flex-col gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-start sm:justify-between">
    <div className="flex min-w-0 items-start gap-3">
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 shadow-sm transition-colors hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900"
          aria-label="Go back"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
      )}
      <div className="min-w-0">
        {eyebrow && (
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-indigo-600">
            {eyebrow}
          </p>
        )}
        <div className="flex min-w-0 flex-wrap items-center gap-2.5">
          <h1 className="text-xl font-bold tracking-tight text-slate-950 sm:text-2xl">
            {title}
          </h1>
          {badge && (
            <span className="inline-flex min-h-7 items-center rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
              {badge}
            </span>
          )}
        </div>
        {description && (
          <p className="mt-1.5 max-w-3xl text-sm leading-6 text-slate-600">
            {description}
          </p>
        )}
        {metadata && <div className="mt-2 text-xs text-slate-500">{metadata}</div>}
      </div>
    </div>
    {actions && (
      <div className="flex min-w-0 flex-wrap items-center gap-2 sm:shrink-0 sm:justify-end">
        {actions}
      </div>
    )}
  </header>
);

export default HmsPageHeader;
