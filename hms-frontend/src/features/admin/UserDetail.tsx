import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { PageHeader } from "../../components/ui/page-header";
import { UserStatusBadge, RoleBadge } from "../../components/ui/user-badges";
import { ConfirmationModal, ReasonModal } from "../../components/ui/approval-modals";
import { KeyRound, LogOut, UserX, ShieldAlert, AlertCircle } from "lucide-react";
import { adminService } from "../../services/admin.service";
import { apiClient } from "../../lib/api";

export const UserDetail = () => {
  const { id } = useParams();
  const [modals, setModals] = useState({ reset: false, forceLogout: false, suspend: false, changeRole: false });
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [tempPassword, setTempPassword] = useState<string | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [apiUser, setApiUser] = useState<{
    id: string;
    email: string;
    status: string;
    mfaEnabled: boolean;
    deactivatedAt: string | null;
    lockedUntil: string | null;
    roles: { id: string; name: string; status: string }[];
    branches: { id: string; name: string }[];
  } | null>(null);
  const [suspendLoading, setSuspendLoading] = useState(false);

  useEffect(() => {
    if (!id) {
      setFetchError("No user ID provided in route.");
      setLoading(false);
      return;
    }
    let active = true;
    setLoading(true);
    setFetchError(null);
    adminService.getUser(id)
      .then((data) => {
        if (!active) return;
        setApiUser({
          id: data.id,
          email: data.email,
          status: data.status,
          mfaEnabled: data.mfaEnabled,
          deactivatedAt: data.deactivatedAt,
          lockedUntil: data.lockedUntil,
          roles: data.roles.map((r) => ({ id: r.id, name: r.name, status: r.status })),
          branches: data.branches.map((b) => ({ id: b.id, name: b.name })),
        });
        setLoading(false);
      })
      .catch((err: unknown) => {
        if (!active) return;
        const error = err as { response?: { status?: number; data?: { message?: string } } };
        if (error.response?.status === 404) {
          setFetchError("User not found.");
        } else {
          setFetchError(error.response?.data?.message || "Could not load user details.");
        }
        setLoading(false);
      });
    return () => { active = false; };
  }, [id]);

  const handleForceLogout = async (reason: string) => {
    if (!id) return;
    setActionLoading(true);
    try {
      await adminService.forceLogout(id, reason);
      alert("User has been forcibly logged out.");
      setModals({...modals, forceLogout: false});
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      alert(error.response?.data?.message || 'Failed to force logout user');
    } finally {
      setActionLoading(false);
    }
  };

  const handleResetPassword = async (reason: string) => {
    if (!id) return;
    setActionLoading(true);
    try {
      const res = await adminService.resetPassword(id, reason);
      setTempPassword(res.tempPassword);
      setModals({...modals, reset: false});
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      alert(error.response?.data?.message || 'Failed to reset password');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSuspend = async (reason: string) => {
    if (!id) return;
    setSuspendLoading(true);
    try {
      const endpoint = apiUser?.status === 'INACTIVE' ? 'activate' : 'deactivate';
      await apiClient.post(`/v1/admin/users/${id}/${endpoint}`, { reason });
      setApiUser((prev) => prev ? { ...prev, status: endpoint === 'deactivate' ? 'INACTIVE' : 'ACTIVE' } : prev);
      setModals({...modals, suspend: false});
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      alert(error.response?.data?.message || 'Failed to change account status');
    } finally {
      setSuspendLoading(false);
    }
  };

  const displayName = apiUser?.email || "User";
  const breadcrumbs = [
    { label: "Admin", to: "/admin" },
    { label: "Users", to: "/admin/users" },
    { label: displayName, current: true }
  ];

  if (loading) {
    return (
      <div className="space-y-6 pb-12">
        <PageHeader title="Loading..." description="Fetching user details." backFallback="/admin/users" backLabel="Back to Users" />
        <div className="card p-6 animate-pulse space-y-4">
          <div className="h-4 bg-slate-200 rounded w-1/3" />
          <div className="h-4 bg-slate-200 rounded w-1/2" />
          <div className="h-4 bg-slate-200 rounded w-2/3" />
        </div>
      </div>
    );
  }

  if (fetchError || !apiUser) {
    return (
      <div className="space-y-6 pb-12">
        <PageHeader title="User Not Found" description={fetchError || "Unknown error."} backFallback="/admin/users" backLabel="Back to Users" />
        <div className="card p-6 flex items-start gap-3 bg-rose-50 border border-rose-200 rounded-2xl">
          <AlertCircle className="h-5 w-5 text-rose-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-rose-900">Unable to load user profile.</p>
            <p className="text-sm text-rose-700 mt-1">{fetchError || "The requested user could not be found."}</p>
          </div>
        </div>
      </div>
    );
  }

  const isInactive = apiUser.status === 'INACTIVE';
  const suspendButtonLabel = isInactive ? 'Activate Account' : 'Suspend Account';

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        title={displayName}
        description="Staff profile and account security."
        backFallback="/admin/users"
        backLabel="Back to Users"
        breadcrumbs={breadcrumbs}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="card p-6">
            <h3 className="font-bold text-slate-900 mb-4 border-b pb-2">Personal Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <p className="text-xs font-medium text-slate-500 uppercase">Email Address</p>
                <p className="text-sm font-medium text-slate-900">{apiUser.email}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium text-slate-500 uppercase">User ID</p>
                <p className="text-sm font-medium text-slate-500 font-mono">{apiUser.id}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium text-slate-500 uppercase">Assigned Branches</p>
                <p className="text-sm font-medium text-slate-900">
                  {apiUser.branches.length > 0
                    ? apiUser.branches.map((b) => b.name).join(', ')
                    : <span className="text-slate-400 italic">None assigned</span>}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium text-slate-500 uppercase">Created</p>
                <p className="text-sm font-medium text-slate-900">{new Date(apiUser.id).toLocaleDateString()}</p>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <h3 className="font-bold text-slate-900 mb-4 border-b pb-2">Account Status</h3>
            <div className="flex items-center gap-6">
              <div className="space-y-1">
                <p className="text-xs font-medium text-slate-500 uppercase">Roles</p>
                <div className="flex flex-wrap gap-1">
                  {apiUser.roles.length > 0
                    ? apiUser.roles.map((r) => <RoleBadge key={r.id} role={r.name} />)
                    : <span className="text-slate-400 italic text-sm">None assigned</span>}
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium text-slate-500 uppercase">Account State</p>
                <UserStatusBadge status={isInactive ? 'Suspended' : 'Active'} />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium text-slate-500 uppercase">MFA</p>
                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                  apiUser.mfaEnabled
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                    : 'bg-slate-100 text-slate-500 border border-slate-200'
                }`}>
                  {apiUser.mfaEnabled ? 'ENABLED' : 'DISABLED'}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="card p-6 space-y-4">
            <div className="flex items-center gap-2 mb-2 text-slate-900 font-bold">
              <ShieldAlert className="h-5 w-5 text-rose-500" />
              <span>Security Actions</span>
            </div>
            <div className="grid grid-cols-1 gap-3">
              <button
                onClick={() => setModals({...modals, reset: true})}
                className="btn btn-secondary w-full flex items-center justify-center gap-2"
                disabled={actionLoading || suspendLoading}
              >
                <KeyRound className="h-4 w-4" />
                Reset Password
              </button>
              <button
                onClick={() => setModals({...modals, forceLogout: true})}
                className="btn btn-secondary w-full flex items-center justify-center gap-2"
                disabled={actionLoading || suspendLoading}
              >
                <LogOut className="h-4 w-4" />
                Force Logout
              </button>
              <button
                onClick={() => setModals({...modals, suspend: true})}
                className={`btn btn-danger w-full flex items-center justify-center gap-2 ${suspendLoading ? 'opacity-50 cursor-wait' : ''}`}
                disabled={actionLoading || suspendLoading}
              >
                <UserX className="h-4 w-4" />
                {suspendLoading ? 'Processing...' : suspendButtonLabel}
              </button>
            </div>
          </div>
        </div>
      </div>

      {tempPassword && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-2">Password Reset Successful</h3>
            <p className="text-sm text-slate-600 mb-4">Please provide this temporary password securely to the user. It will not be shown again.</p>
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 font-mono text-center text-lg mb-6">
              {tempPassword}
            </div>
            <div className="flex justify-end">
              <button onClick={() => setTempPassword(null)} className="btn btn-primary">Done</button>
            </div>
          </div>
        </div>
      )}

      <ReasonModal
        isOpen={modals.reset}
        title="Reset Password"
        guidance={`Reason for password reset required. Minimum 8 characters.`}
        onConfirm={handleResetPassword}
        onClose={() => setModals({...modals, reset: false})}
      />

      <ReasonModal
        isOpen={modals.forceLogout}
        title="Force Logout"
        guidance={`Reason for forcing logout required. Minimum 8 characters.`}
        onConfirm={handleForceLogout}
        onClose={() => setModals({...modals, forceLogout: false})}
      />

      <ReasonModal
        isOpen={modals.suspend}
        title={isInactive ? 'Activate Account' : 'Suspend Account'}
        guidance={`Reason for ${isInactive ? 'activation' : 'suspension'} required.`}
        onConfirm={handleSuspend}
        onClose={() => setModals({...modals, suspend: false})}
      />
    </div>
  );
};
