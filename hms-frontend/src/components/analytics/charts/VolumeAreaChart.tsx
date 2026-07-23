import { useId } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import AnalyticsEmptyState from '../AnalyticsEmptyState';
import AnalyticsSkeleton from '../AnalyticsSkeleton';
import type { TrendPoint } from '../../../types/analytics';

interface VolumeAreaChartProps {
  data: TrendPoint[];
  title?: string;
  description?: string;
  loading?: boolean;
  valueLabel?: string;
  valueFormatter?: (value: number) => string;
  yDomain?: [number | 'auto', number | 'auto'];
}

const defaultFormatter = (value: number) => value.toLocaleString();

export const VolumeAreaChart = ({
  data,
  title,
  description,
  loading,
  valueLabel = 'Volume',
  valueFormatter = defaultFormatter,
  yDomain,
}: VolumeAreaChartProps) => {
  const generatedId = useId().replace(/:/g, '');
  const gradientId = `hms-volume-${generatedId}`;

  if (loading) return <AnalyticsSkeleton cards={0} charts={1} tableRows={0} />;
  if (data.length === 0) return <AnalyticsEmptyState title="No volume data" />;

  return (
    <div
      role="img"
      aria-label={`${title ?? 'Volume chart'}${description ? `. ${description}` : ''}`}
      className="h-full min-h-44 w-full min-w-0"
    >
      <ResponsiveContainer width="100%" height="100%" minHeight={176}>
        <AreaChart data={data} margin={{ top: 8, right: 12, bottom: 2, left: 0 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.25} />
              <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: '#64748b' }}
            axisLine={false}
            tickLine={false}
            minTickGap={16}
          />
          <YAxis
            tick={{ fontSize: 11, fill: '#64748b' }}
            axisLine={false}
            tickLine={false}
            width={52}
            domain={yDomain}
            tickFormatter={valueFormatter}
          />
          <Tooltip
            contentStyle={{ borderRadius: 12, borderColor: '#e2e8f0', fontSize: 12 }}
            formatter={(value) => [valueFormatter(Number(value ?? 0)), valueLabel]}
          />
          <Area
            type="monotone"
            dataKey="value"
            name={valueLabel}
            stroke="#4f46e5"
            strokeWidth={2.5}
            fill={`url(#${gradientId})`}
          />
        </AreaChart>
      </ResponsiveContainer>
      <span className="sr-only">
        {data.map((point) => `${point.label}: ${valueFormatter(point.value)}`).join('; ')}
      </span>
    </div>
  );
};

export default VolumeAreaChart;
