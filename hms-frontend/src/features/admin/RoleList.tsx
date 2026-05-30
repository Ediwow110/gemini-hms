import { Link } from "react-router-dom";
import { PageHeader } from "../../components/ui/page-header";
import { ApprovalRiskBadge } from "../../components/ui/approval-badges";
import { PlusCircle, ShieldAlert } from "lucide-react";
import { useState } from "react";

export const RoleList = () => {
  const [showCreateModal, setShowCreateModal] = useState(false);

  const roles = [
    { name: "Super Admin", users: 1, permissions: 120, risk: "Critical" },
    { name: "Branch Manager", users: 3, permissions: 80, risk: "High" },
    { name: "Cashier", users: 5, permissions: 20, risk: "Low" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <PageHeader title="Roles & Permissions" description="Manage system access levels." />
        <button 
          onClick={() => setShowCreateModal(true)}
          className="btn btn-primary flex items-center gap-2 cursor-pointer"
        >
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

      {/* Role Creation Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 shadow-2xl max-w-sm w-full border border-slate-200 animate-scale-in relative">
            <div className="flex gap-3 mb-4">
              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl h-fit border border-indigo-100">
                <ShieldAlert className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider select-none">
                  Create Access Role
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Mock governance sandbox execution</p>
              </div>
            </div>
            
            <div className="space-y-3 text-xs text-slate-600 leading-relaxed border-t border-b border-slate-100 py-4">
              <p className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 font-medium">
                This triggers a simulated role provisioning configuration. Customized permissions mapping, security validation levels, and scoping requirements are evaluated in sandbox local memory. No database modifications are committed.
              </p>
            </div>

            <div className="mt-5 flex gap-2">
              <button 
                onClick={() => setShowCreateModal(false)}
                className="w-full btn border border-slate-200 hover:bg-slate-50 font-bold py-2 rounded-xl text-slate-700 transition-colors cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
