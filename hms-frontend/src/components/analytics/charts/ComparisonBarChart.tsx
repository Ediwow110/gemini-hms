import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import AnalyticsEmptyState from '../AnalyticsEmptyState';
import AnalyticsSkeleton from '../AnalyticsSkeleton';
import type { TrendPoint } from '../../../types/analytics';

interface ComparisonBarChartProps {
  data: TrendPoint[];
  title?: string;
  description?: string;
  loading?: boolean;
  valueLabel?: string;
  secondaryLabel?: string;
}

export const ComparisonBarChart = ({ data, title, description, loading, valueLabel = 'Value', secondaryLabel = 'Comparison' }: ComparisonBarChartProps) => {
  if (loading) return <AnalyticsSkeleton cards={0} charts={1} tableRows={0} />;
  if (data.length === 0) return <AnalyticsEmptyState title="No comparison data" />;

  return (
    <div role="img" aria-label={`${title ?? 'Comparison chart'}${description ? `. ${description}` : ''}`} className="h-full min-h-56 w-full">
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} margin={{ top: 10, right: 18, bottom: 0, left: -10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
          <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
          <Tooltip contentStyle={{ borderRadius: 12, borderColor: '#e2e8f0', fontSize: 12 }} />
          <Bar dataKey="value" name={valueLabel} fill="#4f46e5" radius={[8, 8, 0, 0]} />
          {data.some(point => point.secondaryValue !== undefined) && <Bar dataKey="secondaryValue" name={secondaryLabel} fill="#10b981" radius={[8, 8, 0, 0]} />}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ComparisonBarChart;
