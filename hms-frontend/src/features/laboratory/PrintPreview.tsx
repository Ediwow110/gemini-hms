import { useState } from "react";
import { Link } from "react-router-dom";
import { Printer, CheckCircle, FileWarning } from "lucide-react";
import { RequirePermission } from "../../components/ui/RequirePermission";
import { logger } from "../../lib/logger";

export const PrintPreview = () => {
  const [showAmendModal, setShowAmendModal] = useState(false);
  const [amendReason, setAmendReason] = useState("");

  const handleAmendRequest = () => {
    // In a real app, this would hit POST /api/v1/lab/results/:id/amend
    logger.info("Amendment requested with reason:", amendReason);
    setShowAmendModal(false);
    setAmendReason("");
  };
  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Print Preview</h1>
          <p className="text-sm text-slate-500 mt-1">Review the final document before generating PDF or sending to printer.</p>
        </div>
        <div className="flex gap-3">
          <RequirePermission permission="lab.result.amend.request">
            <button onClick={() => setShowAmendModal(true)} className="btn btn-danger flex items-center gap-2 bg-rose-50 text-rose-700 hover:bg-rose-100 border-none shadow-sm">
              <FileWarning className="h-4 w-4" />
              Amend Result
            </button>
          </RequirePermission>
          <Link to="/lab/results" className="btn btn-secondary">Done</Link>
          <button onClick={() => window.print()} className="btn btn-primary flex items-center gap-2 shadow-md shadow-indigo-200">
            <Printer className="h-4 w-4" />
            Print Result
          </button>
        </div>
      </div>
      
      <div className="flex justify-center animate-slide-up stagger-1">
        <div className="bg-white p-12 w-full max-w-4xl shadow-xl shadow-slate-200/50 rounded-xl border border-slate-200 min-h-[800px]">
          
          {/* Mock Header */}
          <div className="text-center mb-8 border-b-2 border-indigo-900 pb-6">
            <h1 className="text-3xl font-extrabold text-indigo-900 uppercase tracking-tight" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>HMS Core Medical Center</h1>
            <p className="text-sm text-slate-600 mt-1">123 Health Ave, Medical City | Tel: (02) 123-4567</p>
            <h2 className="text-xl font-bold mt-6 text-slate-800">LABORATORY RESULT</h2>
          </div>
          
          {/* Mock Patient Info */}
          <div className="grid grid-cols-2 gap-x-8 gap-y-2 mb-8 text-sm">
            <div className="flex"><span className="font-bold w-24">Patient:</span> <span>DOE, JOHN</span></div>
            <div className="flex"><span className="font-bold w-24">Date/Time:</span> <span>May 09, 2026 10:00 AM</span></div>
            <div className="flex"><span className="font-bold w-24">Age/Sex:</span> <span>45 / Male</span></div>
            <div className="flex"><span className="font-bold w-24">Req. Dr.:</span> <span>Dr. Smith</span></div>
            <div className="flex"><span className="font-bold w-24">Patient ID:</span> <span>P001</span></div>
            <div className="flex"><span className="font-bold w-24">Order ID:</span> <span>ORD-2026-001</span></div>
          </div>
          
          {/* Mock Result Body */}
          <div className="mb-12">
            <h3 className="font-bold text-lg border-b border-slate-300 pb-2 mb-4 bg-slate-50 px-2 py-1">HEMATOLOGY</h3>
            <h4 className="font-bold mb-4 px-2">COMPLETE BLOOD COUNT</h4>
            
            <table className="w-full text-sm">
              <thead className="border-b-2 border-slate-300">
                <tr>
                  <th className="text-left py-2 px-2">Test</th>
                  <th className="text-left py-2 px-2">Result</th>
                  <th className="text-left py-2 px-2">Unit</th>
                  <th className="text-left py-2 px-2">Reference</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="py-2 px-2 font-medium">White Blood Cells</td>
                  <td className="py-2 px-2 font-bold flex items-center gap-1">
                    12.5 <span className="text-[10px] font-bold uppercase tracking-wider">*HIGH</span>
                  </td>
                  <td className="py-2 px-2">x10^9/L</td>
                  <td className="py-2 px-2">4.5 - 11.0</td>
                </tr>
                <tr>
                  <td className="py-2 px-2 font-medium">Red Blood Cells</td>
                  <td className="py-2 px-2 font-medium">4.8</td>
                  <td className="py-2 px-2">x10^12/L</td>
                  <td className="py-2 px-2">4.0 - 5.5</td>
                </tr>
                <tr>
                  <td className="py-2 px-2 font-medium">Hemoglobin</td>
                  <td className="py-2 px-2 font-medium">145</td>
                  <td className="py-2 px-2">g/L</td>
                  <td className="py-2 px-2">120 - 160</td>
                </tr>
              </tbody>
            </table>
          </div>
          
          {/* Mock Signatures */}
          <div className="grid grid-cols-2 gap-8 mt-24">
            <div className="text-center">
              <div className="h-12 flex items-end justify-center mb-1">
                <span className="font-[signature] italic text-2xl text-slate-700">Jane Smith</span>
              </div>
              <div className="border-t border-slate-400 pt-2">
                <p className="font-bold text-sm">Jane Smith, RMT</p>
                <p className="text-xs text-slate-500">Medical Technologist</p>
                <p className="text-xs text-slate-500">Lic. No: 123456</p>
              </div>
            </div>
            <div className="text-center">
              <div className="h-12 flex items-end justify-center mb-1 relative">
                <span className="font-[signature] italic text-3xl text-indigo-900 z-10 relative">Dr. A. Pathologist</span>
                <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none">
                  <CheckCircle className="h-16 w-16 text-emerald-500" />
                </div>
              </div>
              <div className="border-t border-slate-400 pt-2">
                <p className="font-bold text-sm">Dr. Alan Pathologist, MD</p>
                <p className="text-xs text-slate-500">Pathologist</p>
                <p className="text-xs text-slate-500">Lic. No: 987654</p>
              </div>
            </div>
          </div>
          
        </div>
      </div>

      {showAmendModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl animate-slide-up">
            <div className="flex items-center gap-3 text-rose-600 mb-4 border-b border-slate-100 pb-4">
              <div className="p-2 bg-rose-50 rounded-lg">
                <FileWarning className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Request Amendment</h3>
                <p className="text-xs text-slate-500">This requires Approval Engine authorization.</p>
              </div>
            </div>
            
            <div className="space-y-4 mb-6">
              <p className="text-sm text-slate-600">
                You are about to request an amendment for a released result. The previous version will be archived.
              </p>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Reason for Amendment (Required)</label>
                <textarea 
                  className="input min-h-[100px]" 
                  placeholder="e.g. Typographical error in WBC count, correcting value from 12.5 to 1.25"
                  value={amendReason}
                  onChange={(e) => setAmendReason(e.target.value)}
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <button onClick={() => setShowAmendModal(false)} className="btn btn-secondary py-2">Cancel</button>
              <button onClick={handleAmendRequest} disabled={!amendReason.trim()} className="btn btn-danger py-2 bg-rose-600 hover:bg-rose-700">Submit Request</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
