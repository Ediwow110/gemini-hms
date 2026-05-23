import React, { useState } from 'react';
import { Shield, ShieldAlert, Key, Edit3, UserMinus } from 'lucide-react';
import { RoleBadge, UserStatusBadge } from '../../../components/ui/user-badges';

interface UserItem {
  id: string;
  name: string;
  email: string;
  tenant: string;
  branch: string;
  role: string;
  mfaEnabled: boolean;
  status: 'Active' | 'Suspended' | 'Locked';
  lastLogin: string;
}

interface UserAccessTableProps {
  users: UserItem[];
}

export const UserAccessTable: React.FC<UserAccessTableProps> = ({ users }) => {
  const [activeDialog, setActiveDialog] = useState<{ type: string; user: UserItem } | null>(null);

  const handleActionClick = (type: string, user: UserItem) => {
    setActiveDialog({ type, user });
  };

  return (
    <div className="space-y-4">
      <div className="card overflow-hidden bg-white border border-slate-200/80 shadow-sm rounded-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50/80 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">Account / Contact</th>
                <th className="px-6 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">Tenant Scope</th>
                <th className="px-6 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">Role Matrix</th>
                <th className="px-6 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">MFA Status</th>
                <th className="px-6 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">Account Status</th>
                <th className="px-6 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-indigo-50/20 transition-colors">
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-bold text-slate-900">{u.name}</p>
                      <p className="text-xs text-slate-400 font-medium">{u.email}</p>
                      <p className="text-[10px] text-slate-400 font-mono mt-0.5">Last Login: {u.lastLogin}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-xs">
                    <p className="font-semibold text-slate-700">{u.tenant}</p>
                    <p className="text-[10px] text-slate-400">Branch: {u.branch}</p>
                  </td>
                  <td className="px-6 py-4">
                    <RoleBadge role={u.role} />
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                      u.mfaEnabled 
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                        : 'bg-rose-50 text-rose-700 border border-rose-100'
                    }`}>
                      {u.mfaEnabled ? 'MFA_ON' : 'MFA_OFF'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <UserStatusBadge status={u.status} />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-center gap-1.5">
                      <button 
                        onClick={() => handleActionClick('edit_role', u)}
                        className="p-1.5 bg-slate-50 hover:bg-indigo-50 text-slate-500 hover:text-indigo-600 rounded-lg border border-slate-200 transition-colors"
                        title="Edit Roles & Scopes"
                      >
                        <Edit3 className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => handleActionClick('reset_mfa', u)}
                        className="p-1.5 bg-slate-50 hover:bg-amber-50 text-slate-500 hover:text-amber-600 rounded-lg border border-slate-200 transition-colors"
                        title="Reset/Enforce MFA"
                      >
                        <Key className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => handleActionClick('toggle_status', u)}
                        className={`p-1.5 rounded-lg border transition-colors ${
                          u.status === 'Active' 
                            ? 'bg-slate-50 hover:bg-rose-50 text-slate-500 hover:text-rose-600 border-slate-200' 
                            : 'bg-slate-50 hover:bg-emerald-50 text-slate-500 hover:text-emerald-600 border-slate-200'
                        }`}
                        title={u.status === 'Active' ? 'Lock Account' : 'Unlock Account'}
                      >
                        {u.status === 'Active' ? <UserMinus className="h-4 w-4" /> : <Shield className="h-4 w-4" />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {activeDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 shadow-2xl max-w-sm w-full border border-slate-200 animate-scale-in relative">
            <div className="flex gap-3 mb-4">
              <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl h-fit border border-amber-100">
                <ShieldAlert className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider select-none">
                  Simulated Action
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Mock governance sandbox execution</p>
              </div>
            </div>
            
            <div className="space-y-3 text-xs text-slate-600 leading-relaxed border-t border-b border-slate-100 py-4">
              <p>
                Requested Action: <strong className="text-slate-800 uppercase font-mono">{activeDialog.type}</strong> for user <strong>{activeDialog.user.name}</strong>.
              </p>
              <p className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 font-medium">
                This is a UI demo shell only. Multi-tenant persistence, user modifications, and role assignments are not processed. No production credential storage or MFA setups are changed.
              </p>
            </div>

            <div className="mt-5 flex gap-2">
              <button 
                onClick={() => setActiveDialog(null)}
                className="w-full btn border border-slate-200 hover:bg-slate-50 font-bold py-2 rounded-xl text-slate-700 transition-colors"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default UserAccessTable;
