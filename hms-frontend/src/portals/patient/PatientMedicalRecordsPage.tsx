import React from 'react';
import PatientPortalShellNotice from './components/PatientPortalShellNotice';
import { FileBadge, AlertTriangle } from 'lucide-react';

export const PatientMedicalRecordsPage: React.FC = () => {
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

      {/* WIP Banner */}
      <div className="p-4 bg-amber-50 border border-amber-150 rounded-2xl flex gap-3 text-xs text-amber-800">
        <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
        <div>
          <h5 className="font-extrabold uppercase text-[10px] tracking-wider">Medical Records (WIP)</h5>
          <p className="font-medium mt-0.5">
            Online access to released medical records and clinical summaries is not yet available. Your lab results and prescriptions can be viewed from their respective sections. Please contact the medical records department to request copies of your full medical record.
          </p>
        </div>
      </div>

      {/* Empty state placeholder */}
      <div className="card bg-white border border-slate-200/80 shadow-sm rounded-2xl p-12 text-center text-slate-400 space-y-3">
        <FileBadge className="h-12 w-12 mx-auto text-slate-300" />
        <p className="text-sm font-bold text-slate-600">Medical records not yet available</p>
        <p className="text-xs text-slate-450 max-w-md mx-auto leading-relaxed">
          Your lab results and prescriptions are available in their respective sections.
          Full medical record release, including clinical summaries and encounter notes,
          will be available in a future update.
        </p>
      </div>
    </div>
  );
};

export default PatientMedicalRecordsPage;
