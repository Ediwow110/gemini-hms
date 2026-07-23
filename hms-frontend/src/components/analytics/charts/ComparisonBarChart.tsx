import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
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
  valueFormatter?: (value: number) => string;
  horizontal?: boolean;
  yDomain?: [number | 'auto', number | 'auto'];
}

const defaultFormatter = (value: number) => value.toLocaleString();

export const ComparisonBarChart = ({
  data,
  title,
  description,
  loading,
  valueLabel = 'Value',
  secondaryLabel = 'Comparison',
  valueFormatter = defaultFormatter,
  horizontal = data.length >= 6,
  yDomain,
}: ComparisonBarChartProps) => {
  if (loading) return <AnalyticsSkeleton cards={0} charts={1} tableRows={0} />;
  if (data.length === 0) return <AnalyticsEmptyState title="No comparison data" />;

  const hasSecondary = data.some((point) => point.secondaryValue !== undefined);

  return (
    <div
      role="img"
      aria-label={`${title ?? 'Comparison chart'}${description ? `. ${description}` : ''}`}
      className="h-full min-h-44 w-full min-w-0"
    >
      <ResponsiveContainer width="100%" height="100%" minHeight={176}>
        <BarChart
          data={data}
          layout={horizontal ? 'vertical' : 'horizontal'}
          margin={horizontal
            ? { top: 6, right: 18, bottom: 4, left: 18 }
            : { top: 8, right: 12, bottom: 2, left: 0 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="#e2e8f0"
            vertical={!horizontal}
            horizontal={horizontal}
          />
          {horizontal ? (
            <>
              <XAxis
                type="number"
                tick={{ fontSize: 11, fill: '#64748b' }}
                axisLine={false}
                tickLine={false}
                domain={yDomain}
                tickFormatter={valueFormatter}
              />
              <YAxis
                type="category"
                dataKey="label"
                width={96}
                tick={{ fontSize: 11, fill: '#64748b' }}
                axisLine={false}
                tickLine={false}
              />
            </>
          ) : (
            <>
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11, fill: '#64748b' }}
                axisLine={false}
                tickLine={false}
                minTickGap={12}
              />
              <YAxis
                tick={{ fontSize: 11, fill: '#64748b' }}
                axisLine={false}
                tickLine={false}
                width={52}
                domain={yDomain}
                tickFormatter={valueFormatter}
              />
            </>
          )}
          <Tooltip
            contentStyle={{ borderRadius: 12, borderColor: '#e2e8f0', fontSize: 12 }}
            formatter={(value, name) => [valueFormatter(Number(value ?? 0)), name]}
          />
          {hasSecondary && <Legend wrapperStyle={{ fontSize: 11 }} />}
          <Bar
            dataKey="value"
            name={valueLabel}
            fill="#4f46e5"
            radius={horizontal ? [0, 8, 8, 0] : [8, 8, 0, 0]}
            maxBarSize={42}
          />
          {hasSecondary && (
            <Bar
              dataKey="secondaryValue"
              name={secondaryLabel}
              fill="#0f766e"
              radius={horizontal ? [0, 8, 8, 0] : [8, 8, 0, 0]}
              maxBarSize={42}
            />
          )}
        </BarChart>
      </ResponsiveContainer>
      <span className="sr-only">
        {data.map((point) => `${point.label}: ${valueFormatter(point.value)}`).join('; ')}
      </span>
    </div>
  );
};

export default ComparisonBarChart;
