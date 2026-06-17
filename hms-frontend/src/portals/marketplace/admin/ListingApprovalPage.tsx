import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { apiClient } from '../../../lib/api';
import MarketplaceAdminShellNotice from './components/MarketplaceAdminShellNotice';
import ListingApprovalQueue from './components/ListingApprovalQueue';

export const ListingApprovalPage: React.FC = () => {
  const [counts, setCounts] = useState({ pending: 0, approved: 0, rejected: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCounts = async () => {
      setLoading(true);
      try {
        const response = await apiClient.get('/marketplace/admin/listings');
        const listings = response.data;
        setCounts({
          pending: listings.filter((l: { status: string }) => l.status === 'PENDING_APPROVAL').length,
          approved: listings.filter((l: { status: string }) => l.status === 'APPROVED').length,
          rejected: listings.filter((l: { status: string }) => l.status === 'REJECTED').length,
        });
      } catch (err) {
        console.error('Failed to fetch listing counts:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchCounts();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-black text-slate-800 tracking-tight">Listing Approval</h2>
        <p className="text-xs text-slate-500 font-medium">Review and approve new marketplace listings from suppliers</p>
      </div>

      <MarketplaceAdminShellNotice />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-3xl p-5 space-y-2">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pending</p>
          {loading ? (
            <Loader2 className="h-6 w-6 text-amber-600 animate-spin" />
          ) : (
            <p className="text-2xl font-black text-amber-600">{counts.pending}</p>
          )}
        </div>
        <div className="bg-white border border-slate-200 rounded-3xl p-5 space-y-2">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Approved</p>
          {loading ? (
            <Loader2 className="h-6 w-6 text-emerald-600 animate-spin" />
          ) : (
            <p className="text-2xl font-black text-emerald-600">{counts.approved}</p>
          )}
        </div>
        <div className="bg-white border border-slate-200 rounded-3xl p-5 space-y-2">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Rejected</p>
          {loading ? (
            <Loader2 className="h-6 w-6 text-rose-600 animate-spin" />
          ) : (
            <p className="text-2xl font-black text-rose-600">{counts.rejected}</p>
          )}
        </div>
      </div>

      <ListingApprovalQueue />
    </div>
  );
};

export default ListingApprovalPage;
