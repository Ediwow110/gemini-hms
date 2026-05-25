import React from 'react';
import ITScopeFilter from './components/ITScopeFilter';
import UserSupportQueue from './components/UserSupportQueue';
import { useSupportTickets } from '../../hooks/use-it-support';

export const UserSupportPage: React.FC = () => {
  const { tickets, loading, error, refetch } = useSupportTickets({ pageSize: 50 });

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-800 tracking-tight" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            User Support Center
          </h2>
          <p className="text-xs text-slate-500 font-medium">Login failures, MFA resets, account lockouts, and permission requests</p>
        </div>
      </div>

      <ITScopeFilter />

      {loading ? (
        <div className="card bg-white border border-slate-200/80 shadow-sm rounded-2xl p-12 text-center text-xs text-slate-400">
          Loading tickets...
        </div>
      ) : error ? (
        <div className="card bg-red-50 border border-red-200 rounded-2xl p-6 text-xs text-red-700">
          <p className="font-bold">Error loading tickets</p>
          <p>{error}</p>
          <button onClick={refetch} className="mt-2 text-indigo-600 font-bold cursor-pointer hover:underline">Retry</button>
        </div>
      ) : (
        <UserSupportQueue tickets={tickets.map(t => ({
          id: t.id,
          userName: t.reportedBy?.email || 'Unknown',
          userEmail: t.reportedBy?.email || '',
          userRole: '',
          tenantName: '',
          branchName: t.branch?.name || '',
          issueType: t.issueType,
          summary: t.summary,
          status: t.status,
          priority: t.priority,
          createdAt: new Date(t.createdAt).toLocaleString(),
        }))} />
      )}
    </div>
  );
};

export default UserSupportPage;
