interface HmsLoadingSkeletonProps {
  variant?: 'table' | 'kpi' | 'panel' | 'alert-rail';
  rows?: number;
}

const ShimmerBlock = ({ className }: { className: string }) => (
  <div className={`animate-shimmer rounded ${className}`} />
);

const TableSkeleton = ({ rows = 5 }: { rows: number }) => (
  <div className="rounded-lg border border-slate-200 bg-white">
    <div className="border-b border-slate-100 px-3 py-2.5">
      <ShimmerBlock className="h-4 w-40" />
    </div>
    <div className="divide-y divide-slate-100">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-3 py-2.5">
          <ShimmerBlock className="h-3 w-24" />
          <ShimmerBlock className="h-3 w-32" />
          <ShimmerBlock className="h-3 w-20" />
          <ShimmerBlock className="ml-auto h-3 w-16" />
        </div>
      ))}
    </div>
  </div>
);

const KpiSkeleton = () => (
  <div className="flex flex-wrap gap-6">
    {Array.from({ length: 6 }).map((_, i) => (
      <div key={i} className="flex flex-col gap-1.5">
        <ShimmerBlock className="h-3 w-20" />
        <ShimmerBlock className="h-5 w-16" />
      </div>
    ))}
  </div>
);

const PanelSkeleton = () => (
  <div className="rounded-lg border border-slate-200 bg-white p-4">
    <ShimmerBlock className="mb-3 h-4 w-32" />
    <div className="space-y-2.5">
      <ShimmerBlock className="h-3 w-full" />
      <ShimmerBlock className="h-3 w-3/4" />
      <ShimmerBlock className="h-3 w-5/6" />
    </div>
  </div>
);

const AlertRailSkeleton = () => (
  <div className="flex flex-col gap-2">
    <ShimmerBlock className="h-10 w-full rounded-lg" />
  </div>
);

export const HmsLoadingSkeleton = ({ variant = 'panel', rows }: HmsLoadingSkeletonProps) => {
  switch (variant) {
    case 'table':
      return <TableSkeleton rows={rows ?? 5} />;
    case 'kpi':
      return <KpiSkeleton />;
    case 'alert-rail':
      return <AlertRailSkeleton />;
    default:
      return <PanelSkeleton />;
  }
};

export default HmsLoadingSkeleton;
