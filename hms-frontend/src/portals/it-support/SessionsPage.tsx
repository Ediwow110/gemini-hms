import React from 'react';
import { useItSupport } from '../../hooks/use-it-support';
import { useUser } from '../../hooks/use-user';
import { SessionActivityTable, SessionEntry } from './components/SessionActivityTable';
import { HmsPageHeader } from '../../components/hms-page';
import { HmsDashboardShell, HmsAuditFooter } from '../../components/hms-dashboard';

export const SessionsPage: React.FC = () => {
  const user = useUser();
  const branchId = user?.branchId;
  const { sessions, isLoading } = useItSupport();

  if (!branchId) return <div className="p-10 text-center text-slate-500">No primary branch assigned.</div>;
  if (isLoading) return <div className="p-10 text-center text-slate-400">Loading active sessions...</div>;

  const mappedSessions = sessions?.map(s => ({
    id: s.id,
    userId: s.userId,
    userName: s.user.email.split('@')[0],
    userEmail: s.user.email,
    userRole: s.user.roles[0]?.role.name || 'Staff',
    tenantName: s.tenantId, // simplified
    branchName: s.branch?.name || 'Unknown Branch',
    ipAddress: s.ipAddress,
    userAgent: s.userAgent,
    loginAt: s.lastRotatedAt,
    lastActivity: s.lastRotatedAt,
    riskLevel: 'LOW', // Risk analysis not yet implemented in backend
    isActive: true,
  })) || [];

  return (
    <HmsDashboardShell widthTier="full">
      <div className="space-y-6 pb-12">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <HmsPageHeader
            title="Active User Sessions"
            description="Cross-tenant session monitoring, client analytics, and session revocation controls"
          />
        </div>

        <SessionActivityTable sessions={mappedSessions as SessionEntry[]} />
      </div>
      <HmsAuditFooter />
    </HmsDashboardShell>
  );
};

export default SessionsPage;
