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

export const FieldServiceDashboard: React.FC = () => {
  const navigate = useNavigate();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [jobs, setJobs] = useState<{ deliveries: any[], installations: any[] }>({ deliveries: [], installations: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const response = await apiClient.get('/logistics/technician/jobs');
        setJobs(response.data);
      } catch (error) {
        console.error('Failed to fetch jobs:', error);
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
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-800 tracking-tight">Field Service Dashboard</h2>
          <p className="text-xs text-slate-500 font-medium">Logistics monitoring and field technician operations</p>
        </div>
        <div className="flex items-center gap-3">
          <FieldServiceScopeFilter />
          <button 
            onClick={() => navigate('/field-service/schedule')}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-black transition-all shadow-md"
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
                    id={`DEL-${j.id.substring(0, 4)}`}
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
                    id={`INS-${j.id.substring(0, 4)}`}
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
    </div>
  );
};

export default FieldServiceDashboard;
