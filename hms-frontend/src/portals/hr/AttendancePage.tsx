import React from 'react';
import HRScopeFilter from './components/HRScopeFilter';
import { AttendanceSummaryPanel } from './components/AttendanceSummaryPanel';
import type { AttendanceRecord } from './components/AttendanceSummaryPanel';
import { ReportExportButton } from '../../components/analytics';
import { useHr } from '../../hooks/use-hr';
import { useUser } from '../../hooks/use-user';

export const AttendancePage: React.FC = () => {
  const user = useUser();
  const branchId = (user as any)?.primaryBranchId;
  const { attendance, isLoading } = useHr(branchId);

  const mappedRecords: AttendanceRecord[] = (attendance || []).map(a => ({
    id: a.id,
    employeeName: `${a.employee.firstName} ${a.employee.lastName}`,
    checkIn: a.createdAt.substring(11, 16),
    status: a.status as AttendanceRecord['status'],
  }));

  if (!branchId) return <div className="p-10 text-center text-slate-500">No primary branch assigned.</div>;
  if (isLoading) return <div className="p-10 text-center text-slate-400">Loading attendance...</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-800 tracking-tight" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Attendance Tracking
          </h2>
          <p className="text-xs text-slate-500 font-medium">Monitor staff punctuality, shifts, and active attendance status</p>
        </div>
      </div>

      <HRScopeFilter />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AttendanceSummaryPanel records={mappedRecords} />
        
        <div className="card bg-white border border-slate-200/80 shadow-sm rounded-2xl p-5 space-y-4">
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Attendance Insights</h4>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-[11px] font-bold text-slate-600">Daily Punctuality Rate</span>
              <span className="text-xs font-black text-emerald-600">Live Data</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-[11px] font-bold text-slate-600">Average Check-in Time</span>
              <span className="text-xs font-black text-slate-800">Live Data</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-[11px] font-bold text-slate-600">Pending Shift Overrides</span>
              <span className="text-xs font-black text-amber-600">Live Data</span>
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
