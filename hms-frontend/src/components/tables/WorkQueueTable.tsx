import React from 'react';
import { Loader2 } from 'lucide-react';
import { EmptyState } from '../feedback/EmptyState';

export interface ColumnConfig<T> {
  key: string;
  header: string;
  render?: (row: T) => React.ReactNode;
  align?: 'left' | 'center' | 'right';
}

interface WorkQueueTableProps<T> {
  columns: ColumnConfig<T>[];
  data: T[];
  isLoading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  onRowClick?: (row: T) => void;
  pagination?: {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
  };
}

export function WorkQueueTable<T>({
  columns,
  data,
  isLoading = false,
  emptyTitle = 'No tasks in queue',
  emptyDescription = 'All clear for now!',
  onRowClick,
  pagination,
}: WorkQueueTableProps<T>) {
  if (isLoading) {
    return (
      <div className="card p-12 flex flex-col items-center justify-center min-h-[300px]">
        <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" />
        <p className="text-sm font-semibold text-slate-500 mt-4">Loading queue items...</p>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="card p-6 min-h-[300px] flex items-center justify-center">
        <EmptyState title={emptyTitle} description={emptyDescription} />
      </div>
    );
  }

  return (
    <div className="card overflow-hidden animate-fade-in">
      <div className="overflow-x-auto">
        <table className="w-full text-left table-premium">
          <thead>
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`text-${col.align || 'left'} px-6 py-4`}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, idx) => (
              <tr
                key={idx}
                onClick={() => onRowClick?.(row)}
                className={onRowClick ? 'cursor-pointer' : ''}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={`text-${col.align || 'left'} px-6 py-4.5 font-medium text-slate-700`}
                  >
                    {col.render ? col.render(row) : (row as Record<string, unknown>)[col.key] as React.ReactNode}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pagination && pagination.totalPages > 1 && (
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
          <span className="text-xs font-semibold text-slate-500">
            Page {pagination.currentPage} of {pagination.totalPages}
          </span>
          <div className="flex gap-2">
            <button
              disabled={pagination.currentPage <= 1}
              onClick={() => pagination.onPageChange(pagination.currentPage - 1)}
              className="btn btn-secondary py-1.5 px-3 text-xs"
            >
              Previous
            </button>
            <button
              disabled={pagination.currentPage >= pagination.totalPages}
              onClick={() => pagination.onPageChange(pagination.currentPage + 1)}
              className="btn btn-secondary py-1.5 px-3 text-xs"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
