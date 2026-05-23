import React from 'react';
import {
  DollarSign,
  ShoppingBag,
  FileText,
  Package,
  Users,
  AlertTriangle,
  ShieldCheck,
  Wrench,
  TrendingUp,
  Zap,
  ArrowRight,
  BarChart3
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import MarketplaceAdminShellNotice from './components/MarketplaceAdminShellNotice';
import MarketplaceAdminScopeFilter from './components/MarketplaceAdminScopeFilter';
import MarketplaceMetricCard from './components/MarketplaceMetricCard';
import SupplierApprovalQueue from './components/SupplierApprovalQueue';
import MarketplaceRiskPanel from './components/MarketplaceRiskPanel';
import OrderMonitorTable from './components/OrderMonitorTable';
import DisputeQueuePanel from './components/DisputeQueuePanel';

export const MarketplaceAdminDashboard: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-800 tracking-tight">Marketplace Admin Command Center</h2>
          <p className="text-xs text-slate-500 font-medium">Governance, monitoring, and marketplace health oversight</p>
        </div>
        <div className="flex items-center gap-3">
          <MarketplaceAdminScopeFilter />
        </div>
      </div>

      <MarketplaceAdminShellNotice />

      {/* Metrics Row 1 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MarketplaceMetricCard label="GMV / Sales (Mock)" value="₱18.2M" icon={DollarSign} trend="+15.4%" trendType="positive" color="emerald" />
        <MarketplaceMetricCard label="Active Orders" value={34} icon={ShoppingBag} trend="+5" trendType="positive" color="indigo" />
        <MarketplaceMetricCard label="RFQ Activity" value={47} icon={FileText} trend="+8" trendType="positive" color="blue" />
        <MarketplaceMetricCard label="Listing Approvals" value={12} icon={Package} trend="URGENT" trendType="negative" color="amber" />
      </div>

      {/* Metrics Row 2 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MarketplaceMetricCard label="Active Suppliers" value={28} icon={Users} trend="+3" trendType="positive" color="indigo" />
        <MarketplaceMetricCard label="Supplier Risk" value={3} icon={AlertTriangle} trend="-1" trendType="positive" color="rose" />
        <MarketplaceMetricCard label="Open Disputes" value={5} icon={ShieldCheck} trend="+2" trendType="negative" color="amber" />
        <MarketplaceMetricCard label="Warranty Claims" value={8} icon={Wrench} color="violet" />
      </div>

      {/* Metrics Row 3 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MarketplaceMetricCard label="Installation SLA (Mock)" value="97.8%" icon={TrendingUp} trend="+0.5%" trendType="positive" color="emerald" />
        <MarketplaceMetricCard label="Platform Revenue (Mock)" value="₱845K" icon={DollarSign} trend="+8.3%" trendType="positive" color="emerald" />
      </div>

      {/* Quick Actions */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
        <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest mb-4 flex items-center gap-2">
          <Zap className="h-4 w-4 text-amber-500" /> Quick Actions
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <button onClick={() => navigate('/marketplace-admin/suppliers')} className="flex flex-col items-center justify-center p-4 bg-slate-50 border border-slate-100 rounded-2xl hover:border-indigo-300 hover:bg-indigo-50 transition-all group">
            <Users className="h-5 w-5 text-slate-400 group-hover:text-indigo-600 mb-2" />
            <span className="text-[10px] font-black text-slate-600 uppercase">Suppliers</span>
          </button>
          <button onClick={() => navigate('/marketplace-admin/listing-approval')} className="flex flex-col items-center justify-center p-4 bg-slate-50 border border-slate-100 rounded-2xl hover:border-indigo-300 hover:bg-indigo-50 transition-all group">
            <Package className="h-5 w-5 text-slate-400 group-hover:text-indigo-600 mb-2" />
            <span className="text-[10px] font-black text-slate-600 uppercase">Listing Approval</span>
          </button>
          <button onClick={() => navigate('/marketplace-admin/order-monitor')} className="flex flex-col items-center justify-center p-4 bg-slate-50 border border-slate-100 rounded-2xl hover:border-indigo-300 hover:bg-indigo-50 transition-all group">
            <ShoppingBag className="h-5 w-5 text-slate-400 group-hover:text-indigo-600 mb-2" />
            <span className="text-[10px] font-black text-slate-600 uppercase">Order Monitor</span>
          </button>
          <button onClick={() => navigate('/marketplace-admin/disputes')} className="flex flex-col items-center justify-center p-4 bg-slate-50 border border-slate-100 rounded-2xl hover:border-indigo-300 hover:bg-indigo-50 transition-all group">
            <ShieldCheck className="h-5 w-5 text-slate-400 group-hover:text-indigo-600 mb-2" />
            <span className="text-[10px] font-black text-slate-600 uppercase">Disputes</span>
          </button>
          <button onClick={() => navigate('/marketplace-admin/commission-fees')} className="flex flex-col items-center justify-center p-4 bg-slate-50 border border-slate-100 rounded-2xl hover:border-indigo-300 hover:bg-indigo-50 transition-all group">
            <DollarSign className="h-5 w-5 text-slate-400 group-hover:text-indigo-600 mb-2" />
            <span className="text-[10px] font-black text-slate-600 uppercase">Commission</span>
          </button>
          <button onClick={() => navigate('/marketplace-admin/reports')} className="flex flex-col items-center justify-center p-4 bg-slate-50 border border-slate-100 rounded-2xl hover:border-indigo-300 hover:bg-indigo-50 transition-all group">
            <BarChart3 className="h-5 w-5 text-slate-400 group-hover:text-indigo-600 mb-2" />
            <span className="text-[10px] font-black text-slate-600 uppercase">Reports</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <SupplierApprovalQueue />
          <OrderMonitorTable />
          <DisputeQueuePanel />
        </div>

        <div className="space-y-8">
          <MarketplaceRiskPanel />
          <div className="bg-slate-900 rounded-[2rem] p-6 text-white space-y-6 shadow-xl">
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Marketplace Health (Mock)</p>
              <p className="text-3xl font-black tracking-tight">96.4%</p>
              <p className="text-[10px] text-emerald-400 font-bold uppercase mt-1">All systems operational</p>
            </div>
            <button
              onClick={() => navigate('/marketplace-admin/reports')}
              className="w-full py-3 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-black transition-colors flex items-center justify-center gap-2"
            >
              View Reports <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarketplaceAdminDashboard;
