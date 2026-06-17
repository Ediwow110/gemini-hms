import React from 'react';
import HRScopeFilter from './components/HRScopeFilter';
import { EmployeeWorklist, Employee } from './components/EmployeeWorklist';

export const EmployeesPage: React.FC = () => {
  const mockEmployees: Employee[] = [
    { id: '1', name: 'Employee 001', email: 'employee001@sandbox.local', role: 'Chief Diagnostician', department: 'Clinical', branch: 'St. Jude Metro', status: 'ACTIVE', joinedAt: '2024-01-15' },
    { id: '2', name: 'Employee 002', email: 'employee002@sandbox.local', role: 'Head Nurse', department: 'Nursing', branch: 'St. Jude Metro', status: 'ACTIVE', joinedAt: '2024-03-22' },
    { id: '3', name: 'Employee 003', email: 'employee003@sandbox.local', role: 'Legal Counsel', department: 'Admin', branch: 'St. Jude North', status: 'TERMINATED', joinedAt: '2023-11-05' },
    { id: '4', name: 'Employee 004', email: 'employee004@sandbox.local', role: 'Oncology Head', department: 'Clinical', branch: 'St. Jude Metro', status: 'ON_LEAVE', joinedAt: '2024-02-10' },
    { id: '5', name: 'Employee 005', email: 'employee005@sandbox.local', role: 'Hospital Dean', department: 'Admin', branch: 'St. Jude Metro', status: 'ACTIVE', joinedAt: '2023-08-12' },
    { id: '6', name: 'Employee 006', email: 'employee006@sandbox.local', role: 'Neurologist', department: 'Clinical', branch: 'St. Jude North', status: 'ACTIVE', joinedAt: '2024-05-01' },
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
