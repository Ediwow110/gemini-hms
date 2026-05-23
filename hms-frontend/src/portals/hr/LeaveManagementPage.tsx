import React from 'react';
import HRScopeFilter from './components/HRScopeFilter';
import { LeaveQueuePanel, LeaveRequest } from './components/LeaveQueuePanel';
import { Calendar, Plus } from 'lucide-react';

export const LeaveManagementPage: React.FC = () => {
  const mockRequests: LeaveRequest[] = [
    { id: 'LR-001', employeeName: 'James Wilson', type: 'ANNUAL', startDate: '2026-05-25', endDate: '2026-06-05', days: 10, status: 'PENDING' },
    { id: 'LR-002', employeeName: 'Lisa Cuddy', type: 'EMERGENCY', startDate: '2026-05-21', endDate: '2026-05-23', days: 2, status: 'PENDING' },
    { id: 'LR-003', employeeName: 'Robert Chase', type: 'SICK', startDate: '2026-05-18', endDate: '2026-05-20', days: 3, status: 'APPROVED' },
    { id: 'LR-004', employeeName: 'Allison Cameron', type: 'ANNUAL', startDate: '2026-06-10', endDate: '2026-06-15', days: 5, status: 'PENDING' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-800 tracking-tight" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Leave Management
          </h2>
          <p className="text-xs text-slate-500 font-medium">Review and approve employee time-off requests</p>
        </div>
        <div className="flex flex-col md:flex-row gap-2">
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-1.5 text-[10px] text-amber-800 font-semibold max-w-md">
            <strong>Sandbox Notice:</strong> Leave requests are simulated. No real leave mutation occurs.
          </div>
          <button className="btn bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer shadow-sm shadow-indigo-100 transition-all">
            <Plus className="h-4 w-4" /> Request Leave for Staff
          </button>
        </div>
      </div>

      <HRScopeFilter />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <LeaveQueuePanel requests={mockRequests.filter(r => r.status === 'PENDING')} />
        </div>
        
        <div className="space-y-6">
          <div className="card bg-white border border-slate-200/80 shadow-sm rounded-2xl p-5 space-y-4">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <Calendar className="h-4 w-4 text-indigo-500" />
              Leave Calendar Overview
            </h4>
            <div className="p-8 border-2 border-dashed border-slate-100 rounded-2xl flex flex-col items-center justify-center text-center">
              <Calendar className="h-8 w-8 text-slate-200 mb-2" />
              <p className="text-[10px] text-slate-400 font-medium">Monthly leave calendar shell</p>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center text-[10px] font-bold">
                <span className="text-slate-500">Currently Out</span>
                <span className="text-indigo-600">3 Personnel</span>
              </div>
              <div className="flex justify-between items-center text-[10px] font-bold">
                <span className="text-slate-500">Upcoming Next Week</span>
                <span className="text-indigo-600">5 Personnel</span>
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200/80 shadow-sm rounded-2xl p-5 space-y-3">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Leave Policy Shell</h4>
            <p className="text-[10px] text-slate-500 leading-relaxed font-medium">
              Standard annual leave is 15 days/year. Sick leave is 7 days/year. Emergency leave requires supervisor notification within 2 hours of shift start.
            </p>
            <button className="text-[10px] text-indigo-600 font-bold hover:underline cursor-pointer">
              View Leave Policies &rarr;
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeaveManagementPage;
