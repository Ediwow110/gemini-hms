import { useState } from "react";
import { PageHeader } from "../../components/ui/page-header";
import { ConfirmationModal } from "../../components/ui/approval-modals";

export const RoleDetail = () => {
  const [showConfirm, setShowConfirm] = useState(false);
  const modules = ["Patients", "Orders", "Billing", "Laboratory", "Inventory"];

  return (
    <div className="space-y-6 pb-12">
      <PageHeader title="Role: Branch Manager" description="Manage granular access control for this role." />
      
      <div className="card overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200">
          <h2 className="font-semibold text-slate-900">Permission Matrix</h2>
        </div>
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
            <tr>
              <th className="px-6 py-3">Module</th>
              <th className="px-6 py-3 text-center">View</th>
              <th className="px-6 py-3 text-center">Create</th>
              <th className="px-6 py-3 text-center">Edit</th>
              <th className="px-6 py-3 text-center">Delete</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {modules.map(m => (
              <tr key={m} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4 font-medium text-slate-900">{m}</td>
                <td className="px-6 py-4 text-center">
                  <input type="checkbox" defaultChecked className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                </td>
                <td className="px-6 py-4 text-center">
                  <input type="checkbox" className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                </td>
                <td className="px-6 py-4 text-center">
                  <input type="checkbox" className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                </td>
                <td className="px-6 py-4 text-center">
                  <input type="checkbox" className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button 
            onClick={() => setShowConfirm(true)} 
            className="btn btn-primary"
          >
            Save Changes
          </button>
        </div>
      </div>

      <ConfirmationModal 
        isOpen={showConfirm} 
        title="Save Changes" 
        warning="Changes to permissions will be recorded in the audit log." 
        onConfirm={() => setShowConfirm(false)} 
        onClose={() => setShowConfirm(false)}
      >
        Confirm changes to role permissions?
      </ConfirmationModal>
    </div>
  );
};
