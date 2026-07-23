import React, { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, Loader2, Package } from 'lucide-react';
import { Link } from 'react-router-dom';
import { apiClient } from '../../../../lib/api';

interface SupplierListing {
  id: string;
  status: string;
  priceOverride?: string | number | null;
  serviceItem?: {
    name?: string | null;
    code?: string | null;
    category?: { name?: string | null } | null;
    prices?: Array<{ amount?: string | number | null }> | null;
  } | null;
}

const peso = (value: string | number | null | undefined) =>
  new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);

const statusClasses = (status: string) => {
  if (status === 'APPROVED') return 'border-emerald-200 bg-emerald-50 text-emerald-700';
  if (status === 'PENDING_APPROVAL') return 'border-amber-200 bg-amber-50 text-amber-700';
  if (status === 'REJECTED') return 'border-rose-200 bg-rose-50 text-rose-700';
  return 'border-slate-200 bg-slate-50 text-slate-600';
};

export const SupplierProductTable: React.FC = () => {
  const [listings, setListings] = useState<SupplierListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchListings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.get('/marketplace/supplier/listings');
      setListings(Array.isArray(response.data) ? response.data : []);
    } catch {
      setError('Supplier listings could not be loaded.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchListings();
  }, [fetchListings]);

  if (loading) {
    return (
      <div className="flex min-h-72 flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <Loader2 className="h-7 w-7 animate-spin text-indigo-500" />
        <p className="mt-3 text-xs font-semibold text-slate-500">Loading listings…</p>
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
          onClick={() => void fetchListings()}
          className="mt-4 min-h-10 rounded-xl bg-rose-600 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm" aria-labelledby="supplier-listings-heading">
      <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-5 py-4">
        <div>
          <h2 id="supplier-listings-heading" className="text-sm font-semibold text-slate-900">Product listings</h2>
          <p className="mt-1 text-xs text-slate-500">Live supplier catalog records and approval status.</p>
        </div>
        <Link to="/supplier/listings" className="shrink-0 text-xs font-semibold text-indigo-600 hover:text-indigo-800">
          Manage listings
        </Link>
      </div>

      {listings.length === 0 ? (
        <div className="flex min-h-56 flex-col items-center justify-center px-6 text-center">
          <Package className="h-9 w-9 text-slate-300" />
          <p className="mt-3 text-sm font-semibold text-slate-700">No listings found</p>
          <p className="mt-1 text-xs text-slate-500">Add a product to begin marketplace review.</p>
          <Link to="/supplier/listings" className="mt-4 min-h-10 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700">
            Add listing
          </Link>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-left text-xs">
            <thead className="border-b border-slate-100 bg-slate-50 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-5 py-3">Product</th>
                <th className="px-4 py-3">SKU</th>
                <th className="px-4 py-3">Price</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-5 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {listings.map((listing) => (
                <tr key={listing.id} className="hover:bg-slate-50">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="shrink-0 rounded-xl bg-slate-100 p-2.5 text-slate-500">
                        <Package className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-slate-900">
                          {listing.serviceItem?.name || 'Unnamed catalog item'}
                        </p>
                        <p className="mt-0.5 truncate text-[10px] text-slate-500">
                          {listing.serviceItem?.category?.name || 'Uncategorized'}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 font-mono text-[10px] text-slate-600">
                    {listing.serviceItem?.code || '—'}
                  </td>
                  <td className="px-4 py-3.5 font-mono font-semibold text-slate-900">
                    {peso(listing.priceOverride ?? listing.serviceItem?.prices?.[0]?.amount)}
                  </td>
                  <td className="px-4 py-3.5">
                    <span className={`rounded-full border px-2 py-1 text-[10px] font-semibold ${statusClasses(listing.status)}`}>
                      {listing.status}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <Link
                      to="/supplier/listings"
                      className="inline-flex min-h-9 items-center rounded-lg border border-indigo-200 bg-white px-3 py-2 text-[10px] font-semibold text-indigo-700 hover:bg-indigo-50"
                    >
                      Manage
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
};

export default SupplierProductTable;
