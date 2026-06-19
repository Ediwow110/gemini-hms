import React, { useState } from 'react';
import { Play, RotateCcw, Clock, CheckCircle, XCircle, Loader } from 'lucide-react';
import { StatusBadge } from '../../../components/feedback/StatusBadge';

export interface BackgroundJob {
  id: string;
  name: string;
  type: 'CRON' | 'QUEUE' | 'TRIGGER' | 'BATCH';
  status: 'RUNNING' | 'COMPLETED' | 'FAILED' | 'SCHEDULED' | 'RETRYING';
  schedule?: string;
  lastRun: string;
  nextRun?: string;
  duration?: string;
  retryCount: number;
  description: string;
}

interface BackgroundJobTableProps {
  jobs: BackgroundJob[];
}

export const BackgroundJobTable: React.FC<BackgroundJobTableProps> = ({ jobs }) => {
  const [retriedJobs, setRetriedJobs] = useState<Set<string>>(new Set());

  const handleRetry = (jobId: string) => {
    setRetriedJobs(prev => new Set(prev).add(jobId));
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'RUNNING':
        return <Loader className="h-3.5 w-3.5 text-blue-500 animate-spin" />;
      case 'COMPLETED':
        return <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />;
      case 'FAILED':
        return <XCircle className="h-3.5 w-3.5 text-rose-500" />;
      case 'RETRYING':
        return <RotateCcw className="h-3.5 w-3.5 text-amber-500 animate-spin" />;
      default:
        return <Clock className="h-3.5 w-3.5 text-slate-400" />;
    }
  };

  const getJobTypeBadge = (type: string) => {
    switch (type) {
      case 'CRON':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'QUEUE':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'TRIGGER':
        return 'bg-teal-50 text-teal-700 border-teal-200';
      default:
        return 'bg-slate-100 text-slate-600 border-slate-200';
    }
  };

  return (
    <div className="bg-white border border-slate-200/80 shadow-sm rounded-2xl p-5 space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <Play className="h-4 w-4 text-indigo-500" />
            Background Job Monitor
          </h3>
          <p className="text-[10px] text-slate-400 font-medium">Scheduled tasks, cron jobs, and asynchronous worker status</p>
        </div>
        <div className="flex gap-2">
          <span className="text-[10px] bg-blue-50 text-blue-700 font-bold px-2 py-1 rounded-lg border border-blue-200">
            {jobs.filter(j => j.status === 'RUNNING').length} running
          </span>
          <span className="text-[10px] bg-rose-50 text-rose-700 font-bold px-2 py-1 rounded-lg border border-rose-200">
            {jobs.filter(j => j.status === 'FAILED').length} failed
          </span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
              <th className="pb-3 pl-2">Job</th>
              <th className="pb-3">Type</th>
              <th className="pb-3">Schedule</th>
              <th className="pb-3">Last Run</th>
              <th className="pb-3 text-center">Status</th>
              <th className="pb-3 text-right pr-2">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {jobs.map((job) => (
              <tr key={job.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="py-3 pl-2">
                  <div className="font-bold text-slate-800">{job.name}</div>
                  <div className="text-[10px] text-slate-400 font-medium">{job.description}</div>
                </td>
                <td className="py-3">
                  <span className={`px-2 py-0.5 border text-[10px] font-bold rounded-md ${getJobTypeBadge(job.type)}`}>
                    {job.type}
                  </span>
                </td>
                <td className="py-3">
                  <span className="font-mono text-[10px] text-slate-500 font-semibold">{job.schedule || '—'}</span>
                  {job.nextRun && (
                    <div className="text-[9px] text-slate-400 mt-0.5">Next: {job.nextRun}</div>
                  )}
                </td>
                <td className="py-3">
                  <div className="font-semibold text-slate-600 text-[10px]">{job.lastRun}</div>
                  {job.duration && (
                    <div className="text-[9px] text-slate-400 font-mono mt-0.5">{job.duration}</div>
                  )}
                </td>
                <td className="py-3">
                  <div className="flex justify-center items-center gap-1.5">
                    {getStatusIcon(job.status)}
                    <StatusBadge
                      status={job.status}
                      type={job.status === 'COMPLETED' ? 'success' : job.status === 'FAILED' ? 'danger' : job.status === 'RUNNING' ? 'info' : 'warning'}
                    />
                  </div>
                  {job.retryCount > 0 && (
                    <div className="text-center text-[9px] text-slate-400 font-mono mt-0.5">retries: {job.retryCount}</div>
                  )}
                </td>
                <td className="py-3 text-right pr-2">
                  {job.status === 'FAILED' && !retriedJobs.has(job.id) ? (
                    <button
                      onClick={() => handleRetry(job.id)}
                      className="text-[10px] bg-slate-50 hover:bg-amber-50 border border-slate-200 hover:border-amber-300 text-slate-600 hover:text-amber-700 font-bold px-2.5 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1 ml-auto"
                    >
                      <RotateCcw className="h-3 w-3" />
                      Retry
                    </button>
                  ) : retriedJobs.has(job.id) ? (
                    <span className="text-[10px] bg-amber-50 text-amber-700 border border-amber-200 px-2 py-1 rounded-lg font-bold">
                      Queued (UI only)
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-300 font-bold">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl px-3.5 py-2.5 text-[10px] text-amber-800 font-semibold">
      </div>
    </div>
  );
};

export default BackgroundJobTable;
