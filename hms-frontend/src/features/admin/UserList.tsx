import { PageHeader } from "../../components/ui/page-header";
import { UserStatusBadge, RoleBadge } from "../../components/ui/user-badges";
import { MetricCard } from "../../components/ui/metric-card";
import { Users, UserCheck, UserX, ShieldCheck, AlertTriangle, FlaskConical } from "lucide-react";
import { HmsDashboardShell, HmsAuditFooter } from "../../components/hms-dashboard";

// NOTE: This list is shown only to non-Super-Admin users via UsersWrapper.
// Super Admin users see the live UsersPage (wired to /api/v1/admin/users).
// The names and IDs here are intentionally fake so they cannot be mistaken
// for real production data. Kept as a structural placeholder so the page
// shape is visible during local development.
const MOCK_USERS = [
  { id: "U001", name: "Maria Santos", email: "maria@hms.com", role: "Receptionist", status: "Active", branch: "Main" },
  { id: "U002", name: "Mark Santos", email: "mark@hms.com", role: "Cashier", status: "Active", branch: "Main" },
  { id: "U003", name: "Admin User", email: "admin@hms.com", role: "Admin", status: "Active", branch: "Main" },
];

export const UserList = () => {
  return (
    <HmsDashboardShell
      widthTier="compact"
      footer={<HmsAuditFooter dataSource="Mock user list (sandbox)" />}
    >
      <div className="space-y-6 pb-12 animate-fade-in">
        <PageHeader title="User Management" description="Manage staff accounts, roles, and branch access." />

        <div
          className="card p-5 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3"
          role="status"
          data-testid="userlist-sandbox-banner"
        >
          <div className="p-2 bg-amber-100 rounded-lg flex-shrink-0">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
          </div>
          <div className="text-sm text-amber-900">
            <p className="font-bold mb-1">This page is a sandbox mock.</p>
            <p>
              The backend exposes{" "}
              <code className="font-mono text-[11px]">GET /api/v1/admin/users</code>{" "}
              for Super Admin, but for non-Super-Admin roles this page is a
              static shell. The user rows, branch assignments, and metric
              values shown below are hardcoded mock data and{" "}
              <strong>are not persisted</strong>. The "View Profile" links
              are intentionally disabled because the mock IDs (U001, U002,
              U003) do not exist in the database.
            </p>
            <div className="mt-3 flex items-center gap-2 text-xs text-amber-700">
              <FlaskConical className="h-4 w-4" />
              <span>UI demo shell only. No live user data is displayed.</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5" aria-hidden="true">
          <div className="animate-slide-up stagger-1">
            <MetricCard title="Total Users" value="—" icon={Users} color="indigo" />
          </div>
          <div className="animate-slide-up stagger-2">
            <MetricCard title="Active" value="—" icon={UserCheck} color="emerald" />
          </div>
          <div className="animate-slide-up stagger-3">
            <MetricCard title="Locked" value="—" icon={UserX} color="rose" />
          </div>
          <div className="animate-slide-up stagger-4">
            <MetricCard title="Admins" value="—" icon={ShieldCheck} color="indigo" />
          </div>
        </div>

        <div className="card overflow-hidden">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50/80 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">User</th>
                <th className="px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Role</th>
                <th className="px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Branch</th>
                <th className="px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {MOCK_USERS.map(u => {
                const initials = u.name.split(" ").map(n => n[0]).join("");
                return (
                  <tr key={u.id} className="bg-slate-50/50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center text-xs font-bold text-slate-600">
                          {initials}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900">{u.name}</p>
                          <p className="text-xs text-slate-400">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <RoleBadge role={u.role} />
                    </td>
                    <td className="px-6 py-4 text-slate-600">{u.branch}</td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center">
                        <UserStatusBadge status={u.status} />
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span
                        role="link"
                        aria-disabled="true"
                        data-testid="userlist-view-profile-disabled"
                        className="text-xs font-semibold text-slate-300 cursor-not-allowed px-3 py-1.5 bg-slate-50 rounded-lg inline-block"
                        title="Disabled: this user ID is mock data and does not exist in the database"
                      >
                        View Profile
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </HmsDashboardShell>
  );
};
