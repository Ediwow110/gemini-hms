import AnalyticsEmptyState from '../AnalyticsEmptyState';
import AnalyticsSkeleton from '../AnalyticsSkeleton';
import type { HeatmapCell } from '../../../types/analytics';

interface HeatmapGridProps {
  data: HeatmapCell[];
  title?: string;
  description?: string;
  loading?: boolean;
}

const intensity = (value: number, max: number) => {
  const ratio = max ? value / max : 0;
  if (ratio >= 0.8) return 'bg-rose-500 text-white';
  if (ratio >= 0.6) return 'bg-amber-400 text-slate-900';
  if (ratio >= 0.35) return 'bg-indigo-400 text-white';
  if (ratio > 0) return 'bg-emerald-100 text-emerald-900';
  return 'bg-slate-100 text-slate-400';
};

export const HeatmapGrid = ({ data, title = 'Load heatmap', description, loading }: HeatmapGridProps) => {
  if (loading) return <AnalyticsSkeleton cards={0} charts={1} tableRows={0} />;
  if (data.length === 0) return <AnalyticsEmptyState title="No heatmap data" />;

  const rows = Array.from(new Set(data.map(cell => cell.row)));
  const columns = Array.from(new Set(data.map(cell => cell.column)));
  const max = Math.max(...data.map(cell => cell.value), 1);

  return (
    <div role="img" aria-label={`${title}${description ? `. ${description}` : ''}`} className="overflow-x-auto">
      <div className="min-w-[520px]">
        <div className="grid gap-2" style={{ gridTemplateColumns: `120px repeat(${columns.length}, minmax(72px, 1fr))` }}>
          <div />
          {columns.map(column => <div key={column} className="text-center text-[10px] font-black uppercase tracking-wider text-slate-400">{column}</div>)}
          {rows.map(row => (
            <div key={row} className="contents">
              <div className="flex items-center text-xs font-black text-slate-600">{row}</div>
              {columns.map(column => {
                const cell = data.find(item => item.row === row && item.column === column);
                return (
                  <div key={`${row}-${column}`} title={cell?.label ?? `${row} ${column}: ${cell?.value ?? 0}`} className={`flex min-h-12 items-center justify-center rounded-xl text-xs font-black ${intensity(cell?.value ?? 0, max)}`}>
                    {cell?.value ?? 0}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default HeatmapGrid;
