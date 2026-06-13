import React from 'react';
import { RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import FieldServiceShellNotice from './components/FieldServiceShellNotice';
import OfflineSyncStatusCard from './components/OfflineSyncStatusCard';
import { useFieldServiceOfflineSync } from '../../hooks/use-field-service';
import { HmsPageHeader } from '../../components/hms-page';
import { HmsDashboardShell, HmsAuditFooter, HmsLoadingSkeleton } from '../../components/hms-dashboard';

export const OfflineSyncQueuePage: React.FC = () => {
  const navigate = useNavigate();
  const { data: syncData, isLoading } = useFieldServiceOfflineSync();

  return (
    <HmsDashboardShell widthTier="full">
      <div className="space-y-6 max-w-2xl mx-auto">
        <HmsPageHeader
          title="Offline Sync Queue"
          description={syncData ? `${syncData.pendingCount} items awaiting connection` : 'Sync status'}
          badge="Sandbox"
          onBack={() => navigate(-1)}
        />

        <FieldServiceShellNotice />

        {isLoading ? (
          <HmsLoadingSkeleton variant="panel" />
        ) : (
          <>
            <OfflineSyncStatusCard />

            <div className="bg-indigo-900 rounded-[2rem] p-8 text-white relative overflow-hidden shadow-xl">
              <div className="relative z-10 space-y-4">
                <h3 className="text-lg font-black tracking-tight flex items-center gap-2">
                  <RefreshCw className="h-5 w-5 animate-spin-slow" />
                  Auto-Sync Active
                </h3>
                <p className="text-indigo-300 text-xs font-medium leading-relaxed">
                  The system will automatically attempt to upload your local data as soon as a stable internet connection is detected.
                </p>
                <button className="bg-white text-indigo-900 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase shadow-lg hover:scale-105 transition-all">
                  Retry Sync Now
                </button>
              </div>
            </div>
          </>
        )}
      </div>
      <HmsAuditFooter />
    </HmsDashboardShell>
  );
};

export default OfflineSyncQueuePage;
