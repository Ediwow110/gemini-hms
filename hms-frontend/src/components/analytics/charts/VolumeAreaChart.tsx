import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import AnalyticsEmptyState from '../AnalyticsEmptyState';
import AnalyticsSkeleton from '../AnalyticsSkeleton';
import type { TrendPoint } from '../../../types/analytics';

interface VolumeAreaChartProps {
  data: TrendPoint[];
  title?: string;
  description?: string;
  loading?: boolean;
  valueLabel?: string;
}

export const VolumeAreaChart = ({ data, title, description, loading, valueLabel = 'Volume' }: VolumeAreaChartProps) => {
  if (loading) return <AnalyticsSkeleton cards={0} charts={1} tableRows={0} />;
  if (data.length === 0) return <AnalyticsEmptyState title="No volume data" />;

  return (
    <div role="img" aria-label={`${title ?? 'Volume chart'}${description ? `. ${description}` : ''}`} className="h-full min-h-56 w-full">
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={data} margin={{ top: 10, right: 18, bottom: 0, left: -10 }}>
          <defs>
            <linearGradient id="hmsVolume" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.28} />
              <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
          <Tooltip contentStyle={{ borderRadius: 12, borderColor: '#e2e8f0', fontSize: 12 }} />
          <Area type="monotone" dataKey="value" name={valueLabel} stroke="#4f46e5" strokeWidth={3} fill="url(#hmsVolume)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default VolumeAreaChart;
