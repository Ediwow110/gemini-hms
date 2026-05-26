import React, { useState } from 'react';
import {
  Cpu,
  Users,
  Play,
  AlertOctagon,
  Link2,
  Database,
  Terminal,
  AlertTriangle,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ITScopeFilter from './components/ITScopeFilter';
import SystemHealthCard from './components/SystemHealthCard';
import UserSupportQueue from './components/UserSupportQueue';
import BackgroundJobTable from './components/BackgroundJobTable';
import { useSupportTickets, useTicketStats } from '../../hooks/use-it-support';

export const ITSupportDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [, setScope] = useState({ tenantId: 'all', branchId: 'all', environment: 'production' });
  const { tickets, loading: ticketsLoading } = useSupportTickets({ pageSize: 3 });
  const { stats, loading: statsLoading } = useTicketStats();

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
      </div>

      {/* Scope Filter */}
      {/* WIP Banner */}
      <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl flex gap-2 text-xs text-amber-800">
        <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
        <div>
          <h5 className="font-bold uppercase text-[10px] tracking-wider">IT Operations (Partial)</h5>
          <p className="font-medium mt-0.5">System health, jobs, logs, and backup data are simulated for demonstration. User support ticketing and session management are real.</p>
        </div>
      </div>
      <ITScopeFilter onScopeChange={(newScope) => setScope(newScope)} />

      {/* Health Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <SystemHealthCard
          title="Open Tickets"
          value={statsLoading ? '...' : String(stats.open)}
          icon={AlertOctagon}
          status={stats.open > 0 ? 'CRITICAL' : 'HEALTHY'}
          description={stats.urgent > 0 ? `${stats.urgent} urgent` : 'No urgent tickets'}
          metricLabel="View Tickets"
          onActionClick={() => navigate('/it/user-support')}
        />
        <SystemHealthCard
          title="In Progress"
          value={statsLoading ? '...' : String(stats.inProgress)}
          icon={Play}
          status={stats.inProgress > 0 ? 'DEGRADED' : 'HEALTHY'}
          description="Tickets being worked on"
          metricLabel="View Active"
          onActionClick={() => navigate('/it/user-support')}
        />
        <SystemHealthCard
          title="Total Tickets"
          value={statsLoading ? '...' : String(stats.total)}
          icon={Users}
          status="HEALTHY"
          description="All-time ticket volume"
          metricLabel="View All"
          onActionClick={() => navigate('/it/user-support')}
        />
        <SystemHealthCard
          title="System Health"
          value="Online"
          icon={Cpu}
          status="HEALTHY"
          description="API Gateway: 45ms avg"
          metricLabel="View Health"
          onActionClick={() => navigate('/it/system-health')}
        />
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Support Queue & Jobs */}
        <div className="lg:col-span-2 space-y-6">
          {ticketsLoading ? (
            <div className="card bg-white border border-slate-200/80 shadow-sm rounded-2xl p-6 text-center text-xs text-slate-400">
              Loading tickets...
            </div>
          ) : (
            <UserSupportQueue tickets={tickets.map(t => ({
              id: t.id,
              userName: t.reportedBy?.email || 'Unknown',
              userEmail: t.reportedBy?.email || '',
              userRole: '',
              tenantName: '',
              branchName: t.branch?.name || '',
              issueType: t.issueType,
              summary: t.summary,
              status: t.status,
              priority: t.priority,
              createdAt: new Date(t.createdAt).toLocaleString(),
            }))} />
          )}
          <BackgroundJobTable jobs={[]} />
        </div>

        {/* Right Column: Quick Actions */}
        <div className="space-y-6">
          {/* Quick Actions Panel */}
          <div className="card bg-white border border-slate-200/80 shadow-sm rounded-2xl p-5 space-y-4">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">IT Quick Actions</h4>
            <div className="space-y-2">
              {[
                { label: 'System Health Monitor', icon: Cpu, path: '/it/system-health' },
                { label: 'Active Sessions', icon: Users, path: '/it/sessions' },
                { label: 'System Integrations', icon: Link2, path: '/it/integrations' },
                { label: 'System Logs', icon: Terminal, path: '/it/logs' },
                { label: 'Backup & Recovery', icon: Database, path: '/it/backup-restore' },
                { label: 'Ticket Queue', icon: AlertOctagon, path: '/it/user-support' },
              ].map((item) => (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className="w-full text-left p-2.5 bg-slate-50 hover:bg-indigo-50/50 border border-slate-200 hover:border-indigo-300 rounded-xl transition-all text-xs font-bold text-slate-700 flex justify-between items-center cursor-pointer"
                >
                  <span>{item.label}</span>
                  <item.icon className="h-4 w-4 text-indigo-500" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ITSupportDashboard;
