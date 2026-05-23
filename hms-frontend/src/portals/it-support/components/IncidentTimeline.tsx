import React from 'react';
import { AlertOctagon, Clock, User, CheckCircle, ArrowRight } from 'lucide-react';
import { StatusBadge } from '../../../components/feedback/StatusBadge';

export interface IncidentEntry {
  id: string;
  title: string;
  severity: 'SEV1' | 'SEV2' | 'SEV3' | 'SEV4';
  status: 'OPEN' | 'INVESTIGATING' | 'MITIGATED' | 'RESOLVED' | 'POSTMORTEM';
  detectedAt: string;
  resolvedAt?: string;
  owner: string;
  affectedServices: string[];
  summary: string;
  impactDescription: string;
}

interface IncidentTimelineProps {
  incidents: IncidentEntry[];
}

export const IncidentTimeline: React.FC<IncidentTimelineProps> = ({ incidents }) => {
  const getSeverityType = (severity: string) => {
    switch (severity) {
      case 'SEV1': return 'danger';
      case 'SEV2': return 'danger';
      case 'SEV3': return 'warning';
      default: return 'info';
    }
  };

  const getSeverityBg = (severity: string) => {
    switch (severity) {
      case 'SEV1': return 'border-l-rose-500 bg-rose-50/30';
      case 'SEV2': return 'border-l-orange-500 bg-orange-50/30';
      case 'SEV3': return 'border-l-amber-500 bg-amber-50/30';
      default: return 'border-l-slate-300 bg-slate-50/30';
    }
  };

  return (
    <div className="bg-white border border-slate-200/80 shadow-sm rounded-2xl p-5 space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <AlertOctagon className="h-4 w-4 text-indigo-500" />
            Incident Timeline
          </h3>
          <p className="text-[10px] text-slate-400 font-medium">System incident reports, alert tracking, and resolution timelines</p>
        </div>
        <div className="flex gap-2">
          <span className="text-[10px] bg-rose-50 text-rose-700 font-bold px-2 py-1 rounded-lg border border-rose-200">
            {incidents.filter(i => i.status === 'OPEN' || i.status === 'INVESTIGATING').length} active
          </span>
        </div>
      </div>

      <div className="space-y-3">
        {incidents.map((incident) => (
          <div
            key={incident.id}
            className={`p-4 border border-slate-200/60 rounded-xl border-l-4 ${getSeverityBg(incident.severity)} hover:shadow-sm transition-shadow`}
          >
            <div className="flex justify-between items-start mb-2">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-[9px] text-slate-400 font-bold">{incident.id}</span>
                  <StatusBadge status={incident.severity} type={getSeverityType(incident.severity)} />
                  <StatusBadge
                    status={incident.status}
                    type={
                      incident.status === 'RESOLVED' || incident.status === 'POSTMORTEM' ? 'success' :
                      incident.status === 'MITIGATED' ? 'warning' :
                      incident.status === 'INVESTIGATING' ? 'info' : 'danger'
                    }
                  />
                </div>
                <h4 className="text-xs font-bold text-slate-800">{incident.title}</h4>
              </div>
            </div>

            <p className="text-[11px] text-slate-600 font-medium mb-2">{incident.summary}</p>

            <div className="flex flex-wrap gap-1.5 mb-2">
              {incident.affectedServices.map((svc) => (
                <span key={svc} className="px-2 py-0.5 bg-white border border-slate-200 text-[9px] font-bold rounded-md text-slate-500">
                  {svc}
                </span>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-4 pt-2 border-t border-slate-100 text-[10px]">
              <div className="flex items-center gap-1 text-slate-400">
                <Clock className="h-3 w-3" />
                <span>Detected: {incident.detectedAt}</span>
              </div>
              {incident.resolvedAt && (
                <div className="flex items-center gap-1 text-emerald-600">
                  <CheckCircle className="h-3 w-3" />
                  <span>Resolved: {incident.resolvedAt}</span>
                </div>
              )}
              {!incident.resolvedAt && (
                <div className="flex items-center gap-1 text-amber-600">
                  <ArrowRight className="h-3 w-3" />
                  <span className="font-semibold">Ongoing</span>
                </div>
              )}
              <div className="flex items-center gap-1 text-slate-400 ml-auto">
                <User className="h-3 w-3" />
                <span className="font-semibold">{incident.owner}</span>
              </div>
            </div>

            <div className="mt-2 text-[10px] text-slate-500 bg-slate-50/80 p-2 rounded-lg border border-slate-100">
              <strong>Impact:</strong> {incident.impactDescription}
            </div>
          </div>
        ))}
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl px-3.5 py-2.5 text-[10px] text-amber-800 font-semibold">
        <strong>Sandbox Notice:</strong> All incident records are simulated. No real incident management, escalation, or alerting workflows are triggered from this view.
      </div>
    </div>
  );
};

export default IncidentTimeline;
