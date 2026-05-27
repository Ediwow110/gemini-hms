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
}

export const ChartCard = ({ title, description, children, actions, loading, empty, error, footer, height = 280 }: ChartCardProps) => {
  const chartId = `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-chart`;

  return (
    <section aria-labelledby={chartId} className="break-inside-avoid rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm print:border-slate-300 print:shadow-none">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h3 id={chartId} className="text-sm font-black uppercase tracking-wider text-slate-800">{title}</h3>
          {description && <p className="mt-1 text-xs font-medium leading-relaxed text-slate-500">{description}</p>}
        </div>
        {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
      </div>

      <div className="relative overflow-x-auto overflow-y-hidden" style={{ minHeight: typeof height === 'number' ? `${height}px` : height }}>
        {loading ? (
          <div className="h-full min-h-56 animate-pulse rounded-xl bg-slate-100" />
        ) : error ? (
          <AnalyticsErrorState description={typeof error === 'string' ? error : undefined} />
        ) : empty ? (
          <AnalyticsEmptyState />
        ) : (
          <div className="min-w-0" style={{ height: typeof height === 'number' ? `${height}px` : height }}>
            {children}
          </div>
        )}
      </div>
      {footer && <div className="mt-4 border-t border-slate-100 pt-3 text-xs font-medium text-slate-500">{footer}</div>}
    </section>
  );
};

export default ChartCard;
