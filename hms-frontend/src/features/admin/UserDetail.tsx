import { useState } from "react";
import { useParams } from "react-router-dom";
import { PageHeader } from "../../components/ui/page-header";
import { UserStatusBadge, RoleBadge } from "../../components/ui/user-badges";
import { ConfirmationModal, ReasonModal } from "../../components/ui/approval-modals";
import { KeyRound, LogOut, UserX, ShieldAlert } from "lucide-react";

export const UserDetail = () => {
  const { id } = useParams();
  const [modals, setModals] = useState({ reset: false, forceLogout: false, suspend: false, changeRole: false });

  const user = { 
    id, name: "Maria Santos", email: "maria@hms.com", role: "Receptionist", 
    status: "Active", branch: "Main", phone: "09171234567", department: "Front Desk" 
  };

  return (
    <div className="space-y-6 pb-12">
      <PageHeader title={user.name} description="Staff profile and account security." />
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="card p-6">
            <h3 className="font-bold text-slate-900 mb-4 border-b pb-2">Personal Information</h3>
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
            <h3 className="font-bold text-slate-900 mb-4 border-b pb-2">Account Status</h3>
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
                onClick={() => setModals({...modals, reset: true})} 
                className="btn btn-secondary w-full flex items-center justify-center gap-2"
              >
                <KeyRound className="h-4 w-4" />
                Reset Password
              </button>
              <button 
                onClick={() => setModals({...modals, forceLogout: true})} 
                className="btn btn-secondary w-full flex items-center justify-center gap-2"
              >
                <LogOut className="h-4 w-4" />
                Force Logout
              </button>
              <button 
                onClick={() => setModals({...modals, suspend: true})} 
                className="btn btn-danger w-full flex items-center justify-center gap-2"
              >
                <UserX className="h-4 w-4" />
                Suspend Account
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
        onConfirm={() => setModals({...modals, suspend: false})} 
        onClose={() => setModals({...modals, suspend: false})} 
      />
    </div>
  );
};
