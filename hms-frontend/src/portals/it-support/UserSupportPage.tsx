import React from 'react';
import ITScopeFilter from './components/ITScopeFilter';
import UserSupportQueue from './components/UserSupportQueue';
import { useSupportTickets } from '../../hooks/use-it-support';
import { HmsPageHeader } from '../../components/hms-page';
import { HmsDashboardShell, HmsAuditFooter, HmsLoadingSkeleton, HmsEmptyState } from '../../components/hms-dashboard';

export const UserSupportPage: React.FC = () => {
  const { tickets, loading, error, refetch } = useSupportTickets({ pageSize: 50 });

  return (
    <HmsDashboardShell widthTier="full">
      <div className="space-y-6 pb-12">
        <HmsPageHeader
          title="User Support Center"
          description="Login failures, MFA resets, account lockouts, and permission requests"
        />

        <ITScopeFilter displayOnly />

        {loading ? (
          <HmsLoadingSkeleton variant="table" rows={8} />
        ) : error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-xs text-red-700">
            <p className="font-semibold">Error loading support tickets</p>
            <p className="mt-1">{error}</p>
            <button onClick={() => refetch()} className="mt-2 font-semibold text-indigo-600 cursor-pointer hover:underline">Retry</button>
          </div>
        ) : tickets.length === 0 ? (
          <HmsEmptyState title="No support tickets" description="All issues resolved — no open tickets match the current filters." />
        ) : (
          <UserSupportQueue tickets={tickets.map(t => ({
            id: t.id,
            userName: t.reportedBy?.email || 'Unknown',
            userEmail: t.reportedBy?.email || '',
            userRole: '',
            tenantName: '',
            branchName: t.branch?.name || '',
            issueType: t.issueType,
            summary: t.summary,
            status: t.status,
            priority: t.priority,
            createdAt: new Date(t.createdAt).toLocaleString(),
          }))} />
        )}
      </div>
      <HmsAuditFooter />
    </HmsDashboardShell>
  );
};

export default UserSupportPage;
