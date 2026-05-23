import React from 'react';
import { ShieldCheck, Wifi, WifiOff } from 'lucide-react';
import { StatusBadge } from '../../../components/feedback/StatusBadge';

export interface ServiceStatusItem {
  id: string;
  name: string;
  type: 'CORE' | 'THIRD_PARTY' | 'DATABASE' | 'ADAPTER';
  status: 'ONLINE' | 'DEGRADED' | 'OFFLINE';
  latency: number; // in ms
  uptime: number; // percentage
  description: string;
}

interface ServiceStatusPanelProps {
  services: ServiceStatusItem[];
}

export const ServiceStatusPanel: React.FC<ServiceStatusPanelProps> = ({ services }) => {
  const getServiceTypeBadge = (type: string) => {
    switch (type) {
      case 'CORE':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'DATABASE':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'ADAPTER':
        return 'bg-teal-50 text-teal-700 border-teal-200';
      default:
        return 'bg-slate-100 text-slate-600 border-slate-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ONLINE':
        return <Wifi className="h-4 w-4 text-emerald-500 animate-pulse" />;
      case 'DEGRADED':
        return <Wifi className="h-4 w-4 text-amber-500" />;
      default:
        return <WifiOff className="h-4 w-4 text-rose-500" />;
    }
  };

  return (
    <div className="bg-white border border-slate-200/80 shadow-sm rounded-2xl p-5 space-y-4">
      <div>
        <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Subservice Operations & Latency</h3>
        <p className="text-[10px] text-slate-400 font-medium">Live connection diagnostics for internal databases and external APIs</p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider">
              <th className="pb-3 pl-2">Service Name</th>
              <th className="pb-3">Type</th>
              <th className="pb-3">Uptime (30d)</th>
              <th className="pb-3 text-right pr-2">Response Time</th>
              <th className="pb-3 text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {services.map((svc) => (
              <tr key={svc.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="py-3 pl-2">
                  <div className="font-bold text-slate-800">{svc.name}</div>
                  <div className="text-[10px] text-slate-400 font-medium">{svc.description}</div>
                </td>
                <td className="py-3">
                  <span className={`px-2 py-0.5 border text-[10px] font-bold rounded-md ${getServiceTypeBadge(svc.type)}`}>
                    {svc.type}
                  </span>
                </td>
                <td className="py-3 font-semibold text-slate-655 text-slate-600 font-mono">
                  {svc.uptime.toFixed(3)}%
                </td>
                <td className="py-3 text-right pr-2 font-mono font-bold text-slate-500">
                  {svc.latency} ms
                </td>
                <td className="py-3">
                  <div className="flex justify-center items-center gap-1.5">
                    {getStatusIcon(svc.status)}
                    <StatusBadge 
                      status={svc.status} 
                      type={svc.status === 'ONLINE' ? 'success' : svc.status === 'DEGRADED' ? 'warning' : 'danger'} 
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-slate-50 border p-3.5 rounded-xl flex items-start gap-2.5 text-[10px] text-slate-500">
        <ShieldCheck className="h-4 w-4 text-indigo-500 flex-shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-slate-700 block mb-0.5">Automated SSL & Heartbeat Auditing</span>
          Diagnostics utilize periodic HTTP GET ping sweeps, reporting to this local shell view. Latencies are calculated relative to network route loops.
        </div>
      </div>
    </div>
  );
};

export default ServiceStatusPanel;
