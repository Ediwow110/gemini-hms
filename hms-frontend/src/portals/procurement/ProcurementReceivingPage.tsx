import React from 'react';
import ProcurementScopeFilter from './components/ProcurementScopeFilter';
import { ReceivingMonitorPanel } from './components/ReceivingMonitorPanel';
import { ClipboardList } from 'lucide-react';
import { HmsDashboardShell } from '../../components/hms-dashboard';
import { HmsPageHeader } from '../../components/hms-page';
import { useProcurement } from '../../hooks/use-procurement';
import { useUser } from '../../hooks/use-user';

export const ProcurementReceivingPage: React.FC = () => {
  const user = useUser();
  const branchId = user?.branchId || '';
  const { receiving, isLoading } = useProcurement(branchId);

  if (!branchId) return <div className="p-10 text-center text-slate-500">No primary branch assigned.</div>;
  if (isLoading) return <div className="p-10 text-center text-slate-400">Loading shipments...</div>;

  return (
    <HmsDashboardShell widthTier="full">
      <HmsPageHeader
        title="Warehouse Receiving Dock"
        description="Record incoming shipments, inspect quality, and update logical stock availability"
      />

      <ProcurementScopeFilter />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ReceivingMonitorPanel shipments={receiving || []} />
        </div>
        
        <div className="space-y-6">
          <div className="card bg-white border border-slate-200/80 shadow-sm rounded-2xl p-5 space-y-4">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <ClipboardList className="h-4 w-4 text-indigo-500" />
              Inspection Checklist
            </h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-2 bg-slate-50 rounded-lg">
                <input type="checkbox" readOnly className="h-4 w-4 rounded border-slate-300 text-indigo-600" />
                <span className="text-[10px] font-bold text-slate-600">Verify PO Reference</span>
              </div>
              <div className="flex items-center gap-3 p-2 bg-slate-50 rounded-lg">
                <input type="checkbox" readOnly className="h-4 w-4 rounded border-slate-300 text-indigo-600" />
                <span className="text-[10px] font-bold text-slate-600">Check for Damage</span>
              </div>
              <div className="flex items-center gap-3 p-2 bg-slate-50 rounded-lg">
                <input type="checkbox" readOnly className="h-4 w-4 rounded border-slate-300 text-indigo-600" />
                <span className="text-[10px] font-bold text-slate-600">Count vs Packing List</span>
              </div>
            </div>
            <button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 rounded-xl text-xs transition-all cursor-pointer">
              Begin Inspection
            </button>
          </div>

          <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl space-y-2">
            <h5 className="text-[10px] font-bold text-rose-900 uppercase">Variance Reporting</h5>
            <p className="text-[10px] text-rose-800 leading-relaxed font-medium italic">
              "All quantity variances or damaged items must be logged with photos. Automated debit notes will be generated upon confirmation."
            </p>
          </div>
        </div>
      </div>
    </HmsDashboardShell>
  );
};

export default ProcurementReceivingPage;
