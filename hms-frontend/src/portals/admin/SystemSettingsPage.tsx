import React, { useState, useEffect } from 'react';
import { Users, Shield, Bell, Mail, Clock } from 'lucide-react';
import { HmsPageHeader } from '../../components/hms-page';
import { HmsDashboardShell, HmsAuditFooter, HmsLoadingSkeleton } from '../../components/hms-dashboard';
import { adminService } from '../../services/admin.service';

export const SystemSettingsPage: React.FC = () => {
  const [health, setHealth] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminService.listTenants()
      .then(() => setHealth({ status: 'connected' }))
      .catch(() => setHealth({ status: 'error' }))
      .finally(() => setLoading(false));
  }, []);

  const sections = [
    { icon: <Users className="h-5 w-5 text-blue-500" />, title: 'User Management', desc: 'Manage accounts, roles, and permissions', link: '/admin/users' },
    { icon: <Shield className="h-5 w-5 text-rose-500" />, title: 'Security', desc: 'Audit logs and access control', link: '/admin/security' },
    { icon: <Bell className="h-5 w-5 text-amber-500" />, title: 'Notifications', desc: 'Notification preferences and dispatch', link: '/admin/settings' },
    { icon: <Mail className="h-5 w-5 text-emerald-500" />, title: 'SMTP Configuration', desc: 'Configured via environment variables' },
    { icon: <Clock className="h-5 w-5 text-purple-500" />, title: 'Session & Lockout Policy', desc: 'Configured via environment variables' },
  ];

  return (
    <HmsDashboardShell widthTier="compact" footer={<HmsAuditFooter dataSource="Configuration" />}>
      <HmsPageHeader title="Global System Config" description="System configuration and settings." badge={loading ? 'Loading...' : 'Live'} />

      {loading ? <HmsLoadingSkeleton variant="kpi" /> : (
        <div className="space-y-4 max-w-2xl mx-auto">
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm divide-y divide-slate-100">
            {sections.map((s, i) => (
              s.link ? (
                <a key={i} href={s.link} className="flex items-center gap-4 px-5 py-4 hover:bg-slate-50 transition-colors">
                  {s.icon}
                  <div className="flex-1"><p className="text-sm font-bold text-slate-800">{s.title}</p><p className="text-xs text-slate-500">{s.desc}</p></div>
                  <span className="text-[11px] font-semibold text-indigo-600">Configure &rarr;</span>
                </a>
              ) : (
                <div key={i} className="flex items-center gap-4 px-5 py-4 opacity-70">
                  {s.icon}
                  <div className="flex-1"><p className="text-sm font-bold text-slate-800">{s.title}</p><p className="text-xs text-slate-500">{s.desc}</p></div>
                  <span className="text-[11px] font-semibold text-slate-400">Env-based</span>
                </div>
              )
            ))}
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`h-2.5 w-2.5 rounded-full ${health?.status === 'connected' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
              <span className="text-xs font-bold text-slate-700">API Status</span>
            </div>
            <span className="text-[11px] text-slate-400">{health?.status === 'connected' ? 'Connected' : 'Error'}</span>
          </div>
        </div>
      )}
    </HmsDashboardShell>
  );
};

export default SystemSettingsPage;
