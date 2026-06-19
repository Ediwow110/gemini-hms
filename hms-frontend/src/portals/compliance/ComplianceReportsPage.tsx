import React, { useState, useCallback } from 'react';
import { FileText, RefreshCw } from 'lucide-react';
import ComplianceScopeFilter from './components/ComplianceScopeFilter';
import { ReportExportButton } from '../../components/analytics';
import { complianceService } from '../../services/compliance.service';
import { HmsDashboardShell } from '../../components/hms-dashboard';
import { HmsPageHeader } from '../../components/hms-page';

interface ReportRecord {
  timestamp: string;
  user: string;
  resource: string;
  action: string;
  status: string;
}

interface GeneratedReport {
  title: string;
  generatedAt: string;
  period: string;
  scope: string;
  stats: { label: string; value: number }[];
  records: ReportRecord[];
}

export const ComplianceReportsPage: React.FC = () => {
  const [reportType, setReportType] = useState('HIPAA');
  const [generating, setGenerating] = useState(false);
  const [generatedReport, setGeneratedReport] = useState<GeneratedReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerateReport = useCallback(async () => {
    setGenerating(true);
    setGeneratedReport(null);
    setError(null);

    try {
      let stats: { label: string; value: number }[] = [];
      let records: ReportRecord[] = [];

      if (reportType === 'HIPAA') {
        const ephiData = await complianceService.getEphiAudit();
        const events: Record<string, unknown>[] = Array.isArray(ephiData) ? ephiData : [];
        stats = [
          { label: 'Total PHI Access Events', value: events.length },
          { label: 'Unique Record Types', value: new Set(events.map(e => (e.recordType as string))).size },
          { label: 'Date Range', value: events.length > 0 ? 1 : 0 },
        ];
        records = events.slice(0, 50).map(e => ({
          timestamp: (e.createdAt || e.timestamp) as string,
          user: ((e.userId as string)?.substring(0, 8)) || '—',
          resource: `${e.recordType}:${(e.recordId as string)?.substring(0, 8)}`,
          action: e.eventKey as string,
          status: 'LOGGED',
        }));
      } else if (reportType === 'ACCESS') {
        const [accessReview, staleAccounts] = await Promise.all([
          complianceService.getAccessReviewReport(),
          complianceService.getStaleAccounts(),
        ]);
        const ar = accessReview as Record<string, unknown> || {};
        const reviewData: Record<string, unknown>[] = Array.isArray(ar.accessReport) ? ar.accessReport as Record<string, unknown>[] : [];
        const staleData: Record<string, unknown>[] = Array.isArray(staleAccounts) ? staleAccounts as Record<string, unknown>[] : [];
        stats = [
          { label: 'Accounts Reviewed', value: reviewData.length },
          { label: 'Stale Accounts', value: staleData.length },
          { label: 'Privilege Escalations', value: (ar.privilegeEscalationsCount as number) || 0 },
        ];
        records = [
          ...reviewData.slice(0, 25).map(r => ({
            timestamp: (r.reviewTimestamp as string) || '—',
            user: (r.userId || r.userName) as string || '—',
            resource: (r.resource as string) || 'Account',
            action: 'ACCESS_REVIEWED',
            status: (r.status as string) || 'REVIEWED',
          })),
          ...staleData.slice(0, 25).map(s => ({
            timestamp: (s.lastLogin || s.createdAt) as string || '—',
            user: (s.userId || s.email) as string || '—',
            resource: 'User Account',
            action: 'STALE_DETECTED',
            status: 'INACTIVE',
          })),
        ];
      } else if (reportType === 'RETENTION') {
        const [retentionStatus, changeLog] = await Promise.all([
          complianceService.getRetentionStatus(),
          complianceService.getChangeLog(),
        ]);
        const status = retentionStatus as Record<string, { active: number; archived: number }> || {};
        const changes: Record<string, unknown>[] = Array.isArray(changeLog) ? changeLog as Record<string, unknown>[] : [];
        stats = Object.entries(status).map(([key, val]) => ({
          label: `${key.charAt(0).toUpperCase() + key.slice(1)} Archived`,
          value: (val?.archived as number) || 0,
        }));
        records = changes.slice(0, 50).map(c => ({
          timestamp: (c.timestamp || c.createdAt) as string || '—',
          user: (c.changedBy || c.userId) as string || '—',
          resource: (c.entityType || c.resource) as string || 'System',
          action: (c.changeType || c.eventKey) as string || 'CHANGE',
          status: (c.status as string) || 'APPLIED',
        }));
      }

      setGeneratedReport({
        title: reportType === 'HIPAA'
          ? 'HIPAA Disclosure & PHI Access Trail Report'
          : reportType === 'ACCESS'
          ? 'Quarterly Access Attestation & Privilege Drift Log'
          : 'Data Retention & Pruning Compliance Summary',
        generatedAt: new Date().toLocaleString(),
        period: 'Current snapshot',
        scope: 'Current session (JWT tenant/branch scope)',
        stats,
        records,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate report');
    } finally {
      setGenerating(false);
    }
  }, [reportType]);

  return (
    <HmsDashboardShell widthTier="full">
      <HmsPageHeader
        title="Compliance Reports"
        description="Generate compliance reports from live audit and access data"
      />

      <ComplianceScopeFilter />

      <div className="card p-5 bg-white border border-slate-200/80 shadow-sm rounded-2xl space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="space-y-1.5">
            <label className="font-bold text-slate-700">Report Type</label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="w-full p-2 bg-slate-50 border border-slate-250 rounded-xl font-semibold"
            >
              <option value="HIPAA">HIPAA PHI Access Report</option>
              <option value="ACCESS">Access Attestation Report</option>
              <option value="RETENTION">Retention Compliance Report</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={handleGenerateReport}
              disabled={generating}
              className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              {generating ? (
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <FileText className="h-3.5 w-3.5" />
              )}
              {generating ? 'Generating...' : 'Generate Report'}
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-xs text-rose-700">
          {error}
        </div>
      )}

      {generatedReport && (
        <div className="card p-6 bg-white border border-slate-200/80 shadow-sm rounded-2xl space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-800">{generatedReport.title}</h3>
              <p className="text-[10px] text-slate-400">
                Generated: {generatedReport.generatedAt} | Period: {generatedReport.period}
              </p>
            </div>
            <ReportExportButton />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {generatedReport.stats.map((stat, i) => (
              <div key={i} className="p-3 bg-slate-50 border rounded-xl text-center">
                <div className="text-lg font-extrabold text-slate-900">{stat.value}</div>
                <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">{stat.label}</div>
              </div>
            ))}
          </div>

          {generatedReport.records.length > 0 && (
            <div className="overflow-x-auto border border-slate-200/60 rounded-xl">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 border-b">
                  <tr>
                    <th className="px-4 py-2 font-bold text-slate-500 uppercase">Timestamp</th>
                    <th className="px-4 py-2 font-bold text-slate-500 uppercase">User</th>
                    <th className="px-4 py-2 font-bold text-slate-500 uppercase">Resource</th>
                    <th className="px-4 py-2 font-bold text-slate-500 uppercase">Action</th>
                    <th className="px-4 py-2 font-bold text-slate-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {generatedReport.records.slice(0, 100).map((r, i) => (
                    <tr key={i} className="hover:bg-slate-50/50">
                      <td className="px-4 py-2 font-mono text-slate-500 text-[10px]">{r.timestamp}</td>
                      <td className="px-4 py-2 font-semibold text-slate-700">{r.user}</td>
                      <td className="px-4 py-2 text-slate-600">{r.resource}</td>
                      <td className="px-4 py-2 font-mono text-slate-500">{r.action}</td>
                      <td className="px-4 py-2">
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold">
                          {r.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </HmsDashboardShell>
  );
};

export default ComplianceReportsPage;
