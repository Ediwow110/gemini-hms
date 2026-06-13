import React from 'react';
import ITScopeFilter from './components/ITScopeFilter';
import BackupStatusCard, { BackupEntry } from './components/BackupStatusCard';
import { HmsPageHeader } from '../../components/hms-page';
import { HmsDashboardShell, HmsAuditFooter } from '../../components/hms-dashboard';

export const BackupRestorePage: React.FC = () => {
  const mockBackups: BackupEntry[] = [
    {
      id: 'BKP-2026-05-21-FULL', name: 'Full Database Snapshot', type: 'FULL', status: 'COMPLETED',
      size: '18.4 GB', createdAt: '2026-05-21 02:14', duration: '14m 32s', retentionDays: 90, rpoMet: true
    },
    {
      id: 'BKP-2026-05-21-INC', name: 'Incremental WAL Backup', type: 'INCREMENTAL', status: 'COMPLETED',
      size: '420 MB', createdAt: '2026-05-21 08:00', duration: '1m 05s', retentionDays: 30, rpoMet: true
    },
    {
      id: 'BKP-2026-05-21-SNAP', name: 'VM Snapshot (App Server)', type: 'SNAPSHOT', status: 'IN_PROGRESS',
      size: '~32 GB', createdAt: '2026-05-21 14:00', duration: '~20m', retentionDays: 14, rpoMet: true
    },
    {
      id: 'BKP-2026-05-20-FULL', name: 'Full Database Snapshot', type: 'FULL', status: 'COMPLETED',
      size: '18.2 GB', createdAt: '2026-05-20 02:12', duration: '13m 58s', retentionDays: 90, rpoMet: true
    },
    {
      id: 'BKP-2026-05-19-FULL', name: 'Full Database Snapshot', type: 'FULL', status: 'COMPLETED',
      size: '18.1 GB', createdAt: '2026-05-19 02:10', duration: '14m 10s', retentionDays: 90, rpoMet: true
    },
    {
      id: 'BKP-2026-05-18-SNAP', name: 'VM Snapshot (DB Replica)', type: 'SNAPSHOT', status: 'FAILED',
      size: '0 B', createdAt: '2026-05-18 14:00', duration: '0s', retentionDays: 14, rpoMet: false
    }
  ];

  return (
    <HmsDashboardShell widthTier="full">
      <div className="space-y-6 pb-12">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <HmsPageHeader
            title="Backup & Disaster Recovery"
            description="Database snapshots, WAL archives, VM snapshots, and RPO/RTO compliance"
          />
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-1.5 text-[10px] text-amber-800 font-semibold max-w-md">
            <strong>Sandbox Notice:</strong> Backup data is simulated. No real backups, downloads, or restores are triggered.
          </div>
        </div>

        <ITScopeFilter />

        <BackupStatusCard backups={mockBackups} rpoTarget="≤ 1 Hour" rtoTarget="≤ 4 Hours" />
      </div>
      <HmsAuditFooter />
    </HmsDashboardShell>
  );
};

export default BackupRestorePage;
