import { useState } from 'react';
import { 
  Building, 
  Users, 
  ShieldAlert, 
  History,
  AlertTriangle,
  Play,
  Key,
  ShieldCheck
} from 'lucide-react';
import { PageHeader } from '../../components/ui/page-header';
import { TenantHealthCard } from './components/TenantHealthCard';
import { BranchActivityPanel } from './components/BranchActivityPanel';
import { SecurityAlertPanel } from './components/SecurityAlertPanel';
import { AuditEventTable } from './components/AuditEventTable';
import { SystemHealthCard } from './components/SystemHealthCard';

export const SuperAdminDashboard = () => {
  const [activeActionModal, setActiveActionModal] = useState<string | null>(null);

  // Mock data for Dashboard components
  const mockTenants = [
    {
      id: "TEN-001",
      name: "St. Jude Hospital Network",
      status: "HEALTHY" as const,
      tier: "ENTERPRISE",
      branchCount: 8,
      userCount: 142,
      dbSize: "42.5 GB",
      cpuUsage: 28,
      ramUsage: 64,
      errorRate: 0.012,
      region: "US-East"
    },
    {
      id: "TEN-002",
      name: "MediClinics Group",
      status: "DEGRADED" as const,
      tier: "PREMIUM",
      branchCount: 3,
      userCount: 48,
      dbSize: "12.8 GB",
      cpuUsage: 89,
      ramUsage: 78,
      errorRate: 1.450,
      region: "AP-South"
    }
  ];

  const mockBranches = [
    {
      id: "BR-101",
      name: "St. Jude - Metro Manila",
      tenant: "St. Jude Hospital Network",
      status: "ACTIVE" as const,
      director: "Dr. Sarah Almeda",
      doctors: 18,
      nurses: 34,
      beds: 120,
      activeQueue: 14,
      latency: 42,
      encountersToday: 68
    }
  ];

  const mockAlerts = [
    {
      id: "AL-01",
      type: "FAILED_LOGIN" as const,
      title: "Multiple Failed Logins",
      description: "5 failed attempts on user 'admin@mediclinics.com' from IP 192.168.4.12",
      time: "10 mins ago",
      severity: "WARNING" as const
    },
    {
      id: "AL-02",
      type: "LOCKED_ACCOUNT" as const,
      title: "Account Locked Automatically",
      description: "User account 'dr.stein@hms.com' locked due to suspected brute force pattern.",
      time: "24 mins ago",
      severity: "CRITICAL" as const
    }
  ];

  const mockEvents = [
    {
      id: "AUD-101",
      timestamp: "2026-05-21 13:12:04",
      actor: "Global Admin",
      role: "Super Admin",
      action: "user.role.assign",
      ipAddress: "192.168.1.1",
      tenant: "System-wide",
      branch: "All Branches",
      hash: "8a4f91b2c3d4e5f67a8b9c0d1e2f3a4b",
      risk: "MEDIUM" as const
    },
    {
      id: "AUD-102",
      timestamp: "2026-05-21 13:15:33",
      actor: "System Security Monitor",
      role: "Governance System",
      action: "security.ip.blacklist",
      ipAddress: "127.0.0.1",
      tenant: "MediClinics Group",
      branch: "Singapore Branch",
      hash: "1234567890abcdef1234567890abcdef",
      risk: "HIGH" as const
    }
  ];

  const mockSystem = {
    cpuLoad: 34,
    ramLoad: 58,
    dbLatency: 12,
    redisStatus: "ONLINE" as const,
    queueStatus: "ONLINE" as const,
    smtpStatus: "ONLINE" as const,
    uptime: "214 days, 5 hours"
  };

  const handleQuickAction = (actionKey: string) => {
    setActiveActionModal(actionKey);
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      
      {/* Sandbox Warning Banner */}
      <div className="p-4 bg-amber-50 border border-amber-150 rounded-2xl flex gap-3 text-xs text-amber-800">
        <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
        <div>
          <h5 className="font-extrabold uppercase text-[10px] tracking-wider">UI Governance Demonstration Sandbox</h5>
          <p className="font-medium mt-0.5">
            This administration console executes in local sandbox memory. Multi-tenant partitioning, branch provisioning, global RBAC updates, and user lockouts are simulated in-memory. No live changes are persistent, and no production settings are modified.
          </p>
        </div>
      </div>

      <div className="flex justify-between items-center">
        <PageHeader 
          title="SuperAdmin Governance Console" 
          description="Multi-tenant operations, global security thresholds, active clusters, and audit records." 
        />
      </div>

      {/* Grid: High-level Governance KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-4 flex items-center gap-4 bg-white border border-slate-200/80 shadow-sm rounded-2xl">
          <div className="p-3 bg-indigo-50 border border-indigo-100 text-indigo-700 rounded-2xl">
            <Building className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 leading-none mb-1">Active Tenants</p>
            <p className="text-xl font-black text-slate-800">12</p>
          </div>
        </div>

        <div className="card p-4 flex items-center gap-4 bg-white border border-slate-200/80 shadow-sm rounded-2xl">
          <div className="p-3 bg-violet-50 border border-violet-100 text-violet-700 rounded-2xl">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 leading-none mb-1">Active Users</p>
            <p className="text-xl font-black text-slate-800">312</p>
          </div>
        </div>

        <div className="card p-4 flex items-center gap-4 bg-white border border-slate-200/80 shadow-sm rounded-2xl">
          <div className="p-3 bg-rose-50 border border-rose-100 text-rose-700 rounded-2xl">
            <ShieldAlert className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 leading-none mb-1">Active Alerts</p>
            <p className="text-xl font-black text-slate-800">2</p>
          </div>
        </div>

        <div className="card p-4 flex items-center gap-4 bg-white border border-slate-200/80 shadow-sm rounded-2xl">
          <div className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-2xl">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 leading-none mb-1">Audit Chain</p>
            <p className="text-sm font-black text-emerald-700 uppercase">VERIFIED</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Tenant Status & SLA Latency */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Active Tenants Section */}
          <div className="space-y-4">
            <h3 className="font-bold text-slate-800 text-xs tracking-wider uppercase flex items-center gap-2">
              Tenant Cluster Overview
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {mockTenants.map((tenant) => (
                <TenantHealthCard key={tenant.id} tenant={tenant} />
              ))}
            </div>
          </div>

          {/* Active Branches Section */}
          <div className="space-y-4">
            <h3 className="font-bold text-slate-800 text-xs tracking-wider uppercase flex items-center gap-2">
              Branch Activity Streams
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {mockBranches.map((branch) => (
                <BranchActivityPanel key={branch.id} branch={branch} />
              ))}
            </div>
          </div>

          {/* Infrastructure Health */}
          <SystemHealthCard metrics={mockSystem} />
        </div>

        {/* Right Column: Security Controls & Action Panel */}
        <div className="space-y-6">
          {/* Security Center Preview */}
          <SecurityAlertPanel alerts={mockAlerts} />

          {/* Quick Actions */}
          <div className="card p-5 bg-white border border-slate-200/80 shadow-sm rounded-2xl space-y-4">
            <h3 className="font-bold text-slate-800 text-sm tracking-wider uppercase border-b border-slate-100 pb-3">
              Governance Actions
            </h3>

            <div className="grid grid-cols-1 gap-2">
              <button 
                onClick={() => handleQuickAction('PROVISION_TENANT')}
                className="w-full flex items-center gap-3 px-4 py-3 bg-slate-50 hover:bg-indigo-50 border border-slate-200/60 hover:border-indigo-150 rounded-xl text-left text-xs font-semibold text-slate-700 transition-all cursor-pointer group"
              >
                <div className="p-2 bg-white text-slate-400 group-hover:text-indigo-600 rounded-lg border border-slate-100 shadow-sm">
                  <Building className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-slate-800 font-bold group-hover:text-indigo-900">Provision Tenant</p>
                  <p className="text-[9px] text-slate-400 mt-0.5">Spin up new isolated partition</p>
                </div>
              </button>

              <button 
                onClick={() => handleQuickAction('RESET_MFA')}
                className="w-full flex items-center gap-3 px-4 py-3 bg-slate-50 hover:bg-indigo-50 border border-slate-200/60 hover:border-indigo-150 rounded-xl text-left text-xs font-semibold text-slate-700 transition-all cursor-pointer group"
              >
                <div className="p-2 bg-white text-slate-400 group-hover:text-indigo-600 rounded-lg border border-slate-100 shadow-sm">
                  <Key className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-slate-800 font-bold group-hover:text-indigo-900">Enforce User MFA</p>
                  <p className="text-[9px] text-slate-400 mt-0.5">Require 2FA config systemwide</p>
                </div>
              </button>

              <button 
                onClick={() => handleQuickAction('MAINTENANCE_MODE')}
                className="w-full flex items-center gap-3 px-4 py-3 bg-slate-50 hover:bg-indigo-50 border border-slate-200/60 hover:border-indigo-150 rounded-xl text-left text-xs font-semibold text-slate-700 transition-all cursor-pointer group"
              >
                <div className="p-2 bg-white text-slate-400 group-hover:text-indigo-600 rounded-lg border border-slate-100 shadow-sm">
                  <Play className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-slate-800 font-bold group-hover:text-indigo-900">Cluster Maintenance</p>
                  <p className="text-[9px] text-slate-400 mt-0.5">Schedule downtime or updates</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Recent High-Risk Logs */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-slate-800 text-xs tracking-wider uppercase flex items-center gap-2">
            <History className="h-4 w-4 text-indigo-500" />
            Global High-Risk Audit Stream
          </h3>
        </div>
        <AuditEventTable events={mockEvents} />
      </div>

      {/* Quick Action Modal Dialog */}
      {activeActionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 shadow-2xl max-w-sm w-full border border-slate-200 animate-scale-in relative">
            <div className="flex gap-3 mb-4">
              <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl h-fit border border-amber-100">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider select-none">
                  Simulated Action
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Mock governance sandbox execution</p>
              </div>
            </div>
            
            <div className="space-y-3 text-xs text-slate-600 leading-relaxed border-t border-b border-slate-100 py-4">
              <p>
                Requested Action: <strong className="text-slate-800 uppercase font-mono">{activeActionModal}</strong>
              </p>
              <p className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 font-medium">
                This is a UI demo shell only. Tenant clustering, MFA enforcement policies, and database partitioning are simulated in local sandbox memory. No operational updates are committed to the backend.
              </p>
            </div>

            <div className="mt-5 flex gap-2">
              <button 
                onClick={() => setActiveActionModal(null)}
                className="w-full btn border border-slate-200 hover:bg-slate-50 font-bold py-2 rounded-xl text-slate-700 transition-colors"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default SuperAdminDashboard;
