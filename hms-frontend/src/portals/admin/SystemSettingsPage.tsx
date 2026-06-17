import React from 'react';
import { useNavigate } from 'react-router-dom';
import { HmsPageHeader } from '../../components/hms-page';
import { HmsDashboardShell, HmsAuditFooter } from '../../components/hms-dashboard';
import { Construction, ListChecks } from 'lucide-react';

export const SystemSettingsPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <HmsDashboardShell
      widthTier="compact"
      footer={<HmsAuditFooter dataSource="Not implemented in this release" />}
    >
      <HmsPageHeader
        title="Global System Config"
        description="Configure global multi-tenant controls, security thresholds, and network parameters."
        badge="Not Available"
      />

      <div className="max-w-3xl mx-auto py-10">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-slate-100 rounded-2xl">
              <Construction className="h-7 w-7 text-slate-500" aria-hidden="true" />
            </div>
            <div className="flex-1">
              <h2 className="text-base font-extrabold text-slate-800 tracking-tight">
                Not yet implemented in this release
              </h2>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                Global system configuration is reserved for a future release. The
                controls previously visible here (password policy, session timeout,
                MFA enforcement toggle, SMTP configuration) are not available. No
                write actions are committed to the HMS backend from this route.
                Persisting system settings today requires environment variable
                changes through the operations pipeline.
              </p>

              <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50/50 p-4">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wider">
                  <ListChecks className="h-4 w-4 text-slate-500" aria-hidden="true" />
                  Planned functionality
                </div>
                <ul className="mt-2 space-y-1 text-xs text-slate-600 list-disc list-inside">
                  <li>Persisted auth and password policy settings</li>
                  <li>Session and lockout policy management</li>
                  <li>SMTP / notification provider configuration with validation</li>
                  <li>Audit-logged configuration changes with rollback support</li>
                </ul>
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  type="button"
                  onClick={() => navigate('/admin')}
                  className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 text-white px-4 py-2 text-xs font-bold hover:bg-indigo-700"
                >
                  Back to Admin Dashboard
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </HmsDashboardShell>
  );
};

export default SystemSettingsPage;
