import React, { useState, useEffect } from 'react';
import { Package, AlertTriangle, FileText, CheckCircle2, Loader2, XCircle } from 'lucide-react';
import { apiClient } from '../../../../lib/api';

interface Listing {
  id: string;
  status: string;
  serviceItem: {
    name: string;
    code: string;
  };
  supplier?: {
    name: string;
  };
  createdAt: string;
}

export const ListingApprovalQueue: React.FC = () => {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchListings = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/marketplace/admin/listings?status=PENDING_APPROVAL');
      setListings(response.data);
    } catch (err) {
      console.error('Failed to fetch pending listings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchListings();
  }, []);

  const handleModerate = async (id: string, status: 'APPROVED' | 'REJECTED') => {
    try {
      await apiClient.patch(`/marketplace/admin/listings/${id}/moderate`, {
        status,
        rejectionReason: status === 'REJECTED' ? 'Does not meet marketplace quality standards.' : undefined
      });
      fetchListings();
    } catch (err) {
      console.error(`Failed to ${status} listing:`, err);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3 bg-white rounded-3xl border border-slate-200">
        <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" />
        <p className="text-sm font-black text-slate-400 uppercase tracking-widest">Loading Queue...</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
      <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
        <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
          <Package className="h-4 w-4 text-indigo-500" />
          Listing Approval Queue
        </h3>
      </div>
      <table className="w-full text-left border-collapse">
        <thead className="bg-slate-50/50 border-b border-slate-100">
          <tr>
            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Listing</th>
            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Supplier</th>
            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Submitted</th>
            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {listings.length > 0 ? (
            listings.map((l) => (
              <tr key={l.id} className="hover:bg-slate-50/50 transition-colors group">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400">
                      <Package className="h-4 w-4" />
                    </div>
                    <div>
                      <span className="text-xs font-black text-slate-800">{l.serviceItem.name}</span>
                      <p className="text-[10px] text-slate-400 font-bold uppercase">{l.serviceItem.code}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-[10px] font-bold text-slate-500">{l.supplier?.name || 'Various'}</td>
                <td className="px-6 py-4 text-[10px] font-bold text-slate-500">
                  {new Date(l.createdAt).toLocaleDateString()}
                </td>
                <td className="px-6 py-4">
                  <span className={`text-[9px] font-black px-2 py-0.5 rounded-lg border bg-amber-50 text-amber-700 border-amber-100`}>
                    {l.status.replace('_', ' ')}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => handleModerate(l.id, 'APPROVED')}
                      className="px-3 py-1.5 bg-emerald-50 text-emerald-600 border border-emerald-200 hover:bg-emerald-600 hover:text-white rounded-lg text-[10px] font-black uppercase transition-all"
                    >
                      Approve
                    </button>
                    <button 
                      onClick={() => handleModerate(l.id, 'REJECTED')}
                      className="px-3 py-1.5 bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-600 hover:text-white rounded-lg text-[10px] font-black uppercase transition-all"
                    >
                      Reject
                    </button>
                  </div>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={5} className="px-6 py-20 text-center">
                <CheckCircle2 className="h-10 w-10 text-emerald-200 mx-auto mb-3" />
                <p className="text-sm font-black text-slate-400 uppercase tracking-widest">Queue Clear</p>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default ListingApprovalQueue;
