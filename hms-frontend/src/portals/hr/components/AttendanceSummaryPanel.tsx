import React from 'react';
import { Clock, UserCheck, UserMinus, LogIn, LogOut } from 'lucide-react';

export interface AttendanceRecord {
  id: string;
  employeeName: string;
  checkIn: string;
  checkOut?: string;
  status: 'PRESENT' | 'LATE' | 'ABSENT' | 'ON_LEAVE';
}

interface AttendanceSummaryPanelProps {
  records: AttendanceRecord[];
}

export const AttendanceSummaryPanel: React.FC<AttendanceSummaryPanelProps> = ({ records }) => {
  return (
    <div className="bg-white border border-slate-200/80 shadow-sm rounded-2xl p-5 space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <Clock className="h-4 w-4 text-indigo-500" />
            Today's Attendance
          </h3>
          <p className="text-[10px] text-slate-400 font-medium">Real-time check-in/out monitor</p>
        </div>
        <div className="flex gap-2">
          <div className="flex items-center gap-1 px-2 py-1 bg-emerald-50 text-emerald-700 rounded-lg text-[10px] font-bold border border-emerald-100">
            <UserCheck className="h-3 w-3" /> {records.filter(r => r.status === 'PRESENT').length}
          </div>
          <div className="flex items-center gap-1 px-2 py-1 bg-rose-50 text-rose-700 rounded-lg text-[10px] font-bold border border-rose-100">
            <UserMinus className="h-3 w-3" /> {records.filter(r => r.status === 'ABSENT').length}
          </div>
        </div>
      </div>

      <div className="space-y-2.5">
        {records.map((rec) => (
          <div key={rec.id} className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-800">{rec.employeeName}</p>
              <div className="flex items-center gap-3 mt-0.5">
                <span className="text-[9px] text-slate-400 flex items-center gap-1">
                  <LogIn className="h-2.5 w-2.5" /> {rec.checkIn}
                </span>
                <span className="text-[9px] text-slate-400 flex items-center gap-1">
                  <LogOut className="h-2.5 w-2.5" /> {rec.checkOut || '--:--'}
                </span>
              </div>
            </div>
            <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-md border ${
              rec.status === 'PRESENT' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
              rec.status === 'LATE' ? 'bg-amber-50 text-amber-600 border-amber-100' :
              rec.status === 'ABSENT' ? 'bg-rose-50 text-rose-600 border-rose-100' :
              'bg-blue-50 text-blue-600 border-blue-100'
            }`}>
              {rec.status}
            </span>
          </div>
        ))}
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 text-[10px] text-amber-800 font-semibold">
        <strong>Simulation Notice:</strong> Attendance data is mock-generated. No real biometrics or mobile check-ins are linked.
      </div>
    </div>
  );
};
