import React from 'react';
import { GitMerge, MapPin, ArrowRight } from 'lucide-react';

export interface Assignment {
  id: string;
  employeeName: string;
  currentBranch: string;
  role: string;
  assignmentDate: string;
  type: 'PERMANENT' | 'TEMPORARY' | 'ROTATION';
}

interface BranchAssignmentTableProps {
  assignments: Assignment[];
}

export const BranchAssignmentTable: React.FC<BranchAssignmentTableProps> = ({ assignments }) => {
  return (
    <div className="bg-white border border-slate-200/80 shadow-sm rounded-2xl p-5 space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <GitMerge className="h-4 w-4 text-indigo-500" />
            Branch Assignments
          </h3>
          <p className="text-[10px] text-slate-400 font-medium">Logical facility mapping for staff</p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
              <th className="pb-3 pl-2">Employee</th>
              <th className="pb-3">Branch</th>
              <th className="pb-3">Type</th>
              <th className="pb-3 text-right pr-2">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {assignments.map((asn) => (
              <tr key={asn.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="py-3 pl-2">
                  <p className="font-bold text-slate-800">{asn.employeeName}</p>
                  <p className="text-[10px] text-slate-400 font-medium">{asn.role}</p>
                </td>
                <td className="py-3">
                  <div className="flex items-center gap-1.5 text-slate-600 font-semibold">
                    <MapPin className="h-3.5 w-3.5 text-slate-400" />
                    {asn.currentBranch}
                  </div>
                </td>
                <td className="py-3">
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md border ${
                    asn.type === 'PERMANENT' ? 'bg-indigo-50 text-indigo-700 border-indigo-100' :
                    asn.type === 'TEMPORARY' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                    'bg-slate-50 text-slate-600 border-slate-200'
                  }`}>
                    {asn.type}
                  </span>
                </td>
                <td className="py-3 text-right pr-2">
                  <button className="text-[10px] text-indigo-600 font-bold hover:underline flex items-center gap-1 ml-auto cursor-pointer">
                    Reassign <ArrowRight className="h-3 w-3" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 text-[10px] text-amber-800 font-semibold">
        <strong>Simulation Notice:</strong> Branch assignments are logical placeholders. No real LDAP or access control changes are triggered.
      </div>
    </div>
  );
};
