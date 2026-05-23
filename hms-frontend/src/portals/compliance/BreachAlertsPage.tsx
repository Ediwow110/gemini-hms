import React, { useState } from 'react';
import { ShieldAlert, AlertTriangle, ShieldCheck, AlertCircle } from 'lucide-react';
import { BreachAlertPanel, BreachIncident } from './components/BreachAlertPanel';

export const BreachAlertsPage: React.FC = () => {
  const [incidents, setIncidents] = useState<BreachIncident[]>([
    {
      id: "INC-901",
      timestamp: "2026-05-21 11:15:00",
      severity: "CRITICAL",
      source: "Tenant Partition Leak Guard",
      tenantName: "MediClinics Group",
      branchName: "MediClinics Central",
      dataCategory: "PHI / Clinical History Records",
      status: "INVESTIGATING",
      description: "Anomalous multi-patient decrypt request from unauthorized external IP scope.",
      timeline: [
        { time: "11:15:02", event: "Decrypt API rate limit threshold exceeded (150 requests/sec)" },
        { time: "11:16:00", event: "Automated alert logged in CISO dashboard" },
        { time: "11:20:11", event: "Compliance officer assigned to investigate log trail" }
      ]
    },
    {
      id: "INC-902",
      timestamp: "2026-05-21 08:30:22",
      severity: "HIGH",
      source: "Failed Login Guard",
      tenantName: "St. Jude Hospital Network",
      branchName: "St. Jude Metro",
      dataCategory: "Credentials / Auth Keys",
      status: "INVESTIGATING",
      description: "Possible credential stuffing target. 24 failed login attempts on dr.martinez account.",
      timeline: [
        { time: "08:30:22", event: "Brute-force alert triggered on IP: 198.51.100.42" },
        { time: "08:35:00", event: "IP range temporarily rate-limited at load balancer level" }
      ]
    },
    {
      id: "INC-903",
      timestamp: "2026-05-20 14:12:00",
      severity: "MEDIUM",
      source: "Audit Event Analyzer",
      tenantName: "Apex Healthcare Services",
      branchName: "Apex West",
      dataCategory: "Operational Metadata",
      status: "CONTAINED",
      description: "Admin supporting logs export from unapproved backup workstation.",
      timeline: [
        { time: "14:12:00", event: "Audit trail log generated" },
        { time: "14:45:00", event: "Security staff verified workstation credentials and closed ticket" }
      ]
    }
  ]);

  const handleIncidentUpdate = (id: string, action: 'ESCALATE' | 'CONTAIN') => {
    setIncidents(prev => prev.map(inc => {
      if (inc.id === id) {
        return {
          ...inc,
          status: action === 'ESCALATE' ? 'ESCALATED' : 'CONTAINED',
          timeline: [
            ...inc.timeline,
            {
              time: new Date().toLocaleTimeString(),
              event: action === 'ESCALATE' ? 'Escalated incident to CISO response chain' : 'Marked incident as contained'
            }
          ]
        };
      }
      return inc;
    }));
  };

  const activeCritical = incidents.filter(i => i.severity === 'CRITICAL' && i.status !== 'CONTAINED').length;
  const activeHigh = incidents.filter(i => i.severity === 'HIGH' && i.status !== 'CONTAINED').length;
  const totalContained = incidents.filter(i => i.status === 'CONTAINED').length;

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-800 tracking-tight" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Breach & Threat Alert Console
          </h2>
          <p className="text-xs text-slate-500 font-medium">Investigate real-time security alerts, anomalous data access patterns, and partition leaks</p>
        </div>
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex gap-2 text-[10px] text-amber-800 leading-normal max-w-md">
          <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
          <p>
            <strong>Sandbox Safety Rule:</strong> Breach alerts are simulation structures. No real intrusion detection automation, CISO notification dispatches, or firewall rules are triggered by containment actions.
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center justify-between shadow-sm">
          <div>
            <p className="text-[9px] text-rose-500 font-bold uppercase tracking-wider">Active Critical Threats</p>
            <p className="text-xl font-extrabold text-rose-900 tracking-tight font-mono">{activeCritical} Incident</p>
          </div>
          <div className="p-2.5 bg-rose-100 border border-rose-350 rounded-xl text-rose-800 animate-pulse">
            <ShieldAlert className="h-5 w-5" />
          </div>
        </div>

        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-between shadow-sm">
          <div>
            <p className="text-[9px] text-amber-500 font-bold uppercase tracking-wider">Active High Threats</p>
            <p className="text-xl font-extrabold text-amber-900 tracking-tight font-mono">{activeHigh} Incident</p>
          </div>
          <div className="p-2.5 bg-amber-100 border border-amber-350 rounded-xl text-amber-800">
            <AlertCircle className="h-5 w-5" />
          </div>
        </div>

        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between shadow-sm">
          <div>
            <p className="text-[9px] text-emerald-500 font-bold uppercase tracking-wider">Contained & Resolved</p>
            <p className="text-xl font-extrabold text-emerald-900 tracking-tight font-mono">{totalContained} Incidents</p>
          </div>
          <div className="p-2.5 bg-emerald-100 border border-emerald-350 rounded-xl text-emerald-800">
            <ShieldCheck className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Alerts Grid Component */}
      <div className="space-y-4">
        <div className="flex justify-between items-center px-1">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Threat Investigation Dashboard</h3>
        </div>
        <BreachAlertPanel incidents={incidents} onIncidentUpdate={handleIncidentUpdate} />
      </div>
    </div>
  );
};

export default BreachAlertsPage;
