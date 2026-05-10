import { SectionCard, FormField } from "../../components/ui/section-card";
import { Bell, Mail, MessageSquare, RefreshCw, Shield, AlertTriangle } from "lucide-react";

export const NotificationSettings = () => {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* PHI Warning */}
      <div className="flex items-start gap-3 p-4 bg-rose-50 border border-rose-200 rounded-xl">
        <Shield className="h-5 w-5 text-rose-600 mt-0.5 flex-shrink-0" />
        <div>
          <p className="text-sm font-semibold text-rose-800">Privacy Notice</p>
          <p className="text-xs text-rose-700 mt-0.5">
            Email and SMS notifications must <strong>never</strong> contain Protected Health Information (PHI).
            Result-ready notifications should only state that results are available — not the actual results.
          </p>
        </div>
      </div>

      {/* Email Provider */}
      <SectionCard title="Email Provider">
        <div className="flex items-start gap-3 p-3 mb-4 bg-amber-50 border border-amber-200 rounded-xl">
          <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-amber-700">
            <strong>Not configured.</strong> Email notifications (result-ready, appointment reminders) will not be sent until a provider is configured.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <FormField label="Provider">
            <select className="input">
              <option value="">— Select provider —</option>
              <option>SMTP (Custom)</option>
              <option>SendGrid</option>
              <option>AWS SES</option>
            </select>
          </FormField>
          <FormField label="From Address">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-slate-400" />
              <input className="input flex-1" placeholder="noreply@hospital.com" />
            </div>
          </FormField>
          <FormField label="SMTP Host">
            <input className="input" placeholder="smtp.example.com" disabled />
          </FormField>
          <FormField label="SMTP Port">
            <input className="input" placeholder="587" type="number" disabled />
          </FormField>
        </div>
      </SectionCard>

      {/* SMS Provider */}
      <SectionCard title="SMS Provider">
        <div className="flex items-start gap-3 p-3 mb-4 bg-amber-50 border border-amber-200 rounded-xl">
          <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-amber-700">
            <strong>Not configured.</strong> SMS notifications will not be sent until a provider is set up.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <FormField label="Provider">
            <select className="input">
              <option value="">— Select provider —</option>
              <option>Twilio</option>
              <option>Semaphore</option>
              <option>Vonage</option>
            </select>
          </FormField>
          <FormField label="Sender ID">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-slate-400" />
              <input className="input flex-1" placeholder="HMS-HOSPITAL" />
            </div>
          </FormField>
        </div>
      </SectionCard>

      {/* In-App & Retry */}
      <SectionCard title="In-App Notifications & Retry Policy">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <FormField label="In-App Notifications">
            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
              <Bell className="h-4 w-4 text-indigo-500" />
              <span className="text-sm text-slate-700 font-medium">Enabled</span>
              <label className="relative inline-flex items-center cursor-pointer ml-auto">
                <input type="checkbox" className="sr-only peer" defaultChecked />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
              </label>
            </div>
          </FormField>
          <FormField label="Retry Policy">
            <div className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4 text-slate-400" />
              <select className="input flex-1">
                <option>3 retries, exponential backoff (30s, 2m, 10m)</option>
                <option>5 retries, linear backoff (1m intervals)</option>
                <option>No retry</option>
              </select>
            </div>
          </FormField>
        </div>
      </SectionCard>

      {/* Result-ready template */}
      <SectionCard title="Result-Ready Notification Template">
        <div className="flex items-start gap-3 p-3 mb-4 bg-blue-50 border border-blue-200 rounded-xl">
          <Shield className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-blue-700">
            This template is used for patient-facing result notifications. It must <strong>not</strong> include test names or values.
          </p>
        </div>
        <FormField label="SMS/Email Body">
          <textarea
            className="input min-h-[100px] py-3 font-mono text-xs"
            defaultValue={`Dear {{patient_name}},\n\nYour laboratory results are now available. Please visit the hospital or your patient portal to view them.\n\nThank you,\n{{hospital_name}}`}
          />
        </FormField>
      </SectionCard>
    </div>
  );
};
