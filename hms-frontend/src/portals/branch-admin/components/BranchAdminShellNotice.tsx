import React from 'react';
import { ShieldAlert } from 'lucide-react';

export const BranchAdminShellNotice: React.FC = () => {
  return (
    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex gap-4 items-start shadow-sm">
      <div className="p-2 bg-amber-100 rounded-xl">
        <ShieldAlert className="h-5 w-5 text-amber-600" />
      </div>
      <div>
        <h4 className="text-sm font-black text-amber-900 tracking-tight">Branch Admin — Prototype</h4>
        <p className="text-xs text-amber-700 font-medium leading-relaxed mt-0.5">
          This branch admin portal is a <strong>functional prototype shell</strong>. Branch analytics,
          metrics, and operational data shown here are generated for demonstration purposes. No real
          branch operations or live data is persisted in this phase.
        </p>
      </div>
    </div>
  );
};

export default BranchAdminShellNotice;
