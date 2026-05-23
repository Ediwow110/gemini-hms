import React, { useState } from 'react';
import { PageHeader } from '../../components/ui/page-header';
import { Settings, AlertTriangle, ShieldCheck, Mail, ShieldAlert, Sliders } from 'lucide-react';

export const SystemSettingsPage: React.FC = () => {
  const [showToast, setShowToast] = useState(false);
  const [mfaEnforce, setMfaEnforce] = useState(true);
  const [sessionTimeout, setSessionTimeout] = useState('60');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setShowToast(true);
    setTimeout(() => {
      setShowToast(false);
    }, 4000);
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Sandbox Warning Banner */}
      <div className="p-4 bg-amber-50 border border-amber-150 rounded-2xl flex gap-3 text-xs text-amber-800">
        <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
        <div>
          <h5 className="font-extrabold uppercase text-[10px] tracking-wider">UI Global Settings Sandbox</h5>
          <p className="font-medium mt-0.5">
            This settings console configures global parameters in local sandbox memory. Multi-tenant rules, authentication thresholds, and gateway SMTP parameters are simulated. No backend config alterations are saved.
          </p>
        </div>
      </div>

      <div className="flex justify-between items-center">
        <PageHeader 
          title="Global System Settings" 
          description="Configure global multi-tenant controls, security thresholds, and network parameters." 
        />
      </div>

      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Security and Credentials Policies */}
        <div className="lg:col-span-2 space-y-6">
          <div className="card p-5 bg-white border border-slate-200/80 shadow-sm rounded-2xl space-y-5">
            <h3 className="font-bold text-slate-800 text-sm tracking-wider uppercase border-b border-slate-100 pb-3 flex items-center gap-2">
              <ShieldCheck className="h-4.5 w-4.5 text-indigo-500" />
              Auth & Security Configurations
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700">Minimum Password Length</label>
                <select className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20">
                  <option value="8">8 Characters</option>
                  <option value="12">12 Characters</option>
                  <option value="16">16 Characters</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-700">Session Timeout (minutes)</label>
                <input 
                  type="number"
                  value={sessionTimeout}
                  onChange={(e) => setSessionTimeout(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
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
                  placeholder="smtp.hms-core.local"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700">SMTP Port</label>
                <input 
                  type="number"
                  placeholder="587"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
              <div className="space-y-1.5 md:col-span-2">
                <label className="font-bold text-slate-700">Sender Address Mask</label>
                <input 
                  type="email"
                  placeholder="noreply@hms-core.local"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Save Configurations Controls */}
        <div className="space-y-6">
          <div className="card p-5 bg-white border border-slate-200/80 shadow-sm rounded-2xl space-y-4">
            <h3 className="font-bold text-slate-800 text-sm tracking-wider uppercase border-b border-slate-100 pb-3 flex items-center gap-2">
              <Sliders className="h-4.5 w-4.5 text-indigo-500" />
              Settings Registry
            </h3>

            <p className="text-xs text-slate-400 font-semibold leading-relaxed">
              Global variables can be modified or updated in-memory for testing. Click save to temporarily register updates inside the sandbox.
            </p>

            <button 
              type="submit"
              className="w-full btn btn-primary bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 rounded-xl shadow-md transition-colors"
            >
              Save Configuration Settings
            </button>
          </div>

          <div className="card p-5 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs space-y-3 leading-relaxed">
            <h4 className="font-bold text-slate-700 flex items-center gap-1.5">
              <ShieldAlert className="h-4.5 w-4.5 text-slate-500" />
              Security Policy Bounds
            </h4>
            <p className="text-slate-500">
              Settings altered here affect the simulated application behaviors temporarily. To maintain compliance, the application is restricted from writing directly to environment files or configuration databases.
            </p>
          </div>
        </div>
      </form>

      {showToast && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex gap-3 text-xs text-amber-800 animate-scale-in">
          <Settings className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5 animate-pulse" />
          <div>
            <h5 className="font-extrabold uppercase text-[10px] tracking-wider">UI Demonstration Sandbox</h5>
            <p className="font-medium mt-0.5">
              Global system parameters updated in sandbox memory. No adjustments have been persisted.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
export default SystemSettingsPage;
