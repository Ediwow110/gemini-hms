import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  Activity, 
  FileText, 
  FlaskConical, 
  AlertOctagon, 
  AlertTriangle,
  Play, 
  ListOrdered, 
  Calendar, 
  FilePlus, 
  ChevronRight
} from 'lucide-react';
import { PageHeader } from '../../components/ui/page-header';
import { AnalyticsMetricCard, InsightPanel } from '../../components/analytics';
import { doctorWorklistMetrics } from '../../data/analytics/clinicalAnalytics.mock';
import { useClinicalDashboardSummary, useClinicalWorkQueue } from '../../hooks/use-clinical-workflow';
import { format } from 'date-fns';
import axios from 'axios';

export const DoctorDashboard = () => {
  const navigate = useNavigate();

  const { data: summary, isLoading: isSummaryLoading, error: summaryError } = useClinicalDashboardSummary();
  const { data: queueData, isLoading: isQueueLoading, error: queueError } = useClinicalWorkQueue();

  const metrics = summary ? [
    { ...doctorWorklistMetrics[0], value: summary.waitingForDoctor, title: 'Assigned Patients Today', description: 'Waiting for doctor from live summary' },
    { title: 'Active Encounters', value: summary.activePatients, icon: Activity, description: 'Patients currently in encounter', severity: 'info' as const, href: '/doctor/queue' },
    { title: 'Pending Triage', value: summary.pendingTriage, icon: FileText, description: 'Awaiting nursing intake', severity: 'warning' as const },
    { title: 'Pending Lab Results', value: summary.pendingLabResults, icon: FlaskConical, description: 'Results to follow up', severity: 'info' as const, href: '/doctor/emr' },
  ] : [];

  // Mock critical results for UI layout testing only
  const criticalResults = [
    { id: 'CRIT-01', patient: 'Arthur Pendleton', test: 'Serum Potassium', value: '6.2 mEq/L (Critical High)', time: '20 mins ago' },
  ];

  // Mock schedule for UI layout testing only
  const schedule = [
    { time: '12:00 PM', event: 'Department Clinical Meeting' },
    { time: '02:00 PM', event: 'Telehealth Consult: Patient Robert Walton' },
    { time: '04:00 PM', event: 'Ward Round - Room 304' },
  ];

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
            ? 'You do not have permission to view the clinical dashboard. Please contact your administrator if you believe this is an error.' 
            : 'Failed to connect to the clinical service. Please check your network connection or try again later.'}
        </p>
      </div>
    );
  }


  if (isLoading) {
    return (
      <div className="p-8 text-center space-y-4 animate-fade-in">
        <div className="animate-spin mx-auto w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full" />
        <p className="text-slate-500 font-medium tracking-wide animate-pulse">Loading clinical dashboard...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Mock/WIP Warning Banner */}
      <div className="p-4 bg-amber-50 border border-amber-150 rounded-2xl flex gap-3 text-xs text-amber-800">
        <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
        <div>
          <h5 className="font-extrabold uppercase text-[10px] tracking-wider">Doctor Dashboard (WIP/Mock)</h5>
          <p className="font-medium mt-0.5">
            The dashboard widgets (Critical Alerts, Schedule) are currently running in demo mode with simulated data. Real physician scheduling and critical notification integration is not yet active.
          </p>
        </div>
      </div>

      <div className="flex justify-between items-center">
        <PageHeader 
          title="Clinical Command Center" 
          description="Doctor portal dashboard for patient schedules, medical queues, and safety alerts." 
        />
        
        <div className="flex gap-2">
          <button 
            onClick={() => navigate('/doctor/queue')}
            className="btn btn-primary bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-1.5 text-xs py-2 px-4"
          >
            <Play className="h-4 w-4" /> Start Clinic Day
          </button>
        </div>
      </div>

      {/* Grid: High-level KPI summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((m) => <AnalyticsMetricCard key={m.title} {...m} />)}
      </div>

      <InsightPanel insights={[{ title: 'Worklist-first dashboard', description: 'Clinical users see queue, critical results, notes, and orders before executive analytics to avoid cognitive overload.', severity: 'info', actionLabel: 'Open Queue', actionTo: '/doctor/queue' }]} title="Clinical worklist guidance" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Queue & Schedule */}
        <div className="lg:col-span-2 space-y-6">
          {/* Active Queue List */}
          <div className="card p-5 bg-white border border-slate-200/80 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-800 text-sm tracking-wider uppercase flex items-center gap-2">
                <ListOrdered className="h-4 w-4 text-indigo-500" />
                My Active Patient Queue
              </h3>
              <button 
                onClick={() => navigate('/doctor/queue')}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-0.5"
              >
                Full Queue <ChevronRight className="h-4.5 w-4.5" />
              </button>
            </div>

            <div className="divide-y divide-slate-100">
              {queueData?.length === 0 ? (
                <div className="py-8 text-center text-slate-400 font-medium text-xs">No active patients in your queue.</div>
              ) : (
                queueData?.slice(0, 5).map((item) => (
                  <div key={item.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-800">{item.patientName || '[REDACTED]'}</span>
                        <span className="text-[10px] text-slate-400 font-semibold">
                          {item.timestamp ? format(new Date(item.timestamp), 'hh:mm a') : 'N/A'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">{item.category} Priority</p>
                    </div>
  
                    <div className="flex items-center gap-2">
                      <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-md border ${
                        item.status === 'SERVING'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                          : 'bg-amber-50 text-amber-700 border-amber-100'
                      }`}>
                        {item.status}
                      </span>
                      <button
                        onClick={() => navigate(`/doctor/emr?patientId=${item.patientId}`)}
                        className="btn border border-slate-200 hover:bg-slate-50 text-slate-600 px-2.5 py-1 text-[11px] font-bold rounded-lg shadow-sm"
                      >
                        Chart
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Schedule */}
          <div className="card p-5 bg-white border border-slate-200/80 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-800 text-sm tracking-wider uppercase flex items-center gap-2">
                <Calendar className="h-4 w-4 text-indigo-500" />
                My Schedule Today
              </h3>
            </div>

            <div className="space-y-3">
              {schedule.map((sch, i) => (
                <div key={i} className="flex gap-4 items-start text-xs">
                  <span className="font-mono text-indigo-600 font-bold w-16">{sch.time}</span>
                  <div className="flex-1 bg-slate-50 border border-slate-100 p-2.5 rounded-xl text-slate-700 font-medium">
                    {sch.event}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Alerts & Quick Actions */}
        <div className="space-y-6">
          {/* Critical Alerts */}
          <div className="card p-5 bg-rose-50/50 border border-rose-100/80 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-rose-100 pb-3">
              <h3 className="font-bold text-rose-800 text-sm tracking-wider uppercase flex items-center gap-2">
                <AlertOctagon className="h-4 w-4 text-rose-600 animate-pulse" />
                Critical Results Alert
              </h3>
              <span className="bg-rose-100 text-rose-700 text-[9px] font-black px-2 py-0.5 rounded-full">
                1 Alert
              </span>
            </div>

            <div className="space-y-3">
              {criticalResults.map((alert) => (
                <div key={alert.id} className="p-3 bg-white border border-rose-200/60 rounded-xl space-y-2 text-xs">
                  <div className="flex justify-between items-start">
                    <span className="font-bold text-slate-900">{alert.patient}</span>
                    <span className="text-[10px] text-slate-400">{alert.time}</span>
                  </div>
                  <p className="text-slate-600">
                    Released: <strong className="text-rose-700">{alert.value}</strong> for {alert.test}.
                  </p>
                  <button 
                    onClick={() => navigate(`/doctor/emr?patientId=P-102`)}
                    className="w-full text-center bg-rose-50 hover:bg-rose-100 text-rose-700 font-extrabold py-1.5 rounded-lg border border-rose-100 transition-colors"
                  >
                    Open Patient Chart
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="card p-5 bg-white border border-slate-200/80 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-800 text-sm tracking-wider uppercase border-b border-slate-100 pb-3">
              Quick Actions
            </h3>

            <div className="grid grid-cols-1 gap-2.5">
              <button 
                onClick={() => navigate('/doctor/patients')}
                className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100 border border-slate-200/60 rounded-2xl text-left text-xs font-semibold text-slate-700 group transition-all"
              >
                <span className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-indigo-500" />
                  Search Patient Directory
                </span>
                <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-indigo-600 transition-colors" />
              </button>

              <button 
                onClick={() => navigate('/doctor/emr')}
                className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100 border border-slate-200/60 rounded-2xl text-left text-xs font-semibold text-slate-700 group transition-all"
              >
                <span className="flex items-center gap-2">
                  <FilePlus className="h-4 w-4 text-indigo-500" />
                  Open New Chart
                </span>
                <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-indigo-600 transition-colors" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default DoctorDashboard;
