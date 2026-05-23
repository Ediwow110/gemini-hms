import React, { useState } from 'react';
import { Database, Play, Calendar, Clock, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { StatusBadge } from '../../../components/feedback/StatusBadge';

export interface RetentionJob {
  id: string;
  policyName: string;
  description: string;
  retentionPeriodYears: number;
  targetCategory: string;
  lastRun: string;
  nextRun: string;
  status: 'IDLE' | 'RUNNING' | 'COMPLETED' | 'FAILED';
  recordsProcessed?: number;
  tenantName: string;
  branchName: string;
}

interface RetentionJobCardProps {
  job: RetentionJob;
  onTriggerDryRun?: (id: string) => void;
}

export const RetentionJobCard: React.FC<RetentionJobCardProps> = ({ job, onTriggerDryRun }) => {
  const [currentStatus, setCurrentStatus] = useState<RetentionJob['status']>(job.status);
  const [simulationActive, setSimulationActive] = useState(false);
  const [simulationLog, setSimulationLog] = useState<string[]>([]);
  const [recordsCount, setRecordsCount] = useState(job.recordsProcessed || 0);

  const getStatusBadge = (status: RetentionJob['status']) => {
    switch (status) {
      case 'RUNNING':
        return <StatusBadge status="RUNNING" type="warning" />;
      case 'COMPLETED':
        return <StatusBadge status="COMPLETED" type="success" />;
      case 'FAILED':
        return <StatusBadge status="FAILED" type="danger" />;
      default:
        return <StatusBadge status="ACTIVE (IDLE)" type="info" />;
    }
  };

  const handleSimulateDryRun = () => {
    if (simulationActive) return;
    
    setSimulationActive(true);
    setCurrentStatus('RUNNING');
    setSimulationLog(['[Simulation Started] Initializing dry-run...', '[Database Scope] Scanning clinical records schemas...']);

    if (onTriggerDryRun) {
      onTriggerDryRun(job.id);
    }

    setTimeout(() => {
      setSimulationLog(prev => [
        ...prev,
        `[Isolation Guard] Verifying tenant partition boundaries... OK`,
        `[Filter Apply] Matching records older than ${job.retentionPeriodYears} years...`
      ]);
    }, 800);

    setTimeout(() => {
      const foundCount = Math.floor(Math.random() * 400) + 120;
      setRecordsCount(foundCount);
      setSimulationLog(prev => [
        ...prev,
        `[Report] Identified ${foundCount} expired PHI records targeting ${job.targetCategory}.`,
        `[Dry-Run Complete] 0 records mutated. Sandbox simulated successfully.`
      ]);
      setCurrentStatus('COMPLETED');
      setSimulationActive(false);
    }, 2000);
  };

  return (
    <div className="card bg-white border border-slate-200/80 shadow-sm rounded-2xl p-5 flex flex-col justify-between hover:shadow-md transition-all duration-200">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600">
              <Database className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">{job.policyName}</h4>
              <p className="text-[10px] text-slate-400 font-mono">ID: {job.id}</p>
            </div>
          </div>
          {getStatusBadge(currentStatus)}
        </div>

        {/* Description & Target */}
        <div className="space-y-2 text-xs">
          <p className="text-slate-655 text-slate-500 font-medium leading-relaxed">{job.description}</p>
          
          <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200/50">
            <div>
              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wide">Category Scope</p>
              <p className="font-bold text-slate-700">{job.targetCategory}</p>
            </div>
            <div>
              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wide">Retention Period</p>
              <p className="font-bold text-slate-700">{job.retentionPeriodYears} Years</p>
            </div>
          </div>
        </div>

        {/* Scope Indicators */}
        <div className="border-t border-slate-100 pt-3 space-y-2">
          <div className="flex justify-between text-[11px] text-slate-500">
            <span className="flex items-center gap-1 font-semibold"><Calendar className="h-3.5 w-3.5 text-slate-400" /> Last Prune Run</span>
            <span className="font-mono text-slate-600">{job.lastRun}</span>
          </div>
          <div className="flex justify-between text-[11px] text-slate-500">
            <span className="flex items-center gap-1 font-semibold"><Clock className="h-3.5 w-3.5 text-slate-400" /> Next Scheduled Run</span>
            <span className="font-mono text-slate-600">{job.nextRun}</span>
          </div>
        </div>

        {/* Sandbox Simulation Terminal */}
        {simulationLog.length > 0 && (
          <div className="bg-slate-900 text-emerald-400 font-mono text-[9px] p-3 rounded-xl space-y-1 h-28 overflow-y-auto border border-slate-950">
            {simulationLog.map((log, idx) => (
              <p key={idx} className={log.includes('[Dry-Run Complete]') ? 'text-indigo-300 font-bold' : log.includes('error') ? 'text-rose-400' : ''}>
                {log}
              </p>
            ))}
          </div>
        )}

        {/* Warning Banner */}
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex gap-2 text-[10px] text-amber-800 leading-normal">
          <ShieldAlert className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
          <p>
            <strong>Sandbox Safety Rule:</strong> Pruning or archiving processes are dry-run simulations. No clinical record databases, database tables, or soft-deleted records will be purged or mutated.
          </p>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
        <div className="text-[10px] text-slate-400 font-semibold">
          {recordsCount > 0 ? (
            <span className="flex items-center gap-1 text-indigo-650 font-bold">
              <CheckCircle2 className="h-3.5 w-3.5 text-indigo-500" />
              {recordsCount} records scanned (simulated)
            </span>
          ) : (
            'Ready to test policy dry-run'
          )}
        </div>

        <button
          onClick={handleSimulateDryRun}
          disabled={simulationActive}
          className={`py-1.5 px-4 bg-indigo-650 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          <Play className="h-3 w-3" />
          {simulationActive ? 'Simulating...' : 'Trigger dry-run'}
        </button>
      </div>
    </div>
  );
};

export default RetentionJobCard;
