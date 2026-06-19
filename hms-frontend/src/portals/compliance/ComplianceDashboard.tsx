import React, { useState } from 'react';
import {
  ShieldAlert, 
  Users, 
  History, 
  Database, 
  Lock, 
  Eye, 
  FileText, 
  ArrowRight,
  HelpCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ComplianceScopeFilter from './components/ComplianceScopeFilter';
import ComplianceRiskCard from './components/ComplianceRiskCard';
import { ChartCard, InsightPanel, ReportTable, StatusDonutChart, TrendLineChart } from '../../components/analytics';
import { complianceInsights, complianceReportColumns, complianceReportRows, complianceStatusBreakdown, complianceTrend } from '../../data/analytics/operationsAnalytics.mock';
import PHIAccessTable from './components/PHIAccessTable';
import { StatusBadge } from '../../components/feedback/StatusBadge';
import { useAuditEvents, useAccessReview } from '../../hooks/use-compliance';
import { HmsPageHeader } from '../../components/hms-page';
import { RequirePermission } from '../../components/ui/RequirePermission';
import { HmsDashboardShell, HmsAuditFooter } from '../../components/hms-dashboard';

export const ComplianceDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [, setScope] = useState({ tenantId: 'all', branchId: 'all' });
  const { events: auditEvents, loading: auditLoading } = useAuditEvents({ pageSize: 50 });
  const { report: accessReview, loading: reviewLoading } = useAccessReview();

  // Derive PHI events from audit logs (filter for patient/clinical record types)
  const phiEvents = auditEvents
    .filter(e => ['Patient', 'Encounter', 'LabResult', 'Prescription', 'SOAP', 'ClinicalNote'].includes(e.recordType))
    .slice(0, 5)
    .map(e => ({
      id: e.id,
      timestamp: new Date(e.createdAt).toLocaleString(),
      actorName: e.activeRole || 'Unknown',
      actorRole: e.activeRole || 'N/A',
      patientName: `${e.recordType} ${e.recordId.slice(0, 8)}`,
      patientId: e.recordId,
      tenantName: '',
      branchName: '',
      accessType: (e.eventKey?.includes('BREAK_GLASS') || e.eventKey?.includes('UNAUTHORIZED')) ? 'UNAUTHORIZED' as const : 'ROUTINE' as const,
      reason: e.eventKey || '',
      riskScore: e.eventKey?.includes('BREAK_GLASS') ? 68 : e.eventKey?.includes('UNAUTHORIZED') ? 92 : 12,
    }));

  const criticalCount = phiEvents.filter(e => e.riskScore > 50).length;
  const breakGlassCount = phiEvents.filter(e => e.accessType === 'UNAUTHORIZED').length;
  const auditChainBlocks = auditEvents.length;
  const staleAccountsCount = accessReview?.staleAccountsCount || 0;

  return (
    <HmsDashboardShell widthTier="full">
      <div className="space-y-6 pb-12">
        <HmsPageHeader
          title="Compliance & Governance Workspace"
          description="Real-time PHI monitor, audit-chain verifier, and data privacy dashboard"
        />

        {/* Scope Filter */}
      <ComplianceScopeFilter onScopeChange={(newScope) => setScope(newScope)} />

      {/* Alert Strip: Data Retention & Breach Warnings */}
      <div className="rounded-xl border border-amber-250 bg-amber-50/50 px-4 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2">
          <ShieldAlert className="h-5 w-5 text-amber-600 flex-shrink-0" />
          <div>
            <span className="text-[12px] font-bold text-amber-900 block">SYSTEM STATUS: ENCRYPTION & RETENTION MANDATES ACTIVE</span>
            <span className="text-[10px] text-amber-700 font-semibold block mt-0.5">All patient data access is cryptographically signed and tracked under strict HIPAA and SOC2 compliance rules.</span>
          </div>
        </div>
        <span className="text-[10px] font-extrabold text-amber-700 bg-amber-100 border border-amber-300 rounded-md px-2 py-0.5 font-mono">SECURE</span>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* KPI Band: 4 S-size Cards */}
        <div className="col-span-12 sm:col-span-6 xl:col-span-3">
          <ComplianceRiskCard
            title="Critical Breach Alerts"
            value={auditLoading ? '...' : `${criticalCount} Active`}
            icon={ShieldAlert}
            riskLevel={criticalCount > 0 ? 'CRITICAL' : 'LOW'}
            description={criticalCount > 0 ? 'High-risk events flagged' : 'No critical alerts'}
            actionLabel="View Alerts"
            actionPermission="compliance.phi.monitor"
            onActionClick={() => navigate('/compliance/breach-alerts')}
          />
        </div>
        <div className="col-span-12 sm:col-span-6 xl:col-span-3">
          <ComplianceRiskCard
            title="Unauthorized Access"
            value={`${breakGlassCount} Events`}
            icon={Eye}
            riskLevel={breakGlassCount > 0 ? 'MEDIUM' : 'LOW'}
            description="Flagged access events"
            actionLabel="Review Access Logs"
            actionPermission="compliance.phi.monitor"
            onActionClick={() => navigate('/compliance/phi-access')}
          />
        </div>
        <div className="col-span-12 sm:col-span-6 xl:col-span-3">
          <ComplianceRiskCard
            title="Audit Chain"
            value={`${auditChainBlocks} Events`}
            icon={Lock}
            riskLevel="LOW"
            description="Hash-linked audit trail"
            actionLabel="Verify Integrity"
            onActionClick={() => navigate('/compliance/audit-chain')}
          />
        </div>
        <div className="col-span-12 sm:col-span-6 xl:col-span-3">
          <ComplianceRiskCard
            title="Stale Accounts"
            value={reviewLoading ? '...' : `${staleAccountsCount} Accounts`}
            icon={Users}
            riskLevel={staleAccountsCount > 0 ? 'HIGH' : 'LOW'}
            description={staleAccountsCount > 0 ? 'Awaiting certification' : 'All accounts active'}
            actionLabel="Run Access Reviews"
            onActionClick={() => navigate('/compliance/access-reviews')}
          />
        </div>

        {/* Primary Work Row: PHI Access Monitor (XL Card) + SOC2 Access Review & Tasks (L Card) */}
        <div className="col-span-12 xl:col-span-8">
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">PHI Access Events Monitor</h3>
                <p className="text-[10px] text-slate-400 font-medium">Real audit records of clinical data access</p>
              </div>
              <RequirePermission permission="compliance.phi.monitor">
                <button
                  onClick={() => navigate('/compliance/phi-access')}
                  className="text-xs font-bold text-indigo-650 hover:text-indigo-800 flex items-center gap-1 cursor-pointer transition-colors"
                >
                  Full Monitor <ArrowRight className="h-3 w-3" />
                </button>
              </RequirePermission>
            </div>
            {auditLoading ? (
              <div className="card bg-white border border-slate-200/80 shadow-sm rounded-2xl p-6 text-center text-xs text-slate-400">
                Loading audit events...
              </div>
            ) : phiEvents.length === 0 ? (
              <div className="card bg-white border border-slate-200/80 shadow-sm rounded-2xl p-8 text-center text-slate-400 space-y-2">
                <HelpCircle className="h-6 w-6 mx-auto text-slate-300" />
                <p className="text-xs font-bold">No PHI access events found</p>
                <p className="text-[10px]">Clinical data access events will appear here from the audit log.</p>
              </div>
            ) : (
              <PHIAccessTable events={phiEvents} />
            )}
          </div>
        </div>

        <div className="col-span-12 xl:col-span-4 space-y-6">
          {/* Access Review Summary Card */}
          <div className="card bg-white border border-slate-200/80 shadow-sm rounded-2xl p-5 space-y-4">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">SOC2 Access Review</h4>
            {reviewLoading ? (
              <p className="text-xs text-slate-400">Loading...</p>
            ) : accessReview ? (
              <div className="space-y-3">
                <div className="flex justify-between text-xs border-b pb-2">
                  <span className="font-semibold text-slate-600">Status</span>
                  <StatusBadge
                    status={accessReview.complianceStatus === 'COMPLIANT' ? 'COMPLIANT' : 'NEEDS_ATTENTION'}
                    type={accessReview.complianceStatus === 'COMPLIANT' ? 'success' : 'danger'}
                  />
                </div>
                <div className="flex justify-between text-xs border-b pb-2">
                  <span className="font-semibold text-slate-600">Stale Accounts</span>
                  <span className="font-bold text-slate-700">{accessReview.staleAccountsCount}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="font-semibold text-slate-600">Privilege Escalations</span>
                  <span className="font-bold text-slate-700">{accessReview.privilegeEscalationsCount}</span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-400">Access review data unavailable</p>
            )}
          </div>

          {/* Open Compliance Tasks */}
          <div className="card bg-white border border-slate-200/80 shadow-sm rounded-2xl p-5 space-y-4">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Open Tasks</h4>
            {accessReview && accessReview.staleAccountsCount > 0 ? (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl space-y-2">
                <p className="text-xs font-bold text-rose-700">
                  {accessReview.staleAccountsCount} stale accounts need certification
                </p>
                <p className="text-[10px] text-rose-500">Run access reviews to certify or revoke.</p>
              </div>
            ) : (
              <p className="text-xs text-slate-400">No pending compliance tasks</p>
            )}
          </div>
        </div>

        {/* Secondary Row: Quick Actions + Audit activity timeline */}
        <div className="col-span-12 xl:col-span-4">
          <div className="card bg-white border border-slate-200/80 shadow-sm rounded-2xl p-5 space-y-4">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Compliance Quick Actions</h4>
            <div className="space-y-2">
              {[
                { label: 'Verify Ledger Chains', icon: Lock, path: '/compliance/audit-chain' },
                { label: 'Retention Policies', icon: Database, path: '/compliance/retention' },
                { label: 'Audit Reports', icon: FileText, path: '/compliance/reports' },
                { label: 'Export Logs', icon: History, path: '/compliance/export-logs' },
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

        <div className="col-span-12 xl:col-span-4 card bg-white border border-slate-200/80 shadow-sm rounded-2xl p-5 space-y-4 font-semibold text-slate-700">
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Recent Audit Activity</h4>
          <div className="space-y-2">
            {auditEvents.slice(0, 5).map(e => (
              <div key={e.id} className="text-xs border-b pb-2 last:border-0 last:pb-0">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-700">{e.eventKey}</span>
                  <span className="text-[9px] text-slate-400 font-mono">{new Date(e.createdAt).toLocaleTimeString()}</span>
                </div>
                <p className="text-[10px] text-slate-500">{e.recordType} | {e.activeRole || 'N/A'}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="col-span-12 xl:col-span-4 p-5 bg-indigo-50/40 border border-indigo-150 rounded-2xl flex flex-col justify-center space-y-2.5">
          <div className="flex items-center gap-2">
            <Lock className="h-4.5 w-4.5 text-indigo-600" />
            <h5 className="text-xs font-bold text-indigo-900 uppercase">Cryptographic Verified</h5>
          </div>
          <p className="text-[11px] text-indigo-800 leading-relaxed font-semibold">
            Audit events are hash-chained with SHA-256. Any tampered records are immediately detectable.
          </p>
        </div>

        {/* Analytics Charts & Insights Row (M/L Cards) */}
        <div className="col-span-12 md:col-span-6 xl:col-span-4">
          <ChartCard title="PHI access and flagged events trend" description="Real audit records feed the counters; chart is sandbox until aggregate API exists." height={280}>
            <TrendLineChart data={complianceTrend} title="PHI access trend" valueLabel="Access checks" secondaryLabel="Flagged" />
          </ChartCard>
        </div>
        <div className="col-span-12 md:col-span-6 xl:col-span-4">
          <ChartCard title="Compliance status breakdown" description="Control status view for privacy operations." height={280}>
            <StatusDonutChart data={complianceStatusBreakdown} title="Compliance status breakdown" />
          </ChartCard>
        </div>
        <div className="col-span-12 md:col-span-12 xl:col-span-4">
          <InsightPanel insights={complianceInsights} title="Compliance alerts" />
        </div>

        {/* Compliance control drilldown table (Full-Width Card - 12 cols) */}
        <div className="col-span-12">
          <ReportTable columns={complianceReportColumns} rows={complianceReportRows} caption="Compliance control drilldown table" />
        </div>
      </div>
      </div>
      <HmsAuditFooter />
    </HmsDashboardShell>
  );
};

export default ComplianceDashboard;
