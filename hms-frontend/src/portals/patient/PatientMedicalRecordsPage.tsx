import React, { useState } from 'react';
import PatientPortalShellNotice from './components/PatientPortalShellNotice';
import { FileBadge, AlertTriangle, Loader2, CheckCircle2, Clock, XCircle } from 'lucide-react';
import { usePatientMedicalRecordRequests } from '../../hooks/use-patient-portal';
import { patientPortalService } from '../../services/patient-portal.service';

export const PatientMedicalRecordsPage: React.FC = () => {
  const { requests, loading, refetch } = usePatientMedicalRecordRequests();
  const [submitting, setSubmitting] = useState(false);

  const handleRequestRecord = async () => {
    if (!confirm('Are you sure you want to request a copy of your full medical record? This request will be reviewed by the medical records department.')) return;
    try {
      setSubmitting(true);
      await patientPortalService.createMedicalRecordRequest('FULL_RECORD', 'Requested via Patient Portal');
      alert('Medical record request submitted successfully.');
      refetch();
    } catch (error) {
      console.error('Failed to request medical record:', error);
      alert('Failed to request medical record. You may already have a pending request.');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED': return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
      case 'REJECTED': return <XCircle className="h-4 w-4 text-rose-500" />;
      default: return <Clock className="h-4 w-4 text-amber-500" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-800 tracking-tight" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Medical Records & Summaries
          </h2>
          <p className="text-xs text-slate-500 font-medium">Access your released medical history and encounter summaries</p>
        </div>
      </div>

      <PatientPortalShellNotice />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Active Requests */}
          <div className="bg-white border border-slate-200/80 shadow-sm rounded-2xl p-5 space-y-4">
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
              <FileBadge className="h-4 w-4 text-indigo-500" />
              Your Requests
            </h3>
            
            {loading ? (
              <div className="py-8 text-center text-xs text-slate-400">Loading requests...</div>
            ) : requests.length === 0 ? (
              <div className="py-8 text-center bg-slate-50 rounded-xl border border-slate-100">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">No record requests found</p>
              </div>
            ) : (
              <div className="space-y-3">
                {requests.map((req) => (
                  <div key={req.id} className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(req.status)}
                      <div>
                        <p className="text-xs font-black text-slate-800">{req.requestType.replace(/_/g, ' ')}</p>
                        <p className="text-[9px] text-slate-400 font-bold uppercase">{new Date(req.createdAt).toLocaleDateString()} · {req.id.substring(0, 8)}</p>
                      </div>
                    </div>
                    <span className={`text-[8px] font-extrabold px-1.5 py-0.5 rounded uppercase border ${
                      req.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                      req.status === 'REJECTED' ? 'bg-rose-50 text-rose-700 border-rose-100' :
                      'bg-amber-50 text-amber-700 border-amber-100'
                    }`}>
                      {req.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="card bg-white border border-slate-200/80 shadow-sm rounded-2xl p-8 text-center text-slate-400 space-y-4">
            <FileBadge className="h-12 w-12 mx-auto text-slate-300" />
            <p className="text-sm font-bold text-slate-600">Full Medical Record Access</p>
            <p className="text-xs text-slate-450 max-w-md mx-auto leading-relaxed">
              Your lab results and prescriptions are available in their respective sections.
              You can request a formal copy of your full medical history which will be reviewed
              and released by the Health Information Management department.
            </p>
            <div className="pt-2">
              <button
                onClick={handleRequestRecord}
                disabled={submitting}
                className="inline-flex items-center justify-center px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-black shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all disabled:opacity-50 disabled:cursor-wait"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin mr-2" />
                    Submitting...
                  </>
                ) : (
                  'Request Medical Record Copy'
                )}
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="p-4 bg-amber-50 border border-amber-150 rounded-2xl flex gap-3 text-xs text-amber-800">
            <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
            <div>
              <h5 className="font-extrabold uppercase text-[10px] tracking-wider">Privacy Notice</h5>
              <p className="font-medium mt-0.5 leading-relaxed">
                Medical record requests are processed within 3-5 business days. Once approved, records can be downloaded or picked up at the hospital.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientMedicalRecordsPage;
