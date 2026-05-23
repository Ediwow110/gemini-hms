import { ShieldAlert, Calendar, BadgeCheck, AlertTriangle } from 'lucide-react';

export interface PatientSafetyInfo {
  id: string;
  firstName: string;
  lastName: string;
  mrn: string;
  dob: string;
  gender: string;
  allergies?: string;
  diagnoses?: string[];
  warnings?: string[];
  insuranceProvider?: string;
  insuranceNumber?: string;
}

interface PatientSafetyHeaderProps {
  patient: PatientSafetyInfo | null;
}

export const PatientSafetyHeader = ({ patient }: PatientSafetyHeaderProps) => {
  if (!patient) {
    return (
      <div className="card p-5 bg-slate-50/50 border border-slate-100 flex items-center justify-center text-slate-400 text-xs font-semibold select-none animate-pulse">
        No patient loaded in safety scope. Select an encounter to activate controls.
      </div>
    );
  }

  const initials = `${patient.firstName[0] || ''}${patient.lastName[0] || ''}`.toUpperCase();
  const age = new Date().getFullYear() - new Date(patient.dob).getFullYear();
  const hasAllergies = patient.allergies && patient.allergies.toLowerCase() !== 'none';
  const hasWarnings = patient.warnings && patient.warnings.length > 0;

  return (
    <div className="card p-5 bg-white border border-slate-200/80 shadow-sm relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-5 animate-fade-in">
      {/* Visual top indicator for critical warnings */}
      {hasAllergies && (
        <div className="absolute top-0 left-0 right-0 h-[3px] bg-rose-500" />
      )}

      {/* Patient Meta and Info */}
      <div className="flex items-center gap-4 flex-1">
        <div className={`h-12 w-12 rounded-2xl flex items-center justify-center font-bold text-base text-white shadow-sm flex-shrink-0 ${
          hasAllergies 
            ? 'bg-gradient-to-br from-rose-500 to-red-600 shadow-rose-100'
            : 'bg-gradient-to-br from-indigo-500 to-violet-600 shadow-indigo-100'
        }`}>
          {initials}
        </div>
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-base font-extrabold text-slate-900 leading-tight">
              {patient.lastName}, {patient.firstName}
            </h2>
            <span className="bg-slate-100 text-slate-700 text-[10px] font-extrabold px-2 py-0.5 rounded-md uppercase tracking-wider">
              MRN: {patient.mrn}
            </span>
            {patient.insuranceProvider && (
              <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 text-[10px] font-extrabold px-2 py-0.5 rounded-md flex items-center gap-1">
                <BadgeCheck className="h-3 w-3" />
                {patient.insuranceProvider}
              </span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5 text-slate-400" />
              DOB: {patient.dob} ({age}Y)
            </span>
            <span className="text-slate-300">•</span>
            <span className="font-semibold uppercase text-slate-600">{patient.gender}</span>
          </div>
        </div>
      </div>

      {/* Warnings & Allergies Scope */}
      <div className="flex flex-col sm:flex-row gap-3 md:items-center">
        {/* Allergies Banner */}
        <div className={`px-4 py-2.5 rounded-xl border text-xs flex items-center gap-2.5 min-w-[200px] ${
          hasAllergies
            ? 'bg-rose-50 border-rose-100 text-rose-800'
            : 'bg-slate-50 border-slate-200/60 text-slate-500'
        }`}>
          <ShieldAlert className={`h-4 w-4 flex-shrink-0 ${hasAllergies ? 'text-rose-600 animate-pulse' : 'text-slate-400'}`} />
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 leading-none mb-0.5">Allergies</p>
            <p className={`font-semibold ${hasAllergies ? 'text-rose-700' : 'text-slate-600'}`}>
              {patient.allergies || 'No Known Drug Allergies (NKDA)'}
            </p>
          </div>
        </div>

        {/* Diagnoses & Warnings */}
        <div className={`px-4 py-2.5 rounded-xl border text-xs flex items-center gap-2.5 min-w-[200px] ${
          hasWarnings
            ? 'bg-amber-50 border-amber-100 text-amber-800'
            : 'bg-slate-50 border-slate-200/60 text-slate-500'
        }`}>
          <AlertTriangle className={`h-4 w-4 flex-shrink-0 ${hasWarnings ? 'text-amber-600' : 'text-slate-400'}`} />
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 leading-none mb-0.5">Diagnoses / Flags</p>
            <p className="font-semibold text-slate-600">
              {patient.diagnoses?.join(', ') || 'No active chronic diagnoses'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
