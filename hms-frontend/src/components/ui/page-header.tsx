import type { ReactNode } from 'react';
import { BackButton } from './back-button';
import { Breadcrumbs, type BreadcrumbItem } from './breadcrumbs';

interface PageHeaderProps {
  title: string;
  description?: string;
  backLabel?: string;
  backFallback?: string;
  breadcrumbs?: BreadcrumbItem[];
  actions?: ReactNode;
  statusBadge?: ReactNode;
  metadata?: ReactNode;
}

export const PageHeader = ({
  title,
  description,
  backLabel,
  backFallback,
  breadcrumbs,
  actions,
  statusBadge,
  metadata,
}: PageHeaderProps) => (
  <header className="flex min-w-0 flex-col gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-start sm:justify-between">
    <div className="min-w-0 flex-1">
      {breadcrumbs && breadcrumbs.length > 0 && (
        <div className="mb-2">
          <Breadcrumbs items={breadcrumbs} />
        </div>
      )}
      {backFallback && (
        <div className="mb-3">
          <BackButton label={backLabel} fallback={backFallback} />
        </div>
      )}
      <div className="flex min-w-0 flex-wrap items-center gap-2.5">
        <h1 className="text-xl font-bold tracking-tight text-slate-950 sm:text-2xl">
          {title}
        </h1>
        {statusBadge}
      </div>
      {description && (
        <p className="mt-1.5 max-w-3xl text-sm leading-6 text-slate-600">
          {description}
        </p>
      )}
      {metadata && <div className="mt-2 text-xs text-slate-500">{metadata}</div>}
    </div>
    {actions && (
      <div className="flex min-w-0 flex-wrap items-center gap-2 sm:shrink-0 sm:justify-end">
        {actions}
      </div>
    )}
  </header>
);
