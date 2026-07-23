import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import AnalyticsEmptyState from '../AnalyticsEmptyState';
import AnalyticsSkeleton from '../AnalyticsSkeleton';
import type { StatusBreakdown } from '../../../types/analytics';

interface StatusDonutChartProps {
  data: StatusBreakdown[];
  title?: string;
  description?: string;
  loading?: boolean;
  valueFormatter?: (value: number) => string;
}

const palette = ['#4f46e5', '#0f766e', '#f59e0b', '#e11d48', '#64748b'];
const defaultFormatter = (value: number) => value.toLocaleString();

export const StatusDonutChart = ({
  data,
  title,
  description,
  loading,
  valueFormatter = defaultFormatter,
}: StatusDonutChartProps) => {
  if (loading) return <AnalyticsSkeleton cards={0} charts={1} tableRows={0} />;
  if (data.length === 0) return <AnalyticsEmptyState title="No status data" />;

  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <div
      role="img"
      aria-label={`${title ?? 'Status breakdown'}${description ? `. ${description}` : ''}`}
      className="grid h-full min-h-44 min-w-0 grid-cols-1 gap-4 sm:grid-cols-[minmax(0,1.05fr)_minmax(150px,0.95fr)]"
    >
      <div className="relative min-h-44 min-w-0">
        <ResponsiveContainer width="100%" height="100%" minHeight={176}>
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="label"
              innerRadius="58%"
              outerRadius="82%"
              paddingAngle={2}
              strokeWidth={0}
            >
              {data.map((entry, index) => (
                <Cell
                  key={entry.label}
                  fill={entry.color ?? palette[index % palette.length]}
                />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{ borderRadius: 12, borderColor: '#e2e8f0', fontSize: 12 }}
              formatter={(value) => valueFormatter(Number(value ?? 0))}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-mono text-xl font-bold text-slate-950">
            {valueFormatter(total)}
          </span>
          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            Total
          </span>
        </div>
      </div>
      <div className="flex min-w-0 flex-col justify-center gap-2">
        {data.map((item, index) => (
          <div
            key={item.label}
            className="flex min-w-0 items-center justify-between gap-3 rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-600"
          >
            <span className="flex min-w-0 items-center gap-2">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: item.color ?? palette[index % palette.length] }}
              />
              <span className="truncate font-medium">{item.label}</span>
            </span>
            <span className="shrink-0 font-mono font-semibold text-slate-800">
              {valueFormatter(item.value)}
              {total ? ` · ${Math.round((item.value / total) * 100)}%` : ''}
            </span>
          </div>
        ))}
      </div>
      <span className="sr-only">
        {data.map((item) => `${item.label}: ${valueFormatter(item.value)}`).join('; ')}
      </span>
    </div>
  );
};

export default StatusDonutChart;
