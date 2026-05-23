import React, { useState } from 'react';
import { UserCheck, AlertCircle, FileText, CheckCircle, ShieldAlert } from 'lucide-react';
import { StatusBadge } from '../../../components/feedback/StatusBadge';

export interface AccessReviewUser {
  id: string;
  email: string;
  roles: string[];
  lastLogin: string;
  mfaEnabled: boolean;
  driftDetected: boolean;
  driftDetails?: string;
  staleAccount: boolean;
  status: 'PENDING' | 'APPROVED' | 'REVOKED';
}

interface AccessReviewPanelProps {
  users: AccessReviewUser[];
  onActionComplete?: (userId: string, status: 'APPROVED' | 'REVOKED', notes: string) => void;
}

export const AccessReviewPanel: React.FC<AccessReviewPanelProps> = ({ users, onActionComplete }) => {
  const [activeUser, setActiveUser] = useState<AccessReviewUser | null>(null);
  const [notes, setNotes] = useState('');

  const handleAction = (status: 'APPROVED' | 'REVOKED') => {
    if (activeUser && onActionComplete) {
      onActionComplete(activeUser.id, status, notes);
      setActiveUser(null);
      setNotes('');
    }
  };

  return (
    <div className="space-y-4">
      {/* List Panel */}
      <div className="card overflow-hidden bg-white border border-slate-200/80 shadow-sm rounded-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50/80 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">User Account</th>
                <th className="px-6 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">Assigned Roles</th>
                <th className="px-6 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">MFA Status</th>
                <th className="px-6 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">Last Login</th>
                <th className="px-6 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">Audit Flags</th>
                <th className="px-6 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Status</th>
                <th className="px-6 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-indigo-50/10">
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-bold text-slate-800">{u.email}</p>
                      <p className="text-[10px] text-slate-400 font-mono">ID: {u.id}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {u.roles.map(r => (
                        <span key={r} className="bg-slate-100 border text-slate-600 text-[10px] font-bold px-1.5 py-0.5 rounded">
                          {r}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge 
                      status={u.mfaEnabled ? 'MFA ACTIVE' : 'MFA DISABLED'} 
                      type={u.mfaEnabled ? 'success' : 'danger'} 
                    />
                  </td>
                  <td className="px-6 py-4 text-slate-500 font-medium">{u.lastLogin}</td>
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      {u.driftDetected && (
                        <span className="inline-flex items-center gap-1 bg-amber-50 border border-amber-200 text-amber-800 text-[10px] font-bold px-1.5 py-0.5 rounded">
                          <AlertCircle className="h-3 w-3 text-amber-600" /> Privilege Drift
                        </span>
                      )}
                      {u.staleAccount && (
                        <span className="inline-flex items-center gap-1 bg-rose-50 border border-rose-200 text-rose-800 text-[10px] font-bold px-1.5 py-0.5 rounded">
                          <ShieldAlert className="h-3 w-3 text-rose-600" /> Stale (Inactive &gt; 90 days)
                        </span>
                      )}
                      {!u.driftDetected && !u.staleAccount && (
                        <span className="text-slate-400 italic">No flags</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <StatusBadge 
                      status={u.status} 
                      type={u.status === 'APPROVED' ? 'success' : u.status === 'REVOKED' ? 'danger' : 'warning'} 
                    />
                  </td>
                  <td className="px-6 py-4 text-center">
                    {u.status === 'PENDING' ? (
                      <button
                        onClick={() => setActiveUser(u)}
                        className="btn bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer"
                      >
                        <UserCheck className="h-3.5 w-3.5" /> Certify Access
                      </button>
                    ) : (
                      <span className="text-slate-400 font-bold text-[10px] uppercase">Completed</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Review Modal */}
      {activeUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 shadow-2xl max-w-sm w-full border border-slate-200 animate-scale-in relative">
            <div className="flex gap-3 mb-4">
              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl h-fit border border-indigo-100">
                <FileText className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider select-none">
                  Certify User Access
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Quarterly Privilege Attestation</p>
              </div>
            </div>

            <div className="space-y-3.5 text-xs text-slate-600 leading-relaxed border-t border-b border-slate-100 py-4 my-2">
              <div>
                <p className="font-bold text-slate-800">{activeUser.email}</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Roles: {activeUser.roles.join(', ')}</p>
              </div>

              {activeUser.driftDetected && (
                <div className="p-2.5 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl">
                  <p className="font-bold text-[10px] uppercase">Drift Alert:</p>
                  <p className="mt-0.5">{activeUser.driftDetails}</p>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="font-bold text-slate-700">Reviewer Notes</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Enter access justification or remediation notes..."
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 h-20 resize-none"
                />
              </div>

              <div className="p-3 bg-slate-50 border rounded-xl text-[10px] text-slate-500">
                <strong>Attestation Signature:</strong> Reviewer actions are logged to compliance trails in-memory. No backend tenant role revocations occur automatically.
              </div>
            </div>

            <div className="mt-5 flex gap-2">
              <button 
                onClick={() => handleAction('APPROVED')}
                className="w-full btn bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 rounded-xl text-xs transition-colors flex items-center justify-center gap-1 cursor-pointer"
              >
                <CheckCircle className="h-4 w-4" /> Approve
              </button>
              <button 
                onClick={() => handleAction('REVOKED')}
                className="w-full btn bg-rose-600 hover:bg-rose-700 text-white font-bold py-2 rounded-xl text-xs transition-colors flex items-center justify-center gap-1 cursor-pointer"
              >
                <ShieldAlert className="h-4 w-4" /> Revoke
              </button>
              <button 
                onClick={() => setActiveUser(null)}
                className="w-full btn border border-slate-200 hover:bg-slate-50 font-bold py-2 rounded-xl text-slate-700 transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default AccessReviewPanel;
