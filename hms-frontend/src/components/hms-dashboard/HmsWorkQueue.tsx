import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { HmsEmptyState } from './HmsEmptyState';

interface WorkQueueColumn<T> {
  key: string;
  header: string;
  width?: string;
  render: (item: T) => ReactNode;
}

interface HmsWorkQueueProps<T> {
  title: string;
  description?: string;
  columns: WorkQueueColumn<T>[];
  data: T[];
  keyExtractor: (item: T) => string | number;
  loading?: boolean;
  emptyMessage?: string;
  onRowClick?: (item: T) => void;
  rowHref?: (item: T) => string;
  maxRows?: number;
  viewAllLink?: string;
  viewAllLabel?: string;
}

export const HmsWorkQueue = <T,>({
  title,
  description,
  columns,
  data,
  keyExtractor,
  loading,
  emptyMessage,
  onRowClick,
  rowHref,
  maxRows,
  viewAllLink,
  viewAllLabel = 'View All',
}: HmsWorkQueueProps<T>) => {
  const navigate = useNavigate();
  const visible = maxRows ? data.slice(0, maxRows) : data;

  return (
    <div className="overflow-hidden rounded-md border border-slate-300 bg-white shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <div className="h-4 w-1 rounded-full bg-sky-600" aria-hidden="true" />
          <div>
            <h3 className="text-[13px] font-bold uppercase tracking-wide text-slate-800">{title}</h3>
            {description && <p className="text-[11px] text-slate-500">{description}</p>}
          </div>
        </div>
        {viewAllLink && data.length > (maxRows ?? Infinity) && (
          <button
            type="button"
            onClick={() => navigate(viewAllLink)}
            className="flex items-center gap-0.5 rounded px-2 py-1 text-[11px] font-bold uppercase tracking-wide text-sky-700 transition-colors hover:bg-sky-50"
          >
            {viewAllLabel} <ChevronRight className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-[12px]" role="table" aria-label={title}>
          <thead>
            <tr className="border-b border-slate-200 bg-slate-100/80">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`px-4 py-2 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500 ${col.width ?? ''}`}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="animate-pulse">
                  {columns.map((col) => (
                    <td key={col.key} className="px-4 py-3">
                      <div className="h-3 w-full rounded-sm bg-slate-200" />
                    </td>
                  ))}
                </tr>
              ))
            ) : visible.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="py-8">
                  <HmsEmptyState
                    title={emptyMessage ?? 'No items'}
                    description=""
                  />
                </td>
              </tr>
            ) : (
              visible.map((item) => {
                const id = keyExtractor(item);
                const handleClick = () => {
                  if (rowHref) navigate(rowHref(item));
                  else onRowClick?.(item);
                };
                const isClickable = !!(onRowClick || rowHref);

                return (
                  <tr
                    key={id}
                    className={`transition-colors ${isClickable ? 'cursor-pointer hover:bg-sky-50/60' : ''}`}
                    onClick={isClickable ? handleClick : undefined}
                    role={isClickable ? 'button' : undefined}
                    tabIndex={isClickable ? 0 : undefined}
                    onKeyDown={isClickable ? (e) => { if (e.target !== e.currentTarget) return; if (e.key === 'Enter' || e.key === ' ') handleClick(); } : undefined}
                  >
                    {columns.map((col) => (
                      <td key={col.key} className={`px-4 py-2.5 text-[12px] font-medium text-slate-700 ${col.width ?? ''}`}>
                        {col.render(item)}
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default HmsWorkQueue;
