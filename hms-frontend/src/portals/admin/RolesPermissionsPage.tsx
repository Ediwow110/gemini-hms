import React, { useState, useEffect, useCallback } from 'react';
import { HmsPageHeader } from '../../components/hms-page';
import { HmsDashboardShell, HmsAuditFooter, HmsLoadingSkeleton, HmsEmptyState } from '../../components/hms-dashboard';
import { AdminShellNotice } from './components/AdminShellNotice';
import { PermissionMatrix } from './components/PermissionMatrix';
import { Shield, AlertCircle, Users, Plus, Edit2, Archive, Check, X, Key } from 'lucide-react';
import { adminService, type AdminRoleListItem, type AdminPermissionListItem } from '../../services/admin.service';

const MIN_REASON_LENGTH = 8;

type ModalType = 'create_role' | 'edit_role' | 'archive_role' | 'grant_permission' | 'revoke_permission' | null;

const extractApiError = (err: unknown, fallback: string): string => {
  const e = err as { response?: { data?: { message?: string } }; message?: string };
  return e?.response?.data?.message || e?.message || fallback;
};

export const RolesPermissionsPage: React.FC = () => {
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [selectedRoleId, setSelectedRoleId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [roles, setRoles] = useState<AdminRoleListItem[]>([]);
  const [permissions, setPermissions] = useState<AdminPermissionListItem[]>([]);
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [modalError, setModalError] = useState<string | null>(null);
  const [mutationKey, setMutationKey] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Create role form
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleReason, setNewRoleReason] = useState('');
  const [newRolePermissionIds, setNewRolePermissionIds] = useState<string[]>([]);

  // Edit role form
  const [editRoleName, setEditRoleName] = useState('');

  // Grant permission form
  const [grantPermissionId, setGrantPermissionId] = useState('');
  const [grantReason, setGrantReason] = useState('');

  // Revoke permission form
  const [revokePermissionId, setRevokePermissionId] = useState('');
  const [revokeReason, setRevokeReason] = useState('');

  const fetchRoles = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminService.listRoles();
      setRoles(data);
    } catch (err) {
      console.error('Failed to fetch roles:', err);
      setError('Could not load role directory from server.');
      setRoles([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchPermissions = useCallback(async () => {
    try {
      const data = await adminService.listPermissions();
      setPermissions(data);
    } catch {
      setError('Unable to load permissions');
      setPermissions([]);
    }
  }, []);

  useEffect(() => {
    fetchRoles();
    fetchPermissions();
  }, [fetchRoles, fetchPermissions]);

  useEffect(() => {
    if (roles.length > 0 && !selectedRole) {
      setSelectedRole(roles[0].name);
      setSelectedRoleId(roles[0].id);
    }
  }, [roles, selectedRole]);

  const selectRole = (role: AdminRoleListItem) => {
    setSelectedRole(role.name);
    setSelectedRoleId(role.id);
  };

  const openCreateModal = () => {
    setNewRoleName('');
    setNewRoleReason('');
    setNewRolePermissionIds([]);
    setModalError(null);
    setActiveModal('create_role');
  };

  const openEditModal = () => {
    const role = roles.find((r) => r.id === selectedRoleId);
    if (!role || role.isSystem) return;
    setEditRoleName(role.name);
    setModalError(null);
    setActiveModal('edit_role');
  };

  const openArchiveModal = () => {
    setModalError(null);
    setActiveModal('archive_role');
  };

  const openGrantModal = () => {
    setGrantPermissionId('');
    setGrantReason('');
    setModalError(null);
    setActiveModal('grant_permission');
  };

  const openRevokeModal = (permId: string) => {
    setRevokePermissionId(permId);
    setRevokeReason('');
    setModalError(null);
    setActiveModal('revoke_permission');
  };

  const closeModal = () => {
    if (mutationKey) return;
    setActiveModal(null);
    setModalError(null);
  };

  const handleCreateRole = async () => {
    const name = newRoleName.trim();
    const reason = newRoleReason.trim();
    if (!name) { setModalError('Role name is required.'); return; }
    if (reason.length < MIN_REASON_LENGTH) { setModalError('Reason must be at least 8 characters.'); return; }

    const key = 'create_role';
    setMutationKey(key);
    setModalError(null);
    try {
      await adminService.createRole({ name, reason, permissionIds: newRolePermissionIds.length > 0 ? newRolePermissionIds : undefined });
      setSuccessMessage(`Role "${name}" created successfully.`);
      setActiveModal(null);
      await fetchRoles();
    } catch (err) {
      setModalError(extractApiError(err, 'Could not create role.'));
    } finally {
      setMutationKey(null);
    }
  };

  const handleEditRole = async () => {
    const name = editRoleName.trim();
    const reason = `Rename role to "${name}"`;
    if (!name) { setModalError('Role name is required.'); return; }

    const key = 'edit_role';
    setMutationKey(key);
    setModalError(null);
    try {
      await adminService.updateRole(selectedRoleId, { name, reason });
      setSuccessMessage(`Role renamed to "${name}".`);
      setActiveModal(null);
      await fetchRoles();
    } catch (err) {
      setModalError(extractApiError(err, 'Could not update role.'));
    } finally {
      setMutationKey(null);
    }
  };

  const handleArchiveRole = async () => {
    const reason = 'Archive role - administrative action';

    const key = 'archive_role';
    setMutationKey(key);
    setModalError(null);
    try {
      await adminService.archiveRole(selectedRoleId, reason);
      setSuccessMessage('Role archived successfully.');
      setActiveModal(null);
      setSelectedRole('');
      setSelectedRoleId('');
      await fetchRoles();
    } catch (err) {
      setModalError(extractApiError(err, 'Could not archive role.'));
    } finally {
      setMutationKey(null);
    }
  };

  const handleGrantPermission = async () => {
    if (!grantPermissionId) { setModalError('Select a permission to grant.'); return; }
    const reason = grantReason.trim();
    if (reason.length < MIN_REASON_LENGTH) { setModalError('Reason must be at least 8 characters.'); return; }

    const key = 'grant_permission';
    setMutationKey(key);
    setModalError(null);
    try {
      await adminService.grantRolePermission(selectedRoleId, grantPermissionId, reason);
      const permName = permissions.find((p) => p.id === grantPermissionId)?.name || grantPermissionId;
      setSuccessMessage(`Permission "${permName}" granted to role.`);
      setActiveModal(null);
      await fetchRoles();
    } catch (err) {
      setModalError(extractApiError(err, 'Could not grant permission.'));
    } finally {
      setMutationKey(null);
    }
  };

  const handleRevokePermission = async () => {
    if (!revokePermissionId) { setModalError('No permission selected.'); return; }
    const reason = revokeReason.trim();
    if (reason.length < MIN_REASON_LENGTH) { setModalError('Reason must be at least 8 characters.'); return; }

    const key = 'revoke_permission';
    setMutationKey(key);
    setModalError(null);
    try {
      await adminService.revokeRolePermission(selectedRoleId, revokePermissionId, reason);
      const permName = permissions.find((p) => p.id === revokePermissionId)?.name || revokePermissionId;
      setSuccessMessage(`Permission "${permName}" revoked from role.`);
      setActiveModal(null);
      await fetchRoles();
    } catch (err) {
      setModalError(extractApiError(err, 'Could not revoke permission.'));
    } finally {
      setMutationKey(null);
    }
  };

  const selectedRoleObj = roles.find((r) => r.id === selectedRoleId);
  const eligiblePermissions = permissions.filter(
    (p) => !selectedRoleObj?.permissions.some((rp) => rp.id === p.id)
  );

  if (loading) {
    return (
      <HmsDashboardShell>
        <HmsLoadingSkeleton variant="table" rows={6} />
      </HmsDashboardShell>
    );
  }

  if (error) {
    return (
      <HmsDashboardShell widthTier="full">
        <AdminShellNotice />
        <HmsPageHeader
          title="RBAC Governance & Permissions"
          description="Edit application authorization roles, map permissions, and verify role bounds."
        />
        <div className="flex flex-col items-center gap-3 p-12 text-center">
          <AlertCircle className="h-10 w-10 text-rose-500" />
          <p className="text-sm font-bold text-slate-700">{error}</p>
          <button
            onClick={fetchRoles}
            className="btn btn-primary bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-2 px-4 rounded-xl"
          >
            Retry
          </button>
        </div>
      </HmsDashboardShell>
    );
  }

  if (roles.length === 0) {
    return (
      <HmsDashboardShell widthTier="full">
        <AdminShellNotice />
        <HmsPageHeader
          title="RBAC Governance & Permissions"
          description="Edit application authorization roles, map permissions, and verify role bounds."
        />
        <HmsEmptyState
          title="No roles configured"
          description="This tenant has no roles defined yet. Create one to get started."
          icon={<Shield className="h-6 w-6" />}
        />
        <div className="flex justify-center mt-4">
          <button onClick={openCreateModal} className="btn btn-primary bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-2 px-4 rounded-xl flex items-center gap-1.5">
            <Plus className="h-4 w-4" /> Create Role
          </button>
        </div>
      </HmsDashboardShell>
    );
  }

  return (
    <HmsDashboardShell widthTier="full"
      footer={<HmsAuditFooter dataSource="Live API — /api/v1/admin/roles" />}
    >
      <AdminShellNotice />
      <HmsPageHeader
        title="RBAC Governance & Permissions"
        description="Edit application authorization roles, map permissions, and verify role bounds."
      />

      {successMessage && (
        <div
          role="status"
          className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-semibold text-emerald-800 flex items-start gap-2 mb-4"
        >
          <Check className="h-4 w-4 mt-0.5" />
          <span>{successMessage}</span>
          <button onClick={() => setSuccessMessage(null)} className="ml-auto text-emerald-600 hover:text-emerald-800">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-6">
          <div className="card p-5 bg-white border border-slate-200/80 shadow-sm rounded-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-800 text-sm tracking-wider uppercase flex items-center gap-2">
                <Users className="h-4.5 w-4.5 text-indigo-500" />
                HMS Application Roles
              </h3>
              <button
                onClick={openCreateModal}
                className="p-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-lg border border-indigo-200 transition-colors"
                title="Create new role"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-2">
              {roles.map((role) => {
                const isActive = selectedRole === role.name;
                return (
                  <div
                    key={role.id}
                    className={`relative group w-full p-3.5 border text-left transition-all duration-200 rounded-xl flex items-center justify-between text-xs cursor-pointer ${
                      isActive
                        ? 'bg-gradient-to-r from-indigo-50 to-violet-50/50 border-indigo-200 shadow-sm text-indigo-900 font-bold'
                        : 'bg-slate-50 hover:bg-slate-100/50 border-slate-200/60 hover:border-slate-250 text-slate-700 font-medium'
                    }`}
                    onClick={() => selectRole(role)}
                  >
                    <div className="flex-1 min-w-0">
                      <p className={`font-bold truncate ${isActive ? 'text-indigo-900' : 'text-slate-800 group-hover:text-slate-900'}`}>{role.name}</p>
                      <p className="text-[9px] text-slate-400 font-semibold mt-0.5 uppercase tracking-wide">
                        {role.status === 'INACTIVE'
                          ? 'Inactive'
                          : role.isSystem
                          ? 'System Role'
                          : 'Custom Role'}
                      </p>
                    </div>
                    <div className="flex gap-1.5 items-center ml-2">
                      {!role.isSystem && isActive && (
                        <>
                          <button
                            onClick={(e) => { e.stopPropagation(); openEditModal(); }}
                            className="p-1 bg-white hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 rounded-md border border-slate-200 transition-colors"
                            title="Rename role"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); openArchiveModal(); }}
                            className="p-1 bg-white hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-md border border-slate-200 transition-colors"
                            title="Archive role"
                          >
                            <Archive className="h-3.5 w-3.5" />
                          </button>
                        </>
                      )}
                      <span className={`text-[8px] font-black px-1.5 py-0.5 rounded border uppercase tracking-wider ${
                        role.isSystem
                          ? 'bg-rose-50 text-rose-700 border-rose-100'
                          : 'bg-slate-150 text-slate-500 border-slate-200'
                      }`}>
                        {role.isSystem ? 'SYSTEM' : role.status === 'ACTIVE' ? 'ACTIVE' : 'INACTIVE'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="card p-5 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs space-y-3 leading-relaxed">
            <h4 className="font-bold text-slate-700 flex items-center gap-1.5">
              <Shield className="h-4.5 w-4.5 text-slate-500" />
              Permissions for {selectedRole}
            </h4>
            {selectedRoleObj && selectedRoleObj.permissions.length > 0 ? (
              <div className="space-y-1">
                {selectedRoleObj.permissions.map((p) => (
                  <div key={p.id} className="flex items-center justify-between bg-white p-2 rounded-lg border border-slate-200">
                    <div>
                      <span className="font-semibold text-slate-700 text-[11px]">{p.name}</span>
                      <span className={`ml-2 text-[8px] font-bold px-1 py-0.5 rounded ${
                        p.riskLevel === 'LOW' ? 'bg-emerald-50 text-emerald-700' :
                        p.riskLevel === 'MEDIUM' ? 'bg-amber-50 text-amber-700' :
                        'bg-rose-50 text-rose-700'
                      }`}>{p.riskLevel}</span>
                    </div>
                    <button
                      onClick={() => openRevokeModal(p.id)}
                      className="p-1 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-md transition-colors"
                      title="Revoke this permission"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-400 italic">No permissions assigned to this role.</p>
            )}
            <button
              onClick={openGrantModal}
              className="w-full mt-2 p-2 bg-white hover:bg-indigo-50 text-indigo-600 font-bold rounded-xl border border-indigo-200 transition-colors text-xs flex items-center justify-center gap-1.5"
            >
              <Plus className="h-3.5 w-3.5" /> Grant Permission
            </button>
          </div>
        </div>

        <div className="lg:col-span-2">
          <PermissionMatrix selectedRole={selectedRole} />
        </div>
      </div>

      {/* Create Role Modal */}
      {activeModal === 'create_role' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 shadow-2xl max-w-md w-full border border-slate-200 animate-scale-in">
            <div className="flex gap-3 mb-4">
              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl h-fit border border-indigo-100">
                <Shield className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Create Role</h3>
                <p className="text-xs text-slate-400 mt-0.5">Submits to POST /api/v1/admin/roles</p>
              </div>
            </div>
            <div className="space-y-3 text-xs border-t border-b border-slate-100 py-4">
              <label className="block font-bold text-slate-700">
                Role Name
                <input
                  type="text"
                  value={newRoleName}
                  onChange={(e) => setNewRoleName(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  placeholder="e.g. Lab Manager"
                />
              </label>
              <label className="block font-bold text-slate-700">
                Permissions (optional)
                <div className="mt-1 max-h-32 overflow-y-auto space-y-1 border border-slate-200 rounded-xl p-2">
                  {permissions.length === 0 ? (
                    <p className="text-slate-400 italic p-2">No permissions available</p>
                  ) : (
                    permissions.map((p) => (
                      <label key={p.id} className="flex items-center gap-2 p-1.5 hover:bg-slate-50 rounded-lg cursor-pointer">
                        <input
                          type="checkbox"
                          checked={newRolePermissionIds.includes(p.id)}
                          onChange={() => {
                            setNewRolePermissionIds((prev) =>
                              prev.includes(p.id) ? prev.filter((id) => id !== p.id) : [...prev, p.id]
                            );
                          }}
                          className="h-3.5 w-3.5 rounded border-slate-300 text-indigo-600"
                        />
                        <span className="font-semibold text-slate-600">{p.name}</span>
                        <span className={`ml-auto text-[8px] font-bold px-1 py-0.5 rounded ${
                          p.riskLevel === 'LOW' ? 'bg-emerald-50 text-emerald-700' :
                          p.riskLevel === 'MEDIUM' ? 'bg-amber-50 text-amber-700' :
                          'bg-rose-50 text-rose-700'
                        }`}>{p.riskLevel}</span>
                      </label>
                    ))
                  )}
                </div>
              </label>
              <label className="block font-bold text-slate-700">
                Administrative reason
                <textarea
                  value={newRoleReason}
                  onChange={(e) => setNewRoleReason(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  rows={3}
                  placeholder="Minimum 8 characters"
                />
              </label>
              {modalError && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-2.5 font-bold text-rose-700">{modalError}</p>}
            </div>
            <div className="mt-5 flex gap-2">
              <button onClick={closeModal} disabled={Boolean(mutationKey)} className="w-full btn btn-secondary font-bold py-2">Cancel</button>
              <button onClick={handleCreateRole} disabled={Boolean(mutationKey)} className="w-full btn btn-primary font-bold py-2">
                {mutationKey === 'create_role' ? 'Creating…' : 'Create Role'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Role Modal */}
      {activeModal === 'edit_role' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 shadow-2xl max-w-sm w-full border border-slate-200 animate-scale-in">
            <div className="flex gap-3 mb-4">
              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl h-fit border border-indigo-100">
                <Edit2 className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Rename Role</h3>
                <p className="text-xs text-slate-400 mt-0.5">Submits to PATCH /api/v1/admin/roles/:id</p>
              </div>
            </div>
            <div className="space-y-3 text-xs border-t border-b border-slate-100 py-4">
              <label className="block font-bold text-slate-700">
                New Name
                <input
                  type="text"
                  value={editRoleName}
                  onChange={(e) => setEditRoleName(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </label>
              {modalError && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-2.5 font-bold text-rose-700">{modalError}</p>}
            </div>
            <div className="mt-5 flex gap-2">
              <button onClick={closeModal} disabled={Boolean(mutationKey)} className="w-full btn btn-secondary font-bold py-2">Cancel</button>
              <button onClick={handleEditRole} disabled={Boolean(mutationKey)} className="w-full btn btn-primary font-bold py-2">
                {mutationKey === 'edit_role' ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Archive Role Confirmation */}
      {activeModal === 'archive_role' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 shadow-2xl max-w-sm w-full border border-slate-200 animate-scale-in">
            <div className="flex gap-3 mb-4">
              <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl h-fit border border-rose-100">
                <Archive className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Archive Role</h3>
                <p className="text-xs text-slate-400 mt-0.5">This action can be reversed by recreating the role</p>
              </div>
            </div>
            <div className="space-y-3 text-xs border-t border-b border-slate-100 py-4">
              <p className="font-semibold text-slate-700">
                Are you sure you want to archive <span className="font-black">{selectedRole}</span>?
              </p>
              <p className="text-slate-500">Users with this role will lose all associated permissions. This action is audited.</p>
              {modalError && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-2.5 font-bold text-rose-700">{modalError}</p>}
            </div>
            <div className="mt-5 flex gap-2">
              <button onClick={closeModal} disabled={Boolean(mutationKey)} className="w-full btn btn-secondary font-bold py-2">Cancel</button>
              <button onClick={handleArchiveRole} disabled={Boolean(mutationKey)} className="w-full btn bg-rose-600 hover:bg-rose-700 text-white font-bold py-2 rounded-xl">
                {mutationKey === 'archive_role' ? 'Archiving…' : 'Archive Role'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Grant Permission Modal */}
      {activeModal === 'grant_permission' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 shadow-2xl max-w-md w-full border border-slate-200 animate-scale-in">
            <div className="flex gap-3 mb-4">
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl h-fit border border-emerald-100">
                <Key className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Grant Permission</h3>
                <p className="text-xs text-slate-400 mt-0.5">Submits to POST /api/v1/admin/roles/:id/permissions</p>
              </div>
            </div>
            <div className="space-y-3 text-xs border-t border-b border-slate-100 py-4">
              <label className="block font-bold text-slate-700">
                Permission to grant to {selectedRole}
                <select
                  value={grantPermissionId}
                  onChange={(e) => setGrantPermissionId(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                >
                  <option value="">Select a permission…</option>
                  {eligiblePermissions.map((p) => (
                    <option key={p.id} value={p.id}>{p.name} ({p.riskLevel})</option>
                  ))}
                </select>
              </label>
              {eligiblePermissions.length === 0 && (
                <p className="bg-amber-50 p-2.5 rounded-xl border border-amber-200 text-amber-700 font-medium">
                  All available permissions are already assigned to this role.
                </p>
              )}
              <label className="block font-bold text-slate-700">
                Administrative reason
                <textarea
                  value={grantReason}
                  onChange={(e) => setGrantReason(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  rows={3}
                  placeholder="Minimum 8 characters"
                />
              </label>
              {modalError && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-2.5 font-bold text-rose-700">{modalError}</p>}
            </div>
            <div className="mt-5 flex gap-2">
              <button onClick={closeModal} disabled={Boolean(mutationKey)} className="w-full btn btn-secondary font-bold py-2">Cancel</button>
              <button onClick={handleGrantPermission} disabled={Boolean(mutationKey) || !grantPermissionId} className="w-full btn btn-primary font-bold py-2">
                {mutationKey === 'grant_permission' ? 'Granting…' : 'Grant Permission'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Revoke Permission Confirmation */}
      {activeModal === 'revoke_permission' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 shadow-2xl max-w-sm w-full border border-slate-200 animate-scale-in">
            <div className="flex gap-3 mb-4">
              <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl h-fit border border-rose-100">
                <X className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Revoke Permission</h3>
                <p className="text-xs text-slate-400 mt-0.5">Removes permission from the role immediately</p>
              </div>
            </div>
            <div className="space-y-3 text-xs border-t border-b border-slate-100 py-4">
              <p className="font-semibold text-slate-700">
                Revoke <span className="font-black">{permissions.find((p) => p.id === revokePermissionId)?.name || revokePermissionId}</span> from {selectedRole}?
              </p>
              <p className="text-slate-500">All users with this role will lose this permission. Their token version will be incremented.</p>
              <label className="block font-bold text-slate-700">
                Administrative reason
                <textarea
                  value={revokeReason}
                  onChange={(e) => setRevokeReason(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  rows={3}
                  placeholder="Minimum 8 characters"
                />
              </label>
              {modalError && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-2.5 font-bold text-rose-700">{modalError}</p>}
            </div>
            <div className="mt-5 flex gap-2">
              <button onClick={closeModal} disabled={Boolean(mutationKey)} className="w-full btn btn-secondary font-bold py-2">Cancel</button>
              <button onClick={handleRevokePermission} disabled={Boolean(mutationKey)} className="w-full btn bg-rose-600 hover:bg-rose-700 text-white font-bold py-2 rounded-xl">
                {mutationKey === 'revoke_permission' ? 'Revoking…' : 'Revoke Permission'}
              </button>
            </div>
          </div>
        </div>
      )}
    </HmsDashboardShell>
  );
};
export default RolesPermissionsPage;
