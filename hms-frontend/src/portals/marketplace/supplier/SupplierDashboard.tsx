import React from 'react';
import { 
  Package, 
  FileText, 
  ShoppingBag, 
  ShieldCheck, 
  Plus,
  ArrowRight,
  Truck,
  DollarSign,
  Zap
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import SupplierShellNotice from './components/SupplierShellNotice';
import SupplierScopeFilter from './components/SupplierScopeFilter';
import SupplierMetricCard from './components/SupplierMetricCard';
import SupplierOrderQueue from './components/SupplierOrderQueue';
import RFQInboxTable from './components/RFQInboxTable';
import ListingHealthPanel from './components/ListingHealthPanel';
import SupplierPerformanceScorecard from './components/SupplierPerformanceScorecard';
import { ChartCard, InsightPanel, StatusDonutChart, TrendLineChart } from '../../../components/analytics';
import { supplierInsights, supplierRevenueTrend, supplierStatusBreakdown } from '../../../data/analytics/operationsAnalytics.mock';

export const SupplierDashboard: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-800 tracking-tight">Supplier Command Center</h2>
          <p className="text-xs text-slate-500 font-medium">Manage your enterprise medical equipment business</p>
        </div>
        <div className="flex items-center gap-3">
          <SupplierScopeFilter />
          <button 
            onClick={() => navigate('/supplier/listings')}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-black transition-all shadow-md"
          >
            <Plus className="h-4 w-4" /> New Listing
          </button>
        </div>
      </div>

      <SupplierShellNotice />

      {/* Metrics Row 1 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <SupplierMetricCard label="Active Listings" value={18} icon={Package} trend="+2" trendType="positive" color="indigo" />
        <SupplierMetricCard label="RFQs Pending" value={4} icon={FileText} trend="URGENT" trendType="negative" color="rose" />
        <SupplierMetricCard label="Quotes Submitted" value={7} icon={FileText} trend="+1" trendType="positive" color="blue" />
        <SupplierMetricCard label="Orders Pending" value={5} icon={ShoppingBag} trend="+3" trendType="positive" color="amber" />
      </div>

      {/* Metrics Row 2 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <SupplierMetricCard label="Orders Shipped" value={23} icon={Truck} trend="+5" trendType="positive" color="emerald" />
        <SupplierMetricCard label="Warranty Claims" value={2} icon={ShieldCheck} trend="-1" trendType="positive" color="rose" />
        <SupplierMetricCard label="Revenue (Mock)" value="₱6.4M" icon={DollarSign} trend="+12.5%" trendType="positive" color="emerald" />
        <SupplierMetricCard label="Payout Pending" value="₱1.85M" icon={DollarSign} color="indigo" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <ChartCard title="Supplier revenue trend" description="Sandbox revenue trajectory for settlement planning." height={280}>
          <TrendLineChart data={supplierRevenueTrend} title="Supplier revenue trend" valueLabel="₱M" />
        </ChartCard>
        <ChartCard title="Operational status mix" description="Listings, orders, shipped items, and warranty claims." height={280}>
          <StatusDonutChart data={supplierStatusBreakdown} title="Supplier operational status" />
        </ChartCard>
        <InsightPanel insights={supplierInsights} title="Supplier action insights" />
      </div>

      {/* Quick Actions */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
        <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest mb-4 flex items-center gap-2">
          <Zap className="h-4 w-4 text-amber-500" /> Quick Actions
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <button onClick={() => navigate('/supplier/listings')} className="flex flex-col items-center justify-center p-4 bg-slate-50 border border-slate-100 rounded-2xl hover:border-indigo-300 hover:bg-indigo-50 transition-all group">
            <Package className="h-5 w-5 text-slate-400 group-hover:text-indigo-600 mb-2" />
            <span className="text-[10px] font-black text-slate-600 uppercase">Add Listing</span>
          </button>
          <button onClick={() => navigate('/supplier/rfq-inbox')} className="flex flex-col items-center justify-center p-4 bg-slate-50 border border-slate-100 rounded-2xl hover:border-indigo-300 hover:bg-indigo-50 transition-all group">
            <FileText className="h-5 w-5 text-slate-400 group-hover:text-indigo-600 mb-2" />
            <span className="text-[10px] font-black text-slate-600 uppercase">RFQ Inbox</span>
          </button>
          <button onClick={() => navigate('/supplier/orders')} className="flex flex-col items-center justify-center p-4 bg-slate-50 border border-slate-100 rounded-2xl hover:border-indigo-300 hover:bg-indigo-50 transition-all group">
            <ShoppingBag className="h-5 w-5 text-slate-400 group-hover:text-indigo-600 mb-2" />
            <span className="text-[10px] font-black text-slate-600 uppercase">Order Queue</span>
          </button>
          <button onClick={() => navigate('/supplier/fulfillment')} className="flex flex-col items-center justify-center p-4 bg-slate-50 border border-slate-100 rounded-2xl hover:border-indigo-300 hover:bg-indigo-50 transition-all group">
            <Truck className="h-5 w-5 text-slate-400 group-hover:text-indigo-600 mb-2" />
            <span className="text-[10px] font-black text-slate-600 uppercase">Fulfillment</span>
          </button>
          <button onClick={() => navigate('/supplier/warranty-claims')} className="flex flex-col items-center justify-center p-4 bg-slate-50 border border-slate-100 rounded-2xl hover:border-indigo-300 hover:bg-indigo-50 transition-all group">
            <ShieldCheck className="h-5 w-5 text-slate-400 group-hover:text-indigo-600 mb-2" />
            <span className="text-[10px] font-black text-slate-600 uppercase">Warranty</span>
          </button>
          <button onClick={() => navigate('/supplier/performance')} className="flex flex-col items-center justify-center p-4 bg-slate-50 border border-slate-100 rounded-2xl hover:border-indigo-300 hover:bg-indigo-50 transition-all group">
            <ArrowRight className="h-5 w-5 text-slate-400 group-hover:text-indigo-600 mb-2" />
            <span className="text-[10px] font-black text-slate-600 uppercase">Performance</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <SupplierOrderQueue />
          <RFQInboxTable />
        </div>

        <div className="space-y-8">
           <div className="bg-slate-900 rounded-[2rem] p-6 text-white space-y-6 shadow-xl">
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Next Payout (Mock)</p>
                <p className="text-3xl font-black tracking-tight">₱6.4M</p>
                <p className="text-[10px] text-emerald-400 font-bold uppercase mt-1">Scheduled for June 01</p>
              </div>
              <button 
                onClick={() => navigate('/supplier/payouts')}
                className="w-full py-3 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-black transition-colors flex items-center justify-center gap-2"
              >
                Payout Ledger <ArrowRight className="h-4 w-4" />
              </button>
           </div>
           <ListingHealthPanel />
           <SupplierPerformanceScorecard />
        </div>
      </div>
    </div>
  );
};

export default SupplierDashboard;
