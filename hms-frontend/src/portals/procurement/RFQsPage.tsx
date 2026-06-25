import React from 'react';
import ProcurementScopeFilter from './components/ProcurementScopeFilter';
import { RFQStatusPanel } from './components/RFQStatusPanel';
import { Plus, Search } from 'lucide-react';
import { HmsDashboardShell } from '../../components/hms-dashboard';
import { HmsPageHeader } from '../../components/hms-page';
import { useProcurement } from '../../hooks/use-procurement';
import { useUser } from '../../hooks/use-user';

export const RFQsPage: React.FC = () => {
  const user = useUser();
  const branchId = user?.branchId || '';
  const { rfqs, isLoading } = useProcurement(branchId);

  if (!branchId) return <div className="p-10 text-center text-slate-500">No primary branch assigned.</div>;
  if (isLoading) return <div className="p-10 text-center text-slate-400">Loading RFQs...</div>;

  return (
    <HmsDashboardShell widthTier="full">
      <HmsPageHeader
        title="Request for Quotations (RFQ)"
        description="Manage bidding process, supplier invitations, and bid deadlines"
        actions={(
          <button
            type="button"
            className="btn bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer shadow-sm shadow-indigo-100 transition-all"
          >
            <Plus className="h-4 w-4" /> Create New RFQ
          </button>
        )}
      />

      <ProcurementScopeFilter />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RFQStatusPanel rfqs={rfqs || []} />
        </div>
        
        <div className="space-y-6">
          <div className="card bg-white border border-slate-200/80 shadow-sm rounded-2xl p-5 space-y-4">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <Search className="h-4 w-4 text-indigo-500" />
              RFQ Search & Filter
            </h3>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search reference or items..."
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-[10px] focus:outline-none"
              />
            </div>
            <div className="space-y-2 pt-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase">Status</label>
              <div className="flex flex-wrap gap-2">
                <span className="px-2 py-1 bg-indigo-600 text-white text-[9px] font-bold rounded-md cursor-pointer">All RFQs</span>
                <span className="px-2 py-1 bg-slate-100 text-slate-600 text-[9px] font-bold rounded-md cursor-pointer hover:bg-slate-200">Open</span>
                <span className="px-2 py-1 bg-slate-100 text-slate-600 text-[9px] font-bold rounded-md cursor-pointer hover:bg-slate-200">Closed</span>
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200/80 shadow-sm rounded-2xl p-5 space-y-3">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Invitation Stats</h4>
            <div className="space-y-2">
              <div className="flex justify-between items-center text-[10px] font-bold">
                <span className="text-slate-500">Invitations Sent</span>
                <span className="text-slate-800">Live Data</span>
              </div>
              <div className="flex justify-between items-center text-[10px] font-bold">
                <span className="text-slate-500">Quote Acceptance Rate</span>
                <span className="text-emerald-600">Live Data</span>
              </div>
            </div>
          </div>
        </div>
      </div>

    </HmsDashboardShell>
  );
};

export default RFQsPage;
