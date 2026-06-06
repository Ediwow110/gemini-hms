import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import AnalyticsEmptyState from '../AnalyticsEmptyState';
import AnalyticsSkeleton from '../AnalyticsSkeleton';
import type { StatusBreakdown } from '../../../types/analytics';

interface StatusDonutChartProps {
  data: StatusBreakdown[];
  title?: string;
  description?: string;
  loading?: boolean;
}

const palette = ['#4f46e5', '#10b981', '#f59e0b', '#e11d48', '#64748b'];

export const StatusDonutChart = ({ data, title, description, loading }: StatusDonutChartProps) => {
  if (loading) return <AnalyticsSkeleton cards={0} charts={1} tableRows={0} />;
  if (data.length === 0) return <AnalyticsEmptyState title="No status data" />;
  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <div role="img" aria-label={`${title ?? 'Status breakdown'}${description ? `. ${description}` : ''}`} className="grid h-full min-h-56 grid-cols-1 gap-4 sm:grid-cols-[1.2fr_1fr]">
      <ResponsiveContainer width="100%" height={220} minHeight={220}>
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="label" innerRadius="58%" outerRadius="82%" paddingAngle={3}>
            {data.map((entry, index) => <Cell key={entry.label} fill={entry.color ?? palette[index % palette.length]} />)}
          </Pie>
          <Tooltip contentStyle={{ borderRadius: 12, borderColor: '#e2e8f0', fontSize: 12 }} />
        </PieChart>
      </ResponsiveContainer>
      <div className="flex flex-col justify-center gap-2">
        {data.map((item, index) => (
          <div key={item.label} className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-3 py-2 text-xs font-bold text-slate-600">
            <span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color ?? palette[index % palette.length] }} />{item.label}</span>
            <span>{item.value}{total ? ` (${Math.round((item.value / total) * 100)}%)` : ''}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StatusDonutChart;
