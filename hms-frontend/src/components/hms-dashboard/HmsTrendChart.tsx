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

export const HmsTrendChart = ({ title, description, chart, height = 240, loading, empty }: HmsTrendChartProps) => {
  if (loading) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-3 py-2.5">
          <div className="h-4 w-32 animate-pulse rounded bg-slate-100" />
        </div>
        <div className="p-4" style={{ height }}>
          <HmsLoadingSkeleton variant="panel" />
        </div>
      </div>
    );
  }

  if (empty) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-3 py-2.5">
          <h3 className="text-[14px] font-bold text-slate-800">{title}</h3>
          {description && <p className="text-[12px] text-slate-500 mt-0.5">{description}</p>}
        </div>
        <div className="p-4" style={{ height }}>
          <HmsDataUnavailable sectionName={title} expectedApi="Chart data" />
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-3 py-2.5">
        <h3 className="text-[14px] font-bold text-slate-800">{title}</h3>
        {description && <p className="text-[12px] text-slate-500 mt-0.5">{description}</p>}
      </div>
      <div className="p-2" style={{ height }}>
        {chart}
      </div>
    </div>
  );
};

export default HmsTrendChart;
