import React, { useState, useEffect, useCallback } from 'react';
import { HmsPageHeader } from '../../components/hms-page';
import { HmsDashboardShell, HmsAuditFooter, HmsLoadingSkeleton, HmsEmptyState } from '../../components/hms-dashboard';
import { AdminShellNotice } from './components/AdminShellNotice';
import { UserAccessTable } from './components/UserAccessTable';
import { UserPlus, Search, Filter, Users, AlertCircle } from 'lucide-react';
import { adminService, type AdminUserItem, type AdminUserListParams } from '../../services/admin.service';

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
      console.error('Failed to fetch users:', err);
      setError('Could not load user directory from server.');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

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
            className="btn btn-primary bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-2 px-4 rounded-xl"
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
          onClick={() => setShowCreateModal(true)}
          className="btn btn-primary bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-2 px-4 rounded-xl flex items-center gap-1.5 w-fit"
        >
          <UserPlus className="h-4 w-4" /> Register New Account
        </button>
      </div>

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
            className="appearance-none btn border border-slate-200 bg-white text-slate-655 hover:bg-slate-50 pl-9 pr-8 py-2.5 text-xs font-bold rounded-xl cursor-pointer focus:outline-none"
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
        <UserAccessTable users={filteredUsers} />
      )}

      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 shadow-2xl max-w-sm w-full border border-slate-200 animate-scale-in relative">
            <div className="flex gap-3 mb-4">
              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl h-fit border border-indigo-100">
                <UserPlus className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider select-none">
                  Register User Account
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Backend endpoint exists but frontend wiring is WIP</p>
              </div>
            </div>
            <div className="space-y-3 text-xs text-slate-600 leading-relaxed border-t border-b border-slate-100 py-4">
              <p className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 font-medium">
                The backend <code className="font-mono text-[11px]">POST /api/v1/admin/users</code> endpoint exists to create users. Frontend wiring for this form is deferred to a follow-up lane. No data has been sent.
              </p>
            </div>
            <div className="mt-5 flex gap-2">
              <button 
                onClick={() => setShowCreateModal(false)}
                className="w-full btn border border-slate-200 hover:bg-slate-50 font-bold py-2 rounded-xl text-slate-700 transition-colors"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}
    </HmsDashboardShell>
  );
};
export default UsersPage;
