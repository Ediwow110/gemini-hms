import React from 'react';
import { ShieldAlert } from 'lucide-react';

export const FieldServiceShellNotice: React.FC = () => {
  return (
    <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex gap-4 items-start shadow-sm">
      <div className="p-2 bg-emerald-100 rounded-xl">
        <ShieldAlert className="h-5 w-5 text-emerald-600" />
      </div>
      <div>
        <h4 className="text-sm font-black text-emerald-900 tracking-tight">Field Service Sandbox</h4>
        <p className="text-xs text-emerald-700 font-medium leading-relaxed mt-0.5">
          This field service portal is a <strong>functional prototype shell</strong>. Delivery tracking, installation workflows, 
          and service logs are mock-generated for demonstration purposes. No real GPS, offline sync, or signature 
          data is persisted in this phase.
        </p>
      </div>
    </div>
  );
};

export default FieldServiceShellNotice;
