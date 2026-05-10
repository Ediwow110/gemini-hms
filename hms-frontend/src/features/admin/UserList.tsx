import { Link } from "react-router-dom";
import { PageHeader } from "../../components/ui/page-header";
import { UserStatusBadge, RoleBadge } from "../../components/ui/user-badges";
import { MetricCard } from "../../components/ui/metric-card";
import { Users, UserCheck, UserX, ShieldCheck } from "lucide-react";

const MOCK_USERS = [
  { id: "U001", name: "Maria Santos", email: "maria@hms.com", role: "Receptionist", status: "Active", branch: "Main" },
  { id: "U002", name: "Mark Santos", email: "mark@hms.com", role: "Cashier", status: "Active", branch: "Main" },
  { id: "U003", name: "Admin User", email: "admin@hms.com", role: "Admin", status: "Active", branch: "Main" },
];

export const UserList = () => {
  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      <PageHeader title="User Management" description="Manage staff accounts, roles, and branch access." />
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="animate-slide-up stagger-1">
          <MetricCard title="Total Users" value="25" icon={Users} color="indigo" />
        </div>
        <div className="animate-slide-up stagger-2">
          <MetricCard title="Active" value="22" icon={UserCheck} color="emerald" />
        </div>
        <div className="animate-slide-up stagger-3">
          <MetricCard title="Locked" value="1" icon={UserX} color="rose" />
        </div>
        <div className="animate-slide-up stagger-4">
          <MetricCard title="Admins" value="2" icon={ShieldCheck} color="indigo" />
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
                <tr key={u.id} className="hover:bg-indigo-50/30 transition-colors duration-150 cursor-pointer group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center text-xs font-bold text-slate-600 group-hover:from-indigo-100 group-hover:to-violet-100 group-hover:text-indigo-700 transition-all duration-200">
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
                    <Link to={`/admin/users/${u.id}`} className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-all">
                      View Profile
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
