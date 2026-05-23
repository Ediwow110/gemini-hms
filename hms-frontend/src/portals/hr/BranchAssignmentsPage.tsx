import React from 'react';
import HRScopeFilter from './components/HRScopeFilter';
import { BranchAssignmentTable, Assignment } from './components/BranchAssignmentTable';
import { GitMerge, Plus } from 'lucide-react';

export const BranchAssignmentsPage: React.FC = () => {
  const mockAssignments: Assignment[] = [
    { id: 'ASN-001', employeeName: 'Dr. Gregory House', currentBranch: 'St. Jude Metro', role: 'Chief Diagnostician', assignmentDate: '2024-01-15', type: 'PERMANENT' },
    { id: 'ASN-002', employeeName: 'Nurse Judy Hopps', currentBranch: 'St. Jude Metro', role: 'Head Nurse', assignmentDate: '2024-03-22', type: 'PERMANENT' },
    { id: 'ASN-003', employeeName: 'Eric Foreman', currentBranch: 'St. Jude North', role: 'Neurologist', assignmentDate: '2024-05-01', type: 'ROTATION' },
    { id: 'ASN-004', employeeName: 'Robert Chase', currentBranch: 'St. Jude Metro', role: 'Surgeon', assignmentDate: '2024-02-10', type: 'PERMANENT' },
    { id: 'ASN-005', employeeName: 'Allison Cameron', currentBranch: 'St. Jude North', role: 'Immunologist', assignmentDate: '2024-04-15', type: 'TEMPORARY' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-800 tracking-tight" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Branch & Facility Assignments
          </h2>
          <p className="text-xs text-slate-500 font-medium">Manage staff placement and facility-scoped credentials</p>
        </div>
        <div className="flex flex-col md:flex-row gap-2">
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-1.5 text-[10px] text-amber-800 font-semibold max-w-md">
            <strong>Sandbox Notice:</strong> Assignments are logical placeholders. No real LDAP/Access changes are triggered.
          </div>
          <button className="btn bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer shadow-sm shadow-indigo-100 transition-all">
            <Plus className="h-4 w-4" /> New Assignment
          </button>
        </div>
      </div>

      <HRScopeFilter />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <BranchAssignmentTable assignments={mockAssignments} />
        </div>
        
        <div className="space-y-6">
          <div className="card bg-white border border-slate-200/80 shadow-sm rounded-2xl p-5 space-y-4">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <GitMerge className="h-4 w-4 text-indigo-500" />
              Deployment Summary
            </h4>
            <div className="space-y-3">
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-slate-500 font-medium">St. Jude Metro</span>
                <span className="text-slate-800 font-bold">842 Personnel</span>
              </div>
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-slate-500 font-medium">St. Jude North</span>
                <span className="text-slate-800 font-bold">398 Personnel</span>
              </div>
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-slate-500 font-medium">Corporate HQ</span>
                <span className="text-slate-800 font-bold">12 Personnel</span>
              </div>
            </div>
          </div>

          <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl">
            <h5 className="text-[10px] font-bold text-amber-900 uppercase tracking-wider mb-2">Branch Scoping Rule Shell</h5>
            <p className="text-[10px] text-amber-800 leading-relaxed font-medium italic">
              "Staff members assigned to a branch are granted logical access to that branch's EMR records, inventory, and billing queues. Cross-branch access requires explicit secondary assignment."
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BranchAssignmentsPage;
