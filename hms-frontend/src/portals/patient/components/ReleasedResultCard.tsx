import React from 'react';
import { FlaskConical, Download, FileText, CheckCircle2, Printer } from 'lucide-react';

export interface ReleasedResult {
  id: string;
  testName: string;
  dateReleased: string;
  doctorName: string;
  status: 'NORMAL' | 'ABNORMAL' | 'CRITICAL';
  isReleased: boolean; // Mandatory check
  doctorNotes?: string; // Optional doctor notes
}

interface ReleasedResultCardProps {
  results: ReleasedResult[];
}

export const ReleasedResultCard: React.FC<ReleasedResultCardProps> = ({ results }) => {
  // SECURITY NOTICE: This isReleased filter exists in UI code for functional shell purposes.
  // In a production environment, API/Backend enforcement is STRICTLY REQUIRED to prevent 
  // unreleased laboratory data from ever reaching the client-side state.
  const releasedResults = results.filter(r => r.isReleased);

  return (
    <div className="bg-white border border-slate-200/80 shadow-sm rounded-2xl p-5 space-y-4">
      <div className="flex justify-between items-center pb-2 border-b border-slate-100">
        <div>
          <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <FlaskConical className="h-4 w-4 text-indigo-500" />
            Latest Released Results
          </h3>
          <p className="text-[10px] text-slate-400 font-medium">Secure access to your medical tests</p>
        </div>
        <FileText className="h-4 w-4 text-slate-400" />
      </div>

      <div className="space-y-3">
        {releasedResults.length === 0 ? (
          <div className="py-8 text-center bg-slate-50 rounded-xl border border-slate-100">
            <p className="text-[10px] text-slate-400 font-bold">No results available for release yet</p>
          </div>
        ) : (
          releasedResults.map((result) => (
            <div key={result.id} className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-3 group">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center">
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs font-black text-slate-800">{result.testName}</p>
                    <p className="text-[9px] text-slate-500 font-bold uppercase tracking-tight">{result.dateReleased} · {result.doctorName}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className={`px-1.5 py-0.5 rounded text-[9px] font-extrabold border ${
                    result.status === 'NORMAL' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                    result.status === 'ABNORMAL' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                    'bg-rose-50 text-rose-700 border-rose-100'
                  }`}>
                    {result.status}
                  </div>
                  <button
                    disabled
                    title="Download PDF (WIP - Coming Soon)"
                    aria-label="Download PDF (WIP - Coming Soon)"
                    className="p-1.5 bg-slate-100 text-slate-400 rounded-lg border border-slate-200 cursor-not-allowed shadow-sm opacity-50"
                  >
                    <Download className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => window.print()}
                    title={`Print Lab Result for ${result.testName}`}
                    aria-label={`Print Lab Result for ${result.testName}`}
                    className="p-1.5 bg-white hover:bg-indigo-600 text-slate-400 hover:text-white rounded-lg transition-all border border-slate-200 cursor-pointer shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                  >
                    <Printer className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {result.doctorNotes && (
                <div className="pl-11 pr-4 py-2 border-l-2 border-indigo-200 bg-white/50 rounded-r-lg">
                  <p className="text-[9px] font-black text-indigo-600 uppercase mb-0.5">Physician's Notes</p>
                  <p className="text-[10px] text-slate-600 font-medium italic">"{result.doctorNotes}"</p>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      <div className="bg-rose-50 border border-rose-100 rounded-xl px-3 py-2 text-[10px] text-rose-800 font-bold leading-relaxed">
        <strong>Privacy Note:</strong> Only results verified and released by your physician are displayed here. Preliminary or unreleased lab data is strictly restricted.
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 text-[10px] text-amber-800 font-semibold leading-relaxed">
        <strong>Sandbox Notice:</strong> Download actions are simulated and do not provide real medical documents.
      </div>
    </div>
  );
};

export default ReleasedResultCard;
