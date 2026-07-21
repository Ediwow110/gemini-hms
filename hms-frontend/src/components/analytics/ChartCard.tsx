import type { ReactNode } from 'react';
import AnalyticsEmptyState from './AnalyticsEmptyState';
import AnalyticsErrorState from './AnalyticsErrorState';

interface ChartCardProps {
  title: string;
  description?: string;
  children: ReactNode;
  actions?: ReactNode;
  loading?: boolean;
  empty?: boolean;
  error?: string | boolean;
  footer?: ReactNode;
  height?: number | string;
  emphasis?: 'primary' | 'secondary' | 'compact';
}

const defaultHeight = {
  primary: 320,
  secondary: 260,
  compact: 190,
};

export const ChartCard = ({
  title,
  description,
  children,
  actions,
  loading,
  empty,
  error,
  footer,
  height,
  emphasis = 'secondary',
}: ChartCardProps) => {
  const chartId = `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-chart`;
  const resolvedHeight = height ?? defaultHeight[emphasis];
  const heightValue =
    typeof resolvedHeight === 'number' ? `${resolvedHeight}px` : resolvedHeight;

  return (
    <section
      data-dashboard-chart-card
      aria-labelledby={chartId}
      className="flex h-full min-w-0 break-inside-avoid flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm print:border-slate-300 print:shadow-none"
    >
      <div className="flex min-w-0 flex-col gap-3 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h3 id={chartId} className="text-sm font-semibold text-slate-900">
            {title}
          </h3>
          {description && (
            <p className="mt-1 max-w-2xl text-xs leading-5 text-slate-500">
              {description}
            </p>
          )}
        </div>
        {actions && (
          <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>
        )}
      </div>

      <div className="relative min-w-0 flex-1 p-4" style={{ minHeight: heightValue }}>
        {loading ? (
          <div className="h-full min-h-48 animate-pulse rounded-xl bg-slate-100" />
        ) : error ? (
          <AnalyticsErrorState description={typeof error === 'string' ? error : undefined} />
        ) : empty ? (
          <AnalyticsEmptyState />
        ) : (
          <div className="h-full min-w-0" style={{ height: heightValue }}>
            {children}
          </div>
        )}
      </div>
      {footer && (
        <div className="border-t border-slate-100 px-5 py-3 text-xs text-slate-500">
          {footer}
        </div>
      )}
    </section>
  );
};

export default ChartCard;
