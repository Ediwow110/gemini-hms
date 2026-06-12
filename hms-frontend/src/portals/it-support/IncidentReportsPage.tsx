import React from 'react';
import ITScopeFilter from './components/ITScopeFilter';
import IncidentTimeline from './components/IncidentTimeline';
import { useSupportTickets } from '../../hooks/use-it-support';
import { HmsPageHeader } from '../../components/hms-page';
import { HmsDashboardShell, HmsAuditFooter, HmsLoadingSkeleton, HmsEmptyState } from '../../components/hms-dashboard';

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
    <HmsDashboardShell widthTier="full">
      <div className="space-y-6 pb-12">
        <HmsPageHeader
          title="Incident Reports & Postmortems"
          description="System outages, security alerts, degradation events, and resolution tracking"
        />

        <ITScopeFilter />

        {loading ? (
          <HmsLoadingSkeleton variant="alert-rail" />
        ) : allIncidents.length === 0 ? (
          <HmsEmptyState title="No incidents found" description="High-priority tickets will appear here as incidents." />
        ) : (
          <IncidentTimeline incidents={allIncidents} />
        )}
      </div>
      <HmsAuditFooter />
    </HmsDashboardShell>
  );
};

export default IncidentReportsPage;
