import { useState } from 'react';
import { Pill, Plus, Trash2, AlertTriangle } from 'lucide-react';

interface Prescription {
  id: string;
  medicationName: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
}

interface DoctorPrescriptionPanelProps {
  patientId: string;
  isLocked: boolean;
}

export const DoctorPrescriptionPanel = ({ patientId: _patientId, isLocked }: DoctorPrescriptionPanelProps) => {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([
    { id: 'RX-01', medicationName: 'Amlodipine 5mg', dosage: '1 tablet', frequency: 'Once daily (OD)', duration: '30 days', instructions: 'Take in the morning with or without food.' },
    { id: 'RX-02', medicationName: 'Metformin 500mg', dosage: '1 tablet', frequency: 'Twice daily (BID)', duration: '60 days', instructions: 'Take with meals to minimize GI side effects.' },
  ]);

  const [medName, setMedName] = useState('');
  const [dosage, setDosage] = useState('1 tablet');
  const [frequency, setFrequency] = useState('Once daily (OD)');
  const [duration, setDuration] = useState('30 days');
  const [instructions, setInstructions] = useState('');

  const handleAddRx = (e: React.FormEvent) => {
    e.preventDefault();
    if (!medName || isLocked) return;

    const newRx: Prescription = {
      id: `RX-${Math.floor(100 + Math.random() * 900)}`,
      medicationName: medName,
      dosage,
      frequency,
      duration,
      instructions,
    };

    setPrescriptions([...prescriptions, newRx]);
    setMedName('');
    setInstructions('');
  };

  const handleRemoveRx = (id: string) => {
    if (isLocked) return;
    setPrescriptions(prescriptions.filter(p => p.id !== id));
  };

  return (
    <div className="card p-5 bg-white border border-slate-200/80 shadow-sm space-y-4" data-patient-id={_patientId}>
      {/* Mock/WIP Warning Banner */}
      <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl flex gap-2 text-xs text-amber-800">
        <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0" />
        <div>
          <h5 className="font-extrabold uppercase text-[10px] tracking-wider">E-Prescription (WIP/Mock)</h5>
          <p className="font-medium mt-0.5">
            Medication ordering is currently running in demo mode. No actual prescriptions are sent to pharmacy or recorded in the medical record.
          </p>
        </div>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <h3 className="font-bold text-slate-800 text-sm tracking-wider uppercase flex items-center gap-2">
          <Pill className="h-4 w-4 text-indigo-500" />
          Active E-Prescriptions
        </h3>
        <span className="bg-indigo-50 text-indigo-700 text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase">
          {prescriptions.length} Meds
        </span>
      </div>

      {/* Add Prescription form */}
      {!isLocked && (
        <form onSubmit={handleAddRx} className="space-y-2 bg-slate-50 p-3 rounded-xl border border-slate-100 flex flex-col">
          <div className="flex gap-2">
            <input
              type="text"
              value={medName}
              onChange={(e) => setMedName(e.target.value)}
              placeholder="Medication Name (e.g. Paracetamol 500mg)..."
              className="flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-400 transition-all"
            />
            <input
              type="text"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              placeholder="Duration (e.g. 7 days)..."
              className="w-28 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-400 transition-all"
            />
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={dosage}
              onChange={(e) => setDosage(e.target.value)}
              placeholder="Dosage (e.g. 1 tab)..."
              className="flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-400 transition-all"
            />
            <select
              value={frequency}
              onChange={(e) => setFrequency(e.target.value)}
              className="flex-1 px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/10"
            >
              <option value="Once daily (OD)">Once daily (OD)</option>
              <option value="Twice daily (BID)">Twice daily (BID)</option>
              <option value="Three times daily (TID)">Three times daily (TID)</option>
              <option value="Four times daily (QID)">Four times daily (QID)</option>
              <option value="Every 4 hours (q4h)">Every 4 hours (q4h)</option>
              <option value="As needed (PRN)">As needed (PRN)</option>
            </select>
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="Special instructions (e.g. Take with food)..."
              className="flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs placeholder:text-slate-400 focus:outline-none"
            />
            <button
              type="submit"
              disabled={true}
              className="btn bg-slate-200 text-slate-500 text-xs px-3.5 py-1.5 flex items-center gap-1.5 cursor-not-allowed"
            >
              <Plus className="h-3.5 w-3.5" /> Add
            </button>
          </div>
        </form>
      )}

      {/* Prescription List */}
      <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
        {prescriptions.length === 0 ? (
          <div className="text-center py-6 text-slate-400 text-xs font-semibold">
            No active prescriptions for this patient.
          </div>
        ) : (
          prescriptions.map(rx => (
            <div
              key={rx.id}
              className="p-3 bg-slate-50/50 border border-slate-100 rounded-xl flex items-start justify-between gap-3 text-xs"
            >
              <div className="space-y-1">
                <p className="font-bold text-slate-800 flex items-center gap-1.5">
                  <Pill className="h-3.5 w-3.5 text-indigo-500" />
                  {rx.medicationName}
                </p>
                <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] text-slate-500 font-semibold">
                  <span className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">{rx.dosage}</span>
                  <span>{rx.frequency}</span>
                  <span className="text-slate-300">•</span>
                  <span className="text-slate-600">Dur: {rx.duration}</span>
                </div>
                {rx.instructions && (
                  <p className="text-[10px] text-slate-400 italic">Instructions: {rx.instructions}</p>
                )}
              </div>

              {!isLocked && (
                <button
                  onClick={() => handleRemoveRx(rx.id)}
                  className="p-1 text-slate-400 hover:text-rose-600 transition-colors flex-shrink-0"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
export default DoctorPrescriptionPanel;
