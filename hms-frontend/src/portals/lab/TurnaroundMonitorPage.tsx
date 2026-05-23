import { useState } from 'react';
import { PageHeader } from '../../components/ui/page-header';
import { TurnaroundTimeCard, TurnaroundTimeData } from './components/TurnaroundTimeCard';
import { 
  TrendingUp, 
  Clock, 
  AlertTriangle, 
  ShieldAlert, 
  BarChart3, 
  ClipboardList
} from 'lucide-react';

interface OverdueOrder {
  id: string;
  patientName: string;
  testName: string;
  status: string;
  elapsedMinutes: number;
  slaMinutes: number;
  urgency: 'Routine' | 'STAT';
}

const mockTatData: TurnaroundTimeData[] = [
  { testName: 'Complete Blood Count (CBC)', targetMinutes: 60, averageMinutes: 42, complianceRate: 0.982, totalTests: 45, overdueCount: 0 },
  { testName: 'Basic Metabolic Panel (BMP)', targetMinutes: 90, averageMinutes: 74, complianceRate: 0.941, totalTests: 28, overdueCount: 1 },
  { testName: 'Urinalysis (UA)', targetMinutes: 60, averageMinutes: 38, complianceRate: 0.975, totalTests: 40, overdueCount: 0 },
  { testName: 'Lipid Profile Panel', targetMinutes: 180, averageMinutes: 145, complianceRate: 0.912, totalTests: 15, overdueCount: 0 },
  { testName: 'Thyroid Screen (TSH/FT4)', targetMinutes: 120, averageMinutes: 88, complianceRate: 0.963, totalTests: 22, overdueCount: 0 }
];

const mockOverdueOrders: OverdueOrder[] = [
  {
    id: 'ORD-2026-908',
    patientName: 'Eleanor Vance',
    testName: 'Basic Metabolic Panel (BMP)',
    status: 'Received (Pending Entry)',
    elapsedMinutes: 98,
    slaMinutes: 90,
    urgency: 'STAT'
  },
  {
    id: 'ORD-2026-911',
    patientName: 'Renfield Fly',
    testName: 'Blood Toxicology Screen',
    status: 'Collected (In Transit)',
    elapsedMinutes: 145,
    slaMinutes: 180,
    urgency: 'Routine'
  }
];

export const TurnaroundMonitorPage = () => {
  const [tatStats] = useState<TurnaroundTimeData[]>(mockTatData);
  const [overdueOrders] = useState<OverdueOrder[]>(mockOverdueOrders);

  // Overall compliance rate computation
  const totalTestsCount = tatStats.reduce((sum, item) => sum + item.totalTests, 0);
  const compliantTestsCount = tatStats.reduce((sum, item) => sum + Math.round(item.totalTests * item.complianceRate), 0);
  const overallCompliance = totalTestsCount > 0 ? (compliantTestsCount / totalTestsCount) * 100 : 0;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <PageHeader 
          title="LIS Turnaround Time (TAT) & SLA Console" 
          description="Monitor diagnostic efficiency, track panel mean-time-to-release metrics, and inspect assays in warning or breach statuses." 
        />
        <div className="text-[10px] font-black uppercase text-indigo-700 bg-indigo-50 border border-indigo-150 px-3.5 py-1.5 rounded-xl select-none">
          QA Compliance Active
        </div>
      </div>

      {/* Grid: High-level TAT overview cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        <div className="card p-5 bg-white border border-slate-200/80 shadow-sm rounded-2xl flex items-center gap-4">
          <div className="p-3.5 bg-indigo-50 text-indigo-700 rounded-2xl border border-indigo-100">
            <TrendingUp className="h-6 w-6" />
          </div>
          <div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Global SLA Compliance</span>
            <span className="text-xl font-black text-slate-800">{overallCompliance.toFixed(1)}%</span>
            <p className="text-[9px] text-slate-400 font-semibold mt-0.5">Rolling 30-day window target: &gt;95%</p>
          </div>
        </div>

        <div className="card p-5 bg-white border border-slate-200/80 shadow-sm rounded-2xl flex items-center gap-4">
          <div className="p-3.5 bg-blue-50 text-blue-700 rounded-2xl border border-blue-100">
            <Clock className="h-6 w-6" />
          </div>
          <div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Total Audited Assays</span>
            <span className="text-xl font-black text-slate-800">{totalTestsCount}</span>
            <p className="text-[9px] text-slate-400 font-semibold mt-0.5">Average panel TAT: 58.2 mins</p>
          </div>
        </div>

        <div className="card p-5 bg-rose-50 border border-rose-150 shadow-sm rounded-2xl flex items-center gap-4 animate-pulse">
          <div className="p-3.5 bg-rose-100 text-rose-700 rounded-2xl border border-rose-200">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <div>
            <span className="text-[10px] font-black text-rose-800 uppercase tracking-wider block">SLA Breaches / Warning</span>
            <span className="text-xl font-black text-rose-900">
              {overdueOrders.filter(x => x.elapsedMinutes >= x.slaMinutes).length} active
            </span>
            <p className="text-[9px] text-rose-750 font-semibold mt-0.5">Requires immediate encoder triage</p>
          </div>
        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Columns: SLA Metrics by Panel */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-xs font-bold text-slate-850 uppercase tracking-wider flex items-center gap-2">
            <BarChart3 className="h-4.5 w-4.5 text-indigo-500" />
            SLA Performance by Assay Panel
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tatStats.map((stat, idx) => (
              <TurnaroundTimeCard key={idx} data={stat} />
            ))}
          </div>
        </div>

        {/* Right Column: Danger Queue (Overdue / Warnings) */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-slate-850 uppercase tracking-wider flex items-center gap-2">
            <AlertTriangle className="h-4.5 w-4.5 text-rose-500 animate-pulse" />
            Warning & Breach Queue
          </h3>

          <div className="card p-5 bg-white border border-slate-200/80 shadow-sm rounded-2xl space-y-4">
            {overdueOrders.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs font-semibold">
                No orders in warning status.
              </div>
            ) : (
              overdueOrders.map((o) => {
                const isBreached = o.elapsedMinutes >= o.slaMinutes;
                
                return (
                  <div 
                    key={o.id} 
                    className={`p-3.5 rounded-xl border space-y-2 text-xs font-semibold ${
                      isBreached 
                        ? 'bg-rose-50/30 border-rose-200 text-rose-900' 
                        : 'bg-amber-50/20 border-amber-200 text-amber-900'
                    }`}
                  >
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <span className="font-mono text-[9px] font-black uppercase text-slate-400 block">{o.id}</span>
                        <h4 className="font-black text-slate-800 text-sm mt-0.5">{o.patientName}</h4>
                      </div>
                      
                      <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${
                        isBreached ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'
                      }`}>
                        {isBreached ? 'Breached' : 'Warning'}
                      </span>
                    </div>

                    <p className="text-slate-600 font-bold">{o.testName}</p>
                    <p className="text-[10px] text-slate-400 font-medium">Status: {o.status}</p>

                    <div className="flex justify-between items-center border-t border-slate-100/60 pt-2 text-[10px] text-slate-400 font-bold uppercase">
                      <span>Limit: {o.slaMinutes} min</span>
                      <span className={`font-black flex items-center gap-1 ${isBreached ? 'text-rose-600' : 'text-amber-600'}`}>
                        <Clock className="h-3.5 w-3.5" /> Elapsed: {o.elapsedMinutes} min
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200/60 rounded-2xl flex gap-3 text-xs text-slate-600 font-semibold leading-relaxed">
            <ClipboardList className="h-5 w-5 text-indigo-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-bold text-slate-700">Audit Protocol Warning</p>
              <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                Breaches of laboratory SLA triggers automated QA incident logging. Ensure redrawn specimen collections are routed with highest priority.
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default TurnaroundMonitorPage;
