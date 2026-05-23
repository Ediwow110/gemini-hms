import React, { useState } from 'react';
import {
  Cpu,
  Users,
  Key,
  Play,
  AlertOctagon,
  Link2,
  Database,
  Terminal,
  ArrowRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ITScopeFilter from './components/ITScopeFilter';
import SystemHealthCard from './components/SystemHealthCard';
import UserSupportQueue, { SupportTicket } from './components/UserSupportQueue';
import BackgroundJobTable, { BackgroundJob } from './components/BackgroundJobTable';

export const ITSupportDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [, setScope] = useState({ tenantId: 'all', branchId: 'all', environment: 'production' });

  const mockTickets: SupportTicket[] = [
    {
      id: 'TK-4201',
      userName: 'Dr. Sarah Chen',
      userEmail: 'sarah.chen@stjude.org',
      userRole: 'Doctor',
      tenantName: 'St. Jude Hospital Network',
      branchName: 'St. Jude Metro',
      issueType: 'LOGIN_FAILURE',
      summary: 'Unable to login after password change — locked after 5 failed attempts',
      status: 'OPEN',
      priority: 'HIGH',
      createdAt: '2026-05-21 13:20'
    },
    {
      id: 'TK-4202',
      userName: 'Nurse James Park',
      userEmail: 'james.park@mediclinics.org',
      userRole: 'Nurse',
      tenantName: 'MediClinics Group',
      branchName: 'MediClinics Central',
      issueType: 'MFA_RESET',
      summary: 'Lost authenticator device — requesting MFA re-enrollment',
      status: 'IN_PROGRESS',
      priority: 'MEDIUM',
      createdAt: '2026-05-21 11:45'
    },
    {
      id: 'TK-4203',
      userName: 'Admin Petra Lim',
      userEmail: 'petra.lim@apex.health',
      userRole: 'Branch Admin',
      tenantName: 'Apex Healthcare Services',
      branchName: 'Apex West',
      issueType: 'PERMISSION_REQUEST',
      summary: 'Requesting Inventory Manager permissions for seasonal procurement cycle',
      status: 'WAITING_USER',
      priority: 'LOW',
      createdAt: '2026-05-20 09:30'
    }
  ];

  const mockJobs: BackgroundJob[] = [
    {
      id: 'JOB-001',
      name: 'Nightly Database Backup',
      type: 'CRON',
      status: 'COMPLETED',
      schedule: '0 2 * * *',
      lastRun: '2026-05-21 02:00',
      nextRun: '2026-05-22 02:00',
      duration: '14m 32s',
      retryCount: 0,
      description: 'Full PostgreSQL dump with encryption'
    },
    {
      id: 'JOB-002',
      name: 'Audit Log Archival',
      type: 'CRON',
      status: 'RUNNING',
      schedule: '0 4 * * *',
      lastRun: '2026-05-21 04:00',
      duration: '~8m',
      retryCount: 0,
      description: 'Archive audit entries older than 90 days'
    },
    {
      id: 'JOB-003',
      name: 'SMS Reminder Queue',
      type: 'QUEUE',
      status: 'FAILED',
      lastRun: '2026-05-21 13:00',
      duration: '0.3s',
      retryCount: 3,
      description: 'Appointment reminder push via Twilio'
    },
    {
      id: 'JOB-004',
      name: 'Lab Result Sync Worker',
      type: 'TRIGGER',
      status: 'COMPLETED',
      lastRun: '2026-05-21 13:15',
      duration: '2.1s',
      retryCount: 0,
      description: 'HL7 result ingest from external LIS'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-800 tracking-tight" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            IT & Infrastructure Support Workspace
          </h2>
          <p className="text-xs text-slate-500 font-medium">System health, sessions, jobs, integrations, and incident management</p>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-1.5 text-[10px] text-amber-800 font-semibold max-w-md">
          <strong>Sandbox Notice:</strong> All data is simulated. No real infrastructure actions are performed.
        </div>
      </div>

      {/* Scope Filter */}
      <ITScopeFilter onScopeChange={(newScope) => setScope(newScope)} />

      {/* Health Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <SystemHealthCard
          title="API Gateway"
          value="99.97%"
          icon={Cpu}
          status="HEALTHY"
          description="Response time: 45ms avg"
          metricLabel="View Health Metrics"
          onActionClick={() => navigate('/it/system-health')}
        />
        <SystemHealthCard
          title="Active Sessions"
          value="142"
          icon={Key}
          status="HEALTHY"
          description="Across 3 tenants, 7 branches"
          metricLabel="View Sessions"
          onActionClick={() => navigate('/it/sessions')}
        />
        <SystemHealthCard
          title="Background Workers"
          value="1 Failed"
          icon={Play}
          status="DEGRADED"
          description="SMS reminder queue halted after 3 retries"
          metricLabel="View Jobs"
          onActionClick={() => navigate('/it/background-jobs')}
        />
        <SystemHealthCard
          title="Open Incidents"
          value="2"
          icon={AlertOctagon}
          status="CRITICAL"
          description="1 SEV1 active, 1 SEV3 investigating"
          metricLabel="View Incidents"
          onActionClick={() => navigate('/it/incidents')}
        />
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Support Queue & Jobs */}
        <div className="lg:col-span-2 space-y-6">
          <UserSupportQueue tickets={mockTickets} />
          <BackgroundJobTable jobs={mockJobs} />
        </div>

        {/* Right Column: Quick Actions */}
        <div className="space-y-6">
          {/* Quick Actions Panel */}
          <div className="card bg-white border border-slate-200/80 shadow-sm rounded-2xl p-5 space-y-4">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">IT Quick Actions</h4>
            <div className="space-y-2">
              <button
                onClick={() => navigate('/it/system-health')}
                className="w-full text-left p-2.5 bg-slate-50 hover:bg-indigo-50/50 border border-slate-200 hover:border-indigo-300 rounded-xl transition-all text-xs font-bold text-slate-700 flex justify-between items-center cursor-pointer"
              >
                <span>System Health Monitor</span>
                <Cpu className="h-4 w-4 text-indigo-500" />
              </button>
              <button
                onClick={() => navigate('/it/sessions')}
                className="w-full text-left p-2.5 bg-slate-50 hover:bg-indigo-50/50 border border-slate-200 hover:border-indigo-300 rounded-xl transition-all text-xs font-bold text-slate-700 flex justify-between items-center cursor-pointer"
              >
                <span>Active Sessions</span>
                <Users className="h-4 w-4 text-indigo-500" />
              </button>
              <button
                onClick={() => navigate('/it/integrations')}
                className="w-full text-left p-2.5 bg-slate-50 hover:bg-indigo-50/50 border border-slate-200 hover:border-indigo-300 rounded-xl transition-all text-xs font-bold text-slate-700 flex justify-between items-center cursor-pointer"
              >
                <span>System Integrations</span>
                <Link2 className="h-4 w-4 text-indigo-500" />
              </button>
              <button
                onClick={() => navigate('/it/logs')}
                className="w-full text-left p-2.5 bg-slate-50 hover:bg-indigo-50/50 border border-slate-200 hover:border-indigo-300 rounded-xl transition-all text-xs font-bold text-slate-700 flex justify-between items-center cursor-pointer"
              >
                <span>System Logs</span>
                <Terminal className="h-4 w-4 text-indigo-500" />
              </button>
              <button
                onClick={() => navigate('/it/backup-restore')}
                className="w-full text-left p-2.5 bg-slate-50 hover:bg-indigo-50/50 border border-slate-200 hover:border-indigo-300 rounded-xl transition-all text-xs font-bold text-slate-700 flex justify-between items-center cursor-pointer"
              >
                <span>Backup & Recovery</span>
                <Database className="h-4 w-4 text-indigo-500" />
              </button>
              <button
                onClick={() => navigate('/it/incidents')}
                className="w-full text-left p-2.5 bg-slate-50 hover:bg-indigo-50/50 border border-slate-200 hover:border-indigo-300 rounded-xl transition-all text-xs font-bold text-slate-700 flex justify-between items-center cursor-pointer"
              >
                <span>Incident Reports</span>
                <AlertOctagon className="h-4 w-4 text-indigo-500" />
              </button>
            </div>
          </div>

          {/* System Status Summary */}
          <div className="p-4 bg-indigo-50/40 border border-indigo-150 rounded-2xl space-y-2.5">
            <div className="flex items-center gap-2">
              <Cpu className="h-4.5 w-4.5 text-indigo-600 animate-pulse" />
              <h5 className="text-xs font-bold text-indigo-900 uppercase">Platform Health Overview</h5>
            </div>
            <p className="text-[11px] text-indigo-800 leading-relaxed font-semibold">
              The platform is monitoring 8 core services, 4 external integrations, and 142 active user sessions across 3 tenants. Automated health checks run every 60 seconds.
            </p>
            <button
              onClick={() => navigate('/it/system-health')}
              className="text-[10px] text-indigo-700 font-bold flex items-center gap-1 cursor-pointer hover:text-indigo-900 transition-colors"
            >
              Full Health Dashboard <ArrowRight className="h-3 w-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ITSupportDashboard;
