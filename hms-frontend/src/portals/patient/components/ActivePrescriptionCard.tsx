import React from 'react';
import { Pill, RefreshCw } from 'lucide-react';

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
                <div className="text-right">
                  <p className="text-[9px] text-slate-400 font-bold uppercase">Expires: {p.expiryDate}</p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1 border-t border-slate-100/50 mt-1">
                <div className="flex items-center gap-1.5 text-[9px] text-indigo-600 font-black">
                  <RefreshCw className="h-3 w-3" />
                  {p.remainingRefills} Refills Left
                </div>
                <button className="text-[9px] bg-white hover:bg-indigo-50 text-indigo-700 border border-slate-200 rounded-lg px-2 py-1 font-black transition-all cursor-pointer">
                  Request Refill
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 text-[10px] text-amber-800 font-semibold leading-relaxed">
        <strong>Simulation Notice:</strong> Prescription tracking is mock-only. Refill requests update UI state only and do not notify the pharmacy.
      </div>
    </div>
  );
};

export default ActivePrescriptionCard;
