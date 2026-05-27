import React, { useState } from 'react';
import { Pill, RefreshCw, Download, Loader2 } from 'lucide-react';
import { patientPortalService } from '../../../services/patient-portal.service';
import { downloadBlob } from '../../../lib/download-file';

export interface ActivePrescription {
  id: string;
  medication: string;
  dosage: string;
  frequency: string;
  prescribedBy: string;
  expiryDate: string;
  remainingRefills: number;
}

interface ActivePrescriptionCardProps {
  prescriptions: ActivePrescription[];
}

export const ActivePrescriptionCard: React.FC<ActivePrescriptionCardProps> = ({ prescriptions }) => {
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [requestingId, setRequestingId] = useState<string | null>(null);

  const handleDownload = async (id: string, medication: string) => {
    try {
      setDownloadingId(id);
      const blob = await patientPortalService.downloadPrescriptionPdf(id);
      await downloadBlob(blob, `prescription-${medication.replace(/\s+/g, '-').toLowerCase()}-${id.substring(0, 8)}.pdf`);
    } catch (error) {
      console.error('Failed to download prescription:', error);
      alert('Failed to download prescription. Please try again.');
    } finally {
      setDownloadingId(null);
    }
  };

  const handleRequestRefill = async (id: string) => {
    if (!confirm('Are you sure you want to request a refill for this prescription?')) return;
    try {
      setRequestingId(id);
      await patientPortalService.createRefillRequest(id, 'Requested via Patient Portal');
      alert('Refill request submitted successfully. It will be reviewed by your physician.');
    } catch (error) {
      console.error('Failed to request refill:', error);
      alert('Failed to request refill. You may already have a pending request or this prescription is not eligible.');
    } finally {
      setRequestingId(null);
    }
  };

  return (
    <div className="bg-white border border-slate-200/80 shadow-sm rounded-2xl p-5 space-y-4">
      <div className="flex justify-between items-center pb-2 border-b border-slate-100">
        <div>
          <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <Pill className="h-4 w-4 text-indigo-500" />
            Active Prescriptions
          </h3>
          <p className="text-[10px] text-slate-400 font-medium">Ongoing medication and refill tracking</p>
        </div>
      </div>

      <div className="space-y-3">
        {prescriptions.length === 0 ? (
          <div className="py-8 text-center bg-slate-50 rounded-xl border border-slate-100">
            <p className="text-[10px] text-slate-400 font-bold">No active prescriptions found</p>
          </div>
        ) : (
          prescriptions.map((p) => (
            <div key={p.id} className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-2">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs font-black text-slate-800">{p.medication}</p>
                  <p className="text-[10px] text-slate-500 font-bold">{p.dosage} · {p.frequency}</p>
                </div>
                <div className="text-right flex items-center gap-2">
                  <button
                    onClick={() => handleDownload(p.id, p.medication)}
                    disabled={downloadingId === p.id}
                    title="Download PDF"
                    aria-label="Download PDF"
                    className="p-1 text-slate-400 hover:text-indigo-600 transition-colors"
                  >
                    {downloadingId === p.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Download className="h-3.5 w-3.5" />
                    )}
                  </button>
                  <p className="text-[9px] text-slate-400 font-bold uppercase">Expires: {p.expiryDate || 'N/A'}</p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1 border-t border-slate-100/50 mt-1">
                <div className="flex items-center gap-1.5 text-[9px] text-indigo-600 font-black">
                  <RefreshCw className="h-3 w-3" />
                  {p.remainingRefills} Refills Left
                </div>
                <button
                  onClick={() => handleRequestRefill(p.id)}
                  disabled={requestingId === p.id || p.remainingRefills === 0}
                  title={p.remainingRefills === 0 ? "No refills remaining" : "Request Refill"}
                  aria-label="Request Refill"
                  className={`text-[9px] px-2 py-1 rounded-lg font-black shadow-sm transition-all border ${
                    requestingId === p.id || p.remainingRefills === 0
                      ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed opacity-50'
                      : 'bg-white hover:bg-indigo-600 text-slate-600 hover:text-white border-slate-200 cursor-pointer'
                  }`}
                >
                  {requestingId === p.id ? 'Requesting...' : 'Request Refill'}
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="bg-slate-100 border border-slate-250 rounded-xl px-3 py-2 text-[10px] text-slate-700 font-semibold leading-relaxed">
        <strong>Portal Feature:</strong> You can now download prescriptions as PDF and request refills directly from the portal. Requests are subject to physician review.
      </div>
    </div>
  );
};

export default ActivePrescriptionCard;
