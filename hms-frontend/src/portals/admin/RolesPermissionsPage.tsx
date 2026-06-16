import React, { useState, useEffect, useCallback } from 'react';
import { HmsPageHeader } from '../../components/hms-page';
import { HmsDashboardShell, HmsAuditFooter, HmsLoadingSkeleton, HmsEmptyState } from '../../components/hms-dashboard';
import { AdminShellNotice } from './components/AdminShellNotice';
import { PermissionMatrix } from './components/PermissionMatrix';
import { Shield, AlertCircle, Users } from 'lucide-react';
import { adminService, type AdminRoleListItem } from '../../services/admin.service';

export const RolesPermissionsPage: React.FC = () => {
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [roles, setRoles] = useState<AdminRoleListItem[]>([]);

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

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  useEffect(() => {
    if (roles.length > 0 && !selectedRole) {
      setSelectedRole(roles[0].name);
    }
  }, [roles, selectedRole]);

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
          description="This tenant has no roles defined yet."
          icon={<Shield className="h-6 w-6" />}
        />
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-6">
          <div className="card p-5 bg-white border border-slate-200/80 shadow-sm rounded-2xl space-y-4">
            <h3 className="font-bold text-slate-800 text-sm tracking-wider uppercase border-b border-slate-100 pb-3 flex items-center gap-2">
              <Users className="h-4.5 w-4.5 text-indigo-500" />
              HMS Application Roles
            </h3>

            <div className="space-y-2">
              {roles.map((role) => {
                const isActive = selectedRole === role.name;
                return (
                  <button
                    key={role.id}
                    onClick={() => setSelectedRole(role.name)}
                    className={`w-full p-3.5 border text-left transition-all duration-200 rounded-xl flex items-center justify-between text-xs cursor-pointer group ${
                      isActive
                        ? 'bg-gradient-to-r from-indigo-50 to-violet-50/50 border-indigo-200 shadow-sm text-indigo-900 font-bold'
                        : 'bg-slate-50 hover:bg-slate-100/50 border-slate-200/60 hover:border-slate-250 text-slate-700 font-medium'
                    }`}
                  >
                    <div>
                      <p className={`font-bold ${isActive ? 'text-indigo-900' : 'text-slate-800 group-hover:text-slate-900'}`}>{role.name}</p>
                      <p className="text-[9px] text-slate-400 font-semibold mt-0.5 uppercase tracking-wide">
                        {role.status === 'INACTIVE'
                          ? 'Inactive'
                          : role.isSystem
                          ? 'System Role'
                          : 'Custom Role'}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <span className={`text-[8px] font-black px-1.5 py-0.5 rounded border uppercase tracking-wider ${
                        role.isSystem
                          ? 'bg-rose-50 text-rose-700 border-rose-100'
                          : 'bg-slate-150 text-slate-500 border-slate-200'
                      }`}>
                        {role.isSystem ? 'SYSTEM' : role.status === 'ACTIVE' ? 'ACTIVE' : 'INACTIVE'}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="card p-5 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs space-y-3 leading-relaxed">
            <h4 className="font-bold text-slate-700 flex items-center gap-1.5">
              <Shield className="h-4.5 w-4.5 text-slate-500" />
              Tenant & Branch Scoping Rules
            </h4>
            <p className="text-slate-500">
              Security permissions map to distinct containment scopes. **Super Admin** bypasses branch boundary constraints. **Branch Admin** has dashboard views across branches but mutations are limited. **Doctors, Nurses, Lab Technicians, and Cashiers** are strictly bound to their selected branch contexts.
            </p>
            <div className="flex items-center gap-2 text-indigo-600 font-bold bg-indigo-50/50 p-2.5 rounded-xl border border-indigo-100">
              <Shield className="h-4 w-4" />
              <span>Role data sourced from live API. Permission matrix shows illustrative display — mutation wiring is deferred.</span>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2">
          <PermissionMatrix selectedRole={selectedRole} />
        </div>
      </div>
    </HmsDashboardShell>
  );
};
export default RolesPermissionsPage;
