import React, { useState } from 'react';
import { Calendar, AlertTriangle, Users, CheckCircle } from 'lucide-react';
import { AccessReviewPanel, AccessReviewUser } from './components/AccessReviewPanel';

export const AccessReviewsPage: React.FC = () => {
  const [reviewPeriod, setReviewPeriod] = useState('Q2-2026');
  const [users, setUsers] = useState<AccessReviewUser[]>([
    {
      id: "USR-004",
      email: "support.staff@stjude.org",
      roles: ["Nurse", "Receptionist"],
      lastLogin: "2026-05-19 09:12:04",
      mfaEnabled: true,
      driftDetected: true,
      driftDetails: "Manually granted queue.view permission directly without role validation",
      staleAccount: false,
      status: "PENDING"
    },
    {
      id: "USR-005",
      email: "billing.intern@mediclinics.org",
      roles: ["Cashier"],
      lastLogin: "2026-02-12 14:15:33",
      mfaEnabled: false,
      driftDetected: false,
      staleAccount: true,
      status: "PENDING"
    },
    {
      id: "USR-006",
      email: "dr.martinez@stjude.org",
      roles: ["Doctor"],
      lastLogin: "2026-05-21 13:45:10",
      mfaEnabled: true,
      driftDetected: false,
      staleAccount: false,
      status: "PENDING"
    }
  ]);

  const handleActionComplete = (userId: string, status: 'APPROVED' | 'REVOKED', notes: string) => {
    setUsers(prev => prev.map(u => {
      if (u.id === userId) {
        return { ...u, status };
      }
      return u;
    }));
    alert(`Access review action logged: Account status updated to ${status}. Notes: "${notes || 'None'}"`);
  };

  const pendingCount = users.filter(u => u.status === 'PENDING').length;
  const certifiedCount = users.filter(u => u.status !== 'PENDING').length;

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-800 tracking-tight" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Access Certification Reviews
          </h2>
          <p className="text-xs text-slate-500 font-medium">Verify employee privilege scope boundaries, enforce MFA, and audit stale credentials</p>
        </div>
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex gap-2 text-[10px] text-amber-800 leading-normal max-w-md">
          <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
          <p>
            <strong>Sandbox Safety Rule:</strong> Access reviews executed in this sandbox are simulations. No user accounts are disabled, and no role modifications are pushed to backend authorization systems.
          </p>
        </div>
      </div>

      {/* Review Settings Card */}
      <div className="card p-5 bg-white border border-slate-200/80 shadow-sm rounded-2xl flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-650 border border-indigo-100">
            <Calendar className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Active Attestation Window</h4>
            <p className="text-[10px] text-slate-400 font-semibold font-mono">Period: {reviewPeriod}</p>
          </div>
        </div>

        <div className="flex gap-3 items-center w-full md:w-auto">
          <span className="text-xs font-bold text-slate-655 text-slate-600 whitespace-nowrap">Review Period:</span>
          <select
            value={reviewPeriod}
            onChange={(e) => setReviewPeriod(e.target.value)}
            className="w-full md:w-48 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
          >
            <option value="Q2-2026">Q2 2026 (Active)</option>
            <option value="Q1-2026">Q1 2026 (Archived)</option>
            <option value="Q4-2025">Q4 2025 (Archived)</option>
          </select>
        </div>
      </div>

      {/* Stats Block */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-white border border-slate-200/80 rounded-2xl flex items-center justify-between shadow-sm">
          <div>
            <p className="text-[9px] text-slate-450 font-bold uppercase tracking-wider">Pending Certification</p>
            <p className="text-xl font-extrabold text-slate-800 tracking-tight font-mono">{pendingCount} Accounts</p>
          </div>
          <div className="p-2.5 bg-rose-50 text-rose-600 border border-rose-100 rounded-xl">
            <Users className="h-5 w-5" />
          </div>
        </div>

        <div className="p-4 bg-white border border-slate-200/80 rounded-2xl flex items-center justify-between shadow-sm">
          <div>
            <p className="text-[9px] text-slate-450 font-bold uppercase tracking-wider">Reviewed Accounts</p>
            <p className="text-xl font-extrabold text-emerald-600 tracking-tight font-mono">{certifiedCount} Certified</p>
          </div>
          <div className="p-2.5 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-xl">
            <CheckCircle className="h-5 w-5" />
          </div>
        </div>

        <div className="p-4 bg-white border border-slate-200/80 rounded-2xl flex items-center justify-between shadow-sm">
          <div>
            <p className="text-[9px] text-slate-450 font-bold uppercase tracking-wider">Attestation Deadline</p>
            <p className="text-sm font-extrabold text-slate-800 tracking-tight">June 15, 2026</p>
            <p className="text-[10px] text-rose-500 font-bold mt-0.5">25 days remaining</p>
          </div>
          <div className="p-2.5 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-xl">
            <Calendar className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Main Panel */}
      <div className="space-y-4">
        <div className="flex justify-between items-center px-1">
          <h3 className="text-xs font-bold text-slate-850 uppercase tracking-wider">Awaiting Certification Panel</h3>
        </div>
        <AccessReviewPanel users={users} onActionComplete={handleActionComplete} />
      </div>
    </div>
  );
};

export default AccessReviewsPage;
