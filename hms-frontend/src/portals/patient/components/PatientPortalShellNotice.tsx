import React from 'react';
import { ShieldAlert } from 'lucide-react';

export const PatientPortalShellNotice: React.FC = () => {
  return (
    <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-4 flex gap-4 items-start shadow-sm">
      <div className="p-2 bg-indigo-100 rounded-xl">
        <ShieldAlert className="h-5 w-5 text-indigo-600" />
      </div>
      <div>
        <h4 className="text-sm font-black text-indigo-900 tracking-tight">Patient Portal</h4>
        <p className="text-xs text-indigo-700 font-medium leading-relaxed mt-0.5">
          <strong>Real data:</strong> Lab results, prescriptions, billing invoices, and your profile are loaded from live records.
        </p>
        <p className="text-xs text-indigo-700 font-medium leading-relaxed mt-0.5">
          <strong>In development:</strong> Appointment booking, medical records, messaging, and online payments.
        </p>
      </div>
    </div>
  );
};

export default PatientPortalShellNotice;
