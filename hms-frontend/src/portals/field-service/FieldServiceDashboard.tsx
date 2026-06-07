import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import FieldServiceShellNotice from './components/FieldServiceShellNotice';
import FieldServiceScopeFilter from './components/FieldServiceScopeFilter';
import TechnicianJobCard from './components/TechnicianJobCard';
import RouteSummaryPanel from './components/RouteSummaryPanel';
import OfflineSyncStatusCard from './components/OfflineSyncStatusCard';
import { apiClient } from '../../lib/api';
import { CheckCircle2, Clock, Loader2, Truck, WifiOff } from 'lucide-react';
import { AnalyticsMetricCard, InsightPanel } from '../../components/analytics';
import {
  VolumeAreaChart,
  StatusDonutChart,
  ComparisonBarChart
} from '../../components/analytics/charts';

const MOCK_COMPLETION_TIMELINE = [
  { label: 'Mon', value: 8 },
  { label: 'Tue', value: 12 },
  { label: 'Wed', value: 10 },
  { label: 'Thu', value: 15 },
  { label: 'Fri', value: 14 },
  { label: 'Sat', value: 6 },
  { label: 'Sun', value: 5 },
];

const MOCK_SLA_AGING = [
  { label: '< 2h', value: 12 },
  { label: '2-4h', value: 8 },
  { label: '4-8h', value: 4 },
  { label: '8h+', value: 2 },
];

const MOCK_HANDOVER_STATUS = [
  { label: 'Synced', value: 18, color: '#10b981' },
  { label: 'Pending', value: 3, color: '#f59e0b' },
  { label: 'Failed', value: 1, color: '#e11d48' },
];

export const FieldServiceDashboard: React.FC = () => {
  const navigate = useNavigate();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [jobs, setJobs] = useState<{ deliveries: any[], installations: any[] }>({ deliveries: [], installations: [] });
  const [loading, setLoading] = useState(true);
  const [isDemoData, setIsDemoData] = useState(false);

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const response = await apiClient.get('/logistics/technician/jobs');
        setJobs(response.data);
        setIsDemoData(false);
      } catch (error) {
        console.warn('Failed to fetch jobs from backend, loading mock data:', error);
        setJobs({
          deliveries: [
            { id: '1', customer: 'St. Jude Hospital Network', address: 'Building A, Room 102', status: 'IN_PROGRESS' },
            { id: '2', customer: 'Juan Dela Cruz', address: '123 Rizal Street, Manila', status: 'COMPLETED' },
          ],
          installations: [
            { id: '3', customer: 'MediClinics Diagnostic', address: 'Floor 2, Lab Station B', status: 'PENDING' },
          ],
        });
        setIsDemoData(true);
      } finally {
        setLoading(false);
      }
    };
    fetchJobs();
  }, []);

  const allJobs = [...jobs.deliveries, ...jobs.installations];
  const inProgress = allJobs.filter(j => j.status === 'IN_PROGRESS').length;
  const completed = allJobs.filter(j => j.status === 'COMPLETED').length;

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-black text-slate-800 tracking-tight">Field Service Dashboard</h2>
            {isDemoData && (
              <span className="rounded-full bg-amber-50 border border-amber-200 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-amber-700 animate-pulse">
                Demo Preview Mode
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 font-medium">Logistics monitoring and field technician operations</p>
        </div>
        <div className="flex items-center gap-3">
          <FieldServiceScopeFilter />
          <button
            onClick={() => navigate('/field-service/schedule')}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-black transition-all shadow-md cursor-pointer"
          >
            My Schedule
          </button>
        </div>
      </div>

      <FieldServiceShellNotice />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <AnalyticsMetricCard title="Jobs Today" value={loading ? '...' : String(allJobs.length).padStart(2, '0')} icon={Truck} description="Live technician job assignments" severity="info" href="/field-service/schedule" />
        <AnalyticsMetricCard title="In Progress" value={loading ? '...' : String(inProgress).padStart(2, '0')} icon={Clock} description="Jobs currently underway" severity="warning" href="/field-service/deliveries" />
        <AnalyticsMetricCard title="Completed" value={loading ? '...' : String(completed).padStart(2, '0')} icon={CheckCircle2} description="Completed field work" severity="success" href="/field-service/proof-of-delivery" />
        <AnalyticsMetricCard title="Offline Sync" value="WIP" icon={WifiOff} description="Queued handovers and offline evidence" severity="warning" href="/field-service/offline-sync" />
      </div>

      <InsightPanel insights={[{ title: 'Field dashboard stays route-first', description: 'Technician jobs and route/offline readiness remain more important than executive charts for mobile users.', severity: 'info', actionLabel: 'Open Schedule', actionTo: '/field-service/schedule' }]} title="Field service insights" />

      {/* Visual Analytics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm h-72">
          <h3 className="mb-4 text-xs font-black text-slate-400 uppercase tracking-widest flex justify-between items-center">
            <span>Job Completion Timeline</span>
            {isDemoData && <span className="text-[10px] font-black text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-100">DEMO</span>}
          </h3>
          <div className="h-[calc(100%-3rem)]">
            <VolumeAreaChart
              data={MOCK_COMPLETION_TIMELINE}
              title="Job Completion"
              valueLabel="Completed"
            />
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm h-72">
          <h3 className="mb-4 text-xs font-black text-slate-400 uppercase tracking-widest flex justify-between items-center">
            <span>SLA Response / Aging</span>
            {isDemoData && <span className="text-[10px] font-black text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-100">DEMO</span>}
          </h3>
          <div className="h-[calc(100%-3rem)]">
            <ComparisonBarChart
              data={MOCK_SLA_AGING}
              title="SLA Aging"
              valueLabel="Jobs Count"
            />
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm h-72">
          <h3 className="mb-4 text-xs font-black text-slate-400 uppercase tracking-widest flex justify-between items-center">
            <span>Handover Sync Posture</span>
            {isDemoData && <span className="text-[10px] font-black text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-100">DEMO</span>}
          </h3>
          <div className="h-[calc(100%-3rem)]">
            <StatusDonutChart
              data={MOCK_HANDOVER_STATUS}
              title="Handover Status"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
           <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">Upcoming Job Queue</h3>
           {loading ? (
              <div className="flex items-center justify-center p-12 bg-white border border-slate-100 rounded-3xl">
                <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" />
              </div>
           ) : allJobs.length === 0 ? (
              <div className="bg-white border border-slate-100 rounded-3xl p-12 text-center">
                <p className="text-slate-400 text-sm font-bold uppercase tracking-widest">No active jobs assigned</p>
              </div>
           ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                 {jobs.deliveries.map((j: any) => (
                   <TechnicianJobCard
                     key={j.id}
                     id={`DEL-${j.id}`}
                     type="DELIVERY"
                     customer={j.customer}
                     address={j.address}
                     time="SLA: Immediate"
                     status={j.status}
                     onAction={() => navigate('/field-service/deliveries')}
                   />
                 ))}
                 {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                 {jobs.installations.map((j: any) => (
                   <TechnicianJobCard
                     key={j.id}
                     id={`INS-${j.id}`}
                     type="INSTALLATION"
                     customer={j.customer}
                     address={j.address}
                     time="SLA: Next Day"
                     status={j.status}
                     onAction={() => navigate('/field-service/installations')}
                   />
                 ))}
              </div>
           )}
        </div>

        <div className="space-y-8">
           <RouteSummaryPanel />
           <OfflineSyncStatusCard />
        </div>
      </div>

      {/* Data Label */}
      <div className="flex justify-center mt-6">
        <span className="rounded-full bg-slate-200 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-slate-500">
          {isDemoData ? 'Demo analytics preview — sample data for client walkthrough' : 'Mixed Mode: Real Operations / Demo Analytics'}
        </span>
      </div>
    </div>
  );
};

export default FieldServiceDashboard;
