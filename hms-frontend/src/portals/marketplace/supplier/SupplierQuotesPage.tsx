import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertTriangle, FileText, Loader2, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import { HmsPageHeader } from '../../../components/hms-page';
import {
  HmsAuditFooter,
  HmsDashboardShell,
  HmsDataSourceBadge,
  HmsToolbar,
} from '../../../components/hms-dashboard';
import SupplierShellNotice from './components/SupplierShellNotice';
import { apiClient } from '../../../lib/api';

interface SupplierQuote {
  id: string;
  totalAmount: string | number;
  status: string;
  createdAt?: string | null;
  rfq?: {
    id: string;
    title?: string | null;
  } | null;
}

const peso = (value: string | number) =>
  new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);

export const SupplierQuotesPage: React.FC = () => {
  const [quotes, setQuotes] = useState<SupplierQuote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('ALL');

  const fetchQuotes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.get('/marketplace/supplier/quotes');
      setQuotes(Array.isArray(response.data) ? response.data : []);
    } catch {
      setError('Supplier quotes could not be loaded.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchQuotes();
  }, [fetchQuotes]);

  const filteredQuotes = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    return quotes.filter((quote) => {
      const matchesStatus = status === 'ALL' || quote.status === status;
      const matchesSearch =
        normalizedSearch.length === 0 ||
        quote.id.toLowerCase().includes(normalizedSearch) ||
        quote.rfq?.id.toLowerCase().includes(normalizedSearch) ||
        quote.rfq?.title?.toLowerCase().includes(normalizedSearch);
      return matchesStatus && matchesSearch;
    });
  }, [quotes, search, status]);

  return (
    <HmsDashboardShell
      toolbar={
        <HmsToolbar
          role="Supplier Quotes"
          onRefresh={() => void fetchQuotes()}
          refreshing={loading}
        />
      }
      footer={<HmsAuditFooter dataSource="Supplier quote API" />}
    >
      <HmsPageHeader
        eyebrow="Supplier operations"
        title="Quote Management"
        description="Review submitted bids and open the RFQ inbox to prepare a new quote against a real request."
        actions={
          <>
            <HmsDataSourceBadge mode="live" />
            <Link
              to="/supplier/rfq-inbox"
              className="inline-flex min-h-10 items-center rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700"
            >
              Open RFQ inbox
            </Link>
          </>
        }
      />

      <SupplierShellNotice />

      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-end sm:justify-between">
        <label className="min-w-0 flex-1 text-[11px] font-semibold text-slate-500">
          <span className="mb-1 block">Search quotes</span>
          <span className="relative block">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Quote ID, RFQ ID or title"
              className="min-h-10 w-full rounded-xl border border-slate-200 bg-white py-2 pl-10 pr-3 text-xs font-medium text-slate-700 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
            />
          </span>
        </label>
        <label className="min-w-[180px] text-[11px] font-semibold text-slate-500">
          <span className="mb-1 block">Status</span>
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            className="min-h-10 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
          >
            <option value="ALL">All statuses</option>
            <option value="DRAFT">Draft</option>
            <option value="SENT">Sent</option>
            <option value="ACCEPTED">Accepted</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </label>
      </div>

      {loading ? (
        <div className="flex min-h-72 flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white shadow-sm">
          <Loader2 className="h-7 w-7 animate-spin text-indigo-500" />
          <p className="mt-3 text-xs font-semibold text-slate-500">Loading quotes…</p>
        </div>
      ) : error ? (
        <div className="flex min-h-72 flex-col items-center justify-center rounded-2xl border border-rose-200 bg-white p-8 text-center shadow-sm">
          <AlertTriangle className="h-8 w-8 text-rose-500" />
          <p className="mt-3 text-sm font-semibold text-rose-800">{error}</p>
          <button
            type="button"
            onClick={() => void fetchQuotes()}
            className="mt-4 min-h-10 rounded-xl bg-rose-600 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-700"
          >
            Retry
          </button>
        </div>
      ) : filteredQuotes.length === 0 ? (
        <div className="flex min-h-72 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
          <FileText className="h-10 w-10 text-slate-300" />
          <p className="mt-3 text-sm font-semibold text-slate-700">No matching quotes</p>
          <p className="mt-1 text-xs text-slate-500">
            Adjust the filter or submit a quote from an open RFQ.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-xs">
              <thead className="border-b border-slate-100 bg-slate-50 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-5 py-3">Quote</th>
                  <th className="px-4 py-3">RFQ</th>
                  <th className="px-4 py-3">Submitted</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Bid amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredQuotes.map((quote) => (
                  <tr key={quote.id} className="hover:bg-slate-50">
                    <td className="px-5 py-3.5 font-mono font-semibold text-slate-900">
                      {quote.id.slice(0, 8)}
                    </td>
                    <td className="px-4 py-3.5">
                      <p className="font-semibold text-slate-800">
                        {quote.rfq?.title || 'General RFQ'}
                      </p>
                      <p className="mt-0.5 font-mono text-[10px] text-slate-500">
                        {quote.rfq?.id.slice(0, 8) || 'RFQ unavailable'}
                      </p>
                    </td>
                    <td className="px-4 py-3.5 text-slate-500">
                      {quote.createdAt
                        ? new Date(quote.createdAt).toLocaleDateString()
                        : 'Unavailable'}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-[10px] font-semibold text-slate-700">
                        {quote.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right font-mono font-semibold text-slate-900">
                      {peso(quote.totalAmount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </HmsDashboardShell>
  );
};

export default SupplierQuotesPage;
