import React from 'react';
import { Building, Users, Briefcase, Plus } from 'lucide-react';
import HRScopeFilter from './components/HRScopeFilter';

export const DepartmentsPage: React.FC = () => {
  const mockDepartments = [
    { id: '1', name: 'Clinical Medicine', head: 'Dr. Gregory House', staffCount: 42, branch: 'St. Jude Metro' },
    { id: '2', name: 'Nursing & Patient Care', head: 'Nurse Judy Hopps', staffCount: 120, branch: 'St. Jude Metro' },
    { id: '3', name: 'Administration', head: 'Lisa Cuddy', staffCount: 15, branch: 'St. Jude Metro' },
    { id: '4', name: 'Legal & Compliance', head: 'Charles McGill', staffCount: 4, branch: 'St. Jude North' },
    { id: '5', name: 'Pharmacy', head: 'Ryan Ong', staffCount: 8, branch: 'St. Jude Metro' },
    { id: '6', name: 'Radiology', head: 'Ana Cruz', staffCount: 12, branch: 'St. Jude North' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-800 tracking-tight" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Department Management
          </h2>
          <p className="text-xs text-slate-500 font-medium">Organizational structure and department leadership</p>
        </div>
        <button className="btn bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer shadow-sm shadow-indigo-100 transition-all">
          <Plus className="h-4 w-4" /> Create Department
        </button>
      </div>

      <HRScopeFilter />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {mockDepartments.map((dept) => (
          <div key={dept.id} className="bg-white border border-slate-200/80 shadow-sm rounded-2xl p-5 space-y-4 hover:shadow-md transition-all">
            <div className="flex justify-between items-start">
              <div className="h-10 w-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                <Building className="h-5 w-5" />
              </div>
              <span className="text-[10px] bg-slate-100 text-slate-500 font-bold px-2 py-1 rounded-lg">ID: {dept.id}</span>
            </div>

            <div>
              <h4 className="text-sm font-black text-slate-800 tracking-tight">{dept.name}</h4>
              <p className="text-[10px] text-slate-400 font-medium">{dept.branch}</p>
            </div>

            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-400 font-medium flex items-center gap-1.5">
                  <Briefcase className="h-3.5 w-3.5" /> Department Head
                </span>
                <span className="text-slate-700 font-bold">{dept.head}</span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-400 font-medium flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5" /> Total Staff
                </span>
                <span className="text-slate-700 font-bold">{dept.staffCount} Personnel</span>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button className="text-[10px] text-indigo-600 font-bold hover:underline cursor-pointer">
                Manage Department &rarr;
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 text-[10px] text-amber-800 font-semibold">
        <strong>Sandbox Notice:</strong> Department structure is simulated. No real database mutations occur.
      </div>
    </div>
  );
};

export default DepartmentsPage;
