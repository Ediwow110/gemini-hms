import React from 'react';
import ITScopeFilter from './components/ITScopeFilter';
import IncidentTimeline from './components/IncidentTimeline';
import { useSupportTickets } from '../../hooks/use-it-support';

export const IncidentReportsPage: React.FC = () => {
  // Fetch HIGH and URGENT tickets as incidents
  const { tickets, loading } = useSupportTickets({
    priority: 'HIGH',
    pageSize: 50,
  });
  const { tickets: urgentTickets } = useSupportTickets({
    priority: 'URGENT',
    pageSize: 50,
  });

  const allIncidents = [...(urgentTickets || []), ...(tickets || [])]
    .filter((t, i, arr) => arr.findIndex(x => x.id === t.id) === i) // deduplicate
    .map(t => ({
      id: t.id,
      title: t.summary,
      severity: t.priority === 'URGENT' ? 'SEV1' as const : t.priority === 'HIGH' ? 'SEV2' as const : 'SEV3' as const,
      status: t.status === 'OPEN' ? 'INVESTIGATING' as const : t.status === 'IN_PROGRESS' ? 'MITIGATED' as const : 'RESOLVED' as const,
      detectedAt: new Date(t.createdAt).toLocaleString(),
      owner: t.assignedTo?.email || 'Unassigned',
      affectedServices: [t.issueType],
      summary: t.summary,
      impactDescription: t.description || '',
    }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-800 tracking-tight" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Incident Reports & Postmortems
          </h2>
          <p className="text-xs text-slate-500 font-medium">System outages, security alerts, degradation events, and resolution tracking</p>
        </div>
      </div>

      <ITScopeFilter />

      {loading ? (
        <div className="card bg-white border border-slate-200/80 shadow-sm rounded-2xl p-12 text-center text-xs text-slate-400">
          Loading incidents...
        </div>
      ) : allIncidents.length === 0 ? (
        <div className="card bg-white border border-slate-200/80 shadow-sm rounded-2xl p-12 text-center text-xs text-slate-400">
          <p className="font-bold">No incidents found</p>
          <p className="mt-1">High-priority tickets will appear here as incidents.</p>
        </div>
      ) : (
        <IncidentTimeline incidents={allIncidents} />
      )}
    </div>
  );
};

export default IncidentReportsPage;
