import React from 'react';
import { Database, HardDrive, Clock, CheckCircle, Loader } from 'lucide-react';
import { StatusBadge } from '../../../components/feedback/StatusBadge';

export interface BackupEntry {
  id: string;
  name: string;
  type: 'FULL' | 'INCREMENTAL' | 'SNAPSHOT';
  status: 'COMPLETED' | 'IN_PROGRESS' | 'FAILED' | 'SCHEDULED';
  size: string;
  createdAt: string;
  duration: string;
  retentionDays: number;
  rpoMet: boolean;
}

interface BackupStatusCardProps {
  backups: BackupEntry[];
  rpoTarget: string;
  rtoTarget: string;
}

export const BackupStatusCard: React.FC<BackupStatusCardProps> = ({ backups, rpoTarget, rtoTarget }) => {
  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'FULL':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'INCREMENTAL':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      default:
        return 'bg-teal-50 text-teal-700 border-teal-200';
    }
  };

  return (
    <div className="bg-white border border-slate-200/80 shadow-sm rounded-2xl p-5 space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <Database className="h-4 w-4 text-indigo-500" />
            Backup & Recovery Status
          </h3>
          <p className="text-[10px] text-slate-400 font-medium">Database snapshots, retention lifecycle, and disaster recovery metrics</p>
        </div>
      </div>

      {/* RPO/RTO Metrics */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">RPO Target</p>
          <p className="text-lg font-extrabold text-slate-800" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{rpoTarget}</p>
          <p className="text-[10px] text-slate-500 font-medium">Recovery Point Objective</p>
        </div>
        <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">RTO Target</p>
          <p className="text-lg font-extrabold text-slate-800" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{rtoTarget}</p>
          <p className="text-[10px] text-slate-500 font-medium">Recovery Time Objective</p>
        </div>
      </div>

      {/* Backup Entries */}
      <div className="space-y-2.5">
        {backups.map((backup) => (
          <div key={backup.id} className="p-3.5 bg-slate-50 border border-slate-200/60 rounded-xl hover:border-indigo-200 transition-colors">
            <div className="flex justify-between items-start mb-2">
              <div className="flex items-center gap-2.5">
                {backup.status === 'IN_PROGRESS' ? (
                  <Loader className="h-4 w-4 text-blue-500 animate-spin" />
                ) : backup.status === 'COMPLETED' ? (
                  <CheckCircle className="h-4 w-4 text-emerald-500" />
                ) : (
                  <Clock className="h-4 w-4 text-slate-400" />
                )}
                <div>
                  <p className="text-xs font-bold text-slate-800">{backup.name}</p>
                  <p className="text-[10px] text-slate-400 font-mono">{backup.id}</p>
                </div>
              </div>
              <StatusBadge
                status={backup.status.replace('_', ' ')}
                type={backup.status === 'COMPLETED' ? 'success' : backup.status === 'FAILED' ? 'danger' : backup.status === 'IN_PROGRESS' ? 'info' : 'pending'}
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className={`px-2 py-0.5 border text-[10px] font-bold rounded-md ${getTypeBadge(backup.type)}`}>
                {backup.type}
              </span>
              <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                <HardDrive className="h-3 w-3" />
                <span className="font-mono font-semibold">{backup.size}</span>
              </div>
              <span className="text-[10px] text-slate-400">Duration: {backup.duration}</span>
              <span className="text-[10px] text-slate-400">Retention: {backup.retentionDays}d</span>
            </div>

            <div className="flex justify-between items-center pt-2 border-t border-slate-100">
              <span className="text-[10px] text-slate-400 font-medium">{backup.createdAt}</span>
              {backup.status === 'COMPLETED' && (
                <button
                  type="button"
                  disabled
                  title="Backup download endpoint is not available; sensitive operational exports require signed endpoint, reason capture, and audit logging."
                  className="cursor-not-allowed rounded-lg border border-slate-200 bg-slate-100 px-2.5 py-1.5 text-[10px] font-bold text-slate-400"
                >
                  Export WIP
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl px-3.5 py-2.5 text-[10px] text-amber-800 font-semibold">
      </div>
    </div>
  );
};

export default BackupStatusCard;
