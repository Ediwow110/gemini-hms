import React from 'react';
import { RefreshCw, Server } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../../hooks/use-user';
import FieldServiceShellNotice from './components/FieldServiceShellNotice';
import OfflineSyncStatusCard from './components/OfflineSyncStatusCard';
import { useFieldServiceOfflineSync } from '../../hooks/use-field-service';
import { HmsPageHeader } from '../../components/hms-page';
import { HmsDashboardShell, HmsAuditFooter, HmsLoadingSkeleton } from '../../components/hms-dashboard';

export const OfflineSyncQueuePage: React.FC = () => {
  const navigate = useNavigate();
  const user = useUser();
  const { data: syncData, isLoading } = useFieldServiceOfflineSync();
  const isAdmin = !!user && (user.roles.includes("Super Admin") || user.roles.includes("Branch Admin"));

  return (
    <HmsDashboardShell widthTier="full">
      <div className="space-y-6 max-w-2xl mx-auto">
        <HmsPageHeader
          title="Offline Sync Queue"
          description={isAdmin ? "Global Sync Infrastructure Status" : (syncData ? `${syncData.pendingCount} items awaiting connection` : 'Sync status')}
          badge={isAdmin ? "Admin" : "Sandbox"}
          onBack={() => navigate(-1)}
        />

        <FieldServiceShellNotice />

        {isLoading ? (
          <HmsLoadingSkeleton variant="panel" />
        ) : isAdmin ? (
          <div className="bg-white border border-slate-200 rounded-3xl p-8 space-y-6 shadow-sm text-center">
            <div className="h-16 w-16 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto">
              <Server className="h-8 w-8" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-800">Infrastructure Overview</h3>
              <p className="text-sm text-slate-500 max-w-xs mx-auto mt-2">
                Monitoring synchronization relays across all technician endpoints. Local queue management is restricted to active field personnel.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4 pt-4">
              <div className="p-4 bg-slate-50 rounded-2xl">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Relay Health</p>
                <p className="text-sm font-bold text-emerald-600">Operational</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-2xl">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Avg Latency</p>
                <p className="text-sm font-bold text-slate-800">124ms</p>
              </div>
            </div>
          </div>
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
