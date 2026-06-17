import React from 'react';
import HRScopeFilter from './components/HRScopeFilter';
import { AttendanceSummaryPanel, AttendanceRecord } from './components/AttendanceSummaryPanel';
import { ReportExportButton } from '../../components/analytics';

export const AttendancePage: React.FC = () => {
  const mockRecords: AttendanceRecord[] = [
    { id: '1', employeeName: 'Employee 001', checkIn: '08:12', status: 'PRESENT' },
    { id: '2', employeeName: 'Employee 002', checkIn: '07:45', status: 'PRESENT' },
    { id: '3', employeeName: 'Employee 006', checkIn: '09:05', status: 'LATE' },
    { id: '4', employeeName: 'Employee 004', checkIn: '--:--', status: 'ON_LEAVE' },
    { id: '5', employeeName: 'Employee 005', checkIn: '08:30', status: 'PRESENT' },
    { id: '6', employeeName: 'Employee 007', checkIn: '--:--', status: 'ABSENT' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-800 tracking-tight" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Attendance Tracking
          </h2>
          <p className="text-xs text-slate-500 font-medium">Monitor staff punctuality, shifts, and active attendance status</p>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-1.5 text-[10px] text-amber-800 font-semibold max-w-md">
          <strong>Sandbox Notice:</strong> Attendance data is simulated. No real biometrics or mobile check-ins are linked.
        </div>
      </div>

      <HRScopeFilter />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AttendanceSummaryPanel records={mockRecords} />
        
        <div className="card bg-white border border-slate-200/80 shadow-sm rounded-2xl p-5 space-y-4">
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Attendance Insights</h4>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-[11px] font-bold text-slate-600">Daily Punctuality Rate</span>
              <span className="text-xs font-black text-emerald-600">92.4%</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-[11px] font-bold text-slate-600">Average Check-in Time</span>
              <span className="text-xs font-black text-slate-800">08:05 AM</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-[11px] font-bold text-slate-600">Pending Shift Overrides</span>
              <span className="text-xs font-black text-amber-600">3 Requests</span>
            </div>
          </div>
          
          <div className="pt-2">
            <ReportExportButton label="Export monthly attendance" sensitive requiresReason />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AttendancePage;
