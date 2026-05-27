import { Line, LineChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import AnalyticsEmptyState from '../AnalyticsEmptyState';
import AnalyticsSkeleton from '../AnalyticsSkeleton';
import type { TrendPoint } from '../../../types/analytics';

interface TrendLineChartProps {
  data: TrendPoint[];
  title?: string;
  description?: string;
  loading?: boolean;
  valueLabel?: string;
  secondaryLabel?: string;
}

export const TrendLineChart = ({ data, title, description, loading, valueLabel = 'Value', secondaryLabel = 'Comparison' }: TrendLineChartProps) => {
  if (loading) return <AnalyticsSkeleton cards={0} charts={1} tableRows={0} />;
  if (data.length === 0) return <AnalyticsEmptyState title="No trend data" />;

  return (
    <div role="img" aria-label={`${title ?? 'Trend chart'}${description ? `. ${description}` : ''}`} className="h-full min-h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 18, bottom: 0, left: -10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
          <Tooltip contentStyle={{ borderRadius: 12, borderColor: '#e2e8f0', fontSize: 12 }} />
          <Line type="monotone" dataKey="value" name={valueLabel} stroke="#4f46e5" strokeWidth={3} dot={{ r: 3 }} activeDot={{ r: 5 }} />
          {data.some(point => point.secondaryValue !== undefined) && (
            <Line type="monotone" dataKey="secondaryValue" name={secondaryLabel} stroke="#10b981" strokeWidth={2} dot={false} />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default TrendLineChart;
