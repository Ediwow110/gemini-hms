import React, { useState } from 'react';
import { Shield, Key, Edit3, UserMinus, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';
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

type ActionType = 'edit_role' | 'reset_mfa' | 'toggle_status';

// Honest per-action outcome. The backend has admin endpoints for role
// assignment/revocation (POST /v1/admin/users/:id/roles) and for
// activate/deactivate (POST /v1/admin/users/:id/(de)activate), but the
// frontend wiring is not yet in place. There is no backend endpoint to
// reset another user's MFA. We surface this truth so a Super Admin
// does not believe a fake success alert.
type ActionOutcome = 'pending_wiring' | 'backend_unsupported';

function actionOutcome(type: ActionType): ActionOutcome {
  if (type === 'reset_mfa') return 'backend_unsupported';
  return 'pending_wiring';
}

function outcomeCopy(
  type: ActionType,
  userName: string,
  reason: string,
  status: 'Active' | 'Suspended' | 'Locked' | undefined,
): { icon: React.ReactNode; tone: 'amber' | 'rose'; title: string; body: string } {
  if (type === 'reset_mfa') {
    return {
      icon: <XCircle className="h-5 w-5 text-rose-600" />,
      tone: 'rose',
      title: 'Action not available in this version',
      body:
        `Reset MFA for ${userName} is not wired to a backend endpoint. ` +
        `The current backend exposes user-self MFA setup, verify, and recovery-code ` +
        `generation, but no admin endpoint to reset another user's MFA. ` +
        `Reason was recorded only in this dialog and was NOT persisted: "${reason || 'None'}".`,
    };
  }
  const verb = type === 'edit_role' ? 'Edit user roles/scopes' : status === 'Active' ? 'Lock (deactivate) account' : 'Unlock (activate) account';
  return {
    icon: <CheckCircle2 className="h-5 w-5 text-amber-600" />,
    tone: 'amber',
    title: 'Action queued for backend wiring',
    body:
      `${verb} for ${userName} has the backend support (admin role / lifecycle ` +
      `endpoints) but is not yet wired in this UI. The reason you entered was ` +
      `recorded only in this dialog and was NOT persisted: "${reason || 'None'}". ` +
      `This will be wired in a follow-up lane; do not rely on this dialog to actually ` +
      `change the user's role or status.`,
  };
}

interface OutcomeData {
  type: ActionType;
  userName: string;
  userStatus: 'Active' | 'Suspended' | 'Locked' | undefined;
  reason: string;
}

export const UserAccessTable: React.FC<UserAccessTableProps> = ({ users }) => {
  const [activeDialog, setActiveDialog] = useState<{ type: ActionType; user: UserItem } | null>(null);
  const [outcome, setOutcome] = useState<OutcomeData | null>(null);

  const handleActionClick = (type: ActionType, user: UserItem) => {
    setActiveDialog({ type, user });
  };

  const handleClose = () => {
    setActiveDialog(null);
    setOutcome(null);
  };

  const modalTitle = (() => {
    if (!activeDialog) return '';
    if (activeDialog.type === 'edit_role') return 'Edit User Roles & Scopes';
    if (activeDialog.type === 'reset_mfa') return 'Reset User Multi-Factor Authentication (MFA)';
    return 'Change User Account Status';
  })();

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

      {activeDialog && !outcome && (
        <div
          data-testid="useraccess-sandbox-notice"
          className="fixed bottom-6 right-6 z-[60] max-w-sm p-3 rounded-xl border bg-slate-50 border-slate-200 text-slate-600 text-xs leading-relaxed shadow-2xl"
        >
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-slate-500 flex-shrink-0 mt-0.5" />
            <p>
              Privileged actions in this UI are not yet wired to a backend mutation.
              Backend support exists for role assignment / revocation and activate /
              deactivate (<code className="font-mono text-[11px]">admin.controller.ts</code>),
              but not for admin MFA reset. No change will be persisted from this dialog;
              the reason is recorded only in this client-side session.
            </p>
          </div>
        </div>
      )}

      {activeDialog && (() => {
        const { type, user } = activeDialog;
        return (
          <ReasonModal
            key={`${type}-${user.id}`}
            isOpen
            title={modalTitle}
            guidance={`Specify a valid administrative audit reason for performing the "${type}" action on ${user.name}.`}
            onConfirm={(reason) => {
              setOutcome({ type, userName: user.name, userStatus: user.status, reason });
              setActiveDialog(null);
            }}
            onClose={handleClose}
          />
        );
      })()}

      {outcome && (() => {
        const label = actionOutcome(outcome.type);
        const copy = outcomeCopy(outcome.type, outcome.userName, outcome.reason, outcome.userStatus);
        const toneClass = copy.tone === 'rose'
          ? 'bg-rose-50 border-rose-200 text-rose-800'
          : 'bg-amber-50 border-amber-200 text-amber-800';
        const Icon = copy.icon;
        return (
          <div
            data-testid="useraccess-outcome"
            data-outcome={label}
            className={`fixed bottom-6 right-6 z-[60] max-w-sm p-3 rounded-xl border text-xs leading-relaxed shadow-2xl ${toneClass}`}
          >
            <div className="flex items-start gap-2">
              {Icon}
              <div>
                <p className="font-bold mb-1">{copy.title}</p>
                <p>{copy.body}</p>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};
export default UserAccessTable;
