import React, { useState } from 'react';
import { Calendar, AlertTriangle, Users, CheckCircle, HelpCircle } from 'lucide-react';
import { AccessReviewPanel } from './components/AccessReviewPanel';
import { useAccessReview } from '../../hooks/use-compliance';
import { HmsPageHeader } from '../../components/hms-page';
import { HmsDashboardShell, HmsAuditFooter } from '../../components/hms-dashboard';

export const AccessReviewsPage: React.FC = () => {
  const [reviewPeriod, setReviewPeriod] = useState('Q2-2026');
  const { report, loading, error } = useAccessReview();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const users = (report?.accessReport || []).map((u: any) => ({
    id: u.userId,
    email: u.email,
    roles: u.roles || [],
    lastLogin: u.lastLogin || 'Never',
    mfaEnabled: u.mfaEnabled,
    driftDetected: false,
    staleAccount: u.lastLogin === null,
    status: 'PENDING' as const,
  }));

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const staleUsers = (report?.staleAccounts || []).map((u: any) => ({
    id: u.userId,
    email: u.email,
    roles: u.roles || [],
    lastLogin: u.lastLogin || 'Never',
    mfaEnabled: u.mfaEnabled,
    driftDetected: false,
    staleAccount: true,
    status: 'PENDING' as const,
  }));

  const allUsers = [...users, ...staleUsers].filter(
    (u, i, arr) => arr.findIndex(x => x.id === u.id) === i
  );

  const handleActionComplete = (_userId: string, status: 'APPROVED' | 'REVOKED') => {
    console.warn(`[Compliance Notice] Access review action attempted: ${status} for user ${_userId}. This operation is currently read-only.`);
  };

  const pendingCount = allUsers.filter(u => u.status === 'PENDING').length;
  void pendingCount;
  const certifiedCount = allUsers.filter(u => u.status !== 'PENDING').length;
  void certifiedCount;

  return (
    <HmsDashboardShell widthTier="full">
      <div className="space-y-6 pb-12">
        <HmsPageHeader
          title="Access Certification Reviews"
          description="Verify employee privilege scope boundaries, enforce MFA, and audit stale credentials"
        />

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
          </select>
        </div>
      </div>

      {/* Stats Block */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-white border border-slate-200/80 rounded-2xl flex items-center justify-between shadow-sm">
          <div>
            <p className="text-[9px] text-slate-450 font-bold uppercase tracking-wider">Total Accounts</p>
            <p className="text-xl font-extrabold text-slate-800 tracking-tight font-mono">{allUsers.length}</p>
          </div>
          <div className="p-2.5 bg-rose-50 text-rose-600 border border-rose-100 rounded-xl">
            <Users className="h-5 w-5" />
          </div>
        </div>
        <div className="p-4 bg-white border border-slate-200/80 rounded-2xl flex items-center justify-between shadow-sm">
          <div>
            <p className="text-[9px] text-slate-450 font-bold uppercase tracking-wider">Stale Accounts</p>
            <p className="text-xl font-extrabold text-rose-600 tracking-tight font-mono">{staleUsers.length}</p>
          </div>
          <div className="p-2.5 bg-amber-50 text-amber-600 border border-amber-100 rounded-xl">
            <AlertTriangle className="h-5 w-5" />
          </div>
        </div>
        <div className="p-4 bg-white border border-slate-200/80 rounded-2xl flex items-center justify-between shadow-sm">
          <div>
            <p className="text-[9px] text-slate-450 font-bold uppercase tracking-wider">MFA Compliance</p>
            <p className="text-xl font-extrabold text-emerald-600 tracking-tight font-mono">
              {allUsers.length > 0 ? Math.round(allUsers.filter(u => u.mfaEnabled).length / allUsers.length * 100) : 0}%
            </p>
          </div>
          <div className="p-2.5 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-xl">
            <CheckCircle className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Main Panel */}
      <div className="space-y-4">
        <div className="flex justify-between items-center px-1">
          <h3 className="text-xs font-bold text-slate-850 uppercase tracking-wider">
            {loading ? 'Loading...' : `Access Review — ${allUsers.length} Users`}
          </h3>
        </div>
        {error ? (
          <div className="card bg-white border border-slate-200/80 shadow-sm rounded-2xl p-12 text-center text-rose-500 space-y-2">
            <AlertTriangle className="h-8 w-8 mx-auto" />
            <p className="text-xs font-bold">Failed to load access review</p>
            <p className="text-xs">{error}</p>
          </div>
        ) : loading ? (
          <div className="card bg-white border border-slate-200/80 shadow-sm rounded-2xl p-12 text-center text-xs text-slate-400">
            Loading access review data...
          </div>
        ) : allUsers.length === 0 ? (
          <div className="card bg-white border border-slate-200/80 shadow-sm rounded-2xl p-12 text-center text-slate-400 space-y-2">
            <HelpCircle className="h-8 w-8 mx-auto text-slate-300" />
            <p className="text-xs font-bold">No users found for access review</p>
          </div>
        ) : (
          <AccessReviewPanel users={allUsers} onActionComplete={handleActionComplete} />
        )}
      </div>
      </div>
      <HmsAuditFooter />
    </HmsDashboardShell>
  );
};

export default AccessReviewsPage;
