import React, { useState } from 'react';
import { AlertCircle, Zap, ShieldCheck, HelpCircle } from 'lucide-react';
import { StatusBadge } from '../../../components/feedback/StatusBadge';

export interface BreachIncident {
  id: string;
  timestamp: string;
  severity: 'MEDIUM' | 'HIGH' | 'CRITICAL';
  source: string;
  tenantName: string;
  branchName: string;
  dataCategory: string;
  status: 'INVESTIGATING' | 'ESCALATED' | 'CONTAINED';
  description: string;
  timeline: { time: string; event: string }[];
}

interface BreachAlertPanelProps {
  incidents: BreachIncident[];
  onIncidentUpdate?: (id: string, action: 'ESCALATE' | 'CONTAIN') => void;
}

export const BreachAlertPanel: React.FC<BreachAlertPanelProps> = ({ incidents, onIncidentUpdate }) => {
  const [selectedIncident, setSelectedIncident] = useState<BreachIncident | null>(null);

  const handleIncidentAction = (id: string, action: 'ESCALATE' | 'CONTAIN') => {
    if (onIncidentUpdate) {
      onIncidentUpdate(id, action);
      // Update local state preview
      if (selectedIncident && selectedIncident.id === id) {
        setSelectedIncident({
          ...selectedIncident,
          status: action === 'ESCALATE' ? 'ESCALATED' : 'CONTAINED',
          timeline: [
            ...selectedIncident.timeline,
            { 
              time: new Date().toLocaleTimeString(), 
              event: action === 'ESCALATE' ? 'Escalated incident to CISO response chain' : 'Marked incident as contained, logged IP ranges' 
            }
          ]
        });
      }
    }
  };

  const getSeverityBadge = (sev: string) => {
    switch (sev) {
      case 'CRITICAL':
        return 'danger';
      case 'HIGH':
        return 'warning';
      default:
        return 'warning';
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left List Pane */}
      <div className="lg:col-span-2 space-y-4">
        <div className="card bg-white border border-slate-200/80 shadow-sm rounded-2xl p-4">
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">Active Incidents List</h4>
          <div className="space-y-3">
            {incidents.map((inc) => (
              <div 
                key={inc.id}
                onClick={() => setSelectedIncident(inc)}
                className={`p-4 rounded-xl border transition-all duration-200 cursor-pointer flex justify-between items-start ${
                  selectedIncident?.id === inc.id
                    ? 'bg-indigo-50/40 border-indigo-300 shadow-sm'
                    : 'bg-slate-50/50 hover:bg-slate-50 border-slate-200/80'
                }`}
              >
                <div className="space-y-1.5 min-w-0 pr-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono font-bold text-xs text-slate-700">{inc.id}</span>
                    <StatusBadge status={inc.severity} type={getSeverityBadge(inc.severity)} />
                    <StatusBadge status={inc.status} type={inc.status === 'CONTAINED' ? 'success' : inc.status === 'ESCALATED' ? 'danger' : 'warning'} />
                  </div>
                  <p className="text-xs font-bold text-slate-800 truncate">{inc.description}</p>
                  <p className="text-[10px] text-slate-400 font-semibold">
                    Source: {inc.source} | Category: {inc.dataCategory}
                  </p>
                  <p className="text-[10px] text-slate-400 font-mono">
                    Scope: {inc.tenantName} - {inc.branchName}
                  </p>
                </div>
                <span className="text-[10px] text-slate-400 font-mono flex-shrink-0">{inc.timestamp}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Detail Pane */}
      <div className="lg:col-span-1">
        {selectedIncident ? (
          <div className="card bg-white border border-slate-200/80 shadow-sm rounded-2xl p-5 space-y-5 sticky top-5">
            <div className="border-b pb-3 border-slate-100">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Incident details</h4>
              <p className="text-[10px] text-slate-400 mt-0.5 font-mono">ID: {selectedIncident.id}</p>
            </div>

            <div className="space-y-3.5 text-xs text-slate-600">
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Incident description</p>
                <p className="font-semibold text-slate-700">{selectedIncident.description}</p>
              </div>

              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase mb-1.5">Scope & Location</p>
                <div className="bg-slate-50 border p-2.5 rounded-xl space-y-1">
                  <p className="font-bold text-slate-700">{selectedIncident.tenantName}</p>
                  <p className="font-semibold text-slate-500">{selectedIncident.branchName}</p>
                </div>
              </div>

              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase mb-2">Investigation timeline</p>
                <div className="space-y-3 pl-3 border-l border-slate-200">
                  {selectedIncident.timeline.map((t, idx) => (
                    <div key={idx} className="relative">
                      <div className="absolute -left-[16px] top-1.5 h-2 w-2 rounded-full bg-indigo-500" />
                      <p className="text-[10px] text-slate-400 font-semibold font-mono">{t.time}</p>
                      <p className="font-medium text-slate-600">{t.event}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-3 bg-amber-50 border border-amber-150 rounded-xl flex gap-2 text-[10px] text-amber-800 leading-normal">
                <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                <p>
                  <strong>No Automated Containment:</strong> Real session termination, credential freezing, or security firewalls are simulated. Any containment acts solely as local state mockup flags.
                </p>
              </div>
            </div>

            {selectedIncident.status === 'INVESTIGATING' && (
              <div className="pt-2 flex gap-2">
                <button
                  onClick={() => handleIncidentAction(selectedIncident.id, 'ESCALATE')}
                  className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1 cursor-pointer transition-colors"
                >
                  <Zap className="h-3.5 w-3.5" /> Escalate Incident
                </button>
                <button
                  onClick={() => handleIncidentAction(selectedIncident.id, 'CONTAIN')}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1 cursor-pointer transition-colors"
                >
                  <ShieldCheck className="h-3.5 w-3.5" /> Contain Alert
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="card bg-slate-50/50 border border-dashed border-slate-350 rounded-2xl p-8 text-center text-slate-400 space-y-2.5">
            <HelpCircle className="h-8 w-8 mx-auto text-slate-300" />
            <div>
              <p className="text-xs font-bold text-slate-600">No incident selected</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Select an incident from the grid to open the response panel.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
export default BreachAlertPanel;
