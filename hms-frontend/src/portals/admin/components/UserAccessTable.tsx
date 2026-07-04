import React, { useState } from 'react';
import { Shield, Key, Edit3, UserMinus, LogOut, RefreshCw, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';
import { RoleBadge, UserStatusBadge } from '../../../components/ui/user-badges';
import { ReasonModal } from '../../../components/ui/approval-modals';
import { adminService, type AdminRoleListItem } from '../../../services/admin.service';

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
  availableRoles?: AdminRoleListItem[];
}

type ActionType = 'edit_role' | 'reset_mfa' | 'toggle_status' | 'force_logout' | 'reset_password';
type ActionOutcome = 'wired_success' | 'backend_unsupported' | 'mutation_error' | 'role_changed' | 'password_reset';

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

function forceLogoutSuccessOutcome(userName: string): OutcomeData {
  return {
    label: 'wired_success',
    type: 'force_logout',
    userName,
    tone: 'emerald',
    title: 'Force logout executed',
    body:
      `${userName} was force-logged out through the live admin API. ` +
      `Their token version was incremented, invalidating all active sessions.`,
  };
}

function passwordResetSuccessOutcome(userName: string, tempPassword: string): OutcomeData {
  return {
    label: 'password_reset',
    type: 'reset_password',
    userName,
    tone: 'emerald',
    title: 'Password reset successful',
    body:
      `${userName}'s password was reset through the live admin API. ` +
      `Temporary password: ${tempPassword}\n\n` +
      `Share this securely with the user. They will be prompted to change it on next login.`,
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

export const UserAccessTable: React.FC<UserAccessTableProps> = ({ users, onUsersChanged, availableRoles }) => {
  const [activeDialog, setActiveDialog] = useState<{ type: ActionType; user: UserItem } | null>(null);
  const [outcome, setOutcome] = useState<OutcomeData | null>(null);
  const [mutationKey, setMutationKey] = useState<string | null>(null);
  const [dialogError, setDialogError] = useState<string | null>(null);
  const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>([]);

  const handleActionClick = (type: ActionType, user: UserItem) => {
    setDialogError(null);
    setOutcome(null);
    if (type === 'edit_role') {
      setSelectedRoleIds(user.roleIds ?? []);
    }
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
    switch (activeDialog.type) {
      case 'edit_role': return 'Edit User Roles & Scopes';
      case 'reset_mfa': return 'Reset User Multi-Factor Authentication (MFA)';
      case 'force_logout': return 'Force User Logout';
      case 'reset_password': return 'Reset User Password';
      default: return 'Change User Account Status';
    }
  })();

  const toggleRoleSelection = (roleId: string) => {
    setSelectedRoleIds((prev) =>
      prev.includes(roleId)
        ? prev.filter((id) => id !== roleId)
        : [...prev, roleId]
    );
  };

  const handleConfirm = async (reason: string) => {
    if (!activeDialog || mutationKey) return;

    const trimmedReason = reason.trim();
    if (trimmedReason.length < MIN_REASON_LENGTH) {
      setDialogError('Reason must be at least 8 characters.');
      return;
    }

    const { type, user } = activeDialog;

    if (type === 'reset_mfa') {
      const key = `reset_mfa-${user.id}`;
      setMutationKey(key);
      setDialogError(null);
      try {
        await adminService.resetUserMfa(user.id, trimmedReason);
        await onUsersChanged?.();
        setOutcome({
          label: 'wired_success',
          type: 'reset_mfa',
          userName: user.name,
          tone: 'emerald',
          title: 'MFA reset successful',
          body:
            `Multi-factor authentication was reset for ${user.name} through the live admin API. ` +
            `MFA is now disabled. The user will need to re-enroll on next login.`,
        });
        setActiveDialog(null);
      } catch (err) {
        setOutcome({
          label: 'mutation_error',
          type: 'reset_mfa',
          userName: user.name,
          tone: 'rose',
          title: 'MFA reset failed',
          body: extractApiError(err, `Could not reset MFA for ${user.name}.`),
        });
        setActiveDialog(null);
      } finally {
        setMutationKey(null);
      }
      return;
    }

    if (type === 'edit_role') {
      if (!availableRoles || availableRoles.length === 0) {
        setDialogError('No roles available. Cannot edit role assignments.');
        return;
      }

      const currentRoleIds = user.roleIds ?? [];
      const rolesToAdd = selectedRoleIds.filter((id) => !currentRoleIds.includes(id));
      const rolesToRemove = currentRoleIds.filter((id) => !selectedRoleIds.includes(id));

      if (rolesToAdd.length === 0 && rolesToRemove.length === 0) {
        setOutcome({
          label: 'wired_success',
          type: 'edit_role',
          userName: user.name,
          tone: 'emerald',
          title: 'No changes needed',
          body: `No role changes were requested for ${user.name}.`,
        });
        setActiveDialog(null);
        return;
      }

      const key = `edit_role-${user.id}`;
      setMutationKey(key);
      setDialogError(null);

      try {
        for (const roleId of rolesToAdd) {
          await adminService.assignUserRole(user.id, roleId, trimmedReason);
        }
        for (const roleId of rolesToRemove) {
          await adminService.revokeUserRole(user.id, roleId, trimmedReason);
        }
        await onUsersChanged?.();
        const addedNames = rolesToAdd.map((id) => availableRoles.find((r) => r.id === id)?.name || id);
        const removedNames = rolesToRemove.map((id) => availableRoles.find((r) => r.id === id)?.name || id);
        const changes: string[] = [];
        if (addedNames.length > 0) changes.push(`Added: ${addedNames.join(', ')}`);
        if (removedNames.length > 0) changes.push(`Removed: ${removedNames.join(', ')}`);
        setOutcome({
          label: 'role_changed',
          type: 'edit_role',
          userName: user.name,
          tone: 'emerald',
          title: 'Roles updated',
          body: `Role changes applied for ${user.name}. ${changes.join('. ')}`,
        });
        setActiveDialog(null);
      } catch (err) {
        const errorBody = extractApiError(err, 'Could not update roles.');
        setOutcome({
          label: 'mutation_error',
          type: 'edit_role',
          userName: user.name,
          tone: 'rose',
          title: 'Role update failed',
          body: errorBody,
        });
        setActiveDialog(null);
      } finally {
        setMutationKey(null);
      }
      return;
    }

    if (type === 'force_logout') {
      const key = `force_logout-${user.id}`;
      setMutationKey(key);
      setDialogError(null);
      try {
        await adminService.forceLogout(user.id, trimmedReason);
        await onUsersChanged?.();
        setOutcome(forceLogoutSuccessOutcome(user.name));
        setActiveDialog(null);
      } catch (err) {
        setOutcome({
          label: 'mutation_error',
          type: 'force_logout',
          userName: user.name,
          tone: 'rose',
          title: 'Force logout failed',
          body: extractApiError(err, `Could not force logout ${user.name}.`),
        });
        setActiveDialog(null);
      } finally {
        setMutationKey(null);
      }
      return;
    }

    if (type === 'reset_password') {
      const key = `reset_password-${user.id}`;
      setMutationKey(key);
      setDialogError(null);
      try {
        const result = await adminService.resetPassword(user.id, trimmedReason);
        await onUsersChanged?.();
        setOutcome(passwordResetSuccessOutcome(user.name, result.tempPassword));
        setActiveDialog(null);
      } catch (err) {
        setOutcome({
          label: 'mutation_error',
          type: 'reset_password',
          userName: user.name,
          tone: 'rose',
          title: 'Password reset failed',
          body: extractApiError(err, `Could not reset password for ${user.name}.`),
        });
        setActiveDialog(null);
      } finally {
        setMutationKey(null);
      }
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
                <th className="px-6 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">ID</th>
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
                      <span className="text-xs font-mono text-slate-500" title={u.id}>
                        {u.id.length > 8 ? `${u.id.slice(0, 8)}\u2026` : u.id}
                      </span>
                    </td>
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
                          onClick={() => handleActionClick('reset_password', u)}
                          disabled={buttonsDisabled}
                          className="p-1.5 bg-slate-50 hover:bg-purple-50 text-slate-500 hover:text-purple-600 rounded-lg border border-slate-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Reset Password"
                        >
                          <RefreshCw className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleActionClick('force_logout', u)}
                          disabled={buttonsDisabled}
                          className="p-1.5 bg-slate-50 hover:bg-orange-50 text-slate-500 hover:text-orange-600 rounded-lg border border-slate-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Force Logout"
                        >
                          <LogOut className="h-4 w-4" />
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
                  ? 'Role assignment and revocation endpoints exist. Select roles to add or remove for this user. Changes are applied immediately via the live API.'
                  : activeDialog.type === 'force_logout'
                    ? 'This will increment the token version, invalidating all active sessions for this user. Uses the live admin force-logout endpoint.'
                    : activeDialog.type === 'reset_password'
                      ? 'This will generate a new temporary password and invalidate all sessions. Uses the live admin reset-password endpoint.'
                      : 'This will disable MFA, clear the MFA secret and recovery codes, and increment the token version. Uses the live admin reset-mfa endpoint.'}
            </p>
          </div>
          {dialogError && (
            <p className="mt-2 font-bold text-rose-700" role="alert">
              {dialogError}
            </p>
          )}
        </div>
      )}

      {activeDialog && activeDialog.type === 'edit_role' && (() => {
        const user = activeDialog.user;
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <div className="bg-white rounded-3xl p-6 shadow-2xl max-w-md w-full border border-slate-200 animate-scale-in">
              <div className="flex gap-3 mb-4">
                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl h-fit border border-indigo-100">
                  <Edit3 className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider select-none">
                    Edit User Roles
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">Submits to live POST /admin/users/:id/roles</p>
                </div>
              </div>

              <div className="space-y-3 text-xs text-slate-600 leading-relaxed border-t border-b border-slate-100 py-4">
                <p className="font-bold text-slate-700">{user.name} &lt;{user.email}&gt;</p>

                {availableRoles && availableRoles.length > 0 ? (
                  <div>
                    <p className="font-bold text-slate-700 mb-2">Select roles for this user:</p>
                    <div className="space-y-1 max-h-48 overflow-y-auto">
                      {availableRoles.map((role) => {
                        const isSelected = selectedRoleIds.includes(role.id);
                        return (
                          <label
                            key={role.id}
                            className={`flex items-center gap-3 p-2.5 rounded-xl border cursor-pointer transition-colors ${
                              isSelected
                                ? 'bg-indigo-50 border-indigo-200 text-indigo-900'
                                : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleRoleSelection(role.id)}
                              className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                            />
                            <div className="flex-1">
                              <p className="font-bold text-xs">{role.name}</p>
                              <p className="text-[10px] text-slate-400">
                                {role.permissions.length} permissions &middot; {role.isSystem ? 'System' : 'Custom'}
                              </p>
                            </div>
                            <span className={`text-[8px] font-black px-1.5 py-0.5 rounded border uppercase tracking-wider ${
                              role.isSystem
                                ? 'bg-rose-50 text-rose-700 border-rose-100'
                                : 'bg-slate-150 text-slate-500 border-slate-200'
                            }`}>
                              {role.isSystem ? 'SYSTEM' : role.status === 'ACTIVE' ? 'ACTIVE' : 'INACTIVE'}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <p className="bg-amber-50 p-2.5 rounded-xl border border-amber-200 text-amber-700 font-medium">
                    No roles available from the server.
                  </p>
                )}

                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                  <p className="font-bold text-slate-600 text-[10px] uppercase tracking-wider mb-1">Summary</p>
                  <p className="text-slate-500">
                    {selectedRoleIds.length} role(s) selected.
                    {(user.roleIds?.length ?? 0) > 0 && (
                      <> Currently assigned: {user.roleIds?.length} role(s).</>
                    )}
                  </p>
                </div>

                <label className="block font-bold text-slate-700">
                  Administrative reason
                  <textarea
                    id={`role-reason-${user.id}`}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    rows={3}
                    placeholder="Minimum 8 characters"
                  />
                </label>

                {dialogError && (
                  <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-2.5 font-bold text-rose-700">
                    {dialogError}
                  </p>
                )}
              </div>

              <div className="mt-5 flex gap-2">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={Boolean(mutationKey)}
                  className="w-full btn btn-secondary font-bold py-2"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={Boolean(mutationKey)}
                  onClick={() => {
                    const textarea = document.getElementById(`role-reason-${user.id}`) as HTMLTextAreaElement;
                    const reason = textarea?.value || '';
                    void handleConfirm(reason);
                  }}
                  className="w-full btn btn-primary font-bold py-2"
                >
                  {mutationKey ? 'Saving…' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {activeDialog && activeDialog.type !== 'edit_role' && (() => {
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
