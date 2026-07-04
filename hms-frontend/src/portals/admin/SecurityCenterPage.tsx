import React, { useState, useEffect } from 'react';
import { Shield, AlertTriangle, Users, Key } from 'lucide-react';
import { HmsPageHeader } from '../../components/hms-page';
import { HmsDashboardShell, HmsAuditFooter, HmsKpiStrip, HmsLoadingSkeleton } from '../../components/hms-dashboard';
import { complianceService, type AuditLogEntry } from '../../services/compliance.service';

export const SecurityCenterPage: React.FC = () => {
  const [events, setEvents] = useState<AuditLogEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const fetchEvents = async (p: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await complianceService.getAuditEvents({
        eventKey: 'UNAUTHORIZED_ACCESS,SENSITIVE_DATA_EXPORT,LOGIN_FAILED,LOGIN_LOCKOUT,PERMISSION_DENIED',
        page: p,
        pageSize: 20,
      });
      setEvents(res.data);
      setTotal(res.total);
    } catch {
      setError('Unable to load security events');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchEvents(page); }, [page]);

  const severityByKey: Record<string, 'critical' | 'warning' | 'info'> = {
    UNAUTHORIZED_ACCESS: 'critical',
    SENSITIVE_DATA_EXPORT: 'critical',
    LOGIN_LOCKOUT: 'warning',
    LOGIN_FAILED: 'warning',
    PERMISSION_DENIED: 'info',
  };

  const kpis = [
    { id: 'kpi-total', label: 'Security Events', value: total.toLocaleString(), severity: total > 0 ? 'warning' as const : 'success' as const },
    { id: 'kpi-critical', label: 'Critical', value: events.filter(e => severityByKey[e.eventKey] === 'critical').length.toLocaleString(), severity: 'critical' as const },
    { id: 'kpi-warning', label: 'Warnings', value: events.filter(e => severityByKey[e.eventKey] === 'warning').length.toLocaleString(), severity: 'warning' as const },
  ];

  return (
    <HmsDashboardShell widthTier="full" footer={<HmsAuditFooter dataSource="Audit API" />}>
      <HmsPageHeader title="Security Center Console" description="Global monitoring of threat indicators, failed credentials, and session telemetry." badge={loading ? 'Loading...' : 'Live'} />

      {loading && events.length === 0 ? (
        <HmsLoadingSkeleton variant="kpi" />
      ) : error ? (
        <div className="max-w-3xl mx-auto py-10">
          <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm text-center">
            <AlertTriangle className="h-8 w-8 text-amber-500 mx-auto mb-2" />
            <p className="text-sm text-slate-600">{error}</p>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <HmsKpiStrip metrics={kpis} loading={false} />

          <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-200 flex items-center gap-2">
              <Shield className="h-4 w-4 text-slate-500" />
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Security Audit Events</h3>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="px-5 py-3">Event</th>
                  <th className="px-5 py-3">User ID</th>
                  <th className="px-5 py-3">Record</th>
                  <th className="px-5 py-3">Date</th>
                </tr>
              </thead>
              <tbody>
                {events.length === 0 ? (
                  <tr><td colSpan={4} className="px-5 py-8 text-center text-sm text-slate-400">No security events found</td></tr>
                ) : events.map((e) => (
                  <tr key={e.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                    <td className="px-5 py-3">
                      <span className="flex items-center gap-2">
                        {severityByKey[e.eventKey] === 'critical' ? <AlertTriangle className="h-3.5 w-3.5 text-rose-500" /> :
                         severityByKey[e.eventKey] === 'warning' ? <AlertTriangle className="h-3.5 w-3.5 text-amber-500" /> :
                         <Shield className="h-3.5 w-3.5 text-slate-400" />}
                        <span className="font-mono text-[11px] font-semibold text-slate-700">{e.eventKey}</span>
                      </span>
                    </td>
                    <td className="px-5 py-3 font-mono text-[11px] text-slate-500">{e.userId.slice(0, 8)}...</td>
                    <td className="px-5 py-3 text-xs text-slate-600">{e.recordType} #{e.recordId.slice(0, 8)}</td>
                    <td className="px-5 py-3 text-xs text-slate-400">{new Date(e.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {total > 20 && (
              <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-400">{total} total events</span>
                <div className="flex gap-2">
                  <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="rounded px-3 py-1 text-xs font-bold bg-slate-100 text-slate-600 hover:bg-slate-200 disabled:opacity-40">Prev</button>
                  <span className="text-xs text-slate-500 self-center">Page {page}</span>
                  <button disabled={events.length < 20} onClick={() => setPage(p => p + 1)} className="rounded px-3 py-1 text-xs font-bold bg-slate-100 text-slate-600 hover:bg-slate-200 disabled:opacity-40">Next</button>
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-12 gap-6">
            <div className="col-span-12 xl:col-span-4">
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-3"><Users className="h-4 w-4 text-slate-500" /><h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Quick Actions</h3></div>
                <div className="space-y-2">
                  <a href="/admin/users" className="flex items-center gap-3 rounded-lg border border-slate-100 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"><Users className="h-4 w-4" /> User Management</a>
                  <a href="/admin/audit-logs" className="flex items-center gap-3 rounded-lg border border-slate-100 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"><Shield className="h-4 w-4" /> Audit Logs</a>
                  <a href="/admin/roles" className="flex items-center gap-3 rounded-lg border border-slate-100 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"><Key className="h-4 w-4" /> Roles & Permissions</a>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </HmsDashboardShell>
  );
};

export default SecurityCenterPage;
