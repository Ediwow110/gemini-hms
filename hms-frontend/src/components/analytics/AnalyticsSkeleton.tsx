interface AnalyticsSkeletonProps {
  cards?: number;
  charts?: number;
  tableRows?: number;
}

export const AnalyticsSkeleton = ({ cards = 4, charts = 2, tableRows = 4 }: AnalyticsSkeletonProps) => (
  <div className="space-y-6" aria-label="Loading analytics">
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: cards }).map((_, index) => (
        <div key={index} className="h-28 animate-pulse rounded-2xl border border-slate-200 bg-white p-5">
          <div className="mb-4 h-3 w-24 rounded bg-slate-100" />
          <div className="mb-3 h-7 w-20 rounded bg-slate-100" />
          <div className="h-3 w-32 rounded bg-slate-100" />
        </div>
      ))}
    </div>
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      {Array.from({ length: charts }).map((_, index) => (
        <div key={index} className="h-72 animate-pulse rounded-2xl border border-slate-200 bg-white p-5">
          <div className="mb-6 h-4 w-40 rounded bg-slate-100" />
          <div className="h-48 rounded-xl bg-slate-100" />
        </div>
      ))}
    </div>
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      {Array.from({ length: tableRows }).map((_, index) => (
        <div key={index} className="mb-3 h-10 animate-pulse rounded-xl bg-slate-100 last:mb-0" />
      ))}
    </div>
  </div>
);

export default AnalyticsSkeleton;
