import React, { useState, useEffect } from 'react';
import { HmsPageHeader } from '../../components/hms-page';
import { HmsDashboardShell, HmsAuditFooter, HmsLoadingSkeleton } from '../../components/hms-dashboard';
import { AdminShellNotice } from './components/AdminShellNotice';
import { ShieldCheck, Mail, ShieldAlert, Sliders, AlertTriangle } from 'lucide-react';

export const SystemSettingsPage: React.FC = () => {
  const [mfaEnforce, setMfaEnforce] = useState(true);
  const [sessionTimeout, setSessionTimeout] = useState('60');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <HmsDashboardShell>
        <HmsLoadingSkeleton variant="panel" />
      </HmsDashboardShell>
    );
  }

  return (
    <HmsDashboardShell widthTier="compact"
      footer={<HmsAuditFooter dataSource="Mock settings (sandbox)" />}
    >
      <AdminShellNotice />
      <HmsPageHeader
        title="Global System Config"
        description="Configure global multi-tenant controls, security thresholds, and network parameters."
        badge="Sandbox"
      />

      <div
        className="p-3 bg-amber-50 border border-amber-200 rounded-2xl flex gap-2.5 text-xs text-amber-800"
      >
        <AlertTriangle className="h-4.5 w-4.5 text-amber-600 mt-0.5 flex-shrink-0" />
        <div>
          <p className="font-bold text-[10px] uppercase tracking-wider">Sandbox Only — No Persistence</p>
          <p className="mt-0.5 leading-relaxed">
            These settings are displayed for interface review only. No backend
            configuration API exists yet. Changes made here affect only the
            current session and are discarded on navigation.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="card p-5 bg-white border border-slate-200/80 shadow-sm rounded-2xl space-y-5">
            <h3 className="font-bold text-slate-800 text-sm tracking-wider uppercase border-b border-slate-100 pb-3 flex items-center gap-2">
              <ShieldCheck className="h-4.5 w-4.5 text-indigo-500" />
              Auth & Security Configurations
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700">Minimum Password Length</label>
                <select
                  disabled
                  className="w-full p-2.5 bg-slate-100 border border-slate-200 rounded-xl font-semibold opacity-60 cursor-not-allowed"
                >
                  <option value="8">8 Characters</option>
                  <option value="12">12 Characters</option>
                  <option value="16">16 Characters</option>
                </select>
                <p className="text-[10px] text-slate-400">No backend endpoint to persist this value.</p>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-700">Session Timeout (minutes)</label>
                <input 
                  type="number"
                  value={sessionTimeout}
                  onChange={(e) => setSessionTimeout(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
                <p className="text-[10px] text-slate-400">Session-local only. Not persisted.</p>
              </div>

              <div className="md:col-span-2 flex items-center justify-between p-3.5 bg-slate-50 rounded-2xl border border-slate-200/60 mt-2">
                <div>
                  <p className="font-bold text-slate-800">Enforce Multi-Factor Authentication (MFA)</p>
                  <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Require 2FA configuration systemwide for administrative and clinical staff</p>
                </div>
                <input 
                  type="checkbox"
                  checked={mfaEnforce}
                  onChange={(e) => setMfaEnforce(e.target.checked)}
                  className="h-5 w-5 rounded border-slate-350 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
              </div>
            </div>
          </div>

          <div className="card p-5 bg-white border border-slate-200/80 shadow-sm rounded-2xl space-y-5">
            <h3 className="font-bold text-slate-800 text-sm tracking-wider uppercase border-b border-slate-100 pb-3 flex items-center gap-2">
              <Mail className="h-4.5 w-4.5 text-indigo-500" />
              SMTP Communication Gateway
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700">SMTP Host Server</label>
                <input 
                  type="text"
                  value="smtp.hms-core.local"
                  disabled
                  className="w-full p-2.5 bg-slate-100 border border-slate-200 rounded-xl font-semibold opacity-60 cursor-not-allowed"
                />
                <p className="text-[10px] text-slate-400">No backend endpoint to persist this value.</p>
              </div>
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700">SMTP Port</label>
                <input 
                  type="number"
                  value="587"
                  disabled
                  className="w-full p-2.5 bg-slate-100 border border-slate-200 rounded-xl font-semibold opacity-60 cursor-not-allowed"
                />
                <p className="text-[10px] text-slate-400">No backend endpoint to persist this value.</p>
              </div>
              <div className="space-y-1.5 md:col-span-2">
                <label className="font-bold text-slate-700">Sender Address Mask</label>
                <input 
                  type="email"
                  value="noreply@hms-core.local"
                  disabled
                  className="w-full p-2.5 bg-slate-100 border border-slate-200 rounded-xl font-semibold opacity-60 cursor-not-allowed"
                />
                <p className="text-[10px] text-slate-400">No backend endpoint to persist this value.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="card p-5 bg-white border border-slate-200/80 shadow-sm rounded-2xl space-y-4">
            <h3 className="font-bold text-slate-800 text-sm tracking-wider uppercase border-b border-slate-100 pb-3 flex items-center gap-2">
              <Sliders className="h-4.5 w-4.5 text-indigo-500" />
              Settings Registry
            </h3>

            <p className="text-xs text-slate-400 font-semibold leading-relaxed">
              Configuration values displayed here are sandbox defaults. No backend
              config API exists. To adjust real system settings, deploy infrastructure
              configuration or environment variable changes through the operations pipeline.
            </p>

            <button 
              type="button"
              disabled
              className="w-full btn bg-slate-200 text-slate-400 font-bold py-2.5 rounded-xl cursor-not-allowed"
            >
              Save Configuration Settings (Unavailable)
            </button>
          </div>

          <div className="card p-5 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs space-y-3 leading-relaxed">
            <h4 className="font-bold text-slate-700 flex items-center gap-1.5">
              <ShieldAlert className="h-4.5 w-4.5 text-slate-500" />
              Security Policy Bounds
            </h4>
            <p className="text-slate-500">
              Settings altered here affect session-local state only. The application
              has no backend configuration API. Persisting system settings requires
              infrastructure deployment through the operations pipeline.
            </p>
          </div>
        </div>
      </div>
    </HmsDashboardShell>
  );
};
export default SystemSettingsPage;
