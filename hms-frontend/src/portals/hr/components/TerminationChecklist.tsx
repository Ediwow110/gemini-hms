import React from 'react';
import { UserX, ShieldOff, CreditCard, Key, ClipboardCheck } from 'lucide-react';

export interface ChecklistItem {
  id: string;
  label: string;
  category: 'ACCESS' | 'PAYROLL' | 'EQUIPMENT' | 'ADMIN';
  isCompleted: boolean;
}

interface TerminationChecklistProps {
  employeeName: string;
  items: ChecklistItem[];
}

export const TerminationChecklist: React.FC<TerminationChecklistProps> = ({ employeeName, items }) => {
  const getIcon = (category: string) => {
    switch (category) {
      case 'ACCESS': return <Key className="h-4 w-4 text-rose-500" />;
      case 'PAYROLL': return <CreditCard className="h-4 w-4 text-emerald-500" />;
      case 'EQUIPMENT': return <ShieldOff className="h-4 w-4 text-amber-500" />;
      default: return <ClipboardCheck className="h-4 w-4 text-indigo-500" />;
    }
  };

  return (
    <div className="bg-white border border-slate-200/80 shadow-sm rounded-2xl p-5 space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <UserX className="h-4 w-4 text-rose-500" />
            Offboarding Checklist
          </h3>
          <p className="text-[10px] text-slate-400 font-medium">Termination workflow for {employeeName}</p>
        </div>
        <span className="text-[10px] bg-rose-50 text-rose-700 font-bold px-2 py-1 rounded-lg border border-rose-100">
          Action Required
        </span>
      </div>

      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.id} className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between group">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 bg-white border border-slate-100 rounded-lg flex items-center justify-center shadow-sm">
                {getIcon(item.category)}
              </div>
              <span className="text-xs font-bold text-slate-700">{item.label}</span>
            </div>
            <input 
              type="checkbox" 
              checked={item.isCompleted} 
              readOnly 
              className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
            />
          </div>
        ))}
      </div>

      <div className="pt-2">
        <button className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold py-2.5 rounded-xl text-xs transition-all shadow-sm shadow-rose-100 cursor-pointer">
          Finalize Termination & Deactivate Account
        </button>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 text-[10px] text-amber-800 font-semibold">
        <strong>Shell Notice:</strong> Termination workflow is simulated. No real user deactivation, LDAP revocation, or final payroll settlement occurs.
      </div>
    </div>
  );
};
