import React from 'react';

interface Column<T> {
  header: string;
  accessor: keyof T | ((item: T) => React.ReactNode);
  className?: string;
}

interface DashboardDataTableProps<T> {
  title: string;
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  emptyMessage?: string;
  onRowClick?: (item: T) => void;
  href?: (item: T) => string;
  className?: string;
}

export const DashboardDataTable = <T extends { id: string | number }>({
  title,
  columns,
  data,
  loading,
  emptyMessage = 'No data available',
  onRowClick,
  href,
  className = '',
}: DashboardDataTableProps<T>) => {
  return (
    <div className={`overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm ${className}`}>
      <div className="border-b border-slate-100 bg-slate-50/50 px-4 py-3">
        <h3 className="text-sm font-black tracking-tight text-slate-900">{title}</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs" role="table" aria-label={title}>
          <thead className="bg-slate-50/50 text-slate-400">
            <tr>
              {columns.map((col, idx) => (
                <th key={idx} className={`px-4 py-2 font-black uppercase tracking-widest ${col.className ?? ''}`}>
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="animate-pulse">
                  {columns.map((_, idx) => (
                    <td key={idx} className="px-4 py-3">
                      <div className="h-3 w-full rounded bg-slate-100" />
                    </td>
                  ))}
                </tr>
              ))
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="py-8 text-center text-slate-400 font-medium">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((item) => (
                <tr
                  key={item.id}
                  className={`group transition-colors ${onRowClick || href ? 'cursor-pointer hover:bg-slate-50' : ''}`}
                  onClick={() => onRowClick?.(item)}
                >
                  {columns.map((col, idx) => (
                    <td key={idx} className={`px-4 py-3 font-medium text-slate-600 ${col.className ?? ''}`}>
                      {typeof col.accessor === 'function'
                        ? col.accessor(item)
                        : (item[col.accessor] as React.ReactNode)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DashboardDataTable;
