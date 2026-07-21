import React from 'react';
import { Database, FileText, History, Lock, ShieldAlert } from 'lucide-react';
import {
  AnalyticsMetricCard,
  ChartCard,
  InsightPanel,
  StatusDonutChart,
  TrendLineChart,
} from '../../components/analytics';
import { HmsPageHeader } from '../../components/hms-page';
import {
  HmsAuditFooter,
  HmsDashboardShell,
  HmsDataSourceBadge,
  HmsQuickActions,
  HmsToolbar,
} from '../../components/hms-dashboard';
import ComplianceScopeFilter from './components/ComplianceScopeFilter';
import PHIAccessTable, { type PHIAccessEvent } from './components/PHIAccessTable';
import { StatusBadge } from '../../components/feedback/StatusBadge';
import { useAnalytics } from '../../hooks/use-analytics';
import { useAccessReview, useAuditEvents } from '../../hooks/use-compliance';
import { usePermissions } from '../../hooks/use-user';
import {
  dashboardDemoConfig,
  demoComplianceDashboard,
} from '../../data/dashboard-demo';

export const ComplianceDashboard: React.FC = () => {
  const { hasPermission } = usePermissions();
  const canMonitorPhi = hasPermission('compliance.phi.monitor');
  const canReviewAudit = hasPermission('compliance.audit.review');
  const canExportReports = hasPermission('compliance.report.export');
  const {
    compliance,
    isLoading: analyticsLoading,
    isFetching,
    demoByScope,
    refetchAll: refetchAnalytics,
  } = useAnalytics('compliance');
  const {
    events: auditEvents,
    loading: auditLoading,
    error: auditError,
    refetch: refetchAudit,
  } = useAuditEvents({ pageSize: 50 });
  const {
    report: accessReview,
    loading: reviewLoading,
    error: reviewError,
    refetch: refetchReview,
  } = useAccessReview();

  const livePhiEvents: PHIAccessEvent[] = auditEvents
    .filter((event) =>
      ['Patient', 'Encounter', 'LabResult', 'Prescription', 'SOAP', 'ClinicalNote'].includes(
        event.recordType,
      ),
    )
    .slice(0, 8)
    .map((event) => {
      const isBreakGlass = event.eventKey?.includes('BREAK_GLASS');
      const isUnauthorized = event.eventKey?.includes('UNAUTHORIZED');
      return {
        id: event.id,
        timestamp: new Date(event.createdAt).toLocaleString(),
        actorName: event.activeRole || 'Recorded user',
        actorRole: event.activeRole || 'Role unavailable',
        patientName: `${event.recordType} record`,
        patientId: event.recordId,
        tenantName: 'Current tenant',
        branchName: 'Recorded branch',
        accessType: isUnauthorized
          ? 'UNAUTHORIZED'
          : isBreakGlass
            ? 'EMERGENCY'
            : 'ROUTINE',
        reason: event.eventKey || 'AUDIT_EVENT',
        riskScore: isUnauthorized ? 92 : isBreakGlass ? 68 : 12,
      };
    });

  const allowSynthetic = dashboardDemoConfig.mode !== 'off';
  const useDemoEvents = allowSynthetic && !auditLoading && livePhiEvents.length === 0;
  const displayedEvents = useDemoEvents
    ? demoComplianceDashboard.phiEvents
    : livePhiEvents;
  const hasSyntheticContent = demoByScope.compliance || useDemoEvents || allowSynthetic;

  const criticalCount = displayedEvents.filter((event) => event.riskScore >= 70).length;
  const emergencyCount = displayedEvents.filter((event) => event.accessType === 'EMERGENCY').length;
  const staleAccountsCount = accessReview?.staleAccountsCount ?? 0;

  const refresh = async () => {
    await Promise.all([refetchAnalytics(), refetchAudit(), refetchReview()]);
  };

  return (
    <HmsDashboardShell
      toolbar={
        <HmsToolbar
          branchName="Tenant governance"
          role="Compliance Operations"
          onRefresh={() => void refresh()}
          refreshing={isFetching || auditLoading || reviewLoading}
        />
      }
      footer={
        <HmsAuditFooter
          dataSource={
            hasSyntheticContent
              ? 'Live audit records with synthetic trend context'
              : 'Compliance and audit APIs'
          }
        />
      }
    >
      <HmsPageHeader
        eyebrow="Risk and governance"
        title="Compliance Operations Center"
        description="PHI access, account-review risk and audit activity organized around investigation and certification work."
        actions={
          <HmsDataSourceBadge
            mode={hasSyntheticContent ? 'demo' : 'live'}
            label={hasSyntheticContent ? 'Live + synthetic trends' : undefined}
          />
        }
      />

      <ComplianceScopeFilter />

      {(auditError || reviewError) && !hasSyntheticContent && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-800">
          {auditError || reviewError}
        </div>
      )}

      <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
        <div className="flex items-start gap-3">
          <Lock className="mt-0.5 h-5 w-5 shrink-0 text-indigo-600" />
          <div>
            <p className="text-sm font-semibold text-slate-900">Audit controls are enabled</p>
            <p className="mt-0.5 text-xs leading-5 text-slate-600">
              Integrity verification and retention evidence remain available through the dedicated review workflows; this summary does not claim a fresh verification run.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(190px,1fr))] gap-4">
        <AnalyticsMetricCard
          title="Critical access events"
          value={auditLoading ? '—' : criticalCount}
          icon={ShieldAlert}
          severity={criticalCount > 0 ? 'critical' : 'success'}
          href={canMonitorPhi ? '/compliance/breach-alerts' : undefined}
        />
        <AnalyticsMetricCard
          title="Emergency access"
          value={auditLoading ? '—' : emergencyCount}
          icon={Lock}
          severity={emergencyCount > 0 ? 'warning' : 'success'}
          href={canMonitorPhi ? '/compliance/phi-access' : undefined}
        />
        <AnalyticsMetricCard
          title="Audit events"
          value={analyticsLoading ? '—' : compliance.totalAuditEvents.toLocaleString()}
          icon={History}
          severity="info"
          href="/compliance/audit-review"
        />
        <AnalyticsMetricCard
          title="Stale accounts"
          value={reviewLoading ? '—' : staleAccountsCount}
          icon={Database}
          severity={staleAccountsCount > 0 ? 'warning' : 'success'}
          href="/compliance/access-reviews"
        />
        <AnalyticsMetricCard
          title="Control score"
          value={analyticsLoading ? '—' : `${Math.max(0, Math.min(100, compliance.complianceScore))}%`}
          icon={FileText}
          severity={compliance.complianceScore >= 90 ? 'success' : 'warning'}
        />
      </div>

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 xl:col-span-8">
          <div className="space-y-3">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Recent PHI access</h2>
              <p className="mt-1 text-xs text-slate-500">Patient identifiers remain masked in the dashboard view.</p>
            </div>
            <PHIAccessTable events={displayedEvents} isDemo={useDemoEvents} />
          </div>
        </div>

        <div className="col-span-12 space-y-6 xl:col-span-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-900">Access review</h3>
            {reviewLoading ? (
              <p className="mt-4 text-xs text-slate-400">Loading access review…</p>
            ) : accessReview ? (
              <dl className="mt-4 space-y-3 text-xs">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <dt className="font-medium text-slate-600">Status</dt>
                  <dd>
                    <StatusBadge
                      status={accessReview.complianceStatus === 'COMPLIANT' ? 'COMPLIANT' : 'NEEDS ATTENTION'}
                      type={accessReview.complianceStatus === 'COMPLIANT' ? 'success' : 'danger'}
                    />
                  </dd>
                </div>
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <dt className="font-medium text-slate-600">Stale accounts</dt>
                  <dd className="font-mono font-semibold text-slate-900">{accessReview.staleAccountsCount}</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="font-medium text-slate-600">Privilege escalations</dt>
                  <dd className="font-mono font-semibold text-slate-900">{accessReview.privilegeEscalationsCount}</dd>
                </div>
              </dl>
            ) : (
              <p className="mt-4 text-xs text-slate-500">Access-review data is unavailable.</p>
            )}
          </div>

          <HmsQuickActions
            title="Review workflows"
            actions={[
              ...(canReviewAudit
                ? [
                    { id: 'chain', label: 'Verify audit chain', icon: <Lock className="h-4 w-4" />, href: '/compliance/audit-chain' },
                    { id: 'retention', label: 'Retention policies', icon: <Database className="h-4 w-4" />, href: '/compliance/retention' },
                  ]
                : []),
              ...(canExportReports
                ? [
                    { id: 'reports', label: 'Audit reports', icon: <FileText className="h-4 w-4" />, href: '/compliance/reports' },
                    { id: 'exports', label: 'Export logs', icon: <History className="h-4 w-4" />, href: '/compliance/export-logs' },
                  ]
                : []),
            ]}
          />
        </div>

        <div className="col-span-12 xl:col-span-8">
          <ChartCard
            title="PHI access activity"
            description="Synthetic access checks and flagged-event trend for visual review."
            emphasis="primary"
          >
            <TrendLineChart
              data={demoComplianceDashboard.phiAccessTrend}
              title="PHI access activity"
              valueLabel="Access checks"
              secondaryLabel="Flagged events"
            />
          </ChartCard>
        </div>
        <div className="col-span-12 xl:col-span-4">
          <ChartCard
            title="Control status"
            description="Synthetic control-effectiveness distribution."
          >
            <StatusDonutChart
              data={demoComplianceDashboard.statusBreakdown}
              title="Control status"
            />
          </ChartCard>
        </div>

        <div className="col-span-12 xl:col-span-6">
          <InsightPanel
            insights={demoComplianceDashboard.insights}
            title="Governance decisions"
          />
        </div>
        <div className="col-span-12 xl:col-span-6">
          <div className="h-full rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-900">Recent audit activity</h3>
            <div className="mt-4 divide-y divide-slate-100">
              {auditEvents.slice(0, 6).map((event) => (
                <div key={event.id} className="flex items-start justify-between gap-3 py-3 first:pt-0 last:pb-0">
                  <div className="min-w-0">
                    <p className="truncate text-xs font-semibold text-slate-800">{event.eventKey}</p>
                    <p className="mt-0.5 text-[10px] text-slate-500">{event.recordType} · {event.activeRole || 'Role unavailable'}</p>
                  </div>
                  <span className="shrink-0 font-mono text-[9px] text-slate-400">{new Date(event.createdAt).toLocaleTimeString()}</span>
                </div>
              ))}
              {auditEvents.length === 0 && (
                <p className="py-8 text-center text-xs text-slate-400">No live audit activity is available.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </HmsDashboardShell>
  );
};

export default ComplianceDashboard;
