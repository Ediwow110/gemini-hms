import React, { useState } from 'react';
import { PageHeader } from '../../components/ui/page-header';
import { BarChart3, AlertTriangle, Download, Activity, RefreshCw, Info } from 'lucide-react';

export const ReportsAnalyticsPage: React.FC = () => {
  const [showToast, setShowToast] = useState(false);
  const mockMetrics = [
    { label: "Total Transactions (24h)", value: "1,420 Txns", rate: "+4.2% vs yesterday" },
    { label: "SLA Availability", value: "99.98%", rate: "Meets Enterprise target" },
    { label: "SMTP Queue Delivery", value: "482 Sent", rate: "0 failed in relay" },
    { label: "DB Index Fragmentation", value: "2.18%", rate: "Within optimal bounds" }
  ];

  const handleExport = () => {
    setShowToast(true);
    setTimeout(() => {
      setShowToast(false);
    }, 4000);
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Sandbox Warning Banner */}
      <div className="p-4 bg-amber-50 border border-amber-150 rounded-2xl flex gap-3 text-xs text-amber-800">
        <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
        <div>
          <h5 className="font-extrabold uppercase text-[10px] tracking-wider">UI Analytics Sandbox Shell</h5>
          <p className="font-medium mt-0.5">
            This module generates simulated performance reports and database indexes inside local sandbox memory. No operational metrics are extracted from live server logs.
          </p>
        </div>
      </div>

      {showToast && (
        <div className="p-4 bg-amber-50 border border-amber-250 rounded-2xl flex gap-3 text-xs text-amber-800 animate-scale-in">
          <Info className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5 animate-pulse" />
          <div>
            <h5 className="font-extrabold uppercase text-[10px] tracking-wider">UI Demonstration Sandbox</h5>
            <p className="font-medium mt-0.5">
              Export Operations Summary requested. Generating simulated report bundle in-memory... Export flows are simulated in the sandbox interface and no downloads are processed.
            </p>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <PageHeader 
          title="System Reports & Performance Analytics" 
          description="Analyze system workloads, regional database growth, and mail relay delivery pipelines." 
        />
        <button 
          onClick={handleExport}
          className="btn btn-primary bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-2 px-4 rounded-xl flex items-center gap-1.5 w-fit cursor-pointer"
        >
          <Download className="h-4 w-4" /> Export Operations Summary
        </button>
      </div>

      {/* Grid: KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {mockMetrics.map((m, i) => (
          <div key={i} className="card p-4 bg-white border border-slate-200/80 shadow-sm rounded-2xl">
            <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1">{m.label}</p>
            <p className="text-xl font-black text-slate-800">{m.value}</p>
            <p className="text-[9px] text-emerald-600 font-bold mt-1 flex items-center gap-0.5">
              <Activity className="h-3 w-3" /> {m.rate}
            </p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Database Size & Growth Breakdown */}
        <div className="lg:col-span-2 space-y-6">
          <div className="card p-5 bg-white border border-slate-200/80 shadow-sm rounded-2xl space-y-4">
            <h3 className="font-bold text-slate-800 text-sm tracking-wider uppercase border-b border-slate-100 pb-3 flex items-center gap-2">
              <BarChart3 className="h-4.5 w-4.5 text-indigo-500" />
              Tenant Resource Allocation Breakdowns
            </h3>

            <div className="space-y-3.5 text-xs">
              <div>
                <div className="flex justify-between text-slate-500 font-bold mb-1">
                  <span>St. Jude Hospital Network (Primary Cluster)</span>
                  <span>42.5 GB / 100 GB Allocated</span>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-600 rounded-full" style={{ width: '42.5%' }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-slate-500 font-bold mb-1">
                  <span>MediClinics Group (Secondary Cluster)</span>
                  <span>12.8 GB / 50 GB Allocated</span>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-500 rounded-full" style={{ width: '25.6%' }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-slate-500 font-bold mb-1">
                  <span>Apex Healthcare Services</span>
                  <span>4.2 GB / 20 GB Allocated</span>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-slate-500 rounded-full" style={{ width: '21%' }} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Active Jobs list */}
        <div className="space-y-6">
          <div className="card p-5 bg-white border border-slate-200/80 shadow-sm rounded-2xl space-y-4">
            <h3 className="font-bold text-slate-800 text-sm tracking-wider uppercase border-b border-slate-100 pb-3 flex items-center gap-2">
              <RefreshCw className="h-4.5 w-4.5 text-indigo-500" />
              Background Task Telemetry
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between items-center p-2.5 bg-slate-50 border border-slate-100 rounded-xl">
                <div>
                  <p className="font-bold text-slate-800">patient_index_refresh</p>
                  <p className="text-[9px] text-slate-400 mt-0.5">Frequency: every 5 minutes</p>
                </div>
                <span className="text-[10px] bg-emerald-50 border border-emerald-100 text-emerald-700 font-extrabold px-1.5 py-0.5 rounded-md">
                  STABLE
                </span>
              </div>

              <div className="flex justify-between items-center p-2.5 bg-slate-50 border border-slate-100 rounded-xl">
                <div>
                  <p className="font-bold text-slate-800">hmo_claims_reconciliation</p>
                  <p className="text-[9px] text-slate-400 mt-0.5">Frequency: every 24 hours</p>
                </div>
                <span className="text-[10px] bg-emerald-50 border border-emerald-100 text-emerald-700 font-extrabold px-1.5 py-0.5 rounded-md">
                  STABLE
                </span>
              </div>

              <div className="flex justify-between items-center p-2.5 bg-slate-50 border border-slate-100 rounded-xl">
                <div>
                  <p className="font-bold text-slate-800">audit_integrity_check</p>
                  <p className="text-[9px] text-slate-400 mt-0.5">Frequency: hourly validation</p>
                </div>
                <span className="text-[10px] bg-emerald-50 border border-emerald-100 text-emerald-700 font-extrabold px-1.5 py-0.5 rounded-md">
                  STABLE
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default ReportsAnalyticsPage;
