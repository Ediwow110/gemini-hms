import React from 'react';
import { useItSupport, type ItLog } from '../../hooks/use-it-support';
import { useUser } from '../../hooks/use-user';
import { LogStreamPanel, type LogEntry } from './components/LogStreamPanel';
import { HmsPageHeader } from '../../components/hms-page';
import { HmsDashboardShell, HmsAuditFooter } from '../../components/hms-dashboard';

export const LogsPage: React.FC = () => {
  const user = useUser();
  const branchId = user?.branchId;
  const { fetchLogs } = useItSupport();
  const [logs, setLogs] = React.useState<LogEntry[]>([]);

  React.useEffect(() => {
    if (branchId) {
      fetchLogs(branchId).then((data: ItLog[]) => {
        setLogs(data.map(l => ({
          id: l.id,
          timestamp: l.createdAt,
          severity: l.eventKey.includes('ERROR') || l.eventKey.includes('FAILURE') ? 'ERROR' as const : l.eventKey.includes('WARN') ? 'WARN' as const : 'INFO' as const,
          service: l.recordType,
          message: l.eventKey,
          traceId: l.sessionId,
        })));
      }).catch(console.error);
    }
  }, [branchId, fetchLogs]);

  if (!branchId) return <div className="p-10 text-center text-slate-500">No primary branch assigned.</div>;

  return (
    <HmsDashboardShell widthTier="full">
      <div className="space-y-6 pb-12">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <HmsPageHeader
            title="System Audit Logs"
            description="Filterable log stream with severity classification and service grouping"
          />
        </div>

        <LogStreamPanel logs={logs} />
      </div>
      <HmsAuditFooter />
    </HmsDashboardShell>
  );
};

export default LogsPage;
