import React from 'react';
import { BackButton } from './back-button';
import { Breadcrumbs, BreadcrumbItem } from './breadcrumbs';

interface PageHeaderProps {
  title: string;
  description?: string;
  // Enhanced options
  backLabel?: string;
  backFallback?: string;
  breadcrumbs?: BreadcrumbItem[];
  actions?: React.ReactNode;
  statusBadge?: React.ReactNode;
  metadata?: React.ReactNode;
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
}: PageHeaderProps) => {
  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6 animate-fade-in">
      <div className="space-y-1.5 flex-1">
        {breadcrumbs && breadcrumbs.length > 0 && (
          <Breadcrumbs items={breadcrumbs} />
        )}
        
        {backFallback && (
          <div className="mb-2">
            <BackButton label={backLabel} fallback={backFallback} />
          </div>
        )}

        <div className="flex items-center gap-3">
          <h1
            className="text-2xl font-extrabold text-slate-900 tracking-tight"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            {title}
          </h1>
          {statusBadge && <div className="mt-0.5">{statusBadge}</div>}
        </div>

        {description && <p className="text-slate-500 text-sm mt-1">{description}</p>}
        {metadata && <div className="text-xs text-slate-400 mt-1">{metadata}</div>}
      </div>

      {actions && (
        <div className="flex items-center gap-3 self-start md:self-center">
          {actions}
        </div>
      )}
    </div>
  );
};
