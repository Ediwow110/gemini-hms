import { useState } from "react";
import { PageHeader } from "../../components/ui/page-header";
import { ReasonModal } from "../../components/ui/approval-modals";
import { MetricCard } from "../../components/ui/metric-card";
import { Download, TrendingUp, CheckCircle2, Clock, Package } from "lucide-react";

const MOCK_EXCEPTIONS = [
  { id: "EX-001", severity: "High", msg: "Unpaid completed orders", count: 5, impact: "$250.00" },
  { id: "EX-002", severity: "Medium", msg: "Manual discounts applied", count: 12, impact: "$120.00" },
  { id: "EX-003", severity: "Critical", msg: "Cashier variance (short)", count: 1, impact: "$350.00" },
];

export const Reports = () => {
  const [showExport, setShowExport] = useState(false);

  return (
    <div className="space-y-6 pb-12">
      <div className="animate-fade-in">
        <PageHeader title="Reports & Analytics" description="Monitor financial, clinical, and operational performance." />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="animate-slide-up stagger-1">
          <MetricCard title="Sales" value="$4,250" icon={TrendingUp} color="emerald" />
        </div>
        <div className="animate-slide-up stagger-2">
          <MetricCard title="Payments" value="$3,100" icon={CheckCircle2} color="indigo" />
        </div>
        <div className="animate-slide-up stagger-3">
          <MetricCard title="Pending Lab" value="8" icon={Clock} color="rose" />
        </div>
        <div className="animate-slide-up stagger-4">
          <MetricCard title="Stock" value="120" icon={Package} color="amber" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in stagger-4">
        <div className="card p-6">
          <h2 className="font-bold text-slate-900 mb-4" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Exception Report Summary</h2>
          <div className="space-y-3">
            {MOCK_EXCEPTIONS.map(e => (
              <div key={e.id} className="flex justify-between items-center p-4 bg-slate-50/80 rounded-xl border border-slate-100 text-sm hover:bg-slate-100/80 transition-colors cursor-pointer group">
                <div className="space-y-0.5">
                  <p className="font-semibold text-slate-900 group-hover:text-indigo-700 transition-colors">{e.msg}</p>
                  <p className="text-xs text-slate-500">{e.count} occurrences</p>
                </div>
                <div className="flex items-center gap-4">
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase ${
                    e.severity === 'Critical' ? 'bg-rose-50 text-rose-700 border border-rose-200/60' : 'bg-amber-50 text-amber-700 border border-amber-200/60'
                  }`}>
                    {e.severity}
                  </span>
                  <span className="font-bold text-slate-900">{e.impact}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-6 flex flex-col">
          <h2 className="font-bold text-slate-900 mb-4" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Export Reports</h2>
          <p className="text-sm text-slate-500 mb-8">Use caution when exporting sensitive operational data. All exports are logged.</p>
          <div className="mt-auto">
            <button 
              onClick={() => setShowExport(true)} 
              className="btn btn-primary w-full flex items-center justify-center gap-2 py-3"
            >
              <Download className="h-4 w-4" />
              Export CSV Report
            </button>
          </div>
        </div>
      </div>

      <ReasonModal 
        isOpen={showExport} 
        title="Export Reports" 
        guidance="Explain why you are exporting this system data. This action will be recorded in the audit log." 
        onConfirm={() => setShowExport(false)} 
        onClose={() => setShowExport(false)} 
      />
    </div>
  );
};
