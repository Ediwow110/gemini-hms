import { useNavigate } from 'react-router-dom';
import { ArrowDownRight, ArrowUpRight, ChevronRight, Minus } from 'lucide-react';

type MetricSeverity = 'info' | 'success' | 'warning' | 'critical';

export interface KpiMetric {
  id: string;
  label: string;
  value: string | number;
  trend?: { direction: 'up' | 'down' | 'flat'; value: string };
  severity?: MetricSeverity;
  href?: string;
  onClick?: () => void;
}

interface HmsKpiStripProps {
  metrics: KpiMetric[];
  loading?: boolean;
}

const severityAccent: Record<MetricSeverity, string> = {
  info: 'bg-blue-500',
  success: 'bg-emerald-500',
  warning: 'bg-amber-500',
  critical: 'bg-rose-500',
};

const trendClasses = {
  up: 'text-emerald-700',
  down: 'text-rose-700',
  flat: 'text-slate-500',
};

const TrendIcon = ({ direction }: { direction: 'up' | 'down' | 'flat' }) => {
  if (direction === 'up') return <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />;
  if (direction === 'down') return <ArrowDownRight className="h-3.5 w-3.5" aria-hidden="true" />;
  return <Minus className="h-3.5 w-3.5" aria-hidden="true" />;
};

const MetricContent = ({ metric, interactive }: { metric: KpiMetric; interactive: boolean }) => (
  <div className="relative flex min-h-24 flex-col justify-between overflow-hidden bg-white p-4">
    <span className={`absolute inset-x-0 top-0 h-1 ${severityAccent[metric.severity ?? 'info']}`} />
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-[0.11em] text-slate-500">
          {metric.label}
        </p>
        <p className="mt-2 truncate font-mono text-2xl font-bold tracking-tight text-slate-950">
          {metric.value}
        </p>
      </div>
      {interactive && (
        <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-slate-300 transition-colors group-hover:text-indigo-600" aria-hidden="true" />
      )}
    </div>
    {metric.trend && (
      <span className={`mt-2 inline-flex items-center gap-1 text-xs font-semibold ${trendClasses[metric.trend.direction]}`}>
        <TrendIcon direction={metric.trend.direction} />
        {metric.trend.value}
      </span>
    )}
  </div>
);

export const HmsKpiStrip = ({ metrics, loading }: HmsKpiStripProps) => {
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] overflow-hidden rounded-2xl border border-slate-200 bg-slate-200 shadow-sm">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="min-h-24 animate-pulse bg-white p-4">
            <div className="h-3 w-24 rounded bg-slate-100" />
            <div className="mt-3 h-7 w-20 rounded bg-slate-100" />
            <div className="mt-3 h-3 w-14 rounded bg-slate-100" />
          </div>
        ))}
      </div>
    );
  }

  if (metrics.length === 0) return null;

  return (
    <section aria-label="Key performance indicators" className="grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-px overflow-hidden rounded-2xl border border-slate-200 bg-slate-200 shadow-sm">
      {metrics.map((metric) => {
        const interactive = Boolean(metric.href || metric.onClick);
        const handleClick = () => {
          if (metric.href) navigate(metric.href);
          else metric.onClick?.();
        };

        if (!interactive) {
          return <MetricContent key={metric.id} metric={metric} interactive={false} />;
        }

        return (
          <button
            key={metric.id}
            type="button"
            onClick={handleClick}
            className="group min-w-0 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-500"
            aria-label={`${metric.label}: ${metric.value}`}
          >
            <MetricContent metric={metric} interactive />
          </button>
        );
      })}
    </section>
  );
};

export default HmsKpiStrip;
