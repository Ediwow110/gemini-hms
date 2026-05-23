import React from 'react';
import { AlertTriangle, ShieldCheck, Clock } from 'lucide-react';

import { useIntegrationActivityAudit } from '../../../hooks/use-integration';

export const ActivityAuditEventTable: React.FC = () => {
  const { data: events, isLoading, error } = useIntegrationActivityAudit();
  
  return (
    <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
      <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
        <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-indigo-500" />
          Recent Activity
        </h3>
      </div>
      
      {isLoading ? (
        <div className="p-10 text-center text-sm font-medium text-slate-500">Loading audit events...</div>
      ) : error ? (
        <div className="p-10 text-center text-sm font-bold text-rose-500">
          {(error as { response?: { status: number } })?.response?.status === 401 || (error as { response?: { status: number } })?.response?.status === 403 
            ? 'Unauthorized to view audit events.' 
            : 'Failed to load audit events.'}
        </div>
      ) : !events || events.length === 0 ? (
        <div className="p-10 text-center text-sm font-medium text-slate-500">No activity events found.</div>
      ) : (
        <>
      
      {/* Mobile Card View */}
      <div className="md:hidden divide-y divide-slate-50">
        {events.map((e) => (
          <div key={e.id} className="p-5 space-y-3">
             <div className="flex justify-between items-start">
                <div>
                   <span className="text-xs font-black text-slate-800">
                     {e.eventType.replace(/_/g, ' ')}
                     {e.isMock && <span className="ml-2 text-[9px] font-black bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">MOCK</span>}
                   </span>
                   <p className="text-[10px] text-slate-400 font-bold uppercase">{e.id}</p>
                </div>
                <div className="flex items-center gap-1.5">
                  {e.risk === 'CRITICAL' ? <AlertTriangle className="h-3.5 w-3.5 text-rose-500" /> :
                   e.risk === 'HIGH' ? <AlertTriangle className="h-3.5 w-3.5 text-amber-500" /> :
                   <ShieldCheck className="h-3.5 w-3.5 text-blue-500" />}
                  <span className={`text-[9px] font-black ${
                    e.risk === 'CRITICAL' ? 'text-rose-600' :
                    e.risk === 'HIGH' ? 'text-amber-600' :
                    e.risk === 'MEDIUM' ? 'text-blue-600' :
                    'text-slate-500'
                  }`}>
                    {e.risk}
                  </span>
                </div>
             </div>
             <div className="grid grid-cols-2 gap-4">
                <div>
                   <p className="text-[10px] text-slate-400 font-bold uppercase">Actor</p>
                   <p className="text-xs font-bold text-slate-700">{e.actor}</p>
                   <p className="text-[10px] text-slate-400">{e.role}</p>
                </div>
                <div>
                   <p className="text-[10px] text-slate-400 font-bold uppercase">Record</p>
                   <p className="text-xs font-mono font-bold text-indigo-600">{e.recordId}</p>
                </div>
             </div>
             <div className="flex justify-between items-center pt-2 border-t border-slate-50">
                <span className="text-[10px] font-bold text-slate-500">{e.tenantBranch}</span>
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500">
                  <Clock className="h-3 w-3" /> {new Date(e.timestamp).toLocaleString()}
                </div>
             </div>
          </div>
        ))}
      </div>

      {/* Desktop Table View */}
      <table className="w-full text-left border-collapse hidden md:table">
        <thead className="bg-slate-50/50 border-b border-slate-100">
          <tr>
            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Event</th>
            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Actor / Role</th>
            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Tenant / Branch</th>
            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Record</th>
            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Risk</th>
            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Time</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {events.map((e) => (
            <tr key={e.id} className="hover:bg-slate-50/50 transition-colors cursor-pointer">
              <td className="px-6 py-4">
                <span className="text-xs font-black text-slate-800">
                  {e.eventType.replace(/_/g, ' ')}
                  {e.isMock && <span className="ml-2 text-[9px] font-black bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">MOCK</span>}
                </span>
                <p className="text-[10px] text-slate-400 font-bold uppercase">{e.id}</p>
              </td>
              <td className="px-6 py-4">
                <span className="text-xs font-bold text-slate-700">{e.actor}</span>
                <p className="text-[10px] text-slate-400">{e.role}</p>
              </td>
              <td className="px-6 py-4 text-[10px] font-bold text-slate-500">{e.tenantBranch}</td>
              <td className="px-6 py-4 text-xs font-mono font-bold text-indigo-600">{e.recordId}</td>
              <td className="px-6 py-4">
                <div className="flex items-center gap-1.5">
                  {e.risk === 'CRITICAL' ? <AlertTriangle className="h-3.5 w-3.5 text-rose-500" /> :
                   e.risk === 'HIGH' ? <AlertTriangle className="h-3.5 w-3.5 text-amber-500" /> :
                   <ShieldCheck className="h-3.5 w-3.5 text-blue-500" />}
                  <span className={`text-[9px] font-black ${
                    e.risk === 'CRITICAL' ? 'text-rose-600' :
                    e.risk === 'HIGH' ? 'text-amber-600' :
                    e.risk === 'MEDIUM' ? 'text-blue-600' :
                    'text-slate-500'
                  }`}>
                    {e.risk}
                  </span>
                </div>
              </td>
              <td className="px-6 py-4">
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500">
                  <Clock className="h-3 w-3" /> {new Date(e.timestamp).toLocaleString()}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="p-4 bg-amber-50 border-t border-amber-200 flex gap-3 items-start">
        <ShieldCheck className="h-4 w-4 text-amber-600 mt-0.5" />
        <p className="text-[10px] text-amber-700 font-bold">Audit-readiness note: Events are immutable. No audit deletion or mutation is performed in this phase. All actions are logged for compliance review.</p>
      </div>
      </>
      )}
    </div>
  );
};

export default ActivityAuditEventTable;
