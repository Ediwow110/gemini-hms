import React, { useEffect, useState } from 'react';
import { Package, MoreVertical, Edit2, Trash2, AlertTriangle, Loader2 } from 'lucide-react';
import { apiClient } from '../../../../lib/api';

export const SupplierProductTable: React.FC = () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchListings = async () => {
      try {
        setLoading(true);
        const response = await apiClient.get('/marketplace/supplier/listings');
        setListings(response.data);
        setError(null);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (err: any) {
        console.error('Failed to fetch supplier listings:', err);
        setError('Failed to load listings');
      } finally {
        setLoading(false);
      }
    };

    fetchListings();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-white border border-slate-200 rounded-3xl shadow-sm">
        <Loader2 className="h-8 w-8 text-indigo-500 animate-spin mb-4" />
        <p className="text-sm font-bold text-slate-500 tracking-tight uppercase">Loading listings...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-10 bg-rose-50 border border-rose-100 rounded-3xl text-center">
        <AlertTriangle className="h-10 w-10 text-rose-500 mx-auto mb-4" />
        <p className="text-sm font-black text-rose-800 tracking-tight uppercase">{error}</p>
        <button 
          onClick={() => window.location.reload()}
          className="mt-4 px-6 py-2 bg-rose-600 text-white text-xs font-black rounded-xl"
        >
          Retry
        </button>
      </div>
    );
  }

  if (listings.length === 0) {
    return (
      <div className="p-20 bg-slate-50 border border-dashed border-slate-200 rounded-3xl text-center">
        <Package className="h-12 w-12 text-slate-300 mx-auto mb-4" />
        <p className="text-sm font-black text-slate-500 tracking-tight uppercase">No listings found</p>
        <p className="text-xs text-slate-400 mt-2">Start by adding your first product to the marketplace</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
      <table className="w-full text-left border-collapse">
        <thead className="bg-slate-50/50 border-b border-slate-100">
          <tr>
            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Product</th>
            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">SKU</th>
            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Price</th>
            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {listings.map((l) => (
            <tr key={l.id} className="hover:bg-slate-50/50 transition-colors group">
              <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400">
                    <Package className="h-5 w-5" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-black text-slate-800">{l.serviceItem?.name}</span>
                    <span className="text-[9px] font-bold text-slate-400">{l.serviceItem?.category?.name}</span>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase">{l.serviceItem?.code}</td>
              <td className="px-6 py-4 text-xs font-black text-slate-900">
                ₱{(l.priceOverride || l.serviceItem?.prices?.[0]?.amount || 0).toLocaleString()}
              </td>
              <td className="px-6 py-4">
                <span className={`text-[9px] font-black px-2 py-0.5 rounded-lg border ${
                  l.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 
                  l.status === 'PENDING_APPROVAL' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                  'bg-slate-50 text-slate-400 border-slate-100'
                }`}>
                  {l.status}
                </span>
              </td>
              <td className="px-6 py-4 text-right">
                <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg"><Edit2 className="h-3.5 w-3.5" /></button>
                  <button className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg"><Trash2 className="h-3.5 w-3.5" /></button>
                  <button className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-lg"><MoreVertical className="h-3.5 w-3.5" /></button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default SupplierProductTable;
