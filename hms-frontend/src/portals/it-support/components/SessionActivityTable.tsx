import React, { useState } from 'react';
import { Key, ShieldAlert, Globe, Monitor, Clock } from 'lucide-react';
import { StatusBadge } from '../../../components/feedback/StatusBadge';

export interface SessionEntry {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userRole: string;
  tenantName: string;
  branchName: string;
  ipAddress: string;
  userAgent: string;
  loginAt: string;
  lastActivity: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  isActive: boolean;
}

interface SessionActivityTableProps {
  sessions: SessionEntry[];
}

export const SessionActivityTable: React.FC<SessionActivityTableProps> = ({ sessions }) => {
  const [revokedSessions, setRevokedSessions] = useState<Set<string>>(new Set());

  const handleRevoke = (sessionId: string) => {
    setRevokedSessions(prev => new Set(prev).add(sessionId));
  };

  const getRiskBadge = (level: string) => {
    switch (level) {
      case 'HIGH': return 'danger';
      case 'MEDIUM': return 'warning';
      default: return 'success';
    }
  };

  return (
    <div className="bg-white border border-slate-200/80 shadow-sm rounded-2xl p-5 space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <Key className="h-4 w-4 text-indigo-500" />
            Active User Sessions
          </h3>
          <p className="text-[10px] text-slate-400 font-medium">Real-time session activity and client analytics</p>
        </div>
        <span className="text-[10px] bg-emerald-50 text-emerald-700 font-bold px-2.5 py-1 rounded-lg border border-emerald-200">
          {sessions.filter(s => s.isActive && !revokedSessions.has(s.id)).length} active
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
              <th className="pb-3 pl-2">User</th>
              <th className="pb-3">Client</th>
              <th className="pb-3">Session Age</th>
              <th className="pb-3 text-center">Risk</th>
              <th className="pb-3 text-right pr-2">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {sessions.map((session) => {
              const isRevoked = revokedSessions.has(session.id);
              return (
                <tr key={session.id} className={`transition-colors ${isRevoked ? 'opacity-50' : 'hover:bg-slate-50/50'}`}>
                  <td className="py-3 pl-2">
                    <div className="flex items-center gap-2.5">
                      <div className="h-8 w-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center text-[10px] font-bold uppercase">
                        {session.userName.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-slate-800 text-xs">{session.userName}</p>
                        <p className="text-[10px] text-slate-400 font-medium">{session.userRole} · {session.tenantName}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3">
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-600">
                      <Monitor className="h-3 w-3 text-slate-400" />
                      <span className="font-mono font-semibold truncate max-w-[160px]">{session.userAgent}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mt-0.5">
                      <Globe className="h-3 w-3" />
                      <span className="font-mono">{session.ipAddress}</span>
                    </div>
                  </td>
                  <td className="py-3">
                    <div className="flex items-center gap-1.5 text-[10px]">
                      <Clock className="h-3 w-3 text-slate-400" />
                      <span className="font-semibold text-slate-600">{session.loginAt}</span>
                    </div>
                    <div className="text-[9px] text-slate-400 mt-0.5">Last: {session.lastActivity}</div>
                  </td>
                  <td className="py-3 text-center">
                    <StatusBadge status={session.riskLevel} type={getRiskBadge(session.riskLevel)} />
                  </td>
                  <td className="py-3 text-right pr-2">
                    {isRevoked ? (
                      <span className="text-[10px] bg-rose-50 text-rose-700 border border-rose-200 px-2 py-1 rounded-lg font-bold">
                        Revoked (UI only)
                      </span>
                    ) : (
                      <button
                        onClick={() => handleRevoke(session.id)}
                        className="text-[10px] bg-slate-50 hover:bg-rose-50 border border-slate-200 hover:border-rose-300 text-slate-600 hover:text-rose-700 font-bold px-2.5 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1 ml-auto"
                      >
                        <ShieldAlert className="h-3 w-3" />
                        Revoke
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl px-3.5 py-2.5 text-[10px] text-amber-800 font-semibold">
      </div>
    </div>
  );
};

export default SessionActivityTable;
