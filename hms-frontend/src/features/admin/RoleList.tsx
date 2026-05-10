import { Link } from "react-router-dom";
import { PageHeader } from "../../components/ui/page-header";
import { ApprovalRiskBadge } from "../../components/ui/approval-badges";
import { PlusCircle } from "lucide-react";

export const RoleList = () => {
  const roles = [
    { name: "Super Admin", users: 1, permissions: 120, risk: "Critical" },
    { name: "Branch Manager", users: 3, permissions: 80, risk: "High" },
    { name: "Cashier", users: 5, permissions: 20, risk: "Low" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <PageHeader title="Roles & Permissions" description="Manage system access levels." />
        <button className="btn btn-primary flex items-center gap-2">
          <PlusCircle className="h-4 w-4" />
          New Role
        </button>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
            <tr>
              <th className="px-6 py-3">Role Name</th>
              <th className="px-6 py-3">Assigned Users</th>
              <th className="px-6 py-3">Permissions Count</th>
              <th className="px-6 py-3">Risk Level</th>
              <th className="px-6 py-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {roles.map(r => (
              <tr key={r.name} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4 font-medium text-slate-900">{r.name}</td>
                <td className="px-6 py-4 text-slate-600">{r.users}</td>
                <td className="px-6 py-4 text-slate-600">{r.permissions}</td>
                <td className="px-6 py-4">
                  <div className="flex justify-center">
                    <ApprovalRiskBadge risk={r.risk as 'Low' | 'Medium' | 'High' | 'Critical'} />
                  </div>
                </td>
                <td className="px-6 py-4 text-center">
                  <Link 
                    to={`/admin/roles/${r.name.toLowerCase().replace(" ","-")}`} 
                    className="text-indigo-600 hover:text-indigo-800 font-medium text-xs"
                  >
                    View Details
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
