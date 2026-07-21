import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
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
  valueFormatter?: (value: number) => string;
  secondaryFormatter?: (value: number) => string;
  yDomain?: [number | 'auto', number | 'auto'];
}

const defaultFormatter = (value: number) => value.toLocaleString();

export const TrendLineChart = ({
  data,
  title,
  description,
  loading,
  valueLabel = 'Value',
  secondaryLabel = 'Comparison',
  valueFormatter = defaultFormatter,
  secondaryFormatter,
  yDomain,
}: TrendLineChartProps) => {
  if (loading) return <AnalyticsSkeleton cards={0} charts={1} tableRows={0} />;
  if (data.length === 0) return <AnalyticsEmptyState title="No trend data" />;

  const hasSecondary = data.some((point) => point.secondaryValue !== undefined);

  return (
    <div
      role="img"
      aria-label={`${title ?? 'Trend chart'}${description ? `. ${description}` : ''}`}
      className="h-full min-h-44 w-full min-w-0"
    >
      <ResponsiveContainer width="100%" height="100%" minHeight={176}>
        <LineChart data={data} margin={{ top: 8, right: 12, bottom: 2, left: 0 }}>
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
            formatter={(value, name) => {
              const numericValue = Number(value ?? 0);
              return [
                name === secondaryLabel && secondaryFormatter
                  ? secondaryFormatter(numericValue)
                  : valueFormatter(numericValue),
                name,
              ];
            }}
          />
          {hasSecondary && <Legend wrapperStyle={{ fontSize: 11 }} />}
          <Line
            type="monotone"
            dataKey="value"
            name={valueLabel}
            stroke="#4f46e5"
            strokeWidth={2.5}
            dot={{ r: 2.5 }}
            activeDot={{ r: 5 }}
          />
          {hasSecondary && (
            <Line
              type="monotone"
              dataKey="secondaryValue"
              name={secondaryLabel}
              stroke="#0f766e"
              strokeWidth={2}
              dot={false}
            />
          )}
        </LineChart>
      </ResponsiveContainer>
      <span className="sr-only">
        {data.map((point) => `${point.label}: ${valueFormatter(point.value)}`).join('; ')}
      </span>
    </div>
  );
};

export default TrendLineChart;
