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
      patientName: e.recordId,
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
    <HmsDashboardShell>
      <div className="space-y-6 pb-12">
        <HmsPageHeader
          title="Compliance & Governance Workspace"
          description="Real-time PHI monitor, audit-chain verifier, and data privacy dashboard"
        />

        {/* Scope Filter */}
      <ComplianceScopeFilter onScopeChange={(newScope) => setScope(newScope)} />

      {/* Risk Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <ComplianceRiskCard
          title="Critical Breach Alerts"
          value={auditLoading ? '...' : `${criticalCount} Active`}
          icon={ShieldAlert}
          riskLevel={criticalCount > 0 ? 'CRITICAL' : 'LOW'}
          description={criticalCount > 0 ? 'High-risk events flagged' : 'No critical alerts'}
          actionLabel="View Alerts"
          onActionClick={() => navigate('/compliance/breach-alerts')}
        />
        <ComplianceRiskCard
          title="Unauthorized Access"
          value={`${breakGlassCount} Events`}
          icon={Eye}
          riskLevel={breakGlassCount > 0 ? 'MEDIUM' : 'LOW'}
          description="Flagged access events"
          actionLabel="Review Access Logs"
          onActionClick={() => navigate('/compliance/phi-access')}
        />
        <ComplianceRiskCard
          title="Audit Chain"
          value={`${auditChainBlocks} Events`}
          icon={Lock}
          riskLevel="LOW"
          description="Hash-linked audit trail"
          actionLabel="Verify Integrity"
          onActionClick={() => navigate('/compliance/audit-chain')}
        />
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

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <ChartCard title="PHI access and flagged events trend" description="Real audit records feed the counters; chart is sandbox until aggregate API exists." height={280}>
          <TrendLineChart data={complianceTrend} title="PHI access trend" valueLabel="Access checks" secondaryLabel="Flagged" />
        </ChartCard>
        <ChartCard title="Compliance status breakdown" description="Control status view for privacy operations." height={280}>
          <StatusDonutChart data={complianceStatusBreakdown} title="Compliance status breakdown" />
        </ChartCard>
        <InsightPanel insights={complianceInsights} title="Compliance alerts" />
      </div>

      <ReportTable columns={complianceReportColumns} rows={complianceReportRows} caption="Compliance control drilldown table" />

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* PHI Access Monitor */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">PHI Access Events Monitor</h3>
                <p className="text-[10px] text-slate-400 font-medium">Real audit records of clinical data access</p>
              </div>
              <button
                onClick={() => navigate('/compliance/phi-access')}
                className="text-xs font-bold text-indigo-650 hover:text-indigo-800 flex items-center gap-1 cursor-pointer transition-colors"
              >
                Full Monitor <ArrowRight className="h-3 w-3" />
              </button>
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

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Failed Login Trends */}
            <div className="card bg-white border border-slate-200/80 shadow-sm rounded-2xl p-5 space-y-4">
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

            {/* Access Review Summary */}
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
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Quick Actions Panel */}
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

          {/* Security Info */}
          <div className="p-4 bg-indigo-50/40 border border-indigo-150 rounded-2xl space-y-2.5">
            <div className="flex items-center gap-2">
              <Lock className="h-4.5 w-4.5 text-indigo-600" />
              <h5 className="text-xs font-bold text-indigo-900 uppercase">Cryptographic Verified</h5>
            </div>
            <p className="text-[11px] text-indigo-800 leading-relaxed font-semibold">
              Audit events are hash-chained with SHA-256. Any tampered records are immediately detectable.
            </p>
          </div>
        </div>
      </div>
      </div>
      <HmsAuditFooter />
    </HmsDashboardShell>
  );
};

export default ComplianceDashboard;
