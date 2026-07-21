import type { ReactNode } from 'react';
import { HmsLoadingSkeleton } from './HmsLoadingSkeleton';
import { HmsDataUnavailable } from './HmsDataUnavailable';

interface HmsTrendChartProps {
  title: string;
  description?: string;
  chart: ReactNode;
  height?: number;
  loading?: boolean;
  empty?: boolean;
}

export const HmsTrendChart = ({
  title,
  description,
  chart,
  height = 280,
  loading,
  empty,
}: HmsTrendChartProps) => {
  const header = (
    <div className="border-b border-slate-100 px-5 py-4">
      <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      {description && <p className="mt-1 text-xs leading-5 text-slate-500">{description}</p>}
    </div>
  );

  if (loading) {
    return (
      <div className="h-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {header}
        <div className="p-4" style={{ height }}>
          <HmsLoadingSkeleton variant="panel" />
        </div>
      </div>
    );
  }

  if (empty) {
    return (
      <div className="h-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {header}
        <div className="p-4" style={{ minHeight: height }}>
          <HmsDataUnavailable sectionName={title} expectedApi="Chart data" />
        </div>
      </div>
    );
  }

  return (
    <section className="h-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      {header}
      <div className="min-w-0 p-4" style={{ height }}>
        {chart}
      </div>
    </section>
  );
};

export default HmsTrendChart;
