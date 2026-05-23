import { useNavigate } from 'react-router-dom';
import { 
  Activity, 
  Users, 
  FlaskConical, 
  CheckSquare, 
  ChevronRight, 
  ClipboardList, 
  UserPlus, 
  AlertOctagon, 
  AlertTriangle,
  ArrowRight,
  Heart
} from 'lucide-react';
import { PageHeader } from '../../components/ui/page-header';
import { TriagePriorityBadge, TriagePriorityLevel } from './components/TriagePriorityBadge';
import { useClinicalDashboardSummary, useClinicalWorkQueue } from '../../hooks/use-clinical-workflow';
import { format } from 'date-fns';
import axios from 'axios';

const mapCategoryToPriority = (category?: string): TriagePriorityLevel => {
  if (category === 'EMERGENCY') return 2;
  if (category === 'PRIORITY') return 3;
  return 4;
};

export const NurseDashboard = () => {
  const navigate = useNavigate();

  const { data: summary, isLoading: isSummaryLoading, error: summaryError } = useClinicalDashboardSummary();
  const { data: queueData, isLoading: isQueueLoading, error: queueError } = useClinicalWorkQueue();

  const isLoading = isSummaryLoading || isQueueLoading;
  const errorObj = summaryError || queueError;

  if (errorObj) {
    const isForbidden = axios.isAxiosError(errorObj) && (errorObj.response?.status === 403 || errorObj.response?.status === 401);
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
            ? 'You do not have permission to view the nursing dashboard. Please contact your administrator if you believe this is an error.' 
            : 'Failed to connect to the clinical service. Please check your network connection or try again later.'}
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-8 text-center space-y-4 animate-fade-in">
        <div className="animate-spin mx-auto w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full" />
        <p className="text-slate-500 font-medium tracking-wide animate-pulse">Loading nursing dashboard...</p>
      </div>
    );
  }

  // Derived metrics from summary and queue
  const metrics = [
    { label: 'Patients for Triage', count: summary?.pendingTriage ?? 0, icon: Users, color: 'text-blue-600 bg-blue-50 border-blue-100' },
    { label: 'Waiting for Vitals', count: summary?.pendingTriage ?? 0, icon: Activity, color: 'text-indigo-600 bg-indigo-50 border-indigo-100' },
    { label: 'Critical Vitals Alerts', count: 0, icon: AlertOctagon, color: 'text-rose-600 bg-rose-50 border-rose-100' },
    { label: 'Specimens to Collect', count: queueData?.filter(q => q.serviceType === 'LABORATORY' && q.status !== 'COMPLETED').length ?? 0, icon: FlaskConical, color: 'text-violet-600 bg-violet-50 border-violet-100' },
    { label: 'Pending Nursing Tasks', count: summary?.activePatients ?? 0, icon: CheckSquare, color: 'text-amber-600 bg-amber-50 border-amber-100' },
    { label: 'Patients Ready for Doctor', count: summary?.waitingForDoctor ?? 0, icon: Heart, color: 'text-emerald-600 bg-emerald-50 border-emerald-100' },
  ];

  // Map live queue data for triage (patients with serviceType RECEPTION/CASHIER/DOCTOR or generally the active queue)
  const triageQueue = queueData 
    ? queueData
        .filter(item => item.status !== 'COMPLETED' && item.status !== 'CANCELLED')
        .slice(0, 5)
        .map(item => ({
          id: item.id,
          patientId: item.patientId,
          name: item.patientName || '[REDACTED]',
          time: item.timestamp ? format(new Date(item.timestamp), 'hh:mm a') : 'N/A',
          reason: item.category === 'EMERGENCY' ? 'Emergency medical evaluation needed' : 'Clinical evaluation triage',
          priority: mapCategoryToPriority(item.category),
        }))
    : [];

  const vitalsAlerts: Array<{ id: string; name: string; alert: string; time: string }> = [];


  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Sandbox Warning Banner */}
      <div className="p-4 bg-amber-50 border border-amber-150 rounded-2xl flex gap-3 text-xs text-amber-800">
        <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
        <div>
          <h5 className="font-extrabold uppercase text-[10px] tracking-wider">UI Demonstration Sandbox Shell</h5>
          <p className="font-medium mt-0.5">
            This nursing operations workspace runs in local sandbox memory. Patient intake forms, triage scores, vitals logging, and specimen status updates simulate local state only. No real patient data is persisted, and no clinical dispatch occurs.
          </p>
        </div>
      </div>

      <div className="flex justify-between items-center">
        <PageHeader 
          title="Nursing Operations Hub" 
          description="Nurse portal workspace for patient check-in, triage logging, vital signs monitoring, and specimen routing." 
        />
        
        <div className="flex gap-2">
          <button 
            onClick={() => navigate('/nurse/intake')}
            className="btn btn-primary bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-1.5 text-xs py-2 px-4"
          >
            <UserPlus className="h-4 w-4" /> Patient Intake
          </button>
        </div>
      </div>

      {/* Grid: High-level KPI summary */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        {metrics.map((m, index) => {
          const Icon = m.icon;
          return (
            <div key={index} className="card p-4 flex flex-col justify-between gap-4 bg-white border border-slate-200/80 shadow-sm rounded-2xl">
              <div className="flex items-center justify-between">
                <div className={`p-2.5 rounded-xl border ${m.color}`}>
                  <Icon className="h-4.5 w-4.5" />
                </div>
                <span className="text-lg font-black text-slate-800">{m.count}</span>
              </div>
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 leading-tight">{m.label}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Triage & Queue */}
        <div className="lg:col-span-2 space-y-6">
          {/* Triage Queue List */}
          <div className="card p-5 bg-white border border-slate-200/80 shadow-sm space-y-4 rounded-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-800 text-sm tracking-wider uppercase flex items-center gap-2">
                <ClipboardList className="h-4 w-4 text-indigo-500" />
                Urgent Triage Queue
              </h3>
              <button 
                onClick={() => navigate('/nurse/triage')}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-0.5"
              >
                Full Triage Queue <ChevronRight className="h-4.5 w-4.5" />
              </button>
            </div>

            <div className="divide-y divide-slate-100">
              {triageQueue.length === 0 ? (
                <div className="py-8 text-center text-slate-400 font-medium text-xs">No active patients in triage queue.</div>
              ) : (
                triageQueue.map((item) => (
                  <div key={item.id} className="py-3.5 flex items-center justify-between gap-3 text-xs">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-800">{item.name}</span>
                        <span className="text-[10px] text-slate-400 font-semibold">{item.time}</span>
                      </div>
                      <p className="text-[11px] text-slate-500 font-medium">{item.reason}</p>
                    </div>

                    <div className="flex items-center gap-3">
                      <TriagePriorityBadge level={item.priority} showIcon={false} />
                      <button
                        onClick={() => navigate(`/nurse/triage?patientId=${item.patientId}`)}
                        className="btn border border-slate-200 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 px-3 py-1.5 text-[11px] font-extrabold rounded-xl shadow-sm transition-all"
                      >
                        Start Triage
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Vitals Alerts & Quick Links */}
        <div className="space-y-6">
          {/* Critical Alerts */}
          <div className="card p-5 bg-rose-50/50 border border-rose-100/80 shadow-sm space-y-4 rounded-2xl">
            <div className="flex items-center justify-between border-b border-rose-100 pb-3">
              <h3 className="font-bold text-rose-800 text-sm tracking-wider uppercase flex items-center gap-2">
                <AlertOctagon className="h-4 w-4 text-rose-600 animate-pulse" />
                Vitals Alert Panel
              </h3>
              <span className="bg-rose-100 text-rose-700 text-[9px] font-black px-2 py-0.5 rounded-full">
                2 Alerts
              </span>
            </div>

            <div className="space-y-3">
              {vitalsAlerts.map((alert) => (
                <div key={alert.id} className="p-3.5 bg-white border border-rose-200/60 rounded-xl space-y-2 text-xs">
                  <div className="flex justify-between items-start">
                    <span className="font-bold text-slate-900">{alert.name}</span>
                    <span className="text-[10px] text-slate-400">{alert.time}</span>
                  </div>
                  <p className="text-rose-700 font-bold bg-rose-50/50 px-2 py-1 rounded-lg border border-rose-100/50">
                    {alert.alert}
                  </p>
                  <button 
                    onClick={() => navigate('/nurse/vitals')}
                    className="w-full text-center bg-rose-50 hover:bg-rose-100 text-rose-700 font-extrabold py-1.5 rounded-lg border border-rose-100 transition-colors"
                  >
                    Open Vitals Sheet
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="card p-5 bg-white border border-slate-200/80 shadow-sm space-y-4 rounded-2xl">
            <h3 className="font-bold text-slate-800 text-sm tracking-wider uppercase border-b border-slate-100 pb-3">
              Quick Navigations
            </h3>

            <div className="grid grid-cols-1 gap-2.5">
              <button 
                onClick={() => navigate('/nurse/vitals')}
                className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100 border border-slate-200/60 rounded-2xl text-left text-xs font-semibold text-slate-700 group transition-all"
              >
                <span className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-indigo-500" />
                  Record Patient Vitals
                </span>
                <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-indigo-600 transition-all group-hover:translate-x-1" />
              </button>

              <button 
                onClick={() => navigate('/nurse/tasks')}
                className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100 border border-slate-200/60 rounded-2xl text-left text-xs font-semibold text-slate-700 group transition-all"
              >
                <span className="flex items-center gap-2">
                  <CheckSquare className="h-4 w-4 text-indigo-500" />
                  Nursing Worklist Board
                </span>
                <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-indigo-600 transition-all group-hover:translate-x-1" />
              </button>

              <button 
                onClick={() => navigate('/nurse/specimens')}
                className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100 border border-slate-200/60 rounded-2xl text-left text-xs font-semibold text-slate-700 group transition-all"
              >
                <span className="flex items-center gap-2">
                  <FlaskConical className="h-4 w-4 text-indigo-500" />
                  Specimen Collection Desk
                </span>
                <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-indigo-600 transition-all group-hover:translate-x-1" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NurseDashboard;
