import { useState } from "react";
import { useParams } from "react-router-dom";
import { PageHeader } from "../../components/ui/page-header";
import { UserStatusBadge, RoleBadge } from "../../components/ui/user-badges";
import { ConfirmationModal, ReasonModal } from "../../components/ui/approval-modals";
import { KeyRound, LogOut, UserX, ShieldAlert } from "lucide-react";
import { apiClient } from "../../lib/api";

export const UserDetail = () => {
  const { id } = useParams();
  const [modals, setModals] = useState({ reset: false, forceLogout: false, suspend: false, changeRole: false });
  const [loading, setLoading] = useState(false);

  const user = {
    id, name: "Maria Santos", email: "maria@hms.com", role: "Receptionist",
    status: "Active", branch: "Main", phone: "09171234567", department: "Front Desk"
  };

  const breadcrumbs = [
    { label: "Admin", to: "/admin" },
    { label: "Users", to: "/admin/users" },
    { label: user.name, current: true }
  ];

  const handleSuspend = async (reason: string) => {
    setLoading(true);
    try {
      await apiClient.post(`/v1/admin/users/${id}/deactivate`, { reason });
      alert('Account suspended successfully');
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      alert(error.response?.data?.message || 'Failed to suspend account');
    } finally {
      setLoading(false);
      setModals({...modals, suspend: false});
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        title={user.name}
        description="Staff profile and account security."
        backFallback="/admin/users"
        backLabel="Back to Users"
        breadcrumbs={breadcrumbs}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="card p-6">
            <div className="flex justify-between items-center mb-4 border-b pb-2">
              <h3 className="font-bold text-slate-900">Personal Information</h3>
              <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 uppercase tracking-wider">Read-Only Mock</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <p className="text-xs font-medium text-slate-500 uppercase">Email Address</p>
                <p className="text-sm font-medium text-slate-900">{user.email}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium text-slate-500 uppercase">Phone Number</p>
                <p className="text-sm font-medium text-slate-900">{user.phone}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium text-slate-500 uppercase">Department</p>
                <p className="text-sm font-medium text-slate-900">{user.department}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium text-slate-500 uppercase">Assigned Branch</p>
                <p className="text-sm font-medium text-slate-900">{user.branch}</p>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex justify-between items-center mb-4 border-b pb-2">
              <h3 className="font-bold text-slate-900">Account Status</h3>
              <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 uppercase tracking-wider">Read-Only Mock</span>
            </div>
            <div className="flex items-center gap-6">
              <div className="space-y-1">
                <p className="text-xs font-medium text-slate-500 uppercase">Current Role</p>
                <RoleBadge role={user.role} />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium text-slate-500 uppercase">Account State</p>
                <UserStatusBadge status={user.status} />
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
                disabled
                className="btn btn-secondary w-full flex items-center justify-center gap-2 opacity-50 cursor-not-allowed"
              >
                <KeyRound className="h-4 w-4" />
                Reset Password (WIP)
              </button>
              <button
                disabled
                className="btn btn-secondary w-full flex items-center justify-center gap-2 opacity-50 cursor-not-allowed"
              >
                <LogOut className="h-4 w-4" />
                Force Logout (WIP)
              </button>
              <button
                onClick={() => setModals({...modals, suspend: true})}
                className={`btn btn-danger w-full flex items-center justify-center gap-2 ${loading ? 'opacity-50 cursor-wait' : ''}`}
                disabled={loading}
              >
                <UserX className="h-4 w-4" />
                {loading ? 'Processing...' : 'Suspend Account'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <ConfirmationModal
        isOpen={modals.reset}
        title="Reset Password"
        warning="This will trigger a password reset email."
        onConfirm={() => setModals({...modals, reset: false})}
        onClose={() => setModals({...modals, reset: false})}
      >
        Confirm password reset for {user.name}?
      </ConfirmationModal>

      <ReasonModal
        isOpen={modals.suspend}
        title="Suspend Account"
        guidance="Reason for suspension required."
        onConfirm={handleSuspend}
        onClose={() => setModals({...modals, suspend: false})}
      />
    </div>
  );
};
