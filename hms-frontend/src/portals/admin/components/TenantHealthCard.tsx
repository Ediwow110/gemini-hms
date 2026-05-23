import React from 'react';
import { Server, Database, Activity, Cpu, HardDrive } from 'lucide-react';
import { StatusBadge } from '../../../components/feedback/StatusBadge';

interface TenantHealthProps {
  tenant: {
    id: string;
    name: string;
    status: 'HEALTHY' | 'DEGRADED' | 'CRITICAL';
    tier: string;
    branchCount: number;
    userCount: number;
    dbSize: string;
    cpuUsage: number;
    ramUsage: number;
    errorRate: number;
    region: string;
  };
}

export const TenantHealthCard: React.FC<TenantHealthProps> = ({ tenant }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'HEALTHY':
        return 'success';
      case 'DEGRADED':
        return 'warning';
      default:
        return 'danger';
    }
  };

  return (
    <div className="card p-5 bg-white border border-slate-200/80 shadow-sm rounded-2xl hover:shadow-md transition-all duration-200 space-y-4">
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center gap-2">
            <h4 className="font-bold text-slate-800 text-sm">{tenant.name}</h4>
            <span className="text-[10px] bg-indigo-50 border border-indigo-100 text-indigo-700 font-extrabold px-1.5 py-0.5 rounded-md uppercase tracking-wider">
              {tenant.tier}
            </span>
          </div>
          <p className="text-[10px] text-slate-400 font-mono mt-0.5">ID: {tenant.id} | Region: {tenant.region}</p>
        </div>
        <StatusBadge 
          status={tenant.status} 
          type={getStatusColor(tenant.status)} 
        />
      </div>

      <div className="grid grid-cols-2 gap-3 text-xs border-y border-slate-100 py-3">
        <div className="flex items-center gap-2">
          <Server className="h-4 w-4 text-slate-400" />
          <div>
            <p className="text-[10px] text-slate-400 font-semibold leading-none">Branches</p>
            <p className="font-bold text-slate-700 mt-1">{tenant.branchCount}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Database className="h-4 w-4 text-slate-400" />
          <div>
            <p className="text-[10px] text-slate-400 font-semibold leading-none">DB Size</p>
            <p className="font-bold text-slate-700 mt-1">{tenant.dbSize}</p>
          </div>
        </div>
      </div>

      <div className="space-y-2.5">
        <div>
          <div className="flex justify-between text-[10px] font-semibold text-slate-500 mb-1">
            <span className="flex items-center gap-1"><Cpu className="h-3 w-3" /> CPU Load</span>
            <span className="font-mono">{tenant.cpuUsage}%</span>
          </div>
          <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-500 ${
                tenant.cpuUsage > 80 ? 'bg-rose-500' : tenant.cpuUsage > 50 ? 'bg-amber-500' : 'bg-emerald-500'
              }`}
              style={{ width: `${tenant.cpuUsage}%` }}
            />
          </div>
        </div>

        <div>
          <div className="flex justify-between text-[10px] font-semibold text-slate-500 mb-1">
            <span className="flex items-center gap-1"><HardDrive className="h-3 w-3" /> RAM Usage</span>
            <span className="font-mono">{tenant.ramUsage}%</span>
          </div>
          <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-500 ${
                tenant.ramUsage > 80 ? 'bg-rose-500' : tenant.ramUsage > 50 ? 'bg-amber-500' : 'bg-emerald-500'
              }`}
              style={{ width: `${tenant.ramUsage}%` }}
            />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between text-[10px] font-semibold text-slate-400 pt-1">
        <span className="flex items-center gap-1">
          <Activity className="h-3 w-3 text-indigo-500" />
          SLA error rate
        </span>
        <span className={tenant.errorRate > 1 ? 'text-rose-600 font-bold' : 'text-slate-500'}>
          {tenant.errorRate.toFixed(3)}%
        </span>
      </div>
    </div>
  );
};
