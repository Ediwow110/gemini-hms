import React from 'react';
import { Bell, Clock, CheckCircle2, XCircle } from 'lucide-react';
import IntegrationShellNotice from './components/IntegrationShellNotice';
import NotificationInbox from './components/NotificationInbox';
import { HmsPageHeader } from '../../components/hms-page';
import { HmsDashboardShell, HmsAuditFooter } from '../../components/hms-dashboard';

export const NotificationCenterPage: React.FC = () => {
  return (
    <HmsDashboardShell>
      <div className="space-y-6 pb-12">
        <HmsPageHeader
          title="Notification Center"
          description="Cross-portal notification inbox with role-aware filtering"
          badge="Sandbox"
        />

        <IntegrationShellNotice />

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-5 space-y-2">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-indigo-500" />
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Unread (Mock)</p>
            </div>
            <p className="text-2xl font-black text-slate-900">8</p>
          </div>
          <div className="bg-white border border-slate-200 rounded-3xl p-5 space-y-2">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-amber-500" />
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pending (Mock)</p>
            </div>
            <p className="text-2xl font-black text-slate-900">3</p>
          </div>
          <div className="bg-white border border-slate-200 rounded-3xl p-5 space-y-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Read (Mock)</p>
            </div>
            <p className="text-2xl font-black text-slate-900">24</p>
          </div>
          <div className="bg-white border border-slate-200 rounded-3xl p-5 space-y-2">
            <div className="flex items-center gap-2">
              <XCircle className="h-4 w-4 text-rose-500" />
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Failed (Mock)</p>
            </div>
            <p className="text-2xl font-black text-slate-900">1</p>
          </div>
        </div>

        <NotificationInbox />

        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex gap-3 items-start">
          <Bell className="h-5 w-5 text-amber-600 mt-0.5" />
          <div>
            <p className="text-xs font-bold text-amber-900">Read/Unread Shell State</p>
            <p className="text-[10px] text-amber-700 font-medium mt-0.5">Notification read/unread status is a UI placeholder. No real notification delivery or mutation is performed in this phase.</p>
          </div>
        </div>
      </div>
      <HmsAuditFooter />
    </HmsDashboardShell>
  );
};

export default NotificationCenterPage;
