import React from 'react';
import { Activity, Shield, AlertTriangle, FileText } from 'lucide-react';
import IntegrationShellNotice from './components/IntegrationShellNotice';
import ActivityAuditEventTable from './components/ActivityAuditEventTable';

export const ActivityAuditContextPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-black text-slate-800 tracking-tight">Activity & Audit Context</h2>
        <p className="text-xs text-slate-500 font-medium">Cross-domain audit trail with role-aware visibility</p>
      </div>

      <IntegrationShellNotice />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-3xl p-5 space-y-2">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-indigo-500" />
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Events (24h) (Mock)</p>
          </div>
          <p className="text-2xl font-black text-slate-900">142</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-3xl p-5 space-y-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-rose-500" />
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">High Risk (Mock)</p>
          </div>
          <p className="text-2xl font-black text-slate-900">3</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-3xl p-5 space-y-2">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-emerald-500" />
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Compliance Events (Mock)</p>
          </div>
          <p className="text-2xl font-black text-slate-900">28</p>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-3xl p-5 flex items-center gap-4">
        <FileText className="h-5 w-5 text-slate-400" />
        <input type="text" placeholder="Filter by user, action, resource, or event ID..." className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none" />
      </div>

      <ActivityAuditEventTable />

      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex gap-3 items-start">
        <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
        <div>
          <p className="text-xs font-bold text-amber-900">Audit Log Visibility</p>
          <p className="text-[10px] text-amber-700 font-medium mt-0.5">Audit events are UI placeholders. No real audit log ingestion or cross-domain aggregation is performed. Patient users cannot see internal staff audit events. Supplier users cannot see tenant-wide audit trails.</p>
        </div>
      </div>
    </div>
  );
};

export default ActivityAuditContextPage;
