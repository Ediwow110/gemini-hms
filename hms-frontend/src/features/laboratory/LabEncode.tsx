import { WorkflowTimeline } from "../../components/ui/lab-workflow";
import { PatientIdentityHeader } from "../../components/ui/patient-identity-header";
import { PageHeader } from "../../components/ui/page-header";
import { useNavigate } from "react-router-dom";

export const LabEncode = () => {
  const navigate = useNavigate();
  const patient = { id: "P001", name: "John Doe", age: 45, gender: "M", category: "Regular", balance: 0 };

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      <PageHeader title="Encode Results" description="Enter laboratory results for the requested tests." />
      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        <WorkflowTimeline currentStep={3} />
      </div>
      
      <PatientIdentityHeader patient={patient} />
      
      <div className="card overflow-hidden animate-slide-up stagger-1">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
          <h2 className="font-bold text-slate-900" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Complete Blood Count (CBC)</h2>
          <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2.5 py-1 uppercase tracking-wider rounded border border-rose-100">STAT Priority</span>
        </div>
        
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50/80 text-slate-500 font-medium border-b border-slate-200">
            <tr>
              <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider">Test / Parameter</th>
              <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider">Result</th>
              <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider">Flag</th>
              <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider">Unit</th>
              <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider">Reference Range</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            <tr className="hover:bg-slate-50 transition-colors">
              <td className="px-6 py-4 font-semibold text-slate-900">White Blood Cells (WBC)</td>
              <td className="px-6 py-3">
                <input type="text" className="input h-9 py-1 w-32 border-rose-300 focus:ring-rose-200 bg-rose-50/30 text-rose-900 font-bold" defaultValue="12.5" />
              </td>
              <td className="px-6 py-4"><span className="text-xs font-bold text-rose-600 bg-rose-100 px-2 py-0.5 rounded">HIGH</span></td>
              <td className="px-6 py-4 text-slate-500 font-mono text-xs">x10^9/L</td>
              <td className="px-6 py-4 text-slate-500 font-mono text-xs">4.5 - 11.0</td>
            </tr>
            <tr className="hover:bg-slate-50 transition-colors">
              <td className="px-6 py-4 font-semibold text-slate-900">Red Blood Cells (RBC)</td>
              <td className="px-6 py-3">
                <input type="text" className="input h-9 py-1 w-32 font-medium" defaultValue="4.8" />
              </td>
              <td className="px-6 py-4"></td>
              <td className="px-6 py-4 text-slate-500 font-mono text-xs">x10^12/L</td>
              <td className="px-6 py-4 text-slate-500 font-mono text-xs">4.0 - 5.5</td>
            </tr>
            <tr className="hover:bg-slate-50 transition-colors">
              <td className="px-6 py-4 font-semibold text-slate-900">Hemoglobin (Hgb)</td>
              <td className="px-6 py-3">
                <input type="text" className="input h-9 py-1 w-32 font-medium" defaultValue="145" />
              </td>
              <td className="px-6 py-4"></td>
              <td className="px-6 py-4 text-slate-500 font-mono text-xs">g/L</td>
              <td className="px-6 py-4 text-slate-500 font-mono text-xs">120 - 160</td>
            </tr>
          </tbody>
        </table>
        
        <div className="p-6 bg-slate-50/50 border-t border-slate-100">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Med-Tech Remarks</label>
          <textarea className="input min-h-[80px]" placeholder="Optional notes about the sample or result..." />
        </div>
      </div>
      
      <div className="flex justify-end gap-3 pt-4 animate-fade-in stagger-2">
        <button onClick={() => navigate('/lab/results')} className="btn btn-secondary px-6">Save as Draft</button>
        <button onClick={() => navigate('/lab/results')} className="btn btn-primary px-6">Submit for Validation</button>
      </div>
    </div>
  );
};
