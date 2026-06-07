import { useNavigate } from 'react-router-dom';
import { ChevronRight, ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';

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
  info: 'border-l-blue-500',
  success: 'border-l-emerald-500',
  warning: 'border-l-amber-500',
  critical: 'border-l-rose-500',
};

const trendIcon = (direction: 'up' | 'down' | 'flat') => {
  if (direction === 'up') return <ArrowUpRight className="h-3 w-3 text-emerald-600" aria-hidden="true" />;
  if (direction === 'down') return <ArrowDownRight className="h-3 w-3 text-rose-600" aria-hidden="true" />;
  return <Minus className="h-3 w-3 text-slate-400" aria-hidden="true" />;
};

const KpiMetricBlock = ({ metric, interactive }: { metric: KpiMetric; interactive: boolean }) => (
  <div
    className={`flex flex-col gap-0.5 border-l-2 pl-3 ${severityAccent[metric.severity ?? 'info']} ${interactive ? 'cursor-pointer hover:opacity-80' : ''}`}
  >
    <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
      {metric.label}
    </span>
    <span className="text-lg font-bold text-slate-900 font-mono leading-tight">
      {metric.value}
    </span>
    {metric.trend && (
      <span className="inline-flex items-center gap-0.5 text-[11px] font-medium text-slate-500">
        {trendIcon(metric.trend.direction)}
        <span>{metric.trend.value}</span>
      </span>
    )}
  </div>
);

export const HmsKpiStrip = ({ metrics, loading }: HmsKpiStripProps) => {
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="flex flex-wrap gap-x-6 gap-y-3 animate-pulse">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex flex-col gap-1 border-l-2 border-l-slate-200 pl-3">
            <div className="h-3 w-20 rounded bg-slate-100" />
            <div className="h-5 w-16 rounded bg-slate-100" />
          </div>
        ))}
      </div>
    );
  }

  if (metrics.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-x-6 gap-y-3">
      {metrics.map((m) => {
        const interactive = !!(m.href || m.onClick);
        const handleClick = () => {
          if (m.href) navigate(m.href);
          else if (m.onClick) m.onClick();
        };

        if (interactive) {
          return (
            <button
              key={m.id}
              type="button"
              onClick={handleClick}
              className="group flex items-start gap-1 text-left"
            >
              <KpiMetricBlock metric={m} interactive />
              <ChevronRight className="mt-1 h-3 w-3 text-slate-300 group-hover:text-blue-500 transition-colors flex-shrink-0" aria-hidden="true" />
            </button>
          );
        }

        return <KpiMetricBlock key={m.id} metric={m} interactive={false} />;
      })}
    </div>
  );
};

export default HmsKpiStrip;
