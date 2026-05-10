import { useState } from "react";
import { SectionCard, FormField } from "../../components/ui/section-card";
import { Shield, Clock, Lock, KeyRound, Download, Archive, AlertTriangle, Save } from "lucide-react";

export const SecuritySettings = () => {
  const [showConfirm, setShowConfirm] = useState(false);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Audit notice */}
      <div className="flex items-start gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
        <Shield className="h-4 w-4 text-slate-400 mt-0.5 flex-shrink-0" />
        <p className="text-xs text-slate-500">
          Security policy changes are high-risk operations. All modifications are logged in the audit trail and require confirmation.
        </p>
      </div>

      {/* Session */}
      <SectionCard title="Session Management">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <FormField label="Session Timeout (minutes)" required>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-slate-400" />
              <input className="input flex-1" type="number" defaultValue={30} min={5} max={480} />
            </div>
          </FormField>
          <FormField label="Idle Warning Before Timeout (minutes)">
            <input className="input" type="number" defaultValue={5} min={1} max={30} />
          </FormField>
        </div>
      </SectionCard>

      {/* Password Policy */}
      <SectionCard title="Password Policy">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <FormField label="Minimum Length" required>
            <div className="flex items-center gap-2">
              <Lock className="h-4 w-4 text-slate-400" />
              <input className="input flex-1" type="number" defaultValue={8} min={8} max={128} />
            </div>
          </FormField>
          <FormField label="Require Uppercase">
            <select className="input">
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
          </FormField>
          <FormField label="Require Number">
            <select className="input">
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
          </FormField>
          <FormField label="Require Special Character">
            <select className="input">
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
          </FormField>
          <FormField label="Password Expiry (days)">
            <input className="input" type="number" defaultValue={90} min={0} max={365} />
          </FormField>
          <FormField label="Password History (count)">
            <input className="input" type="number" defaultValue={5} min={0} max={24} />
          </FormField>
        </div>
      </SectionCard>

      {/* MFA */}
      <SectionCard title="Multi-Factor Authentication">
        <div className="flex items-start gap-3 p-3 mb-4 bg-indigo-50 border border-indigo-200 rounded-xl">
          <KeyRound className="h-4 w-4 text-indigo-600 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-indigo-700">
            MFA enforcement is configurable per role. When enabled, users must complete a second factor at login.
            <span className="block mt-1 text-indigo-500 italic">Integration with TOTP/SMS providers is pending.</span>
          </p>
        </div>
        <div className="space-y-3">
          {["Admin", "Manager", "Doctor", "HR"].map((role) => (
            <div key={role} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
              <div className="flex items-center gap-2">
                <KeyRound className="h-4 w-4 text-slate-400" />
                <span className="text-sm font-semibold text-slate-900">{role}</span>
              </div>
              <select className="input w-40 text-xs">
                <option value="required">Required</option>
                <option value="optional">Optional</option>
                <option value="disabled">Disabled</option>
              </select>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* Login Lockout */}
      <SectionCard title="Login Attempt Lockout">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <FormField label="Max Failed Attempts" required>
            <input className="input" type="number" defaultValue={5} min={3} max={20} />
          </FormField>
          <FormField label="Lockout Duration (minutes)">
            <input className="input" type="number" defaultValue={15} min={1} max={1440} />
          </FormField>
        </div>
      </SectionCard>

      {/* Export Approval */}
      <SectionCard title="Data Export Controls">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <FormField label="Export Approval Threshold (records)">
            <div className="flex items-center gap-2">
              <Download className="h-4 w-4 text-slate-400" />
              <input className="input flex-1" type="number" defaultValue={100} min={1} />
            </div>
          </FormField>
          <FormField label="Require Approval for Bulk Export">
            <select className="input">
              <option value="yes">Yes — exports over threshold need approval</option>
              <option value="no">No — all exports allowed</option>
            </select>
          </FormField>
        </div>
      </SectionCard>

      {/* Audit Retention */}
      <SectionCard title="Audit Log Retention">
        <div className="flex items-start gap-3 p-3 mb-4 bg-amber-50 border border-amber-200 rounded-xl">
          <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-amber-700">
            Reducing retention period is irreversible once old logs are purged. Healthcare regulations may mandate minimum retention of 7+ years.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <FormField label="Retention Period">
            <div className="flex items-center gap-2">
              <Archive className="h-4 w-4 text-slate-400" />
              <select className="input flex-1">
                <option>7 years (recommended for healthcare)</option>
                <option>5 years</option>
                <option>3 years</option>
                <option>1 year</option>
                <option>Indefinite</option>
              </select>
            </div>
          </FormField>
        </div>
      </SectionCard>

      {/* Save */}
      <div className="flex justify-end pt-2">
        <button className="btn btn-warning px-6 py-2.5 text-sm gap-2" onClick={() => setShowConfirm(true)}>
          <Save className="h-4 w-4" /> Save Security Settings
        </button>
      </div>

      {/* Confirmation */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 animate-fade-in">
          <div className="card p-6 max-w-md w-full mx-4 animate-scale-in">
            <div className="flex items-start gap-3 mb-4">
              <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
              <div>
                <h3 className="text-base font-bold text-slate-900">Confirm Security Policy Change</h3>
                <p className="text-xs text-slate-500 mt-1">
                  You are about to modify security policies. This action will be recorded in the audit log.
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-4">
              <button className="btn btn-secondary px-4 py-2 text-sm" onClick={() => setShowConfirm(false)}>Cancel</button>
              <button className="btn btn-warning px-6 py-2 text-sm" onClick={() => setShowConfirm(false)}>Confirm & Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
