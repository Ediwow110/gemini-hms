import React, { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, Clock, FileText, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { apiClient } from '../../../../lib/api';

interface SupplierRfq {
  id: string;
  title?: string | null;
  createdAt: string;
  branch?: { name?: string | null } | null;
  _count?: { quotes?: number } | null;
}

export const RFQInboxTable: React.FC = () => {
  const [rfqs, setRfqs] = useState<SupplierRfq[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRfqs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.get('/marketplace/supplier/rfqs');
      setRfqs(Array.isArray(response.data) ? response.data : []);
    } catch {
      setError('RFQs could not be loaded.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchRfqs();
  }, [fetchRfqs]);

  if (loading) {
    return (
      <div className="flex min-h-72 flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <Loader2 className="h-7 w-7 animate-spin text-indigo-500" />
        <p className="mt-3 text-xs font-semibold text-slate-500">Loading RFQs…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-72 flex-col items-center justify-center rounded-2xl border border-rose-200 bg-white p-8 text-center shadow-sm">
        <AlertTriangle className="h-8 w-8 text-rose-500" />
        <p className="mt-3 text-sm font-semibold text-rose-800">{error}</p>
        <button
          type="button"
          onClick={() => void fetchRfqs()}
          className="mt-4 min-h-10 rounded-xl bg-rose-600 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <section className="h-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm" aria-labelledby="supplier-rfq-heading">
      <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-5 py-4">
        <div>
          <h3 id="supplier-rfq-heading" className="text-sm font-semibold text-slate-900">RFQ inbox</h3>
          <p className="mt-1 text-xs text-slate-500">Live buyer requests available to this supplier account.</p>
        </div>
        <Link to="/supplier/rfq-inbox" className="shrink-0 text-xs font-semibold text-indigo-600 hover:text-indigo-800">
          View all
        </Link>
      </div>

      {rfqs.length === 0 ? (
        <div className="flex min-h-56 flex-col items-center justify-center px-6 text-center">
          <FileText className="h-9 w-9 text-slate-300" />
          <p className="mt-3 text-sm font-semibold text-slate-700">No open RFQs</p>
          <p className="mt-1 text-xs text-slate-500">New buyer requests will appear here.</p>
        </div>
      ) : (
        <div className="divide-y divide-slate-100">
          {rfqs.slice(0, 5).map((rfq) => (
            <div key={rfq.id} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 items-start gap-3">
                <div className="shrink-0 rounded-xl border border-indigo-100 bg-indigo-50 p-2.5 text-indigo-600">
                  <FileText className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-900">
                    {rfq.title || `RFQ from ${rfq.branch?.name || 'buyer branch'}`}
                  </p>
                  <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] text-slate-500">
                    <span className="font-mono">{rfq.id.slice(0, 8)}</span>
                    <span>{rfq.branch?.name || 'Branch unavailable'}</span>
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between gap-4 sm:justify-end">
                <span className="inline-flex items-center gap-1 text-[10px] text-slate-500">
                  <Clock className="h-3.5 w-3.5" />
                  {new Date(rfq.createdAt).toLocaleDateString()}
                </span>
                <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-[10px] font-semibold text-slate-700">
                  {rfq._count?.quotes ?? 0} quotes
                </span>
                <Link
                  to="/supplier/rfq-inbox"
                  className="min-h-9 rounded-lg border border-indigo-200 bg-white px-3 py-2 text-[10px] font-semibold text-indigo-700 hover:bg-indigo-50"
                >
                  Review
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

export default RFQInboxTable;
