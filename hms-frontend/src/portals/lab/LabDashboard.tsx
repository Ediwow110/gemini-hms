import { useNavigate } from 'react-router-dom';
import { 
  FileText, 
  FlaskConical, 
  CheckSquare, 
  FileCheck2, 
  ShieldAlert, 
  AlertTriangle,
  Send, 
  Inbox,
  ArrowRight,
  TrendingUp
} from 'lucide-react';
import { PageHeader } from '../../components/ui/page-header';
import { SpecimenWorkQueue, SpecimenItem } from './components/SpecimenWorkQueue';
import { CriticalResultPanel, CriticalResultItem } from './components/CriticalResultPanel';
import { TurnaroundTimeCard, TurnaroundTimeData } from './components/TurnaroundTimeCard';
import { useClinicalWorkQueue } from '../../hooks/use-clinical-workflow';
import { format } from 'date-fns';
import axios from 'axios';
import { LabStatus } from './components/LabStatusBadge';

export const LabDashboard = () => {
  const navigate = useNavigate();

  const { data: queueData, isLoading, error } = useClinicalWorkQueue();

  // Mock critical results for UI layout testing only
  const criticals: CriticalResultItem[] = [
    {
      id: 'CRIT-01',
      patientName: 'Arthur Pendleton',
      mrn: 'MRN-2026-0042',
      testName: 'Serum Chemistry',
      parameterName: 'Potassium (K+)',
      value: '6.2 mEq/L (Critical High)',
      refRange: '3.5 - 5.1 mEq/L',
      physicianName: 'Dr. Victor Frankenstein',
      physicianPhone: '555-0199',
      reportedAt: '15 mins ago',
      isNotified: false
    }
  ];

  // Metrics derived from active laboratory worklist queue
  const labQueue = queueData?.filter(item => item.serviceType === 'LABORATORY') || [];

  const metrics = [
    { label: 'New LIS Orders', count: labQueue.filter(q => q.status === 'WAITING').length, icon: Inbox, color: 'text-blue-600 bg-blue-50 border-blue-105' },
    { label: 'Specimens Collected', count: labQueue.filter(q => q.status === 'CALLING').length, icon: FlaskConical, color: 'text-amber-600 bg-amber-50 border-amber-105' },
    { label: 'Specimens Received', count: labQueue.filter(q => q.status === 'SERVING').length, icon: CheckSquare, color: 'text-violet-600 bg-violet-50 border-violet-105' },
    { label: 'Results for Encoding', count: labQueue.filter(q => q.status === 'SERVING').length, icon: FileText, color: 'text-indigo-600 bg-indigo-50 border-indigo-105' },
    { label: 'Results for Validation', count: 0, icon: FileCheck2, color: 'text-amber-600 bg-amber-50 border-amber-105' },
    { label: 'Critical Results', count: criticals.filter(c => !c.isNotified).length, icon: ShieldAlert, color: 'text-rose-600 bg-rose-50 border-rose-105' },
    { label: 'Released Today', count: labQueue.filter(q => q.status === 'COMPLETED').length, icon: Send, color: 'text-emerald-600 bg-emerald-50 border-emerald-105' },
  ];

  // Map queueData to SpecimenItems for SpecimenWorkQueue
  const specimens: SpecimenItem[] = labQueue.map(item => {
    let mappedStatus: LabStatus = 'Ordered';
    if (item.status === 'WAITING') mappedStatus = 'Ordered';
    else if (item.status === 'CALLING') mappedStatus = 'Collected';
    else if (item.status === 'SERVING') mappedStatus = 'Received';
    else if (item.status === 'COMPLETED') mappedStatus = 'Released';

    return {
      id: item.id,
      patientName: item.patientName || '[REDACTED]',
      mrn: item.patientNumber,
      specimenType: 'Whole Blood (Default)',
      container: 'Lavender Top (EDTA) (Default)',
      testName: 'Complete Blood Count (CBC) (Default)',
      collectedTime: item.timestamp ? format(new Date(item.timestamp), 'hh:mm a') : 'N/A',
      status: mappedStatus,
      urgency: item.category === 'EMERGENCY' ? 'STAT' : 'Routine'
    };
  });

  // Mock turnaround statistics for UI layout testing only
  const tatMetrics: TurnaroundTimeData[] = [
    { testName: 'Complete Blood Count (CBC)', targetMinutes: 60, averageMinutes: 42, complianceRate: 0.982, totalTests: 45, overdueCount: 0 },
    { testName: 'Basic Metabolic Panel (BMP)', targetMinutes: 90, averageMinutes: 74, complianceRate: 0.941, totalTests: 28, overdueCount: 1 },
  ];

  if (error) {
    const isForbidden = axios.isAxiosError(error) && (error.response?.status === 403 || error.response?.status === 401);
    return (
      <div className="p-8 text-center space-y-4 animate-fade-in">
        <div className="mx-auto w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center">
          <AlertTriangle className="h-8 w-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-800">
          {isForbidden ? 'Access Restricted' : 'Connection Error'}
        </h2>
        <p className="text-slate-500 max-w-md mx-auto">
          {isForbidden 
            ? 'You do not have permission to view the laboratory dashboard. Please contact your administrator if you believe this is an error.' 
            : 'Failed to connect to the clinical service. Please check your network connection or try again later.'}
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-8 text-center space-y-4 animate-fade-in">
        <div className="animate-spin mx-auto w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full" />
        <p className="text-slate-500 font-medium tracking-wide animate-pulse">Loading LIS Dashboard...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Mock/WIP Warning Banner */}
      <div className="p-4 bg-amber-50 border border-amber-150 rounded-2xl flex gap-3 text-xs text-amber-800">
        <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
        <div>
          <h5 className="font-extrabold uppercase text-[10px] tracking-wider">Laboratory Information System (WIP/Mock)</h5>
          <p className="font-medium mt-0.5">
            This LIS laboratory workspace runs in local sandbox memory. Specimen tracking, result entries, QA validation checks, and release workflows simulate local state only. No clinical lab values are written to production databases or released to actual patient records.
          </p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <PageHeader 
          title="Laboratory Information System (LIS)" 
          description="Lab technician workspace for tracking specimens, encoding diagnostics, validating assays, and releasing critical clinical results." 
        />
        
        <div className="text-[10px] font-extrabold text-indigo-700 bg-indigo-50 border border-indigo-150 px-3.5 py-1.5 rounded-xl uppercase tracking-wider select-none">
          Demo Mode: Working with simulated LIS records
        </div>
      </div>

      {/* Grid: High-level KPI summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        {metrics.map((m, index) => {
          const Icon = m.icon;
          return (
            <div key={index} className="card p-4 flex flex-col justify-between gap-4 bg-white border border-slate-200/80 shadow-sm rounded-2xl">
              <div className="flex items-center justify-between">
                <div className={`p-2 rounded-xl border ${m.color}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <span className="text-lg font-black text-slate-800">{m.count}</span>
              </div>
              <p className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400 leading-tight">{m.label}</p>
            </div>
          );
        })}
      </div>

      {/* Grid Layout: Main queue, alerts, and quick actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Columns: Specimen Worklist & Critical Alerts */}
        <div className="lg:col-span-2 space-y-6">
          <SpecimenWorkQueue specimens={specimens} limit={3} />
          
          <CriticalResultPanel 
            items={criticals} 
            onAcknowledge={() => {}} // Mock acknowledgment
          />
        </div>

        {/* Right Column: Turnaround time & Quick Actions */}
        <div className="space-y-6">
          {/* Quick Actions Panel */}
          <div className="card p-5 bg-white border border-slate-200/80 shadow-sm space-y-4 rounded-2xl">
            <h3 className="font-bold text-slate-800 text-sm tracking-wider uppercase border-b border-slate-100 pb-3">
              Laboratory Actions
            </h3>

            <div className="grid grid-cols-1 gap-2.5">
              <button 
                onClick={() => navigate('/lab/orders')}
                className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100 border border-slate-200/60 rounded-2xl text-left text-xs font-semibold text-slate-700 group transition-all"
              >
                <span className="flex items-center gap-2">
                  <Inbox className="h-4 w-4 text-indigo-500" />
                  View Lab Orders Queue
                </span>
                <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-indigo-600 transition-all group-hover:translate-x-1" />
              </button>

              <button 
                onClick={() => navigate('/lab/specimens')}
                className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100 border border-slate-200/60 rounded-2xl text-left text-xs font-semibold text-slate-700 group transition-all"
              >
                <span className="flex items-center gap-2">
                  <FlaskConical className="h-4 w-4 text-indigo-500" />
                  Specimen Receiving Desk
                </span>
                <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-indigo-600 transition-all group-hover:translate-x-1" />
              </button>

              <button 
                onClick={() => navigate('/lab/encoding')}
                className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100 border border-slate-200/60 rounded-2xl text-left text-xs font-semibold text-slate-700 group transition-all"
              >
                <span className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-indigo-500" />
                  Result Entry & Encoding
                </span>
                <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-indigo-600 transition-all group-hover:translate-x-1" />
              </button>

              <button 
                onClick={() => navigate('/lab/validation')}
                className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100 border border-slate-200/60 rounded-2xl text-left text-xs font-semibold text-slate-700 group transition-all"
              >
                <span className="flex items-center gap-2">
                  <FileCheck2 className="h-4 w-4 text-indigo-500" />
                  Verification & Validation
                </span>
                <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-indigo-600 transition-all group-hover:translate-x-1" />
              </button>

              <button 
                onClick={() => navigate('/lab/release')}
                className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100 border border-slate-200/60 rounded-2xl text-left text-xs font-semibold text-slate-700 group transition-all"
              >
                <span className="flex items-center gap-2">
                  <Send className="h-4 w-4 text-indigo-500" />
                  Release Final Results
                </span>
                <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-indigo-600 transition-all group-hover:translate-x-1" />
              </button>
            </div>
          </div>

          {/* Turnaround time widget */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-800 text-xs tracking-wider uppercase flex items-center gap-1.5">
                <TrendingUp className="h-4 w-4 text-indigo-500" />
                TAT SLA compliance
              </h3>
              <button
                onClick={() => navigate('/lab/turnaround')}
                className="text-[10px] font-bold text-indigo-600 hover:text-indigo-700"
              >
                Details
              </button>
            </div>

            <div className="space-y-3.5">
              {tatMetrics.map((tat, idx) => (
                <TurnaroundTimeCard key={idx} data={tat} />
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default LabDashboard;
