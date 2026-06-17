import { useState } from "react";
import { SectionCard, FormField } from "../../components/ui/section-card";
import { HmsDashboardShell, HmsAuditFooter } from "../../components/hms-dashboard";
import { Hash, AlertTriangle, Eye, RotateCcw } from "lucide-react";

interface NumberingRule {
  id: string;
  label: string;
  prefix: string;
  separator: string;
  yearReset: boolean;
  branchAware: boolean;
  nextNumber: string;
}

const mockRules: NumberingRule[] = [
  { id: "patient", label: "Patient ID", prefix: "PAT", separator: "-", yearReset: true, branchAware: false, nextNumber: "PAT-2026-00147" },
  { id: "order", label: "Order Number", prefix: "ORD", separator: "-", yearReset: true, branchAware: true, nextNumber: "ORD-MAIN-2026-01203" },
  { id: "invoice", label: "Invoice Number", prefix: "INV", separator: "-", yearReset: true, branchAware: true, nextNumber: "INV-MAIN-2026-00891" },
  { id: "receipt", label: "Receipt Number", prefix: "RCT", separator: "-", yearReset: true, branchAware: true, nextNumber: "RCT-MAIN-2026-00645" },
  { id: "lab", label: "Lab Number", prefix: "LAB", separator: "-", yearReset: true, branchAware: false, nextNumber: "LAB-2026-02456" },
  { id: "employee", label: "Employee ID", prefix: "EMP", separator: "-", yearReset: false, branchAware: false, nextNumber: "EMP-00034" },
];

export const NumberingSettings = () => {
  const [rules] = useState(mockRules);
  const [editing, setEditing] = useState<NumberingRule | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [reason, setReason] = useState("");

  const handleSave = () => {
    setShowConfirm(true);
  };

  return (
    <HmsDashboardShell
      widthTier="full"
      footer={<HmsAuditFooter dataSource="Mock numbering rules (sandbox)" />}
    >
      <div className="space-y-6 animate-fade-in">
        <SectionCard title="Numbering Rules (Mock)">
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs font-semibold text-amber-800" data-testid="numbering-settings-sandbox-notice">
            <strong>Sandbox Notice:</strong> The numbering rules and &ldquo;Next Number Preview&rdquo; values shown below are mock placeholder data, not real production counters. The preview values (&ldquo;PAT-2026-00147&rdquo;, &ldquo;ORD-MAIN-2026-01203&rdquo;, &ldquo;INV-MAIN-2026-00891&rdquo;, etc.) are illustrative only; real numbering counters are managed by the database. The live numbering-rules API is not yet wired; Edit, Save, and Confirm Change buttons below are UI demos only. The amber &ldquo;high-risk operation&rdquo; banner describes the intended change-control behavior; it is not active enforcement in this sandbox.
          </div>
          <div className="flex items-start gap-3 p-3 mb-4 mt-4 bg-amber-50 border border-amber-200 rounded-xl">
            <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-amber-700">
              Changing numbering rules is a <strong>high-risk operation</strong>. All changes require a confirmation step and a reason. Changes only apply to new records — existing numbers are never modified.
            </p>
          </div>

          <div className="overflow-hidden rounded-xl border border-slate-200">
            <table className="w-full table-premium">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Prefix</th>
                  <th>Year Reset</th>
                  <th>Branch-Aware</th>
                  <th>Next Number Preview</th>
                  <th className="w-20"></th>
                </tr>
              </thead>
              <tbody>
                {rules.map((r) => (
                  <tr key={r.id}>
                    <td>
                      <div className="flex items-center gap-2">
                        <Hash className="h-4 w-4 text-slate-400" />
                        <span className="font-semibold text-slate-900">{r.label}</span>
                      </div>
                    </td>
                    <td><code className="text-xs bg-slate-100 text-indigo-600 px-2 py-0.5 rounded font-mono">{r.prefix}</code></td>
                    <td>
                      {r.yearReset ? (
                        <span className="inline-flex items-center gap-1 text-xs text-emerald-600"><RotateCcw className="h-3 w-3" /> Yes</span>
                      ) : (
                        <span className="text-xs text-slate-400">No</span>
                      )}
                    </td>
                    <td>
                      {r.branchAware ? (
                        <span className="text-xs text-indigo-600 font-medium">Yes</span>
                      ) : (
                        <span className="text-xs text-slate-400">No</span>
                      )}
                    </td>
                    <td>
                      <div className="flex items-center gap-1.5">
                        <Eye className="h-3 w-3 text-slate-400" />
                        <code className="text-xs font-mono text-slate-700">{r.nextNumber}</code>
                      </div>
                    </td>
                    <td>
                      <button className="btn-ghost px-2 py-1 text-xs rounded-lg" onClick={() => setEditing(r)}>Edit</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>

        {/* Edit Panel */}
        {editing && (
          <SectionCard title={`Edit: ${editing.label}`}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <FormField label="Prefix" required>
                <input className="input font-mono" defaultValue={editing.prefix} />
              </FormField>
              <FormField label="Separator">
                <input className="input font-mono" defaultValue={editing.separator} />
              </FormField>
              <FormField label="Reset Counter Yearly">
                <select className="input" defaultValue={editing.yearReset ? "yes" : "no"}>
                  <option value="yes">Yes — reset to 00001 each year</option>
                  <option value="no">No — continuous increment</option>
                </select>
              </FormField>
              <FormField label="Branch-Aware Numbering">
                <select className="input" defaultValue={editing.branchAware ? "yes" : "no"}>
                  <option value="yes">Yes — include branch code</option>
                  <option value="no">No — global sequence</option>
                </select>
              </FormField>
            </div>
            <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-200">
              <p className="text-xs text-slate-500">
                <strong>Preview:</strong>{" "}
                <code className="font-mono text-indigo-600">{editing.nextNumber}</code>
              </p>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button className="btn btn-secondary px-4 py-2 text-sm" onClick={() => { setEditing(null); setShowConfirm(false); }}>Cancel</button>
              <button className="btn btn-warning px-6 py-2 text-sm" onClick={handleSave}>Save (Requires Confirmation)</button>
            </div>
          </SectionCard>
        )}

        {/* Confirmation dialog */}
        {showConfirm && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 animate-fade-in">
            <div className="card p-6 max-w-md w-full mx-4 animate-scale-in">
              <h3 className="text-base font-bold text-slate-900 mb-2">Confirm Numbering Change</h3>
              <p className="text-xs text-slate-500 mb-4">
                This change will affect how future records are numbered. Existing numbers will not be modified. Please provide a reason.
              </p>
              <FormField label="Reason for Change" required>
                <textarea
                  className="input min-h-[80px] py-3"
                  placeholder="e.g., Switching to branch-aware format for 2026..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
              </FormField>
              <div className="flex justify-end gap-3 mt-4">
                <button className="btn btn-secondary px-4 py-2 text-sm" onClick={() => { setShowConfirm(false); setReason(""); }}>Cancel</button>
                <button className="btn btn-warning px-6 py-2 text-sm" disabled={!reason.trim()}>Confirm Change</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </HmsDashboardShell>
  );
};
