import { useState } from "react";
import { PageHeader } from "../../components/ui/page-header";
import { SectionCard, FormField } from "../../components/ui/section-card";
import { FileText, Eye, Shield, AlertTriangle, CheckCircle2, Mail, MessageSquare, Bell } from "lucide-react";

interface Template {
  key: string;
  name: string;
  channels: string[];
  subject: string;
  bodyPreview: string;
  privacyClass: string;
  isActive: boolean;
}

const mockTemplates: Template[] = [
  { key: "ACCOUNT_INVITATION", name: "Account Invitation", channels: ["EMAIL", "IN_APP"], subject: "You have been invited to {{hospitalName}}", bodyPreview: "Dear {{userName}}, You have been invited...", privacyClass: "PUBLIC", isActive: true },
  { key: "PASSWORD_RESET", name: "Password Reset", channels: ["EMAIL"], subject: "Password Reset Request", bodyPreview: "A password reset was requested for your account...", privacyClass: "SENSITIVE", isActive: true },
  { key: "APPOINTMENT_REMINDER", name: "Appointment Reminder", channels: ["EMAIL", "SMS", "IN_APP"], subject: "Appointment Reminder", bodyPreview: "This is a reminder that you have an upcoming appointment...", privacyClass: "PUBLIC", isActive: true },
  { key: "QUEUE_UPDATE", name: "Queue Update", channels: ["SMS", "IN_APP"], subject: "Queue Status Update", bodyPreview: "Your queue status has been updated...", privacyClass: "PUBLIC", isActive: true },
  { key: "PAYMENT_CONFIRMATION", name: "Payment Confirmation", channels: ["EMAIL", "SMS", "IN_APP"], subject: "Payment Confirmation", bodyPreview: "Your payment of {{amount}} has been received...", privacyClass: "PUBLIC", isActive: true },
  { key: "RESULT_READY", name: "Result Ready Notice", channels: ["EMAIL", "SMS", "IN_APP"], subject: "A Secure Document Is Available", bodyPreview: "A secure document is available in your patient portal...", privacyClass: "PHI-SAFE", isActive: true },
  { key: "APPROVAL_REQUEST", name: "Approval Request", channels: ["EMAIL", "IN_APP"], subject: "Approval Required: {{approvalType}}", bodyPreview: "An action requires your approval...", privacyClass: "INTERNAL", isActive: true },
  { key: "LOW_STOCK_ALERT", name: "Low Stock Alert", channels: ["IN_APP", "EMAIL"], subject: "LOW STOCK ALERT: {{itemName}}", bodyPreview: "Item {{itemName}} (SKU: {{itemSku}}) has fallen to {{currentStock}} units...", privacyClass: "INTERNAL", isActive: true },
  { key: "SECURITY_ALERT", name: "Security Alert", channels: ["EMAIL", "IN_APP"], subject: "Security Alert: Unusual Activity Detected", bodyPreview: "Unusual activity was detected on your account...", privacyClass: "SENSITIVE", isActive: true },
];

const channelBadge = (ch: string) => {
  const icons: Record<string, React.ElementType> = { EMAIL: Mail, SMS: MessageSquare, IN_APP: Bell };
  const Icon = icons[ch] || Bell;
  return (
    <span key={ch} className="inline-flex items-center gap-1 text-[10px] font-medium text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
      <Icon className="h-2.5 w-2.5" /> {ch}
    </span>
  );
};

const privacyBadge = (cls: string) => {
  const map: Record<string, string> = {
    "PUBLIC": "text-emerald-700 bg-emerald-50",
    "PHI-SAFE": "text-blue-700 bg-blue-50",
    "INTERNAL": "text-amber-700 bg-amber-50",
    "SENSITIVE": "text-rose-700 bg-rose-50",
  };
  return <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${map[cls] || "bg-slate-100"}`}>{cls}</span>;
};

export const NotificationTemplates = () => {
  const [templates] = useState(mockTemplates);
  const [previewKey, setPreviewKey] = useState<string | null>(null);
  const [showEditWarning, setShowEditWarning] = useState(false);
  const [reason, setReason] = useState("");

  const previewTemplate = templates.find((t) => t.key === previewKey);

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      <PageHeader title="Notification Templates" description="Manage notification templates, channels, and privacy classifications." />

      <div className="flex items-start gap-3 p-3 bg-rose-50 border border-rose-200 rounded-xl">
        <Shield className="h-4 w-4 text-rose-600 mt-0.5 flex-shrink-0" />
        <p className="text-xs text-rose-700">
          Templates marked <strong>PHI-SAFE</strong> must never contain lab results, diagnoses, or patient-specific health data. Email/SMS channels must only reference the patient portal.
        </p>
      </div>

      <SectionCard title="Templates">
        <div className="overflow-hidden rounded-xl border border-slate-200">
          <table className="w-full table-premium">
            <thead>
              <tr>
                <th>Template</th>
                <th>Key</th>
                <th>Channels</th>
                <th>Privacy</th>
                <th>Status</th>
                <th className="w-32"></th>
              </tr>
            </thead>
            <tbody>
              {templates.map((t) => (
                <tr key={t.key}>
                  <td>
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-slate-400" />
                      <span className="font-semibold text-slate-900 text-sm">{t.name}</span>
                    </div>
                  </td>
                  <td><code className="text-xs bg-slate-100 text-indigo-600 px-2 py-0.5 rounded font-mono">{t.key}</code></td>
                  <td><div className="flex flex-wrap gap-1">{t.channels.map(channelBadge)}</div></td>
                  <td>{privacyBadge(t.privacyClass)}</td>
                  <td>
                    {t.isActive ? (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full"><CheckCircle2 className="h-3 w-3" /> Active</span>
                    ) : (
                      <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">Inactive</span>
                    )}
                  </td>
                  <td>
                    <div className="flex gap-1">
                      <button className="btn-ghost px-2 py-1 text-xs rounded-lg flex items-center gap-1" onClick={() => setPreviewKey(t.key)}><Eye className="h-3 w-3" /> Preview</button>
                      <button className="btn-ghost px-2 py-1 text-xs rounded-lg" onClick={() => setShowEditWarning(true)}>Edit</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>

      {/* Preview Modal */}
      {previewTemplate && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 animate-fade-in">
          <div className="card p-6 max-w-lg w-full mx-4 animate-scale-in">
            <h3 className="text-base font-bold text-slate-900 mb-1">{previewTemplate.name}</h3>
            <div className="flex gap-2 mb-4">{previewTemplate.channels.map(channelBadge)} {privacyBadge(previewTemplate.privacyClass)}</div>
            <div className="space-y-3">
              <div><p className="text-xs text-slate-400 mb-1">Subject:</p><p className="text-sm font-semibold text-slate-900 bg-slate-50 p-2 rounded-lg">{previewTemplate.subject}</p></div>
              <div><p className="text-xs text-slate-400 mb-1">Body Preview:</p><p className="text-xs text-slate-700 bg-slate-50 p-3 rounded-lg whitespace-pre-wrap leading-relaxed font-mono">{previewTemplate.bodyPreview}</p></div>
            </div>
            <div className="flex justify-end mt-4">
              <button className="btn btn-secondary px-4 py-2 text-sm" onClick={() => setPreviewKey(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Warning */}
      {showEditWarning && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 animate-fade-in">
          <div className="card p-6 max-w-md w-full mx-4 animate-scale-in">
            <div className="flex items-start gap-3 mb-4">
              <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
              <div>
                <h3 className="text-base font-bold text-slate-900">Template Edit Requires Reason</h3>
                <p className="text-xs text-slate-500 mt-1">Template changes are audited. Please provide a reason before editing.</p>
              </div>
            </div>
            <FormField label="Reason for Change" required>
              <textarea className="input min-h-[80px] py-3" placeholder="e.g., Updated wording for clarity..." value={reason} onChange={(e) => setReason(e.target.value)} />
            </FormField>
            <div className="flex justify-end gap-3 mt-4">
              <button className="btn btn-secondary px-4 py-2 text-sm" onClick={() => { setShowEditWarning(false); setReason(""); }}>Cancel</button>
              <button className="btn btn-primary px-6 py-2 text-sm" disabled={!reason.trim()}>Open Editor</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
