import { Link } from "react-router-dom";
import { WorkflowTimeline } from "../../components/ui/lab-workflow";
import { PatientIdentityHeader } from "../../components/ui/patient-identity-header";
import { PageHeader } from "../../components/ui/page-header";

export const LabApproval = () => {
  const patient = { id: "P001", name: "John Doe", age: 45, gender: "M", category: "Regular", balance: 0 };

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      <PageHeader title="Review & Approve Results" description="Verify encoded results before release." />
      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        <WorkflowTimeline currentStep={4} />
      </div>
      
      <PatientIdentityHeader patient={patient} />
      
      <div className="card overflow-hidden animate-slide-up stagger-1">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
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
            <tr className="hover:bg-slate-50 transition-colors bg-rose-50/20">
              <td className="px-6 py-4 font-semibold text-slate-900">White Blood Cells (WBC)</td>
              <td className="px-6 py-4 font-extrabold text-rose-700">12.5</td>
              <td className="px-6 py-4"><span className="text-xs font-bold text-rose-600 bg-rose-100 px-2 py-0.5 rounded">HIGH</span></td>
              <td className="px-6 py-4 text-slate-500 font-mono text-xs">x10^9/L</td>
              <td className="px-6 py-4 text-slate-500 font-mono text-xs">4.5 - 11.0</td>
            </tr>
            <tr className="hover:bg-slate-50 transition-colors">
              <td className="px-6 py-4 font-semibold text-slate-900">Red Blood Cells (RBC)</td>
              <td className="px-6 py-4 font-medium text-slate-900">4.8</td>
              <td className="px-6 py-4"></td>
              <td className="px-6 py-4 text-slate-500 font-mono text-xs">x10^12/L</td>
              <td className="px-6 py-4 text-slate-500 font-mono text-xs">4.0 - 5.5</td>
            </tr>
          </tbody>
        </table>
        
        <div className="grid grid-cols-2 gap-4 p-6 bg-slate-50/50 border-t border-slate-100">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Encoded By</p>
            <p className="text-sm font-semibold text-slate-900">Jane Smith, RMT</p>
            <p className="text-xs text-slate-500 font-mono mt-0.5">May 09, 2026 - 10:15 AM</p>
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Med-Tech Remarks</p>
            <p className="text-sm font-medium text-slate-700 italic">"Sample slightly hemolyzed."</p>
          </div>
        </div>
      </div>
      
      <div className="flex justify-between items-center pt-4 animate-fade-in stagger-2">
        <Link to="/lab/results/1/encode" className="btn btn-secondary text-rose-600 border-rose-200 bg-rose-50 hover:bg-rose-100 px-6">
          Reject & Return to Encoder
        </Link>
        <Link to="/lab/results/1/print-preview" className="btn btn-primary px-6 shadow-md shadow-indigo-200">
          Approve & Release Result
        </Link>
      </div>
    </div>
  );
};
