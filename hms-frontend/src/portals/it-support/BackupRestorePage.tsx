import React from 'react';
import { useItSupport } from '../../hooks/use-it-support';
import { useUser } from '../../hooks/use-user';
import BackupStatusCard, { BackupEntry } from './components/BackupStatusCard';
import { HmsPageHeader } from '../../components/hms-page';
import { HmsDashboardShell, HmsAuditFooter } from '../../components/hms-dashboard';

export const BackupRestorePage: React.FC = () => {
  const user = useUser();
  const branchId = user?.branchId;
  const { backups, isLoading } = useItSupport();

  if (!branchId) return <div className="p-10 text-center text-slate-500">No primary branch assigned.</div>;
  if (isLoading) return <div className="p-10 text-center text-slate-400">Loading backups...</div>;

  return (
    <HmsDashboardShell widthTier="full">
      <div className="space-y-6 pb-12">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <HmsPageHeader
            title="Backup & Disaster Recovery"
            description="Database snapshots, WAL archives, VM snapshots, and RPO/RTO compliance"
          />
        </div>

        <BackupStatusCard backups={(backups || []) as BackupEntry[]} rpoTarget="≤ 1 Hour" rtoTarget="≤ 4 Hours" />
      </div>
      <HmsAuditFooter />
    </HmsDashboardShell>
  );
};

export default BackupRestorePage;
