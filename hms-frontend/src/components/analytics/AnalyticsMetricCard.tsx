import type { LucideIcon } from 'lucide-react';
import { ArrowDownRight, ArrowRight, ArrowUpRight, Minus } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { AnalyticsSeverity, AnalyticsTrend } from '../../types/analytics';

type MetricValue = string | number;

interface AnalyticsMetricCardProps {
  title: string;
  value: MetricValue;
  description?: string;
  icon?: LucideIcon;
  trend?: AnalyticsTrend;
  severity?: AnalyticsSeverity;
  onClick?: () => void;
  href?: string;
  loading?: boolean;
  testId?: string;
}

const severityClasses: Record<AnalyticsSeverity, string> = {
  info: 'bg-indigo-50 text-indigo-700 border-indigo-100',
  success: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  warning: 'bg-amber-50 text-amber-700 border-amber-100',
  critical: 'bg-rose-50 text-rose-700 border-rose-100',
};

const trendClasses = {
  positive: 'text-emerald-700 bg-emerald-50 border-emerald-100',
  negative: 'text-rose-700 bg-rose-50 border-rose-100',
  neutral: 'text-slate-600 bg-slate-50 border-slate-100',
};

const TrendIcon = ({ trend }: { trend: AnalyticsTrend }) => {
  if (trend.direction === 'positive') return <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />;
  if (trend.direction === 'negative') return <ArrowDownRight className="h-3.5 w-3.5" aria-hidden="true" />;
  return <Minus className="h-3.5 w-3.5" aria-hidden="true" />;
};

const InnerCard = ({
  title,
  value,
  description,
  icon: Icon,
  trend,
  severity = 'info',
  loading,
  interactive,
}: AnalyticsMetricCardProps & { interactive: boolean }) => (
  <div data-dashboard-metric-card className={`flex h-full min-h-32 min-w-0 flex-col rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all ${interactive ? 'hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md' : ''} ${loading ? 'animate-pulse' : ''}`}>
    <div className="flex min-w-0 items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-[0.11em] text-slate-500">
          {title}
        </p>
        <p className="mt-2 truncate font-mono text-2xl font-bold tracking-tight text-slate-950">
          {loading ? '—' : value}
        </p>
      </div>
      {Icon && (
        <div className={`shrink-0 rounded-xl border p-2.5 ${severityClasses[severity]}`}>
          <Icon className="h-5 w-5" aria-hidden="true" />
        </div>
      )}
    </div>
    <div className="mt-auto flex min-w-0 items-end gap-2 pt-3">
      <div className="min-w-0 flex-1">
        {trend && !loading && (
          <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[10px] font-semibold ${trendClasses[trend.direction]}`} aria-label={`${trend.label ?? 'Trend'} ${trend.value}`}>
            <TrendIcon trend={trend} /> {trend.value}
          </span>
        )}
        {description && (
          <p className="mt-2 line-clamp-2 text-xs leading-5 text-slate-500">{description}</p>
        )}
      </div>
      {interactive && <ArrowRight className="mb-1 h-4 w-4 shrink-0 text-slate-300" aria-hidden="true" />}
    </div>
  </div>
);

export const AnalyticsMetricCard = (props: AnalyticsMetricCardProps) => {
  const label = `${props.title}: ${props.value}${props.description ? `. ${props.description}` : ''}`;

  if (props.href) {
    return (
      <Link to={props.href} aria-label={label} data-testid={props.testId} className="block h-full rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500">
        <InnerCard {...props} interactive />
      </Link>
    );
  }

  if (props.onClick) {
    return (
      <button type="button" onClick={props.onClick} aria-label={label} data-testid={props.testId} className="block h-full w-full rounded-2xl text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500">
        <InnerCard {...props} interactive />
      </button>
    );
  }

  return (
    <div aria-label={label} data-testid={props.testId} className="h-full">
      <InnerCard {...props} interactive={false} />
    </div>
  );
};

export default AnalyticsMetricCard;
