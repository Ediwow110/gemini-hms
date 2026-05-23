import React from 'react';
import ProcurementScopeFilter from './components/ProcurementScopeFilter';
import { VendorPerformanceScorecard, VendorPerformance } from './components/VendorPerformanceScorecard';
import { TrendingUp } from 'lucide-react';

export const VendorPerformancePage: React.FC = () => {
  const mockVendors: VendorPerformance[] = [
    { id: 'SUP-001', supplier: 'Apex Medical Corp', onTimeRate: 98, qualityRate: 99, responseTime: '4h', riskScore: 'LOW' },
    { id: 'SUP-002', supplier: 'Global Pharma Inc', onTimeRate: 92, qualityRate: 98, responseTime: '1.2d', riskScore: 'LOW' },
    { id: 'SUP-003', supplier: 'Metro Lab Tech', onTimeRate: 75, qualityRate: 94, responseTime: '3.5d', riskScore: 'MEDIUM' },
    { id: 'SUP-004', supplier: 'Stellar Imaging', onTimeRate: 100, qualityRate: 100, responseTime: '8h', riskScore: 'LOW' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-800 tracking-tight" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Vendor Performance Matrix
          </h2>
          <p className="text-xs text-slate-500 font-medium">Monitoring supplier reliability, quality standards, and response times</p>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-1.5 text-[10px] text-amber-800 font-semibold max-w-md">
          <strong>Sandbox Notice:</strong> Vendor performance data is simulated. No real scoring or blacklisting occurs.
        </div>
      </div>

      <ProcurementScopeFilter />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <VendorPerformanceScorecard vendors={mockVendors} />
        </div>
        
        <div className="space-y-6">
          <div className="card bg-white border border-slate-200/80 shadow-sm rounded-2xl p-5 space-y-4">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-indigo-500" />
              Global Quality Trends Shell
            </h4>
            <div className="p-8 border-2 border-dashed border-slate-100 rounded-2xl flex flex-col items-center justify-center text-center">
              <TrendingUp className="h-8 w-8 text-slate-200 mb-2" />
              <p className="text-[10px] text-slate-400 font-medium">Aggregated vendor quality trend chart shell</p>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center text-[10px] font-bold">
                <span className="text-slate-500">Avg. On-Time Delivery</span>
                <span className="text-emerald-600">91.2%</span>
              </div>
              <div className="flex justify-between items-center text-[10px] font-bold">
                <span className="text-slate-500">Defect/Return Rate</span>
                <span className="text-rose-600">0.8%</span>
              </div>
            </div>
          </div>

          <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-5 space-y-3">
            <h4 className="text-xs font-bold text-indigo-900 uppercase tracking-wider">Accreditation Policy Shell</h4>
            <p className="text-[10px] text-indigo-800 leading-relaxed font-medium">
              Suppliers with a risk score of HIGH or an on-time rate below 70% for two consecutive quarters are automatically flagged for probation review.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VendorPerformancePage;
