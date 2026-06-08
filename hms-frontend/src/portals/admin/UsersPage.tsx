import React, { useState, useEffect } from 'react';
import { HmsPageHeader } from '../../components/hms-page';
import { HmsDashboardShell, HmsAuditFooter, HmsLoadingSkeleton, HmsEmptyState } from '../../components/hms-dashboard';
import { AdminShellNotice } from './components/AdminShellNotice';
import { UserAccessTable } from './components/UserAccessTable';
import { UserPlus, Search, Filter, Users } from 'lucide-react';

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

export const UsersPage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  const mockUsers: UserItem[] = [
    {
      id: "U001",
      name: "Maria Santos",
      email: "maria@hms.com",
      tenant: "St. Jude Hospital Network",
      branch: "Metro Manila",
      role: "Nurse",
      mfaEnabled: true,
      status: "Active",
      lastLogin: "2026-05-21 12:44"
    },
    {
      id: "U002",
      name: "Mark Santos",
      email: "mark@hms.com",
      tenant: "St. Jude Hospital Network",
      branch: "Metro Manila",
      role: "Cashier",
      mfaEnabled: false,
      status: "Active",
      lastLogin: "2026-05-21 11:20"
    },
    {
      id: "U003",
      name: "Dr. Arthur Stein",
      email: "arthur@hms.com",
      tenant: "St. Jude Hospital Network",
      branch: "Cebu City",
      role: "Doctor",
      mfaEnabled: true,
      status: "Locked",
      lastLogin: "2026-05-20 18:15"
    },
    {
      id: "U004",
      name: "Super Admin User",
      email: "admin@hms.com",
      tenant: "System-wide",
      branch: "All Branches",
      role: "Super Admin",
      mfaEnabled: true,
      status: "Active",
      lastLogin: "2026-05-21 13:10"
    },
    {
      id: "U005",
      name: "MediClinics Registrar",
      email: "registrar@mediclinics.com",
      tenant: "MediClinics Group",
      branch: "Singapore",
      role: "Branch Admin",
      mfaEnabled: false,
      status: "Suspended",
      lastLogin: "2026-05-18 09:30"
    }
  ];

  const filteredUsers = mockUsers.filter(u => 
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    u.role.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <HmsDashboardShell>
        <HmsLoadingSkeleton variant="table" rows={5} />
      </HmsDashboardShell>
    );
  }

  return (
    <HmsDashboardShell
      footer={<HmsAuditFooter dataSource="Mock user data (sandbox)" />}
    >
      <AdminShellNotice />
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <HmsPageHeader
          title="User Directory & Scopes"
          description="Centralised audit and directory of active personnel, MFA security alignments, and locks."
          badge="Sandbox"
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
        <button className="btn border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 px-4 py-2 text-xs font-bold rounded-xl flex items-center gap-1.5">
          <Filter className="h-4 w-4" /> Filter Status
        </button>
      </div>

      {filteredUsers.length === 0 ? (
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
                <p className="text-xs text-slate-400 mt-0.5">Mock governance sandbox execution</p>
              </div>
            </div>
            <div className="space-y-3 text-xs text-slate-600 leading-relaxed border-t border-b border-slate-100 py-4">
              <p className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 font-medium">
                This triggers a simulated user invitation and provisioning flow. Email invites, temporary password setups, and branch bindings are tested in-memory with no changes persisted to the database.
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
