import React from 'react';
import HRScopeFilter from './components/HRScopeFilter';
import { BranchAssignmentTable } from './components/BranchAssignmentTable';
import type { Assignment } from './components/BranchAssignmentTable';
import { GitMerge, Plus } from 'lucide-react';
import { useHr } from '../../hooks/use-hr';
import { useUser } from '../../hooks/use-user';

export const BranchAssignmentsPage: React.FC = () => {
  const user = useUser();
  const branchId = user?.branchId;
  const { assignments, isLoading } = useHr(branchId ?? '');

  const mappedAssignments: Assignment[] = (assignments || []).map(a => ({
    id: a.id,
    employeeName: `${a.employee.firstName} ${a.employee.lastName}`,
    currentBranch: a.branch.name,
    role: 'Staff',
    assignmentDate: new Date(a.createdAt).toISOString().split('T')[0],
    type: (a.isPrimary ? 'PERMANENT' : 'ROTATION') as Assignment['type'],
  }));

  if (!branchId) return <div className="p-10 text-center text-slate-500">No primary branch assigned.</div>;
  if (isLoading) return <div className="p-10 text-center text-slate-400">Loading assignments...</div>;

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
          <button className="btn bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer shadow-sm shadow-indigo-100 transition-all">
            <Plus className="h-4 w-4" /> New Assignment
          </button>
        </div>
      </div>

      <HRScopeFilter />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <BranchAssignmentTable assignments={mappedAssignments} />
        </div>
        
        <div className="space-y-6">
          <div className="card bg-white border border-slate-200/80 shadow-sm rounded-2xl p-5 space-y-4">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <GitMerge className="h-4 w-4 text-indigo-500" />
              Deployment Summary
            </h4>
            <div className="space-y-3">
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-slate-500 font-medium">Active Assignments</span>
                <span className="text-slate-800 font-bold">{assignments?.length || 0} Personnel</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BranchAssignmentsPage;
