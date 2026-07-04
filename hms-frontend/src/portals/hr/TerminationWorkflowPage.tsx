import React from 'react';
import HRScopeFilter from './components/HRScopeFilter';
import { TerminationChecklist, ChecklistItem } from './components/TerminationChecklist';
import { Search, UserX } from 'lucide-react';

export const TerminationWorkflowPage: React.FC = () => {
  const mockChecklist: ChecklistItem[] = [
    { id: '1', label: 'Revoke Email & LDAP Access', category: 'ACCESS', isCompleted: false },
    { id: '2', label: 'Disable HMS Application Login', category: 'ACCESS', isCompleted: false },
    { id: '3', label: 'Calculate Final Pay & Deductions', category: 'PAYROLL', isCompleted: false },
    { id: '4', label: 'Issue BIR 2316 Tax Form', category: 'PAYROLL', isCompleted: false },
    { id: '5', label: 'Recover Corporate Laptop / Phone', category: 'EQUIPMENT', isCompleted: false },
    { id: '6', label: 'Collect Facility Badge / Keys', category: 'EQUIPMENT', isCompleted: false },
    { id: '7', label: 'Archive Employee Master Record', category: 'ADMIN', isCompleted: false },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-800 tracking-tight" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Termination & Offboarding Workflow
          </h2>
          <p className="text-xs text-slate-500 font-medium">Standardized exit process and credential revocation</p>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-1.5 text-[10px] text-amber-800 font-semibold max-w-md">
          <span className="font-black uppercase tracking-wide mr-1">Sandbox Notice:</span>
          Termination & Offboarding is a prototype operational view. The termination checklist and employee search are fabricated demo examples — no real account mutations occur in this build.
        </div>
      </div>

      <HRScopeFilter />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="card bg-white border border-slate-200/80 shadow-sm rounded-2xl p-6">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Search className="h-4 w-4 text-indigo-500" />
              Select Employee for Offboarding
            </h3>
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search by name or staff ID..."
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
              />
            </div>
            
            <div className="mt-6 p-12 border-2 border-dashed border-slate-100 rounded-2xl flex flex-col items-center justify-center text-center">
              <UserX className="h-10 w-10 text-slate-200 mb-3" />
              <p className="text-sm font-bold text-slate-400">Search and select an employee to begin the termination checklist</p>
            </div>
          </div>

          <div className="bg-rose-50 border border-rose-100 rounded-2xl p-5">
            <h4 className="text-xs font-bold text-rose-900 uppercase tracking-wider mb-2">Policy: Immediate Access Revocation</h4>
            <p className="text-[11px] text-rose-800 leading-relaxed font-medium">
              Upon finalization of the termination workflow, the following actions are triggered: 
              1. Session termination across all devices. 
              2. MFA credential invalidation. 
              3. Logical deletion from all clinical and billing queues. 
              4. Notification sent to IT Security and Finance.
            </p>
          </div>
        </div>

        <div>
          <TerminationChecklist employeeName="Employee 003" items={mockChecklist} />
        </div>
      </div>
    </div>
  );
};

export default TerminationWorkflowPage;
