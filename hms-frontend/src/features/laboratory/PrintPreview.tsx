import { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { Printer, CheckCircle, FileWarning, Loader2 } from "lucide-react";
import { RequirePermission } from "../../components/ui/RequirePermission";
import { logger } from "../../lib/logger";
import { labService } from "../../services/lab.service";

export const PrintPreview = () => {
  const { id } = useParams<{ id: string }>();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAmendModal, setShowAmendModal] = useState(false);
  const [amendReason, setAmendReason] = useState("");
  const [submittingAmend, setSubmittingAmend] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError(null);
    labService.getResult(id)
      .then((data) => {
        setResult(data);
      })
      .catch((err) => {
        logger.error("Failed to load lab result for print preview", err);
        setError("Failed to load lab result. It may not exist or you may lack permissions.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [id]);

  const handleAmendRequest = async () => {
    if (!id || !amendReason.trim()) return;
    setSubmittingAmend(true);
    try {
      await labService.requestAmendment(id, amendReason);
      logger.info("Amendment requested successfully with reason:", amendReason);
      setShowAmendModal(false);
      setAmendReason("");
      // reload
      const updated = await labService.getResult(id);
      setResult(updated);
    } catch (err) {
      logger.error("Failed to submit amendment request", err);
      alert("Failed to submit amendment request. Make sure the result is in RELEASED status.");
    } finally {
      setSubmittingAmend(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        <p className="text-sm text-slate-500 font-semibold">Loading lab result details...</p>
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="p-6 max-w-md mx-auto text-center space-y-4">
        <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl text-rose-700 text-sm font-semibold">
          {error || "Lab result not found."}
        </div>
        <Link to="/lab/results" className="btn btn-secondary inline-block">Back to Results</Link>
      </div>
    );
  }

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
          
          {/* Header */}
          <div className="text-center mb-8 border-b-2 border-indigo-900 pb-6">
            <h1 className="text-3xl font-extrabold text-indigo-900 uppercase tracking-tight" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>HMS Core Medical Center</h1>
            <p className="text-sm text-slate-600 mt-1">123 Health Ave, Medical City | Tel: (02) 123-4567</p>
            <h2 className="text-xl font-bold mt-6 text-slate-800">LABORATORY RESULT</h2>
          </div>
          
          {/* Patient Info */}
          <div className="grid grid-cols-2 gap-x-8 gap-y-2 mb-8 text-sm">
            <div className="flex"><span className="font-bold w-24">Patient:</span> <span>{result.order?.patient ? `${result.order.patient.lastName.toUpperCase()}, ${result.order.patient.firstName.toUpperCase()}` : 'N/A'}</span></div>
            <div className="flex"><span className="font-bold w-24">Date/Time:</span> <span>{result.createdAt ? new Date(result.createdAt).toLocaleString() : 'N/A'}</span></div>
            <div className="flex"><span className="font-bold w-24">Age/Sex:</span> <span>{result.order?.patient?.dob ? `${new Date().getFullYear() - new Date(result.order.patient.dob).getFullYear()}` : 'N/A'} / {result.order?.patient?.gender || 'N/A'}</span></div>
            <div className="flex"><span className="font-bold w-24">Req. Dr.:</span> <span>{result.order?.requestedBy || 'Attending Physician'}</span></div>
            <div className="flex"><span className="font-bold w-24">Patient ID:</span> <span>{result.order?.patient?.patientNumber || result.order?.patientId || 'N/A'}</span></div>
            <div className="flex"><span className="font-bold w-24">Order ID:</span> <span>{result.order?.orderNumber || result.orderId || 'N/A'}</span></div>
          </div>
          
          {/* Result Body */}
          <div className="mb-12">
            <h3 className="font-bold text-lg border-b border-slate-300 pb-2 mb-4 bg-slate-50 px-2 py-1">LABORATORY ANALYSIS</h3>
            
            <table className="w-full text-sm">
              <thead className="border-b-2 border-slate-300">
                <tr>
                  <th className="text-left py-2 px-2">Test Name</th>
                  <th className="text-left py-2 px-2">Result Value</th>
                </tr>
              </thead>
              <tbody>
                {result.results && typeof result.results === 'object' ? (
                  Object.entries(result.results).map(([key, value]) => (
                    <tr key={key} className="border-b border-slate-100">
                      <td className="py-2 px-2 font-medium">{key}</td>
                      <td className="py-2 px-2 font-bold">{String(value)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={2} className="py-4 text-center text-slate-400">No raw results data available</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          {/* Signatures */}
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
              <button onClick={() => setShowAmendModal(false)} className="btn btn-secondary py-2" disabled={submittingAmend}>Cancel</button>
              <button onClick={handleAmendRequest} disabled={!amendReason.trim() || submittingAmend} className="btn btn-danger py-2 bg-rose-600 hover:bg-rose-700 flex items-center gap-2">
                {submittingAmend && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Submit Request
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
