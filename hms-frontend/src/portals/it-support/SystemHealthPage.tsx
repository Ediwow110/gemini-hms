import React from 'react';
import { Cpu, HardDrive, Wifi, Server, Zap, Database } from 'lucide-react';
import ITScopeFilter from './components/ITScopeFilter';
import SystemHealthCard from './components/SystemHealthCard';
import ServiceStatusPanel, { ServiceStatusItem } from './components/ServiceStatusPanel';
import { HmsPageHeader } from '../../components/hms-page';
import { HmsDashboardShell, HmsAuditFooter } from '../../components/hms-dashboard';

export const SystemHealthPage: React.FC = () => {
  const mockServices: ServiceStatusItem[] = [
    { id: 'SVC-01', name: 'HMS API Gateway', type: 'CORE', status: 'ONLINE', latency: 42, uptime: 99.973, description: 'Primary REST API entrypoint (NestJS)' },
    { id: 'SVC-02', name: 'PostgreSQL Primary', type: 'DATABASE', status: 'ONLINE', latency: 8, uptime: 99.999, description: 'Main relational database cluster' },
    { id: 'SVC-03', name: 'Redis Cache', type: 'DATABASE', status: 'ONLINE', latency: 2, uptime: 99.998, description: 'Session store and queue broker' },
    { id: 'SVC-04', name: 'Twilio SMS Provider', type: 'THIRD_PARTY', status: 'DEGRADED', latency: 320, uptime: 99.850, description: 'SMS appointment reminders and OTP delivery' },
    { id: 'SVC-05', name: 'SendGrid Email', type: 'THIRD_PARTY', status: 'ONLINE', latency: 180, uptime: 99.920, description: 'Transactional email and notification service' },
    { id: 'SVC-06', name: 'Payment Gateway (PayMaya)', type: 'THIRD_PARTY', status: 'ONLINE', latency: 250, uptime: 99.910, description: 'Online payment processing endpoint' },
    { id: 'SVC-07', name: 'HL7 Lab Adapter', type: 'ADAPTER', status: 'ONLINE', latency: 95, uptime: 99.940, description: 'HL7v2 message ingest from external LIS' },
    { id: 'SVC-08', name: 'FHIR R4 Bridge', type: 'ADAPTER', status: 'OFFLINE', latency: 0, uptime: 98.500, description: 'FHIR STU3/R4 interoperability connector' },
  ];

  return (
    <HmsDashboardShell widthTier="full">
      <div className="space-y-6 pb-12">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <HmsPageHeader
            title="System Health Monitor"
            description="Service uptime, infrastructure status, database connections, and dependency health"
          />
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-1.5 text-[10px] text-amber-800 font-semibold max-w-md">
            <strong>Sandbox Notice:</strong> All health metrics are simulated. No real infrastructure monitoring is running.
          </div>
        </div>

        <ITScopeFilter />

        {/* Health Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <SystemHealthCard title="API Cluster Uptime" value="99.97%" icon={Cpu} status="HEALTHY" description="NestJS API gateway, p99 45ms" />
          <SystemHealthCard title="Database Health" value="Active" icon={Database} status="HEALTHY" description="PostgreSQL 15 — 2 replicas, 0 lag" />
          <SystemHealthCard title="Cache Layer" value="2ms" icon={Zap} status="HEALTHY" description="Redis 7 — 98% hit rate, 12k keys" />
          <SystemHealthCard title="Worker Nodes" value="3 / 4" icon={Server} status="DEGRADED" description="1 worker node unresponsive (SMS queue)" />
          <SystemHealthCard title="Storage Volumes" value="62%" icon={HardDrive} status="HEALTHY" description="240 GB used of 400 GB provisioned" />
          <SystemHealthCard title="Network I/O" value="1.2 Gbps" icon={Wifi} status="HEALTHY" description="Ingress/Egress balanced, 0 packet loss" />
        </div>

        {/* Service Status Table */}
        <ServiceStatusPanel services={mockServices} />
      </div>
      <HmsAuditFooter />
    </HmsDashboardShell>
  );
};

export default SystemHealthPage;
