import { useMemo, useState } from 'react';
import { ArrowDownUp, Search } from 'lucide-react';
import type { ReportColumn, ReportRow } from '../../types/analytics';
import AnalyticsEmptyState from './AnalyticsEmptyState';
import AnalyticsErrorState from './AnalyticsErrorState';

interface ReportTableProps<T extends ReportRow> {
  columns: ReportColumn<T>[];
  rows: T[];
  loading?: boolean;
  empty?: string;
  error?: string | boolean;
  pageSize?: number;
  caption?: string;
}

export const ReportTable = <T extends ReportRow>({ columns, rows, loading, empty, error, pageSize = 8, caption = 'Analytics report table' }: ReportTableProps<T>) => {
  const [query, setQuery] = useState('');
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(1);

  const filteredRows = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const baseRows = normalizedQuery
      ? rows.filter((row) => Object.values(row).some((value) => String(value ?? '').toLowerCase().includes(normalizedQuery)))
      : rows;

    if (!sortKey) return baseRows;
    return [...baseRows].sort((a, b) => {
      const left = String(a[sortKey] ?? '');
      const right = String(b[sortKey] ?? '');
      return sortDir === 'asc' ? left.localeCompare(right, undefined, { numeric: true }) : right.localeCompare(left, undefined, { numeric: true });
    });
  }, [query, rows, sortDir, sortKey]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const visibleRows = filteredRows.slice((safePage - 1) * pageSize, safePage * pageSize);

  if (error) return <AnalyticsErrorState description={typeof error === 'string' ? error : undefined} />;

  return (
    <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm" aria-label={caption}>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <label className="relative block max-w-sm text-xs font-bold text-slate-500">
          <span className="sr-only">Search report rows</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-300" aria-hidden="true" />
          <input
            type="search"
            value={query}
            onChange={(event) => { setQuery(event.target.value); setPage(1); }}
            placeholder="Search report rows"
            className="min-h-11 w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-xs font-semibold outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
          />
        </label>
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{filteredRows.length} rows</p>
      </div>

      {loading ? (
        <div className="space-y-3" aria-label="Loading report rows">
          {Array.from({ length: Math.min(pageSize, 5) }).map((_, index) => <div key={index} className="h-12 animate-pulse rounded-xl bg-slate-100" />)}
        </div>
      ) : filteredRows.length === 0 ? (
        <AnalyticsEmptyState title={empty ?? 'No report rows'} description="No rows match the current filters." />
      ) : (
        <>
          <div className="hidden overflow-x-auto md:block">
            <table className="min-w-full divide-y divide-slate-100 text-left text-xs">
              <caption className="sr-only">{caption}</caption>
              <thead>
                <tr>
                  {columns.map((column) => (
                    <th key={column.key} scope="col" className="px-3 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400">
                      {column.sortable ? (
                        <button
                          type="button"
                          onClick={() => {
                            if (sortKey === column.key) setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
                            else { setSortKey(column.key); setSortDir('asc'); }
                          }}
                          className="inline-flex min-h-11 items-center gap-1 rounded-lg px-1 text-left hover:text-indigo-600"
                        >
                          {column.header}<ArrowDownUp className="h-3 w-3" aria-hidden="true" />
                        </button>
                      ) : column.header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {visibleRows.map((row, index) => (
                  <tr key={String(row.id ?? index)} className="hover:bg-slate-50/70">
                    {columns.map((column) => <td key={column.key} className="px-3 py-3 font-semibold text-slate-600">{column.render ? column.render(row) : String(row[column.key] ?? '—')}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="space-y-3 md:hidden">
            {visibleRows.map((row, index) => (
              <article key={String(row.id ?? index)} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                {columns.map((column) => (
                  <div key={column.key} className="mb-2 flex items-start justify-between gap-3 last:mb-0">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{column.header}</span>
                    <span className="text-right text-xs font-bold text-slate-700">{column.render ? column.render(row) : String(row[column.key] ?? '—')}</span>
                  </div>
                ))}
              </article>
            ))}
          </div>

          <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs font-bold text-slate-500">
            <span>Page {safePage} of {totalPages}</span>
            <div className="flex gap-2">
              <button type="button" onClick={() => setPage(Math.max(1, safePage - 1))} disabled={safePage === 1} className="min-h-11 rounded-xl border border-slate-200 px-3 disabled:cursor-not-allowed disabled:opacity-40">Previous</button>
              <button type="button" onClick={() => setPage(Math.min(totalPages, safePage + 1))} disabled={safePage === totalPages} className="min-h-11 rounded-xl border border-slate-200 px-3 disabled:cursor-not-allowed disabled:opacity-40">Next</button>
            </div>
          </div>
        </>
      )}
    </section>
  );
};

export default ReportTable;
