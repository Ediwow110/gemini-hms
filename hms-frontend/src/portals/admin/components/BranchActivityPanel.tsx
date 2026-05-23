import React from 'react';
import { Building, Stethoscope, Users, Clock, Activity } from 'lucide-react';
import { StatusBadge } from '../../../components/feedback/StatusBadge';

interface BranchActivityProps {
  branch: {
    id: string;
    name: string;
    tenant: string;
    status: 'ACTIVE' | 'MAINTENANCE' | 'OFFLINE';
    director: string;
    doctors: number;
    nurses: number;
    beds: number;
    activeQueue: number;
    latency: number;
    encountersToday: number;
  };
}

export const BranchActivityPanel: React.FC<BranchActivityProps> = ({ branch }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'success';
      case 'MAINTENANCE':
        return 'warning';
      default:
        return 'danger';
    }
  };

  return (
    <div className="card p-5 bg-white border border-slate-200/80 shadow-sm rounded-2xl space-y-4 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center justify-center text-indigo-600">
            <Building className="h-5 w-5" />
          </div>
          <div>
            <h4 className="font-bold text-slate-800 text-sm">{branch.name}</h4>
            <p className="text-[10px] text-indigo-600 font-semibold uppercase tracking-wider">{branch.tenant}</p>
          </div>
        </div>
        <StatusBadge 
          status={branch.status} 
          type={getStatusColor(branch.status)} 
        />
      </div>

      <div className="grid grid-cols-3 gap-2 text-center py-2.5 bg-slate-50 rounded-xl border border-slate-100">
        <div>
          <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Queue</p>
          <p className="text-sm font-black text-slate-800 mt-0.5">{branch.activeQueue}</p>
        </div>
        <div>
          <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Encounters</p>
          <p className="text-sm font-black text-slate-800 mt-0.5">{branch.encountersToday}</p>
        </div>
        <div>
          <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Latency</p>
          <p className={`text-sm font-black mt-0.5 ${branch.latency > 150 ? 'text-rose-600' : 'text-slate-800'}`}>
            {branch.latency}ms
          </p>
        </div>
      </div>

      <div className="space-y-2 text-xs">
        <div className="flex justify-between text-slate-600">
          <span className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400"><Stethoscope className="h-3.5 w-3.5" /> Staff Directory</span>
          <span className="font-bold text-slate-700">{branch.doctors} Doctors / {branch.nurses} Nurses</span>
        </div>
        <div className="flex justify-between text-slate-600">
          <span className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400"><Users className="h-3.5 w-3.5" /> Capacity</span>
          <span className="font-bold text-slate-700">{branch.beds} Beds Provisioned</span>
        </div>
        <div className="flex justify-between text-slate-600">
          <span className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400"><Clock className="h-3.5 w-3.5" /> Clinical Director</span>
          <span className="font-bold text-slate-700">{branch.director}</span>
        </div>
      </div>

      <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-100">
        <span className="font-mono">ID: {branch.id}</span>
        <span className="flex items-center gap-1 text-emerald-600 font-semibold">
          <Activity className="h-3 w-3" /> Core APIs online
        </span>
      </div>
    </div>
  );
};
