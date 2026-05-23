import React, { useState } from 'react';
import { 
  ShieldAlert, 
  Users, 
  History, 
  Database, 
  Lock, 
  Eye, 
  FileText, 
  TrendingUp, 
  ArrowRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ComplianceScopeFilter from './components/ComplianceScopeFilter';
import ComplianceRiskCard from './components/ComplianceRiskCard';
import PHIAccessTable, { PHIAccessEvent } from './components/PHIAccessTable';
import { StatusBadge } from '../../components/feedback/StatusBadge';

export const ComplianceDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [scope, setScope] = useState({ tenantId: 'all', branchId: 'all' });

  // Mock PHI Access Events
  const mockPHIAccessEvents: PHIAccessEvent[] = [
    {
      id: 'EVT-1002',
      timestamp: '2026-05-21 13:45:10',
      actorName: 'Dr. Evelyn Martinez',
      actorRole: 'Doctor',
      patientName: 'John Doe',
      patientId: 'PAT-8812',
      tenantName: 'St. Jude Hospital Network',
      branchName: 'St. Jude Metro',
      accessType: 'ROUTINE',
      reason: 'Standard EMR charting during consultation',
      riskScore: 12
    },
    {
      id: 'EVT-1003',
      timestamp: '2026-05-21 12:30:15',
      actorName: 'Nurse Marcus Vance',
      actorRole: 'Nurse',
      patientName: 'Jane Smith',
      patientId: 'PAT-4322',
      tenantName: 'St. Jude Hospital Network',
      branchName: 'St. Jude Metro',
      accessType: 'EMERGENCY',
      reason: 'Break-glass trigger: Critical triage entry in ICU',
      riskScore: 68
    },
    {
      id: 'EVT-1004',
      timestamp: '2026-05-21 11:15:00',
      actorName: 'Unknown Administrator',
      actorRole: 'System Admin',
      patientName: 'Robert Johnson',
      patientId: 'PAT-7019',
      tenantName: 'MediClinics Group',
      branchName: 'MediClinics Central',
      accessType: 'UNAUTHORIZED',
      reason: 'Access from anomalous IP range outside subnet',
      riskScore: 92
    }
  ];

  // Mock security/audit tasks
  const openComplianceTasks = [
    { id: 'TSK-01', text: 'Certify quarterly access permissions for St. Jude Metro', due: '2 days', severity: 'HIGH' },
    { id: 'TSK-02', text: 'Investigate 2 break-glass occurrences in St. Jude North', due: '5 days', severity: 'MEDIUM' },
    { id: 'TSK-03', text: 'Confirm retention clean-up dry-run log for MediClinics', due: 'Today', severity: 'CRITICAL' },
  ];

  // Mock privilege changes
  const recentPrivilegeChanges = [
    { id: 'PC-1', user: 'admin.support@stjude.org', action: 'Assigned "Billing Admin" role', actor: 'Super Admin', time: '1 hr ago' },
    { id: 'PC-2', user: 'dr.martinez@stjude.org', action: 'Bypassed temporary MFA policy', actor: 'Branch Admin', time: '3 hrs ago' },
  ];

  // Filter events based on selected tenant/branch mock scopes
  const filteredEvents = mockPHIAccessEvents.filter(e => {
    if (scope.tenantId !== 'all') {
      const matchTenant = scope.tenantId === 'TEN-001' ? 'St. Jude Hospital Network' : scope.tenantId === 'TEN-002' ? 'MediClinics Group' : 'Apex Healthcare Services';
      if (e.tenantName !== matchTenant) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-800 tracking-tight" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Compliance & Governance Workspace
          </h2>
          <p className="text-xs text-slate-500 font-medium">Real-time PHI monitor, audit-chain verifier, and data privacy dashboard</p>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-1.5 text-[10px] text-amber-800 font-semibold max-w-md">
          <strong>Sandbox Notice:</strong> You are viewing simulated metrics. No backend logs are mutated.
        </div>
      </div>

      {/* Scope Filter */}
      <ComplianceScopeFilter onScopeChange={(newScope) => setScope(newScope)} />

      {/* Risk Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <ComplianceRiskCard
          title="Critical Breach Alerts"
          value="1 Active"
          icon={ShieldAlert}
          riskLevel="CRITICAL"
          description="IP spoofing alert flagged on Tenant 2"
          actionLabel="View Alerts"
          onActionClick={() => navigate('/compliance/breach-alerts')}
        />
        <ComplianceRiskCard
          title="Break-Glass Events"
          value="3 Today"
          icon={Eye}
          riskLevel="MEDIUM"
          description="Critical emergency access overrides"
          actionLabel="Review Access Logs"
          onActionClick={() => navigate('/compliance/phi-access')}
        />
        <ComplianceRiskCard
          title="Audit Chain Health"
          value="124 Blocks"
          icon={Lock}
          riskLevel="LOW"
          description="Hash links validated successfully"
          actionLabel="Verify Ledger Integrity"
          onActionClick={() => navigate('/compliance/audit-chain')}
        />
        <ComplianceRiskCard
          title="Pending Attestations"
          value="5 Accounts"
          icon={Users}
          riskLevel="HIGH"
          description="Stale accounts awaiting certification"
          actionLabel="Run Access Reviews"
          onActionClick={() => navigate('/compliance/access-reviews')}
        />
      </div>

      {/* Main Grid: Left column (Activities, PHI, Log tables) / Right column (Security metrics, tasks, trends) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: PHI monitor Table & Export Logs */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* PHI Access Monitor */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">PHI Access Events Monitor</h3>
                <p className="text-[10px] text-slate-400 font-medium">Real-time audit records of patient health information requests</p>
              </div>
              <button 
                onClick={() => navigate('/compliance/phi-access')}
                className="text-xs font-bold text-indigo-650 hover:text-indigo-800 flex items-center gap-1 cursor-pointer transition-colors"
              >
                Full Monitor <ArrowRight className="h-3 w-3" />
              </button>
            </div>
            <PHIAccessTable events={filteredEvents} />
          </div>

          {/* Export & Privilege Event Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Failed Login Trends & Security Events */}
            <div className="card bg-white border border-slate-200/80 shadow-sm rounded-2xl p-5 space-y-4">
              <div>
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Failed Login Trends</h4>
                <p className="text-[10px] text-slate-400 font-medium font-semibold">IP block triggers & brute-force prevention</p>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs border-b pb-2">
                  <span className="font-semibold text-slate-655 text-slate-600">IP: 198.51.100.42</span>
                  <div className="flex items-center gap-2">
                    <StatusBadge status="BLOCKED" type="danger" />
                    <span className="font-mono font-bold text-slate-500">15 attempts</span>
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs border-b pb-2">
                  <span className="font-semibold text-slate-655 text-slate-600">IP: 203.0.113.88</span>
                  <div className="flex items-center gap-2">
                    <StatusBadge status="WARNING" type="warning" />
                    <span className="font-mono font-bold text-slate-500">4 attempts</span>
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-655 text-slate-600">IP: 198.51.100.99</span>
                  <div className="flex items-center gap-2">
                    <StatusBadge status="BLOCKED" type="danger" />
                    <span className="font-mono font-bold text-slate-500">12 attempts</span>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 border p-3 rounded-xl flex items-center gap-2 text-[10px] text-slate-500">
                <TrendingUp className="h-4 w-4 text-indigo-500 flex-shrink-0" />
                <span>Failed login metrics are simulated for tenant isolation boundary validation.</span>
              </div>
            </div>

            {/* Privilege Changes */}
            <div className="card bg-white border border-slate-200/80 shadow-sm rounded-2xl p-5 space-y-4">
              <div>
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Privilege Changes</h4>
                <p className="text-[10px] text-slate-400 font-medium font-semibold font-mono">RBAC modifications audit track</p>
              </div>

              <div className="space-y-3">
                {recentPrivilegeChanges.map((pc) => (
                  <div key={pc.id} className="text-xs border-b pb-2 last:border-0 last:pb-0 space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-slate-700 truncate max-w-[150px]">{pc.user}</span>
                      <span className="text-[9px] text-slate-400 font-mono">{pc.time}</span>
                    </div>
                    <p className="text-slate-500 font-medium text-[11px]">{pc.action}</p>
                    <p className="text-[9px] text-slate-400 font-semibold">Granted by: {pc.actor}</p>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>

        {/* Right Column: Tasks, Quick Actions, Warnings */}
        <div className="space-y-6">
          
          {/* Quick Actions Panel */}
          <div className="card bg-white border border-slate-200/80 shadow-sm rounded-2xl p-5 space-y-4">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Compliance Quick Actions</h4>
            
            <div className="space-y-2">
              <button 
                onClick={() => navigate('/compliance/audit-chain')}
                className="w-full text-left p-2.5 bg-slate-50 hover:bg-indigo-50/50 border border-slate-200 hover:border-indigo-300 rounded-xl transition-all text-xs font-bold text-slate-700 flex justify-between items-center cursor-pointer"
              >
                <span>Verify Ledger Chains</span>
                <Lock className="h-4 w-4 text-indigo-500" />
              </button>
              <button 
                onClick={() => navigate('/compliance/retention')}
                className="w-full text-left p-2.5 bg-slate-50 hover:bg-indigo-50/50 border border-slate-200 hover:border-indigo-300 rounded-xl transition-all text-xs font-bold text-slate-700 flex justify-between items-center cursor-pointer"
              >
                <span>Retention Policies Clean-up</span>
                <Database className="h-4 w-4 text-indigo-500" />
              </button>
              <button 
                onClick={() => navigate('/compliance/reports')}
                className="w-full text-left p-2.5 bg-slate-50 hover:bg-indigo-50/50 border border-slate-200 hover:border-indigo-300 rounded-xl transition-all text-xs font-bold text-slate-700 flex justify-between items-center cursor-pointer"
              >
                <span>Generate Audit Reports</span>
                <FileText className="h-4 w-4 text-indigo-500" />
              </button>
              <button 
                onClick={() => navigate('/compliance/export-logs')}
                className="w-full text-left p-2.5 bg-slate-50 hover:bg-indigo-50/50 border border-slate-200 hover:border-indigo-300 rounded-xl transition-all text-xs font-bold text-slate-700 flex justify-between items-center cursor-pointer"
              >
                <span>Data Export Logs</span>
                <History className="h-4 w-4 text-indigo-500" />
              </button>
            </div>
          </div>

          {/* Open Compliance Tasks */}
          <div className="card bg-white border border-slate-200/80 shadow-sm rounded-2xl p-5 space-y-4">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Open Tasks</h4>
            <div className="space-y-3">
              {openComplianceTasks.map((t) => (
                <div key={t.id} className="p-3 bg-slate-50 border border-slate-250/60 rounded-xl space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-mono text-[9px] text-slate-400 font-bold">{t.id}</span>
                    <StatusBadge status={t.severity} type={t.severity === 'CRITICAL' ? 'danger' : t.severity === 'HIGH' ? 'danger' : 'warning'} />
                  </div>
                  <p className="text-xs font-bold text-slate-700 leading-normal">{t.text}</p>
                  <p className="text-[10px] text-slate-400 font-bold">Due: {t.due}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Audit Chain Warnings & Security Info */}
          <div className="p-4 bg-indigo-50/40 border border-indigo-150 rounded-2xl space-y-2.5">
            <div className="flex items-center gap-2">
              <Lock className="h-4.5 w-4.5 text-indigo-600 animate-pulse" />
              <h5 className="text-xs font-bold text-indigo-900 uppercase">Cryptographic Verified</h5>
            </div>
            <p className="text-[11px] text-indigo-800 leading-relaxed font-semibold">
              The dashboard integrates automatic SHA-256 validation checks. If any audit record drift or tampering is suspected, alerts escalate instantly.
            </p>
          </div>

        </div>

      </div>
    </div>
  );
};

export default ComplianceDashboard;
