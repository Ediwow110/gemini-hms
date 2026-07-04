import React from 'react';
import ProcurementScopeFilter from './components/ProcurementScopeFilter';
import { VendorPerformanceScorecard } from './components/VendorPerformanceScorecard';
import { TrendingUp } from 'lucide-react';
import { HmsDashboardShell } from '../../components/hms-dashboard';
import { HmsPageHeader } from '../../components/hms-page';
import { useProcurement } from '../../hooks/use-procurement';
import { useUser } from '../../hooks/use-user';

export const VendorPerformancePage: React.FC = () => {
  const user = useUser();
  const branchId = user?.branchId || '';
  const { performance, isLoading } = useProcurement(branchId);

  if (!branchId) return <div className="p-10 text-center text-slate-500">No primary branch assigned.</div>;
  if (isLoading) return <div className="p-10 text-center text-slate-400">Loading performance data...</div>;

  return (
    <HmsDashboardShell widthTier="full">
      <HmsPageHeader
        title="Vendor Performance Matrix"
        description="Monitoring supplier reliability, quality standards, and response times"
      />

      <ProcurementScopeFilter />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <VendorPerformanceScorecard vendors={performance || []} />
        </div>
        
        <div className="space-y-6">
          <div className="card bg-white border border-slate-200/80 shadow-sm rounded-2xl p-5 space-y-4">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-indigo-500" />
              Global Quality Trends
            </h4>
            <div className="p-8 border-2 border-dashed border-slate-100 rounded-2xl flex flex-col items-center justify-center text-center">
              <TrendingUp className="h-8 w-8 text-slate-200 mb-2" />
              <p className="text-[10px] text-slate-400 font-medium">Aggregated vendor quality trend chart</p>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center text-[10px] font-bold">
                <span className="text-slate-500">Avg. On-Time Delivery</span>
                <span className="text-emerald-600">Live Data</span>
              </div>
              <div className="flex justify-between items-center text-[10px] font-bold">
                <span className="text-slate-500">Defect/Return Rate</span>
                <span className="text-rose-600">Live Data</span>
              </div>
            </div>
          </div>

          <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-5 space-y-3">
            <h4 className="text-xs font-bold text-indigo-900 uppercase tracking-wider">Accreditation Policy</h4>
            <p className="text-[10px] text-indigo-800 leading-relaxed font-medium">
              Suppliers with a risk score of HIGH or an on-time rate below 70% for two consecutive quarters are automatically flagged for probation review.
            </p>
          </div>
        </div>
      </div>
    </HmsDashboardShell>
  );
};

export default VendorPerformancePage;
