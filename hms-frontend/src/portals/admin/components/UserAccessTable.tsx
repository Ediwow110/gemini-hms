import React, { useState } from 'react';
import { Shield, Key, Edit3, UserMinus, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';
import { RoleBadge, UserStatusBadge } from '../../../components/ui/user-badges';
import { ReasonModal } from '../../../components/ui/approval-modals';
import { adminService } from '../../../services/admin.service';

const MIN_REASON_LENGTH = 8;

interface UserItem {
  id: string;
  name: string;
  email: string;
  tenant: string;
  branch: string;
  role: string;
  roleIds?: string[];
  branchIds?: string[];
  mfaEnabled: boolean;
  status: 'Active' | 'Suspended' | 'Locked';
  lastLogin: string;
}

interface UserAccessTableProps {
  users: UserItem[];
  onUsersChanged?: () => Promise<void> | void;
}

type ActionType = 'edit_role' | 'reset_mfa' | 'toggle_status';
type ActionOutcome = 'wired_success' | 'backend_unsupported' | 'pending_wiring' | 'mutation_error';

interface OutcomeData {
  label: ActionOutcome;
  type: ActionType;
  userName: string;
  title: string;
  body: string;
  tone: 'emerald' | 'amber' | 'rose';
}

const extractApiError = (err: unknown, fallback: string): string => {
  const e = err as { response?: { data?: { message?: string } }; message?: string };
  return e?.response?.data?.message || e?.message || fallback;
};

function unsupportedMfaOutcome(userName: string, reason: string): OutcomeData {
  return {
    label: 'backend_unsupported',
    type: 'reset_mfa',
    userName,
    tone: 'rose',
    title: 'Action not available in this version',
    body:
      `Reset MFA for ${userName} is not wired to a backend endpoint. ` +
      `The current backend exposes user-self MFA setup, verify, and recovery-code ` +
      `generation, but no admin endpoint to reset another user's MFA. ` +
      `Reason was recorded only in this dialog and was NOT persisted: "${reason || 'None'}".`,
  };
}

function deferredRoleOutcome(userName: string, reason: string): OutcomeData {
  return {
    label: 'pending_wiring',
    type: 'edit_role',
    userName,
    tone: 'amber',
    title: 'Role editing still requires a dedicated selector',
    body:
      `Role assignment and revocation backend endpoints exist, but this table does not yet provide a safe target-role selector. ` +
      `No role mutation was sent for ${userName}. Reason was recorded only in this dialog and was NOT persisted: "${reason || 'None'}".`,
  };
}

function lifecycleSuccessOutcome(
  userName: string,
  previousStatus: 'Active' | 'Suspended' | 'Locked',
): OutcomeData {
  const action = previousStatus === 'Active' ? 'deactivated' : 'activated';
  return {
    label: 'wired_success',
    type: 'toggle_status',
    userName,
    tone: 'emerald',
    title: `Account ${action}`,
    body:
      `${userName} was ${action} through the live admin lifecycle API. ` +
      `The user list was refreshed after the backend confirmed the mutation.`,
  };
}

export const UserAccessTable: React.FC<UserAccessTableProps> = ({ users, onUsersChanged }) => {
  const [activeDialog, setActiveDialog] = useState<{ type: ActionType; user: UserItem } | null>(null);
  const [outcome, setOutcome] = useState<OutcomeData | null>(null);
  const [mutationKey, setMutationKey] = useState<string | null>(null);
  const [dialogError, setDialogError] = useState<string | null>(null);

  const handleActionClick = (type: ActionType, user: UserItem) => {
    setDialogError(null);
    setOutcome(null);
    setActiveDialog({ type, user });
  };

  const handleClose = () => {
    if (mutationKey) return;
    setActiveDialog(null);
    setOutcome(null);
    setDialogError(null);
  };

  const modalTitle = (() => {
    if (!activeDialog) return '';
    if (activeDialog.type === 'edit_role') return 'Edit User Roles & Scopes';
    if (activeDialog.type === 'reset_mfa') return 'Reset User Multi-Factor Authentication (MFA)';
    return 'Change User Account Status';
  })();

  const handleConfirm = async (reason: string) => {
    if (!activeDialog || mutationKey) return;

    const trimmedReason = reason.trim();
    if (trimmedReason.length < MIN_REASON_LENGTH) {
      setDialogError('Reason must be at least 8 characters.');
      return;
    }

    const { type, user } = activeDialog;

    if (type === 'reset_mfa') {
      setOutcome(unsupportedMfaOutcome(user.name, trimmedReason));
      setActiveDialog(null);
      setDialogError(null);
      return;
    }

    if (type === 'edit_role') {
      setOutcome(deferredRoleOutcome(user.name, trimmedReason));
      setActiveDialog(null);
      setDialogError(null);
      return;
    }

    const key = `${type}-${user.id}`;
    setMutationKey(key);
    setDialogError(null);

    try {
      if (user.status === 'Active') {
        await adminService.deactivateUser(user.id, trimmedReason);
      } else {
        await adminService.activateUser(user.id, trimmedReason);
      }
      await onUsersChanged?.();
      setOutcome(lifecycleSuccessOutcome(user.name, user.status));
      setActiveDialog(null);
    } catch (err) {
      setOutcome({
        label: 'mutation_error',
        type,
        userName: user.name,
        tone: 'rose',
        title: 'Account status change failed',
        body: extractApiError(
          err,
          `Could not ${user.status === 'Active' ? 'deactivate' : 'activate'} ${user.name}.`,
        ),
      });
      setActiveDialog(null);
    } finally {
      setMutationKey(null);
    }
  };

  const outcomeToneClass = (tone: OutcomeData['tone']) => {
    if (tone === 'emerald') return 'bg-emerald-50 border-emerald-200 text-emerald-800';
    if (tone === 'rose') return 'bg-rose-50 border-rose-200 text-rose-800';
    return 'bg-amber-50 border-amber-200 text-amber-800';
  };

  const outcomeIcon = (tone: OutcomeData['tone']) => {
    if (tone === 'emerald') return <CheckCircle2 className="h-5 w-5 text-emerald-600" />;
    if (tone === 'rose') return <XCircle className="h-5 w-5 text-rose-600" />;
    return <AlertTriangle className="h-5 w-5 text-amber-600" />;
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
              {users.map((u) => {
                const rowMutationKey = `toggle_status-${u.id}`;
                const isMutating = mutationKey === rowMutationKey;
                const buttonsDisabled = Boolean(mutationKey);
                return (
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
                          disabled={buttonsDisabled}
                          className="p-1.5 bg-slate-50 hover:bg-indigo-50 text-slate-500 hover:text-indigo-600 rounded-lg border border-slate-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Edit Roles & Scopes"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleActionClick('reset_mfa', u)}
                          disabled={buttonsDisabled}
                          className="p-1.5 bg-slate-50 hover:bg-amber-50 text-slate-500 hover:text-amber-600 rounded-lg border border-slate-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Reset/Enforce MFA"
                        >
                          <Key className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleActionClick('toggle_status', u)}
                          disabled={buttonsDisabled}
                          data-testid={`useraccess-status-action-${u.id}`}
                          className={`p-1.5 rounded-lg border transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                            u.status === 'Active'
                              ? 'bg-slate-50 hover:bg-rose-50 text-slate-500 hover:text-rose-600 border-slate-200'
                              : 'bg-slate-50 hover:bg-emerald-50 text-slate-500 hover:text-emerald-600 border-slate-200'
                          }`}
                          title={u.status === 'Active' ? 'Lock Account' : 'Unlock Account'}
                        >
                          {isMutating ? '…' : u.status === 'Active' ? <UserMinus className="h-4 w-4" /> : <Shield className="h-4 w-4" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
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
              {activeDialog.type === 'toggle_status'
                ? 'This status change uses the live admin activate/deactivate endpoint after backend confirmation. A reason of at least 8 characters is required.'
                : activeDialog.type === 'edit_role'
                  ? 'Role assignment/revocation endpoints exist, but this table still lacks a safe target-role selector. No change will be persisted and no role change will be sent from this dialog.'
                  : 'Admin MFA reset is not backed by a confirmed endpoint. No MFA change will be persisted from this dialog.'}
            </p>
          </div>
          {dialogError && (
            <p className="mt-2 font-bold text-rose-700" role="alert">
              {dialogError}
            </p>
          )}
        </div>
      )}

      {activeDialog && (() => {
        const { type, user } = activeDialog;
        return (
          <ReasonModal
            key={`${type}-${user.id}`}
            isOpen
            title={modalTitle}
            guidance={`Specify a valid administrative audit reason of at least 8 characters for performing the "${type}" action on ${user.name}.`}
            onConfirm={(reason) => void handleConfirm(reason)}
            onClose={handleClose}
          />
        );
      })()}

      {outcome && (() => {
        const toneClass = outcomeToneClass(outcome.tone);
        const icon = outcomeIcon(outcome.tone);
        return (
          <div
            data-testid="useraccess-outcome"
            data-outcome={outcome.label}
            className={`fixed bottom-6 right-6 z-[60] max-w-sm p-3 rounded-xl border text-xs leading-relaxed shadow-2xl ${toneClass}`}
          >
            <div className="flex items-start gap-2">
              {icon}
              <div>
                <p className="font-bold mb-1">{outcome.title}</p>
                <p>{outcome.body}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOutcome(null)}
              className="mt-2 text-[10px] font-black uppercase tracking-wider underline"
            >
              Dismiss
            </button>
          </div>
        );
      })()}
    </div>
  );
};
export default UserAccessTable;
