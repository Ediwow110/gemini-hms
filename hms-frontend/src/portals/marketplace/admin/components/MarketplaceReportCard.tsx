import React from 'react';
import { BarChart3, Download } from 'lucide-react';

export const MarketplaceReportCard: React.FC<{ title: string; value: string; trend?: string }> = ({ title, value, trend }) => {
  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-4 shadow-sm hover:shadow-md transition-all">
      <div className="flex justify-between items-start">
        <div className="p-2.5 rounded-2xl border text-indigo-600 bg-indigo-50 border-indigo-100">
          <BarChart3 className="h-5 w-5" />
        </div>
        {trend && (
          <span className="text-[10px] font-black px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-600">
            {trend}
          </span>
        )}
      </div>
      <div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{title}</p>
        <p className="text-2xl font-black text-slate-900 tracking-tight">{value}</p>
      </div>
    </div>
  );
};

export const MarketplaceReportsPageShell: React.FC = () => {
  const reports = [
    { title: 'Sales Performance (Mock)', value: '₱18.2M GMV', trend: '+15.4%' },
    { title: 'RFQ Activity (Mock)', value: '47 Active RFQs', trend: '+8' },
    { title: 'Supplier Performance (Mock)', value: '94.2% Avg Score', trend: '+1.2%' },
    { title: 'Installation SLA (Mock)', value: '97.8% On-Time', trend: '+0.5%' },
    { title: 'Warranty Exposure (Mock)', value: '₱2.1M Reserve', trend: '-3.1%' },
    { title: 'Platform Revenue (Mock)', value: '₱845K', trend: '+8.3%' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-800 tracking-tight">Marketplace Reports</h2>
          <p className="text-xs text-slate-500 font-medium">Aggregated marketplace analytics and performance metrics</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-black text-slate-600 hover:bg-slate-50 transition-all">
          <Download className="h-4 w-4" /> Export Report (Shell)
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {reports.map((r) => (
          <MarketplaceReportCard key={r.title} title={r.title} value={r.value} trend={r.trend} />
        ))}
      </div>
    </div>
  );
};

export default MarketplaceReportCard;
