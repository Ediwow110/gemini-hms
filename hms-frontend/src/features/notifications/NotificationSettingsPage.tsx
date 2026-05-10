import { PageHeader } from "../../components/ui/page-header";
import { SectionCard, FormField } from "../../components/ui/section-card";
import { Bell, Mail, MessageSquare, Shield, RefreshCw, Clock, AlertTriangle, Save } from "lucide-react";

export const NotificationSettingsPage = () => {
  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      <PageHeader title="Notification Settings" description="Configure notification channels, providers, retry policies, and quiet hours." />

      {/* PHI Warning */}
      <div className="flex items-start gap-3 p-4 bg-rose-50 border border-rose-200 rounded-xl">
        <Shield className="h-5 w-5 text-rose-600 mt-0.5 flex-shrink-0" />
        <div>
          <p className="text-sm font-semibold text-rose-800">Privacy Notice</p>
          <p className="text-xs text-rose-700 mt-0.5">
            Email and SMS notifications must <strong>never</strong> contain Protected Health Information (PHI). Result-ready notifications should only state that results are available — not the actual results.
          </p>
        </div>
      </div>

      {/* Channel Toggles */}
      <SectionCard title="Channel Configuration">
        <div className="space-y-3">
          {[
            { icon: Bell, label: "In-App Notifications", desc: "Push notifications within the HMS platform", enabled: true },
            { icon: Mail, label: "Email Notifications", desc: "Send emails via configured SMTP/API provider", enabled: false },
            { icon: MessageSquare, label: "SMS Notifications", desc: "Send SMS via configured SMS provider", enabled: false },
          ].map((ch) => (
            <div key={ch.label} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
              <div className="flex items-center gap-3">
                <ch.icon className="h-5 w-5 text-indigo-500" />
                <div>
                  <p className="text-sm font-semibold text-slate-900">{ch.label}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{ch.desc}</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" defaultChecked={ch.enabled} />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
              </label>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* Dispatcher Status */}
      <SectionCard title="Dispatcher Status">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl">
            <p className="text-xs text-slate-500 font-medium">Last Dispatch Run</p>
            <p className="text-lg font-bold text-slate-900 mt-1">Just now</p>
          </div>
          <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl">
            <p className="text-xs text-slate-500 font-medium">Pending Delivery</p>
            <p className="text-lg font-bold text-amber-600 mt-1">0</p>
          </div>
          <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl">
            <p className="text-xs text-slate-500 font-medium">Failed</p>
            <p className="text-lg font-bold text-rose-600 mt-1">0</p>
          </div>
          <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl">
            <p className="text-xs text-slate-500 font-medium">Sent Today</p>
            <p className="text-lg font-bold text-emerald-600 mt-1">12</p>
          </div>
        </div>
      </SectionCard>

      {/* Email Provider */}
      <SectionCard title="Email Provider">
        <div className="flex items-start gap-3 p-3 mb-4 bg-amber-50 border border-amber-200 rounded-xl">
          <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-amber-700"><strong>Mock mode active.</strong> Mock provider does not send real email/SMS. Logs are written to the console instead.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <FormField label="Provider">
            <select className="input">
              <option>Mock Provider (Development)</option>
              <option>Mailrelay</option>
              <option>Amazon SES</option>
              <option>SMTP (Custom)</option>
              <option>SendGrid</option>
            </select>
          </FormField>
          <FormField label="From Address">
            <input className="input" placeholder="noreply@hospital.com" />
          </FormField>
        </div>
      </SectionCard>

      {/* SMS Provider */}
      <SectionCard title="SMS Provider">
        <div className="flex items-start gap-3 p-3 mb-4 bg-amber-50 border border-amber-200 rounded-xl">
          <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-amber-700"><strong>Mock mode active.</strong> Mock provider does not send real SMS. Logs are written to the console instead.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <FormField label="Provider">
            <select className="input">
              <option>Mock Provider (Development)</option>
              <option>Twilio</option>
              <option>Semaphore</option>
              <option>Vonage</option>
            </select>
          </FormField>
          <FormField label="Sender ID">
            <input className="input" placeholder="HMS-HOSPITAL" />
          </FormField>
        </div>
      </SectionCard>

      {/* Retry Policy */}
      <SectionCard title="Retry & Delivery Policy">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
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
          <FormField label="Max Retry Attempts">
            <input className="input" type="number" defaultValue={3} min={0} max={10} />
          </FormField>
        </div>
      </SectionCard>

      {/* Quiet Hours */}
      <SectionCard title="Quiet Hours">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <FormField label="Start Time">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-slate-400" />
              <input className="input flex-1" type="time" defaultValue="22:00" />
            </div>
          </FormField>
          <FormField label="End Time">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-slate-400" />
              <input className="input flex-1" type="time" defaultValue="06:00" />
            </div>
          </FormField>
        </div>
        <p className="text-xs text-slate-500 mt-3">During quiet hours, non-critical email/SMS notifications are held until the end of the quiet period. Critical and in-app notifications are delivered immediately.</p>
      </SectionCard>

      {/* Patient Opt-In */}
      <SectionCard title="Patient Communication Preferences">
        <div className="flex items-start gap-3 p-3 bg-blue-50 border border-blue-200 rounded-xl">
          <Shield className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-blue-700">
            Patient opt-in/opt-out preferences are managed per patient profile. This section controls the global default for new patients.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-4">
          <FormField label="Default Email Opt-In">
            <select className="input">
              <option>Opt-in (patient must agree)</option>
              <option>Opt-out (patient can decline)</option>
              <option>Disabled</option>
            </select>
          </FormField>
          <FormField label="Default SMS Opt-In">
            <select className="input">
              <option>Opt-in (patient must agree)</option>
              <option>Opt-out (patient can decline)</option>
              <option>Disabled</option>
            </select>
          </FormField>
        </div>
      </SectionCard>

      <div className="flex justify-end pt-2">
        <button className="btn btn-primary px-6 py-2.5 text-sm gap-2">
          <Save className="h-4 w-4" /> Save Notification Settings
        </button>
      </div>
    </div>
  );
};
