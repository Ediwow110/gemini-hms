import React from 'react';
import HRScopeFilter from './components/HRScopeFilter';
import { EmployeeWorklist, Employee } from './components/EmployeeWorklist';

export const EmployeesPage: React.FC = () => {
  const mockEmployees: Employee[] = [
    { id: '1', name: 'Dr. Gregory House', email: 'g.house@stjude.org', role: 'Chief Diagnostician', department: 'Clinical', branch: 'St. Jude Metro', status: 'ACTIVE', joinedAt: '2024-01-15' },
    { id: '2', name: 'Nurse Judy Hopps', email: 'j.hopps@stjude.org', role: 'Head Nurse', department: 'Nursing', branch: 'St. Jude Metro', status: 'ACTIVE', joinedAt: '2024-03-22' },
    { id: '3', name: 'Charles McGill', email: 'c.mcgill@stjude.org', role: 'Legal Counsel', department: 'Admin', branch: 'St. Jude North', status: 'TERMINATED', joinedAt: '2023-11-05' },
    { id: '4', name: 'James Wilson', email: 'j.wilson@stjude.org', role: 'Oncology Head', department: 'Clinical', branch: 'St. Jude Metro', status: 'ON_LEAVE', joinedAt: '2024-02-10' },
    { id: '5', name: 'Lisa Cuddy', email: 'l.cuddy@stjude.org', role: 'Hospital Dean', department: 'Admin', branch: 'St. Jude Metro', status: 'ACTIVE', joinedAt: '2023-08-12' },
    { id: '6', name: 'Eric Foreman', email: 'e.foreman@stjude.org', role: 'Neurologist', department: 'Clinical', branch: 'St. Jude North', status: 'ACTIVE', joinedAt: '2024-05-01' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-800 tracking-tight" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Employee Directory
          </h2>
          <p className="text-xs text-slate-500 font-medium">Manage personnel records, roles, and employment status</p>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-1.5 text-[10px] text-amber-800 font-semibold max-w-md">
          <strong>Sandbox Notice:</strong> Employee data is simulated. No real account mutations occur from this view.
        </div>
      </div>

      <HRScopeFilter />

      <EmployeeWorklist employees={mockEmployees} />
    </div>
  );
};

export default EmployeesPage;
