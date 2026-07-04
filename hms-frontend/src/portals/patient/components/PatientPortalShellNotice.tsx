import React from 'react';
import { Info } from 'lucide-react';

export const PatientPortalShellNotice: React.FC = () => {
  return (
    <div
      role="status"
      data-testid="patient-portal-shell-notice"
      className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex gap-4 items-start shadow-sm"
    >
      <div className="p-2 bg-slate-100 rounded-xl">
        <Info className="h-5 w-5 text-slate-500" aria-hidden="true" />
      </div>
      <div>
        <h4 className="text-sm font-black text-slate-800 tracking-tight">
          Patient Portal — sandbox preview
        </h4>
        <p className="text-xs text-slate-600 font-medium leading-relaxed mt-0.5">
          This patient portal is a prototype. Lab results, prescriptions, appointments,
          billing, and messaging features show placeholder data and have no backend
          implementation yet. Real patient portal functionality will be available in a
          future release.
        </p>
      </div>
    </div>
  );
};

export default PatientPortalShellNotice;
