import React from 'react';
import { 
  Users, 
  Calendar, 
  ShieldCheck, 
  DollarSign, 
  UserX, 
  Briefcase,
  Clock,
  ArrowRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import HRScopeFilter from './components/HRScopeFilter';
import { EmployeeSummaryCard } from './components/EmployeeSummaryCard';
import { EmployeeWorklist, Employee } from './components/EmployeeWorklist';
import { LeaveQueuePanel, LeaveRequest } from './components/LeaveQueuePanel';
import { LicenseMonitorPanel, License } from './components/LicenseMonitorPanel';

export const HRDashboard: React.FC = () => {
  const navigate = useNavigate();

  const mockEmployees: Employee[] = [
    { id: '1', name: 'Dr. Gregory House', email: 'g.house@stjude.org', role: 'Chief Diagnostician', department: 'Clinical', branch: 'St. Jude Metro', status: 'ACTIVE', joinedAt: '2024-01-15' },
    { id: '2', name: 'Nurse Judy Hopps', email: 'j.hopps@stjude.org', role: 'Head Nurse', department: 'Nursing', branch: 'St. Jude Metro', status: 'ACTIVE', joinedAt: '2024-03-22' },
    { id: '3', name: 'Charles McGill', email: 'c.mcgill@stjude.org', role: 'Legal Counsel', department: 'Admin', branch: 'St. Jude North', status: 'TERMINATED', joinedAt: '2023-11-05' },
    { id: '4', name: 'James Wilson', email: 'j.wilson@stjude.org', role: 'Oncology Head', department: 'Clinical', branch: 'St. Jude Metro', status: 'ON_LEAVE', joinedAt: '2024-02-10' },
  ];

  const mockLeaveRequests: LeaveRequest[] = [
    { id: 'LR-001', employeeName: 'James Wilson', type: 'ANNUAL', startDate: '2026-05-25', endDate: '2026-06-05', days: 10, status: 'PENDING' },
    { id: 'LR-002', employeeName: 'Lisa Cuddy', type: 'EMERGENCY', startDate: '2026-05-21', endDate: '2026-05-23', days: 2, status: 'PENDING' },
  ];

  const mockLicenses: License[] = [
    { id: 'LIC-001', employeeName: 'Dr. Gregory House', type: 'Medical Board License', expiryDate: '2026-06-15', daysRemaining: 25, status: 'EXPIRING' },
    { id: 'LIC-002', employeeName: 'Nurse Judy Hopps', type: 'Nursing License', expiryDate: '2026-08-30', daysRemaining: 101, status: 'VALID' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-800 tracking-tight" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            HR & Workforce Management Workspace
          </h2>
          <p className="text-xs text-slate-500 font-medium">Employee directory, payroll, leave management, and staff compliance</p>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-1.5 text-[10px] text-amber-800 font-semibold max-w-md">
          <strong>Sandbox Notice:</strong> All workforce data is simulated. No real HR or payroll actions are performed.
        </div>
      </div>

      <HRScopeFilter />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <EmployeeSummaryCard 
          title="Active Employees" 
          value="1,240" 
          icon={Users} 
          description="Across 12 departments" 
          trend={{ value: "12% vs last month", isUp: true }}
        />
        <EmployeeSummaryCard 
          title="On Leave" 
          value="18" 
          icon={Calendar} 
          description="Approved time-off" 
          trend={{ value: "4% vs last month", isUp: false }}
        />
        <EmployeeSummaryCard 
          title="Expiring Licenses" 
          value="14" 
          icon={ShieldCheck} 
          description="Requires renewal < 30 days" 
        />
        <EmployeeSummaryCard 
          title="Payroll Pending" 
          value="₱12.4M" 
          icon={DollarSign} 
          description="Cycle: May 16-31, 2026" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <EmployeeWorklist employees={mockEmployees} />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <LeaveQueuePanel requests={mockLeaveRequests} />
            <LicenseMonitorPanel licenses={mockLicenses} />
          </div>
        </div>

        <div className="space-y-6">
          <div className="card bg-white border border-slate-200/80 shadow-sm rounded-2xl p-5 space-y-4">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">HR Quick Actions</h4>
            <div className="space-y-2">
              <button
                onClick={() => navigate('/hr/employees')}
                className="w-full text-left p-2.5 bg-slate-50 hover:bg-indigo-50/50 border border-slate-200 hover:border-indigo-300 rounded-xl transition-all text-xs font-bold text-slate-700 flex justify-between items-center cursor-pointer"
              >
                <span>Add New Employee</span>
                <Briefcase className="h-4 w-4 text-indigo-500" />
              </button>
              <button
                onClick={() => navigate('/hr/attendance')}
                className="w-full text-left p-2.5 bg-slate-50 hover:bg-indigo-50/50 border border-slate-200 hover:border-indigo-300 rounded-xl transition-all text-xs font-bold text-slate-700 flex justify-between items-center cursor-pointer"
              >
                <span>Log Manual Attendance</span>
                <Clock className="h-4 w-4 text-indigo-500" />
              </button>
              <button
                onClick={() => navigate('/hr/payroll')}
                className="w-full text-left p-2.5 bg-slate-50 hover:bg-indigo-50/50 border border-slate-200 hover:border-indigo-300 rounded-xl transition-all text-xs font-bold text-slate-700 flex justify-between items-center cursor-pointer"
              >
                <span>Process Payroll Cycle</span>
                <DollarSign className="h-4 w-4 text-indigo-500" />
              </button>
              <button
                onClick={() => navigate('/hr/termination')}
                className="w-full text-left p-2.5 bg-slate-50 hover:bg-rose-50/50 border border-slate-200 hover:border-rose-300 rounded-xl transition-all text-xs font-bold text-slate-700 flex justify-between items-center cursor-pointer"
              >
                <span>Offboard Employee</span>
                <UserX className="h-4 w-4 text-rose-500" />
              </button>
            </div>
          </div>

          <div className="p-4 bg-indigo-50/40 border border-indigo-150 rounded-2xl space-y-2.5">
            <div className="flex items-center gap-2">
              <Users className="h-4.5 w-4.5 text-indigo-600 animate-pulse" />
              <h5 className="text-xs font-bold text-indigo-900 uppercase">Workforce Insights</h5>
            </div>
            <p className="text-[11px] text-indigo-800 leading-relaxed font-semibold">
              The workforce comprises 1,240 employees across 3 facility branches. 85% of clinical staff have valid licenses, with 14 pending renewals. Next payroll cycle starts in 10 days.
            </p>
            <button
              onClick={() => navigate('/hr/employees')}
              className="text-[10px] text-indigo-700 font-bold flex items-center gap-1 cursor-pointer hover:text-indigo-900 transition-colors"
            >
              Full Staff Directory <ArrowRight className="h-3 w-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HRDashboard;
