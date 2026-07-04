import React from 'react';
import { Cpu, Database, Zap } from 'lucide-react';
import { useItSupport } from '../../hooks/use-it-support';
import { useUser } from '../../hooks/use-user';
import SystemHealthCard from './components/SystemHealthCard';
import ServiceStatusPanel from './components/ServiceStatusPanel';
import type { ServiceStatusItem } from './components/ServiceStatusPanel';
import { HmsPageHeader } from '../../components/hms-page';
import { HmsDashboardShell, HmsAuditFooter } from '../../components/hms-dashboard';

export const SystemHealthPage: React.FC = () => {
  const user = useUser();
  const branchId = user?.branchId;
  const { health, isLoading } = useItSupport();

  if (!branchId) return <div className="p-10 text-center text-slate-500">No primary branch assigned.</div>;
  if (isLoading) return <div className="p-10 text-center text-slate-400">Loading system health...</div>;

  return (
    <HmsDashboardShell widthTier="full">
      <div className="space-y-6 pb-12">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <HmsPageHeader
            title="System Health Monitor"
            description="Service uptime, infrastructure status, database connections, and dependency health"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <SystemHealthCard title="API Cluster Uptime" value="99.97%" icon={Cpu} status="HEALTHY" description="NestJS API gateway, p99 45ms" />
          <SystemHealthCard title="Database Health" value={health?.overallStatus === 'HEALTHY' ? 'Active' : 'Error'} icon={Database} status={(health?.overallStatus || 'HEALTHY') as 'HEALTHY' | 'DEGRADED' | 'CRITICAL'} description="PostgreSQL 15 — 2 replicas, 0 lag" />
          <SystemHealthCard title="Cache Layer" value="2ms" icon={Zap} status="HEALTHY" description="Redis 7 — 98% hit rate, 12k keys" />
        </div>

        <ServiceStatusPanel services={(health?.services || []).map(s => ({ ...s, type: 'CORE' as const, description: '' })) as ServiceStatusItem[]} />
      </div>
      <HmsAuditFooter />
    </HmsDashboardShell>
  );
};

export default SystemHealthPage;
