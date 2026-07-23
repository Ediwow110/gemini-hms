import React, { useState, useEffect, useCallback } from 'react';
import { HmsPageHeader } from '../../components/hms-page';
import { HmsDashboardShell, HmsAuditFooter, HmsLoadingSkeleton, HmsEmptyState } from '../../components/hms-dashboard';
import { AdminShellNotice } from './components/AdminShellNotice';
import { UserAccessTable } from './components/UserAccessTable';
import { UserPlus, Search, Filter, Users, AlertCircle, CheckCircle2 } from 'lucide-react';
import {
  adminService,
  type AdminBranchItem,
  type AdminRoleListItem,
  type AdminUserItem,
  type AdminUserListParams,
} from '../../services/admin.service';
import { logger } from '../../lib/logger';

const MIN_REASON_LENGTH = 8;
const PRIVILEGED_PERMISSION = 'admin.role.change';

const isDirectlyAssignableRole = (role: AdminRoleListItem): boolean =>
  role.name !== 'Super Admin' &&
  !role.permissions.some((permission) => permission.name === PRIVILEGED_PERMISSION);

interface UserItem {
  id: string;
  name: string;
  email: string;
  tenant: string;
  branch: string;
  role: string;
  roleIds: string[];
  branchIds: string[];
  mfaEnabled: boolean;
  status: 'Active' | 'Suspended' | 'Locked';
  lastLogin: string;
}

interface CreateUserFormState {
  email: string;
  password: string;
  reason: string;
  mfaEnabled: boolean;
  branchIds: string[];
  roleIds: string[];
}

const emptyCreateForm: CreateUserFormState = {
  email: '',
  password: '',
  reason: '',
  mfaEnabled: false,
  branchIds: [],
  roleIds: [],
};

const extractApiError = (err: unknown, fallback: string): string => {
  const e = err as { response?: { data?: { message?: string } }; message?: string };
  return e?.response?.data?.message || e?.message || fallback;
};

function mapAdminUser(u: AdminUserItem): UserItem {
  const roleNames = u.roles.map((r) => r.name).join(', ') || 'None';
  const branchNames = u.branches.map((b) => b.name).join(', ') || 'None';
  let displayStatus: UserItem['status'] = 'Active';
  if (u.status === 'INACTIVE' || u.deactivatedAt) {
    displayStatus = 'Suspended';
  } else if (u.lockedUntil && new Date(u.lockedUntil) > new Date()) {
    displayStatus = 'Locked';
  }
  return {
    id: u.id,
    name: u.email,
    email: u.email,
    tenant: u.tenantId,
    branch: branchNames,
    role: roleNames,
    roleIds: u.roles.map((r) => r.id),
    branchIds: u.branches.map((b) => b.id),
    mfaEnabled: u.mfaEnabled,
    status: displayStatus,
    lastLogin: '—',
  };
}

export const UsersPage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'Active' | 'Suspended' | 'Locked'>('ALL');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [users, setUsers] = useState<UserItem[]>([]);
  const [roles, setRoles] = useState<AdminRoleListItem[]>([]);
  const [branches, setBranches] = useState<AdminBranchItem[]>([]);
  const [createForm, setCreateForm] = useState<CreateUserFormState>(emptyCreateForm);
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createSuccess, setCreateSuccess] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: AdminUserListParams = {};
      if (statusFilter !== 'ALL') {
        if (statusFilter === 'Active') params.status = 'ACTIVE';
        else if (statusFilter === 'Suspended') params.status = 'INACTIVE';
      }
      if (search) params.search = search;
      const response = await adminService.listUsers(
        Object.keys(params).length > 0 ? params : undefined,
      );
      setUsers(response.data.map(mapAdminUser));
    } catch (err) {
      logger.error('Failed to fetch users:', err);
      setError('Could not load user directory from server.');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  const fetchCreateOptions = useCallback(async () => {
    try {
      const [roleRows, branchRows] = await Promise.all([
        adminService.listRoles(),
        adminService.listBranches({ limit: 100 }),
      ]);
      setRoles(
        roleRows.filter(
          (role) => role.status !== 'ARCHIVED' && isDirectlyAssignableRole(role),
        ),
      );
      setBranches(branchRows.data.filter((branch) => Boolean(branch.id)));
    } catch (err) {
      logger.error('Failed to load admin create-user options:', err);
      setCreateError('Could not load branch and role options for account creation.');
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    fetchCreateOptions();
  }, [fetchCreateOptions]);

  const openCreateModal = () => {
    setCreateForm(emptyCreateForm);
    setCreateError(null);
    setShowCreateModal(true);
  };

  const closeCreateModal = () => {
    if (createSubmitting) return;
    setShowCreateModal(false);
    setCreateError(null);
  };

  const updateCreateField = <K extends keyof CreateUserFormState>(
    key: K,
    value: CreateUserFormState[K],
  ) => {
    setCreateForm((prev) => ({ ...prev, [key]: value }));
  };

  const updateMultiSelect = (key: 'branchIds' | 'roleIds', values: string[]) => {
    setCreateForm((prev) => ({ ...prev, [key]: values }));
  };

  const submitCreateUser = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (createSubmitting) return;

    const email = createForm.email.trim().toLowerCase();
    const password = createForm.password;
    const reason = createForm.reason.trim();

    if (!email) {
      setCreateError('Email is required.');
      return;
    }
    if (!password.trim()) {
      setCreateError('Temporary password is required.');
      return;
    }
    if (createForm.branchIds.length === 0) {
      setCreateError('Select at least one branch.');
      return;
    }
    if (reason.length < MIN_REASON_LENGTH) {
      setCreateError('Reason must be at least 8 characters.');
      return;
    }

    setCreateSubmitting(true);
    setCreateError(null);
    setCreateSuccess(null);
    try {
      const result = await adminService.createUser({
        email,
        password,
        mfaEnabled: createForm.mfaEnabled,
        branchIds: createForm.branchIds,
        roleIds: createForm.roleIds.length > 0 ? createForm.roleIds : undefined,
        reason,
      });
      setCreateSuccess(`Created ${result.email} through the live admin API.`);
      setShowCreateModal(false);
      setCreateForm(emptyCreateForm);
      await fetchUsers();
    } catch (err) {
      setCreateError(extractApiError(err, 'Could not create user account.'));
    } finally {
      setCreateSubmitting(false);
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch = u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.role.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || u.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <HmsDashboardShell>
        <HmsLoadingSkeleton variant="table" rows={5} />
      </HmsDashboardShell>
    );
  }

  if (error) {
    return (
      <HmsDashboardShell widthTier="full">
        <AdminShellNotice />
        <HmsPageHeader
          title="User Directory & Scopes"
          description="Centralised audit and directory of active personnel, MFA security alignments, and locks."
        />
        <div className="flex flex-col items-center gap-3 p-12 text-center">
          <AlertCircle className="h-10 w-10 text-rose-500" />
          <p className="text-sm font-bold text-slate-700">{error}</p>
          <button
            onClick={fetchUsers}
            className="btn btn-primary font-bold text-xs py-2 px-4"
          >
            Retry
          </button>
        </div>
      </HmsDashboardShell>
    );
  }

  return (
    <HmsDashboardShell widthTier="full"
      footer={<HmsAuditFooter dataSource="Live API — /api/v1/admin/users" />}
    >
      <AdminShellNotice />
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <HmsPageHeader
          title="User Directory & Scopes"
          description="Centralised audit and directory of active personnel, MFA security alignments, and locks."
        />
        <button
          onClick={openCreateModal}
          className="btn btn-primary font-bold text-xs py-2 px-4 flex items-center gap-1.5 w-fit"
        >
          <UserPlus className="h-4 w-4" /> Register New Account
        </button>
      </div>

      {createSuccess && (
        <div
          role="status"
          className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-semibold text-emerald-800 flex items-start gap-2"
        >
          <CheckCircle2 className="h-4 w-4 mt-0.5" />
          <span>{createSuccess}</span>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search operator name, email, role..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>
        <div className="relative">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'ALL' | 'Active' | 'Suspended' | 'Locked')}
            className="appearance-none btn border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 pl-9 pr-8 py-2.5 text-xs font-bold rounded-xl cursor-pointer focus:outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Suspended">Suspended</option>
            <option value="Locked">Locked</option>
          </select>
          <Filter className="absolute left-3 top-3.5 h-4 w-4 text-slate-400 pointer-events-none" />
        </div>
      </div>

      {filteredUsers.length === 0 && !loading ? (
        <HmsEmptyState
          title="No matching users"
          description="Try adjusting your search query."
          icon={<Users className="h-6 w-6" />}
        />
      ) : (
        <UserAccessTable users={filteredUsers} onUsersChanged={fetchUsers} availableRoles={roles} />
      )}

      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <form
            onSubmit={submitCreateUser}
            className="bg-white rounded-3xl p-6 shadow-2xl max-w-lg w-full border border-slate-200 animate-scale-in relative"
          >
            <div className="flex gap-3 mb-4">
              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl h-fit border border-indigo-100">
                <UserPlus className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider select-none">
                  Register User Account
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Submits to live POST /api/v1/admin/users</p>
              </div>
            </div>

            <div className="space-y-3 text-xs text-slate-600 leading-relaxed border-t border-b border-slate-100 py-4">
              <label className="block font-bold text-slate-700">
                Email
                <input
                  type="email"
                  value={createForm.email}
                  onChange={(e) => updateCreateField('email', e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  placeholder="operator@hospital.test"
                />
              </label>

              <label className="block font-bold text-slate-700">
                Temporary password
                <input
                  type="password"
                  value={createForm.password}
                  onChange={(e) => updateCreateField('password', e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  placeholder="Set a temporary password"
                />
              </label>

              <label className="block font-bold text-slate-700">
                Branches
                <select
                  multiple
                  value={createForm.branchIds}
                  onChange={(e) => updateMultiSelect(
                    'branchIds',
                    Array.from(e.currentTarget.selectedOptions, (option) => option.value),
                  )}
                  className="mt-1 h-24 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  aria-label="Branches"
                >
                  {branches.map((branch) => (
                    <option key={branch.id} value={branch.id}>{branch.name}</option>
                  ))}
                </select>
              </label>

              <label className="block font-bold text-slate-700">
                Operational roles (optional)
                <select
                  multiple
                  value={createForm.roleIds}
                  onChange={(e) => updateMultiSelect(
                    'roleIds',
                    Array.from(e.currentTarget.selectedOptions, (option) => option.value),
                  )}
                  className="mt-1 h-24 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  aria-label="Roles"
                >
                  {roles.map((role) => (
                    <option key={role.id} value={role.id}>{role.name}</option>
                  ))}
                </select>
                <span className="mt-1 block text-[10px] font-medium text-slate-400">
                  Privileged roles are intentionally excluded and require the approval workflow.
                </span>
              </label>

              <label className="inline-flex items-center gap-2 font-bold text-slate-700">
                <input
                  type="checkbox"
                  checked={createForm.mfaEnabled}
                  onChange={(e) => updateCreateField('mfaEnabled', e.target.checked)}
                />
                Require MFA on first access
              </label>

              <label className="block font-bold text-slate-700">
                Administrative reason
                <textarea
                  value={createForm.reason}
                  onChange={(e) => updateCreateField('reason', e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  rows={3}
                  placeholder="Minimum 8 characters"
                />
              </label>

              {createError && (
                <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-2.5 font-bold text-rose-700">
                  {createError}
                </p>
              )}
            </div>

            <div className="mt-5 flex gap-2">
              <button
                type="button"
                onClick={closeCreateModal}
                disabled={createSubmitting}
                className="w-full btn btn-secondary font-bold py-2"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={createSubmitting}
                className="w-full btn btn-primary font-bold py-2"
              >
                {createSubmitting ? 'Creating…' : 'Create Account'}
              </button>
            </div>
          </form>
        </div>
      )}
    </HmsDashboardShell>
  );
};
export default UsersPage;
