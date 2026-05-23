import React from 'react';
import { Mail, Briefcase, Building } from 'lucide-react';

export interface Employee {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string;
  branch: string;
  status: 'ACTIVE' | 'LEAVE' | 'SUSPENDED';
  joinedAt: string;
}

interface EmployeeWorklistProps {
  employees: Employee[];
}

export const EmployeeWorklist: React.FC<EmployeeWorklistProps> = ({ employees }) => {
  return (
    <div className="bg-white border border-slate-200/80 shadow-sm rounded-2xl overflow-hidden">
      <div className="p-5 border-b border-slate-100 flex justify-between items-center">
        <div>
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Employee Worklist</h3>
          <p className="text-[10px] text-slate-400 font-medium">Recent hires and active personnel</p>
        </div>
        <button className="text-[10px] text-indigo-600 font-bold hover:underline cursor-pointer">View All Directory</button>
      </div>

      <div className="divide-y divide-slate-50">
        {employees.map((emp) => (
          <div key={emp.id} className="p-4 hover:bg-slate-50 transition-colors flex items-center justify-between group">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 bg-slate-100 text-slate-600 rounded-xl flex items-center justify-center font-bold text-xs group-hover:bg-indigo-100 group-hover:text-indigo-700 transition-colors">
                {emp.name.charAt(0)}
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-800">{emp.name}</h4>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[10px] text-slate-400 flex items-center gap-1">
                    <Mail className="h-3 w-3" /> {emp.email}
                  </span>
                  <span className="text-[10px] text-slate-400">·</span>
                  <span className="text-[10px] text-slate-400 flex items-center gap-1">
                    <Briefcase className="h-3 w-3" /> {emp.role}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block">
                <p className="text-[10px] font-bold text-slate-700 flex items-center justify-end gap-1">
                  <Building className="h-3 w-3 text-slate-400" />
                  {emp.branch}
                </p>
                <p className="text-[9px] text-slate-400 font-medium">{emp.department}</p>
              </div>
              <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full border ${
                emp.status === 'ACTIVE' 
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                  : emp.status === 'LEAVE'
                  ? 'bg-amber-50 text-amber-700 border-amber-100'
                  : 'bg-rose-50 text-rose-700 border-rose-100'
              }`}>
                {emp.status}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="p-4 bg-slate-50/50 border-t border-slate-100">
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 text-[10px] text-amber-800 font-semibold">
          <strong>Sandbox Notice:</strong> Employee records are simulated. Actions in this portal are for UI evaluation and do not affect real staff accounts.
        </div>
      </div>
    </div>
  );
};
