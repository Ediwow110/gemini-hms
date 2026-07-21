import React from 'react';
import { CheckCircle, Clock, Loader, Play, RotateCcw, XCircle } from 'lucide-react';
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
  onRetry?: (job: BackgroundJob) => void;
  retryingJobId?: string | null;
  isDemo?: boolean;
}

const StatusIcon = ({ status }: { status: BackgroundJob['status'] }) => {
  if (status === 'RUNNING') return <Loader className="h-3.5 w-3.5 animate-spin text-blue-500" />;
  if (status === 'COMPLETED') return <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />;
  if (status === 'FAILED') return <XCircle className="h-3.5 w-3.5 text-rose-500" />;
  if (status === 'RETRYING') return <RotateCcw className="h-3.5 w-3.5 animate-spin text-amber-500" />;
  return <Clock className="h-3.5 w-3.5 text-slate-400" />;
};

const jobTypeClass = (type: BackgroundJob['type']) => {
  if (type === 'CRON') return 'bg-purple-50 text-purple-700 border-purple-200';
  if (type === 'QUEUE') return 'bg-blue-50 text-blue-700 border-blue-200';
  if (type === 'TRIGGER') return 'bg-teal-50 text-teal-700 border-teal-200';
  return 'bg-slate-100 text-slate-600 border-slate-200';
};

export const BackgroundJobTable: React.FC<BackgroundJobTableProps> = ({
  jobs,
  onRetry,
  retryingJobId,
  isDemo = false,
}) => (
  <div className="h-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
    <div className="flex flex-col gap-3 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
          <Play className="h-4 w-4 text-indigo-500" />
          Background Job Monitor
        </h3>
        <p className="mt-1 text-xs text-slate-500">
          Scheduled work, asynchronous queues and retry status.
        </p>
      </div>
      <div className="flex gap-2">
        <span className="rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-[10px] font-semibold text-blue-700">
          {jobs.filter((job) => job.status === 'RUNNING').length} running
        </span>
        <span className="rounded-full border border-rose-200 bg-rose-50 px-2.5 py-1 text-[10px] font-semibold text-rose-700">
          {jobs.filter((job) => job.status === 'FAILED').length} failed
        </span>
      </div>
    </div>

    {jobs.length === 0 ? (
      <div className="flex min-h-48 flex-col items-center justify-center px-6 text-center text-slate-400">
        <Play className="mb-2 h-8 w-8 opacity-40" />
        <p className="text-sm font-semibold text-slate-600">No background job telemetry</p>
        <p className="mt-1 text-xs">Worker status will appear when the telemetry endpoint is connected.</p>
      </div>
    ) : (
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] border-collapse text-left text-xs">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              <th className="px-5 py-3">Job</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Schedule</th>
              <th className="px-4 py-3">Last run</th>
              <th className="px-4 py-3 text-center">Status</th>
              <th className="px-5 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {jobs.map((job) => {
              const retrying = retryingJobId === job.id;
              return (
                <tr key={job.id} className="hover:bg-slate-50/70">
                  <td className="px-5 py-3.5">
                    <p className="font-semibold text-slate-900">{job.name}</p>
                    <p className="mt-0.5 text-[10px] text-slate-500">{job.description}</p>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className={`rounded-md border px-2 py-0.5 text-[10px] font-semibold ${jobTypeClass(job.type)}`}>
                      {job.type}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="font-mono text-[10px] font-semibold text-slate-600">{job.schedule || '—'}</span>
                    {job.nextRun && <p className="mt-0.5 text-[9px] text-slate-400">Next: {job.nextRun}</p>}
                  </td>
                  <td className="px-4 py-3.5">
                    <p className="text-[10px] font-semibold text-slate-600">{job.lastRun}</p>
                    {job.duration && <p className="mt-0.5 font-mono text-[9px] text-slate-400">{job.duration}</p>}
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center justify-center gap-1.5">
                      <StatusIcon status={job.status} />
                      <StatusBadge
                        status={job.status}
                        type={job.status === 'COMPLETED' ? 'success' : job.status === 'FAILED' ? 'danger' : job.status === 'RUNNING' ? 'info' : 'warning'}
                      />
                    </div>
                    {job.retryCount > 0 && <p className="mt-1 text-center font-mono text-[9px] text-slate-400">retries: {job.retryCount}</p>}
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    {job.status === 'FAILED' && onRetry && !isDemo ? (
                      <button
                        type="button"
                        onClick={() => onRetry(job)}
                        disabled={retrying}
                        className="ml-auto inline-flex min-h-9 items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[10px] font-semibold text-slate-700 hover:border-amber-300 hover:bg-amber-50 hover:text-amber-700 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <RotateCcw className={`h-3 w-3 ${retrying ? 'animate-spin' : ''}`} />
                        {retrying ? 'Retrying' : 'Retry'}
                      </button>
                    ) : (
                      <span className="text-[10px] text-slate-300">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    )}

    {isDemo && (
      <div className="border-t border-sky-100 bg-sky-50 px-5 py-3 text-[10px] font-semibold text-sky-800">
        Synthetic worker telemetry is read-only and used for dashboard layout review.
      </div>
    )}
  </div>
);

export default BackgroundJobTable;
