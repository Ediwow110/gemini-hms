import React from 'react';
import { Cpu, HardDrive, ShieldAlert, CheckCircle2 } from 'lucide-react';

interface SystemHealthCardProps {
  metrics: {
    cpuLoad: number;
    ramLoad: number;
    dbLatency: number;
    redisStatus: 'ONLINE' | 'OFFLINE';
    queueStatus: 'ONLINE' | 'OFFLINE';
    smtpStatus: 'ONLINE' | 'OFFLINE';
    uptime: string;
  };
}

export const SystemHealthCard: React.FC<SystemHealthCardProps> = ({ metrics }) => {
  const getServiceStatus = (status: 'ONLINE' | 'OFFLINE') => {
    if (status === 'ONLINE') {
      return (
        <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600">
          <CheckCircle2 className="h-3.5 w-3.5" />
          ONLINE
        </span>
      );
    }
    return (
      <span className="flex items-center gap-1 text-[10px] font-bold text-rose-600 animate-pulse">
        <ShieldAlert className="h-3.5 w-3.5" />
        OFFLINE
      </span>
    );
  };

  return (
    <div className="card p-5 bg-white border border-slate-200/80 shadow-sm rounded-2xl space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <h3 className="font-bold text-slate-800 text-sm tracking-wider uppercase flex items-center gap-2">
          <Cpu className="h-4.5 w-4.5 text-indigo-500" />
          Infrastructure SLA Monitor
        </h3>
        <span className="bg-indigo-50 border border-indigo-100 text-indigo-700 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
          Uptime: {metrics.uptime}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Memory/CPU Meters */}
        <div className="space-y-3">
          <div>
            <div className="flex justify-between text-[10px] font-semibold text-slate-500 mb-1">
              <span className="flex items-center gap-1"><Cpu className="h-3 w-3" /> Core CPU Cluster</span>
              <span className="font-mono">{metrics.cpuLoad}%</span>
            </div>
            <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-indigo-600 rounded-full" 
                style={{ width: `${metrics.cpuLoad}%` }}
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between text-[10px] font-semibold text-slate-500 mb-1">
              <span className="flex items-center gap-1"><HardDrive className="h-3 w-3" /> Shared RAM Pool</span>
              <span className="font-mono">{metrics.ramLoad}%</span>
            </div>
            <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-violet-600 rounded-full" 
                style={{ width: `${metrics.ramLoad}%` }}
              />
            </div>
          </div>
        </div>

        {/* Database & Latency */}
        <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl flex flex-col justify-between text-xs">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">DB API Latency</span>
            <span className="text-emerald-600 font-extrabold">{metrics.dbLatency}ms</span>
          </div>
          <div className="flex justify-between items-center pt-2 border-t border-slate-200/60">
            <span className="text-[10px] text-slate-500">Service Status</span>
            <span className="text-emerald-600 font-extrabold uppercase">Stable</span>
          </div>
        </div>
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-3 gap-2.5 pt-1 text-xs">
        <div className="p-2.5 bg-slate-50 border border-slate-100 rounded-xl flex flex-col gap-1 items-center text-center">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Redis Cache</span>
          {getServiceStatus(metrics.redisStatus)}
        </div>
        <div className="p-2.5 bg-slate-50 border border-slate-100 rounded-xl flex flex-col gap-1 items-center text-center">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Job Queues</span>
          {getServiceStatus(metrics.queueStatus)}
        </div>
        <div className="p-2.5 bg-slate-50 border border-slate-100 rounded-xl flex flex-col gap-1 items-center text-center">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">SMTP Relay</span>
          {getServiceStatus(metrics.smtpStatus)}
        </div>
      </div>
    </div>
  );
};
export default SystemHealthCard;
