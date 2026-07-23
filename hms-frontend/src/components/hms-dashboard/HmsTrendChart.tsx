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
    <div className="flex items-center gap-2 border-b border-slate-200 bg-slate-50 px-4 py-2.5">
      <div className="h-4 w-1 rounded-full bg-sky-600" aria-hidden="true" />
      <div>
        <h3 className="text-[13px] font-bold uppercase tracking-wide text-slate-800">{title}</h3>
        {description && <p className="text-[11px] text-slate-500">{description}</p>}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="h-full overflow-hidden rounded-md border border-slate-300 bg-white shadow-sm">
        {header}
        <div className="p-4" style={{ height }}>
          <HmsLoadingSkeleton variant="panel" />
        </div>
      </div>
    );
  }

  if (empty) {
    return (
      <div className="h-full overflow-hidden rounded-md border border-slate-300 bg-white shadow-sm">
        {header}
        <div className="p-4" style={{ minHeight: height }}>
          <HmsDataUnavailable sectionName={title} expectedApi="Chart data" />
        </div>
      </div>
    );
  }

  return (
    <section className="h-full overflow-hidden rounded-md border border-slate-300 bg-white shadow-sm">
      {header}
      <div className="min-w-0 p-4" style={{ height }}>
        {chart}
      </div>
    </section>
  );
};

export default HmsTrendChart;
