import { useState } from "react";
import { SectionCard, FormField } from "../../components/ui/section-card";
import { FileText, Eye, CheckCircle2, AlertTriangle, History } from "lucide-react";

interface Template {
  id: string;
  name: string;
  type: string;
  version: string;
  isActive: boolean;
  updatedAt: string;
}

const mockTemplates: Template[] = [
  { id: "1", name: "Lab Result Report", type: "lab_result", version: "v2.1", isActive: true, updatedAt: "2026-04-15" },
  { id: "2", name: "Official Receipt", type: "receipt", version: "v1.3", isActive: true, updatedAt: "2026-03-20" },
  { id: "3", name: "Invoice", type: "invoice", version: "v1.0", isActive: true, updatedAt: "2026-02-10" },
  { id: "4", name: "Queue Ticket", type: "queue_ticket", version: "v1.1", isActive: true, updatedAt: "2026-04-01" },
  { id: "5", name: "Barcode Label (Specimen)", type: "barcode", version: "v1.0", isActive: true, updatedAt: "2026-01-15" },
];

export const TemplateSettings = () => {
  const [templates] = useState(mockTemplates);
  const [showReasonDialog, setShowReasonDialog] = useState(false);
  const [reason, setReason] = useState("");

  return (
    <div className="space-y-6 animate-fade-in">
      <SectionCard title="Print Templates">
        {/* Version preservation warning */}
        <div className="flex items-start gap-3 p-3 mb-4 bg-blue-50 border border-blue-200 rounded-xl">
          <History className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-blue-700">
            Previously generated documents retain the template version used at creation time. Updating a template does not retroactively change existing printouts.
          </p>
        </div>

        <div className="overflow-hidden rounded-xl border border-slate-200">
          <table className="w-full table-premium">
            <thead>
              <tr>
                <th>Template</th>
                <th>Type</th>
                <th>Active Version</th>
                <th>Last Updated</th>
                <th>Status</th>
                <th className="w-32"></th>
              </tr>
            </thead>
            <tbody>
              {templates.map((t) => (
                <tr key={t.id}>
                  <td>
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-slate-400" />
                      <span className="font-semibold text-slate-900">{t.name}</span>
                    </div>
                  </td>
                  <td>
                    <code className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono">{t.type}</code>
                  </td>
                  <td>
                    <span className="inline-flex items-center gap-1 text-xs font-mono font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                      {t.version}
                    </span>
                  </td>
                  <td className="text-xs text-slate-500">{t.updatedAt}</td>
                  <td>
                    {t.isActive ? (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                        <CheckCircle2 className="h-3 w-3" /> Active
                      </span>
                    ) : (
                      <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">Draft</span>
                    )}
                  </td>
                  <td>
                    <div className="flex gap-1">
                      <button className="btn-ghost px-2 py-1 text-xs rounded-lg flex items-center gap-1">
                        <Eye className="h-3 w-3" /> Preview
                      </button>
                      <button className="btn-ghost px-2 py-1 text-xs rounded-lg" onClick={() => setShowReasonDialog(true)}>Edit</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>

      {/* Reason dialog for template changes */}
      {showReasonDialog && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 animate-fade-in">
          <div className="card p-6 max-w-md w-full mx-4 animate-scale-in">
            <div className="flex items-start gap-3 mb-4">
              <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
              <div>
                <h3 className="text-base font-bold text-slate-900">Template Change Requires Reason</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Template modifications create a new version. The previous version is preserved for historical documents.
                </p>
              </div>
            </div>
            <FormField label="Reason for Change" required>
              <textarea
                className="input min-h-[80px] py-3"
                placeholder="e.g., Updated header logo per hospital rebranding..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </FormField>
            <div className="flex justify-end gap-3 mt-4">
              <button className="btn btn-secondary px-4 py-2 text-sm" onClick={() => { setShowReasonDialog(false); setReason(""); }}>Cancel</button>
              <button className="btn btn-primary px-6 py-2 text-sm" disabled={!reason.trim()}>Open Editor</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
