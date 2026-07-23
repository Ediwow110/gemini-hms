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
  info: 'border-l-sky-600',
  success: 'border-l-emerald-600',
  warning: 'border-l-amber-600',
  critical: 'border-l-red-600',
};

const severityBg: Record<MetricSeverity, string> = {
  info: 'bg-sky-50/40',
  success: 'bg-emerald-50/40',
  warning: 'bg-amber-50/40',
  critical: 'bg-red-50/40',
};

const trendClasses = {
  up: 'text-emerald-700 bg-emerald-50',
  down: 'text-red-700 bg-red-50',
  flat: 'text-slate-500 bg-slate-50',
};

const TrendIcon = ({ direction }: { direction: 'up' | 'down' | 'flat' }) => {
  if (direction === 'up') return <ArrowUpRight className="h-3 w-3" aria-hidden="true" />;
  if (direction === 'down') return <ArrowDownRight className="h-3 w-3" aria-hidden="true" />;
  return <Minus className="h-3 w-3" aria-hidden="true" />;
};

const MetricContent = ({ metric, interactive }: { metric: KpiMetric; interactive: boolean }) => {
  const severity = metric.severity ?? 'info';
  return (
    <div className={`relative flex min-h-[92px] flex-col justify-between border-l-[3px] ${severityAccent[severity]} ${severityBg[severity]} bg-white px-4 py-3`}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">
            {metric.label}
          </p>
          <p className="mt-1.5 truncate font-mono text-[22px] font-bold leading-tight tracking-tight text-slate-900">
            {metric.value}
          </p>
        </div>
        {interactive && (
          <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-slate-300 transition-colors group-hover:text-sky-600" aria-hidden="true" />
        )}
      </div>
      {metric.trend && (
        <span className={`mt-2 inline-flex w-fit items-center gap-1 rounded px-1.5 py-0.5 text-[11px] font-bold ${trendClasses[metric.trend.direction]}`}>
          <TrendIcon direction={metric.trend.direction} />
          {metric.trend.value}
        </span>
      )}
    </div>
  );
};

export const HmsKpiStrip = ({ metrics, loading }: HmsKpiStripProps) => {
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="grid grid-cols-[repeat(auto-fit,minmax(160px,1fr))] gap-px overflow-hidden rounded-md border border-slate-300 bg-slate-300">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="min-h-[92px] animate-pulse bg-white px-4 py-3">
            <div className="h-2.5 w-20 rounded-sm bg-slate-200" />
            <div className="mt-3 h-6 w-16 rounded-sm bg-slate-200" />
            <div className="mt-3 h-2.5 w-12 rounded-sm bg-slate-100" />
          </div>
        ))}
      </div>
    );
  }

  if (metrics.length === 0) return null;

  return (
    <section aria-label="Key performance indicators" className="grid grid-cols-[repeat(auto-fit,minmax(160px,1fr))] gap-px overflow-hidden rounded-md border border-slate-300 bg-slate-300 shadow-sm">
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
            className="group min-w-0 text-left transition-shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-sky-600 hover:shadow-md"
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
