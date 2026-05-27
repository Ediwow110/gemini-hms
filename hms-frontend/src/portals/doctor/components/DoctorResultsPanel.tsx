import { useState } from 'react';
import { FlaskConical, Eye, BadgeAlert } from 'lucide-react';

interface DiagnosticResult {
  id: string;
  testName: string;
  category: 'Laboratory' | 'Radiology';
  releasedBy: string;
  releasedAt: string;
  summary: string;
  findings: string;
  isCritical: boolean;
}

interface DoctorResultsPanelProps {
  patientId: string;
}

export const DoctorResultsPanel = ({ patientId }: DoctorResultsPanelProps) => {
  const [selectedResult, setSelectedResult] = useState<DiagnosticResult | null>(null);

  const mockResults: DiagnosticResult[] = [
    {
      id: 'RES-01',
      testName: 'Complete Blood Count (CBC)',
      category: 'Laboratory',
      releasedBy: 'Dr. Sarah Connor (Pathologist)',
      releasedAt: '2026-05-20 14:30',
      summary: 'Normal White Blood Cell count. Mild anemia detected.',
      findings: 'Hgb: 11.2 g/dL (Low), WBC: 6.4 x10^9/L, PLT: 250 x10^9/L.',
      isCritical: false,
    },
    {
      id: 'RES-02',
      testName: 'Serum Potassium',
      category: 'Laboratory',
      releasedBy: 'Dr. Sarah Connor (Pathologist)',
      releasedAt: '2026-05-21 08:15',
      summary: 'Critical Hyperkalemia detected. Immediate clinical review required.',
      findings: 'Potassium: 6.2 mEq/L (Critical High), Reference: 3.5 - 5.1 mEq/L.',
      isCritical: true,
    },
  ];

  return (
    <div data-patient-id={patientId} className="card p-5 bg-white border border-slate-200/80 shadow-sm space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <h3 className="font-bold text-slate-800 text-sm tracking-wider uppercase flex items-center gap-2">
          <FlaskConical className="h-4 w-4 text-indigo-500" />
          Released Diagnostic Results
        </h3>
        <span className="bg-indigo-50 text-indigo-700 text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase">
          {mockResults.length} Released
        </span>
      </div>

      {/* Results List */}
      <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
        {mockResults.map(res => (
          <div
            key={res.id}
            onClick={() => setSelectedResult(res)}
            className={`p-3 border rounded-xl flex items-center justify-between gap-3 text-xs cursor-pointer transition-all duration-200 ${
              res.isCritical
                ? 'bg-rose-50/40 border-rose-200 hover:bg-rose-50'
                : 'bg-slate-50/50 border-slate-100 hover:bg-slate-50'
            }`}
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-800">{res.testName}</span>
                {res.isCritical && (
                  <span className="bg-rose-100 text-rose-700 border border-rose-200 text-[8px] font-black px-1.5 py-0.5 rounded flex items-center gap-0.5 tracking-wider uppercase animate-pulse">
                    <BadgeAlert className="h-2.5 w-2.5" />
                    CRITICAL
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 truncate max-w-[220px]">{res.summary}</p>
              <p className="text-[10px] text-slate-400 font-medium">Released: {res.releasedAt}</p>
            </div>

            <button className="p-1.5 bg-white border border-slate-200 rounded-lg text-slate-500 hover:text-indigo-600 shadow-sm transition-colors">
              <Eye className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>

      {/* Result Preview Modal */}
      {selectedResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 shadow-2xl max-w-lg w-full border border-slate-200 animate-slide-up flex flex-col gap-4">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="bg-slate-100 text-slate-600 text-[9px] font-extrabold px-2 py-0.5 rounded uppercase tracking-wider">
                  {selectedResult.category} Report
                </span>
                <h4 className="text-sm font-extrabold text-slate-900 mt-1">{selectedResult.testName}</h4>
              </div>
              {selectedResult.isCritical && (
                <span className="bg-rose-50 text-rose-700 border border-rose-100 text-[10px] font-extrabold px-2.5 py-1 rounded-lg uppercase tracking-wider animate-pulse flex items-center gap-1">
                  <BadgeAlert className="h-3.5 w-3.5" />
                  CRITICAL RESULT
                </span>
              )}
            </div>

            <div className="space-y-3 text-xs leading-relaxed text-slate-600">
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/60 font-mono text-slate-800">
                <p className="font-extrabold text-[10px] uppercase tracking-wider text-slate-400 mb-1.5">Lab Findings</p>
                {selectedResult.findings}
              </div>

              <div>
                <p className="font-bold text-slate-800">Clinical Interpretation Summary</p>
                <p className="text-slate-500 mt-0.5">{selectedResult.summary}</p>
              </div>

              <div className="border-t border-slate-100 pt-3 flex justify-between text-[10px] text-slate-400 font-semibold">
                <span>Signer: {selectedResult.releasedBy}</span>
                <span>Released: {selectedResult.releasedAt}</span>
              </div>
            </div>

            <div className="mt-2 flex justify-end gap-2 border-t border-slate-100 pt-4">
              <button
                onClick={() => setSelectedResult(null)}
                className="btn btn-secondary text-xs px-4 py-2"
              >
                Close Report
              </button>
              <button
                type="button"
                disabled
                title="Doctor result PDF export endpoint is not available yet."
                className="btn cursor-not-allowed bg-slate-100 text-slate-400 text-xs px-4 py-2 flex items-center gap-1.5 border border-slate-200"
              >
                Download PDF WIP
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
