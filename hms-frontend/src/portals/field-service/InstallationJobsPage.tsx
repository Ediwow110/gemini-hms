import React, { useEffect, useState } from 'react';
import { Wrench, Loader2 } from 'lucide-react';
import FieldServiceShellNotice from './components/FieldServiceShellNotice';
import InstallationChecklist from './components/InstallationChecklist';
import { apiClient } from '../../lib/api';

export const InstallationJobsPage: React.FC = () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/logistics/installations');
      setJobs(response.data);
    } catch (error) {
      console.error('Failed to fetch installation jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const handleStartJob = async (id: string) => {
    try {
      await apiClient.patch(`/logistics/installations/${id}/status`, { status: 'IN_PROGRESS' });
      fetchJobs();
    } catch (error) {
      console.error('Failed to start job:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-800 tracking-tight">Installation Jobs</h2>
          <p className="text-xs text-slate-500 font-medium">Monitor equipment setup and facility commissioning tasks</p>
        </div>
      </div>

      <FieldServiceShellNotice />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
           {loading ? (
             <div className="flex items-center justify-center p-12 bg-white border border-slate-100 rounded-3xl">
               <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" />
             </div>
           ) : jobs.length === 0 ? (
             <div className="bg-white border border-slate-100 rounded-3xl p-12 text-center text-slate-400 font-bold uppercase tracking-widest">
               No installation jobs found
             </div>
           ) : (
             jobs.map((job) => (
               <div key={job.id} className="bg-white border border-slate-200 rounded-3xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:shadow-md transition-all group">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center">
                      <Wrench className="h-6 w-6" />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight">Job: {job.id.substring(0, 8)}</h4>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">{job.asset.model} · {job.asset.serialNumber}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                     <span className={`text-[9px] font-black px-2 py-0.5 rounded-lg uppercase tracking-tight ${
                       job.status === 'ASSIGNED' ? 'bg-amber-100 text-amber-700' :
                       job.status === 'IN_PROGRESS' ? 'bg-indigo-100 text-indigo-700' :
                       job.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700' :
                       'bg-slate-100 text-slate-500'
                     }`}>
                       {job.status}
                     </span>
                     {job.status === 'ASSIGNED' && (
                       <button 
                         onClick={() => handleStartJob(job.id)}
                         className="px-4 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase cursor-pointer hover:bg-black transition-colors"
                       >
                         Start Job
                       </button>
                     )}
                  </div>
               </div>
             ))
           )}
        </div>
        <aside>
           <InstallationChecklist />
        </aside>
      </div>
    </div>
  );
};

export default InstallationJobsPage;
