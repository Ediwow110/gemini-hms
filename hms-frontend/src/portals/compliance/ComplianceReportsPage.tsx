import React, { useState } from 'react';
import { FileText, Calendar, Download, AlertTriangle, HelpCircle, RefreshCw } from 'lucide-react';
import ComplianceScopeFilter from './components/ComplianceScopeFilter';

interface ReportStat {
  label: string;
  value: number;
}

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
  stats: ReportStat[];
  records: ReportRecord[];
}

export const ComplianceReportsPage: React.FC = () => {
  const [scope, setScope] = useState({ tenantId: 'all', branchId: 'all' });
  const [reportType, setReportType] = useState('HIPAA');
  const [startDate, setStartDate] = useState('2026-05-01');
  const [endDate, setEndDate] = useState('2026-05-21');
  const [generating, setGenerating] = useState(false);
  const [generatedReport, setGeneratedReport] = useState<GeneratedReport | null>(null);

  const handleGenerateReport = () => {
    setGenerating(true);
    setGeneratedReport(null);

    setTimeout(() => {
      setGenerating(false);
      setGeneratedReport({
        title: reportType === 'HIPAA' 
          ? 'HIPAA Disclosure & PHI Access Trail Report' 
          : reportType === 'ACCESS' 
          ? 'Quarterly Access Attestation & Privilege Drift Log' 
          : 'Data Retention & Pruning Compliance Summary',
        generatedAt: new Date().toLocaleString(),
        period: `${startDate} to ${endDate}`,
        scope: `${scope.tenantId === 'all' ? 'System-wide' : scope.tenantId} / ${scope.branchId === 'all' ? 'All Branches' : scope.branchId}`,
        stats: reportType === 'HIPAA' 
          ? [
              { label: 'Total PHI Access Checks', value: 432 },
              { label: 'Break-Glass Actions', value: 3 },
              { label: 'Anomalous Block Alerts', value: 1 }
            ]
          : reportType === 'ACCESS'
          ? [
              { label: 'Users Attested', value: 18 },
              { label: 'Uncertified Accounts', value: 3 },
              { label: 'Privilege Drift Alerts', value: 1 }
            ]
          : [
              { label: 'Active Retention Policies', value: 3 },
              { label: 'Dry-run Scans Run', value: 8 },
              { label: 'Records Scanned', value: 1735 }
            ],
        records: reportType === 'HIPAA'
          ? [
              { timestamp: '2026-05-21 13:45:10', user: 'Dr. Evelyn Martinez', resource: 'Jesse Pinkman (PAT-3304)', action: 'ROUTINE Decrypt', status: 'VERIFIED' },
              { timestamp: '2026-05-21 12:30:15', user: 'Nurse Marcus Vance', resource: 'Jane Smith (PAT-4322)', action: 'EMERGENCY Breakglass', status: 'VERIFIED' }
            ]
          : reportType === 'ACCESS'
          ? [
              { timestamp: '2026-05-21 10:30:00', user: 'support.staff@stjude.org', resource: 'Privilege Attestation', action: 'APPROVED', status: 'PENDING REMEDIATION' },
              { timestamp: '2026-05-21 10:35:12', user: 'billing.intern@mediclinics.org', resource: 'Stale Account Audit', action: 'PENDING REVIEW', status: 'REVOCATION RECOMMENDED' }
            ]
          : [
              { timestamp: '2026-05-21 09:00:00', user: 'Retention Engine', resource: 'Clinical SOAP Notes DB', action: 'DRY-RUN SCAN', status: '1205 records matched' },
              { timestamp: '2026-05-21 09:15:00', user: 'Retention Engine', resource: 'Financial Ledger DB', action: 'DRY-RUN SCAN', status: '432 records matched' }
            ]
      });
    }, 1200);
  };

  const triggerExport = () => {
    alert("Report file exported successfully (Simulated download).");
  };

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-800 tracking-tight" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Compliance & Governance Reports
          </h2>
          <p className="text-xs text-slate-500 font-medium">Generate HIPAA-readiness documents, access attestation logs, and retention reports</p>
        </div>
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex gap-2 text-[10px] text-amber-800 leading-normal max-w-md">
          <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
          <p>
            <strong>Sandbox Safety Rule:</strong> Reports are compiled using mock placeholders. Real HIPAA certificates, legal attestation seals, or database exports are disabled.
          </p>
        </div>
      </div>

      {/* Scope Selector */}
      <ComplianceScopeFilter onScopeChange={(newScope) => setScope(newScope)} />

      {/* Report Generator Controls */}
      <div className="card p-5 bg-white border border-slate-200/80 shadow-sm rounded-2xl space-y-4">
        <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Report Generator Parameters</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          {/* Report Type */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-700">Report Category</label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
            >
              <option value="HIPAA">HIPAA PHI Access & Disclosure Log</option>
              <option value="ACCESS">Access Review & Certification Audit</option>
              <option value="RETENTION">Data Retention & Pruning Summary</option>
            </select>
          </div>

          {/* Start Date */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-700">Start Date</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold focus:outline-none cursor-pointer"
              />
            </div>
          </div>

          {/* End Date */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-700">End Date</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold focus:outline-none cursor-pointer"
              />
            </div>
          </div>
        </div>

        <div className="pt-2 border-t flex justify-between items-center flex-wrap gap-3">
          <div className="text-[10px] text-slate-400 font-semibold max-w-lg">
            <strong>Audit-Readiness Note:</strong> These reports serve as pre-verification checks. Official regulatory filings must be backed by secondary raw backend database transaction validation logs.
          </div>
          <button
            onClick={handleGenerateReport}
            disabled={generating}
            className="py-2 px-5 bg-indigo-650 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer disabled:opacity-50"
          >
            {generating ? 'Compiling Report...' : 'Generate Preview'}
          </button>
        </div>
      </div>

      {/* Report Preview Placeholder */}
      {generating && (
        <div className="card bg-white border rounded-2xl p-12 text-center text-slate-400 space-y-3">
          <RefreshCw className="h-8 w-8 mx-auto text-indigo-500 animate-spin" />
          <p className="text-xs font-bold text-slate-700">Compiling ledger datasets...</p>
          <p className="text-[10px] text-slate-400 font-semibold">Decrypting log payloads and mapping tenant partitions</p>
        </div>
      )}

      {!generating && generatedReport && (
        <div className="card bg-white border border-slate-200/80 shadow-md rounded-2xl p-6 space-y-6 animate-scale-in">
          {/* Report Document Header */}
          <div className="flex justify-between items-start border-b pb-4 border-slate-100 flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-2xl text-indigo-650">
                <FileText className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">{generatedReport.title}</h3>
                <p className="text-[10px] text-slate-400 font-bold mt-0.5">Generated: {generatedReport.generatedAt}</p>
              </div>
            </div>
            
            <div className="flex gap-2">
              <button 
                onClick={triggerExport}
                className="py-1.5 px-3 border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Download className="h-3.5 w-3.5" /> PDF
              </button>
              <button 
                onClick={triggerExport}
                className="py-1.5 px-3 border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Download className="h-3.5 w-3.5" /> CSV
              </button>
            </div>
          </div>

          {/* Report Metadata */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-xl border">
            <div>
              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Report Scope</p>
              <p className="text-xs font-bold text-slate-700">{generatedReport.scope}</p>
            </div>
            <div>
              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Date Boundary</p>
              <p className="text-xs font-bold text-slate-700">{generatedReport.period}</p>
            </div>
            <div>
              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Sign-Off Status</p>
              <span className="inline-flex text-[9px] bg-indigo-50 border border-indigo-200 text-indigo-800 px-1.5 py-0.5 rounded font-bold uppercase">Pre-Attested</span>
            </div>
            <div>
              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Verification Type</p>
              <p className="text-xs font-mono font-bold text-slate-500">SHA-256 Chain</p>
            </div>
          </div>

          {/* Stats Summary */}
          <div className="space-y-2">
            <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Dataset Summary Metrics</h5>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {generatedReport.stats.map((st, idx) => (
                <div key={idx} className="p-3 bg-slate-50/50 border border-slate-200 rounded-xl">
                  <p className="text-[10px] text-slate-450 font-bold uppercase">{st.label}</p>
                  <p className="text-lg font-extrabold text-slate-800 font-mono mt-0.5">{st.value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Table Data Preview */}
          <div className="space-y-2">
            <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Audit Log Details Preview</h5>
            <div className="overflow-x-auto border border-slate-200/60 rounded-xl">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 border-b">
                  <tr>
                    <th className="px-4 py-2 font-bold text-slate-500 uppercase tracking-wider">Timestamp</th>
                    <th className="px-4 py-2 font-bold text-slate-500 uppercase tracking-wider">Initiator</th>
                    <th className="px-4 py-2 font-bold text-slate-500 uppercase tracking-wider">Resource / Target</th>
                    <th className="px-4 py-2 font-bold text-slate-500 uppercase tracking-wider">Operation</th>
                    <th className="px-4 py-2 font-bold text-slate-500 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                  {generatedReport.records.map((r, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="px-4 py-2.5 text-slate-500">{r.timestamp}</td>
                      <td className="px-4 py-2.5 font-bold text-slate-700 font-sans">{r.user}</td>
                      <td className="px-4 py-2.5 text-indigo-900 font-sans">{r.resource}</td>
                      <td className="px-4 py-2.5 text-slate-600">{r.action}</td>
                      <td className="px-4 py-2.5 font-sans font-bold text-indigo-650">{r.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {!generating && !generatedReport && (
        <div className="card bg-slate-50/50 border border-dashed border-slate-350 rounded-2xl p-12 text-center text-slate-400 space-y-2.5">
          <HelpCircle className="h-8 w-8 mx-auto text-slate-300" />
          <div>
            <p className="text-xs font-bold text-slate-600">No report generated</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Select a report type and configure parameters, then click "Generate Preview" to build the ledger preview window.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ComplianceReportsPage;
