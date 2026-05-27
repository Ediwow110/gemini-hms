import React, { useState } from 'react';
import { Shield, Key, Edit3, UserMinus } from 'lucide-react';
import { RoleBadge, UserStatusBadge } from '../../../components/ui/user-badges';
import { ReasonModal } from '../../../components/ui/approval-modals';

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
        <ReasonModal
          isOpen={!!activeDialog}
          title={activeDialog.type === 'edit_role' ? 'Edit User Roles & Scopes' : activeDialog.type === 'reset_mfa' ? 'Reset User Multi-Factor Authentication (MFA)' : 'Change User Account Status'}
          guidance={`Specify a valid administrative audit reason for performing the "${activeDialog.type}" action on ${activeDialog.user.name}.`}
          onClose={() => setActiveDialog(null)}
          onConfirm={(reason) => {
            alert(`Audit Action Logged: ${activeDialog.type} for ${activeDialog.user.name}. Reason: ${reason}`);
            setActiveDialog(null);
          }}
        />
      )}
    </div>
  );
};
export default UserAccessTable;
