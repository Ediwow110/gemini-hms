import React, { useState } from 'react';
import { ShieldCheck } from 'lucide-react';

interface ModulePermission {
  view: boolean;
  create: boolean;
  edit: boolean;
  delete: boolean;
  approve: boolean;
  export: boolean;
  tenantScope: boolean;
  branchScope: boolean;
  mfaRequired: boolean;
}

interface PermissionMatrixProps {
  selectedRole: string;
}

const MODULES = [
  { key: 'emr', label: 'Clinical EMR & SOAP Charting', desc: 'Patient health records, triage logs, and encounters' },
  { key: 'lis', label: 'LIS Laboratory Information System', desc: 'Specimen inventory, test encoding, and QA release' },
  { key: 'billing', label: 'POS Billing & Cashiering', desc: 'Invoices, daily ledger entries, voids, and refunds' },
  { key: 'inventory', label: 'Pharmacy & Supply Chain', desc: 'B2B stock procurement, dispensations, and audits' },
  { key: 'governance', label: 'Security & System Governance', desc: 'Tenant isolation boundaries, audit logs, and keys' }
];

export const PermissionMatrix: React.FC<PermissionMatrixProps> = ({ selectedRole }) => {
  const [matrixState, setMatrixState] = useState<Record<string, Record<string, ModulePermission>>>({
    'Super Admin': {
      emr: { view: true, create: true, edit: true, delete: true, approve: true, export: true, tenantScope: true, branchScope: false, mfaRequired: true },
      lis: { view: true, create: true, edit: true, delete: true, approve: true, export: true, tenantScope: true, branchScope: false, mfaRequired: true },
      billing: { view: true, create: true, edit: true, delete: true, approve: true, export: true, tenantScope: true, branchScope: false, mfaRequired: true },
      inventory: { view: true, create: true, edit: true, delete: true, approve: true, export: true, tenantScope: true, branchScope: false, mfaRequired: true },
      governance: { view: true, create: true, edit: true, delete: true, approve: true, export: true, tenantScope: true, branchScope: false, mfaRequired: true }
    },
    'Branch Admin': {
      emr: { view: true, create: false, edit: false, delete: false, approve: false, export: true, tenantScope: false, branchScope: true, mfaRequired: true },
      lis: { view: true, create: false, edit: false, delete: false, approve: false, export: true, tenantScope: false, branchScope: true, mfaRequired: true },
      billing: { view: true, create: false, edit: false, delete: false, approve: false, export: true, tenantScope: false, branchScope: true, mfaRequired: true },
      inventory: { view: true, create: false, edit: false, delete: false, approve: false, export: true, tenantScope: false, branchScope: true, mfaRequired: true },
      governance: { view: false, create: false, edit: false, delete: false, approve: false, export: false, tenantScope: false, branchScope: false, mfaRequired: true }
    },
    'Doctor': {
      emr: { view: true, create: true, edit: true, delete: false, approve: true, export: false, tenantScope: false, branchScope: true, mfaRequired: false },
      lis: { view: true, create: false, edit: false, delete: false, approve: false, export: false, tenantScope: false, branchScope: true, mfaRequired: false },
      billing: { view: false, create: false, edit: false, delete: false, approve: false, export: false, tenantScope: false, branchScope: false, mfaRequired: false },
      inventory: { view: false, create: false, edit: false, delete: false, approve: false, export: false, tenantScope: false, branchScope: false, mfaRequired: false },
      governance: { view: false, create: false, edit: false, delete: false, approve: false, export: false, tenantScope: false, branchScope: false, mfaRequired: false }
    },
    'Nurse': {
      emr: { view: true, create: true, edit: true, delete: false, approve: false, export: false, tenantScope: false, branchScope: true, mfaRequired: false },
      lis: { view: true, create: false, edit: false, delete: false, approve: false, export: false, tenantScope: false, branchScope: true, mfaRequired: false },
      billing: { view: false, create: false, edit: false, delete: false, approve: false, export: false, tenantScope: false, branchScope: false, mfaRequired: false },
      inventory: { view: false, create: false, edit: false, delete: false, approve: false, export: false, tenantScope: false, branchScope: false, mfaRequired: false },
      governance: { view: false, create: false, edit: false, delete: false, approve: false, export: false, tenantScope: false, branchScope: false, mfaRequired: false }
    },
    'Lab Technician': {
      emr: { view: false, create: false, edit: false, delete: false, approve: false, export: false, tenantScope: false, branchScope: false, mfaRequired: false },
      lis: { view: true, create: true, edit: true, delete: false, approve: true, export: false, tenantScope: false, branchScope: true, mfaRequired: false },
      billing: { view: false, create: false, edit: false, delete: false, approve: false, export: false, tenantScope: false, branchScope: false, mfaRequired: false },
      inventory: { view: false, create: false, edit: false, delete: false, approve: false, export: false, tenantScope: false, branchScope: false, mfaRequired: false },
      governance: { view: false, create: false, edit: false, delete: false, approve: false, export: false, tenantScope: false, branchScope: false, mfaRequired: false }
    },
    'Cashier': {
      emr: { view: false, create: false, edit: false, delete: false, approve: false, export: false, tenantScope: false, branchScope: false, mfaRequired: false },
      lis: { view: false, create: false, edit: false, delete: false, approve: false, export: false, tenantScope: false, branchScope: false, mfaRequired: false },
      billing: { view: true, create: true, edit: true, delete: false, approve: false, export: false, tenantScope: false, branchScope: true, mfaRequired: false },
      inventory: { view: false, create: false, edit: false, delete: false, approve: false, export: false, tenantScope: false, branchScope: false, mfaRequired: false },
      governance: { view: false, create: false, edit: false, delete: false, approve: false, export: false, tenantScope: false, branchScope: false, mfaRequired: false }
    }
  });

  const isReadOnly = true;

  const handleToggle = (moduleKey: string, field: keyof ModulePermission) => {
    if (isReadOnly) return;
    setMatrixState((prev) => {
      const roleMap = prev[selectedRole] || {
        emr: { view: false, create: false, edit: false, delete: false, approve: false, export: false, tenantScope: false, branchScope: false, mfaRequired: false },
        lis: { view: false, create: false, edit: false, delete: false, approve: false, export: false, tenantScope: false, branchScope: false, mfaRequired: false },
        billing: { view: false, create: false, edit: false, delete: false, approve: false, export: false, tenantScope: false, branchScope: false, mfaRequired: false },
        inventory: { view: false, create: false, edit: false, delete: false, approve: false, export: false, tenantScope: false, branchScope: false, mfaRequired: false },
        governance: { view: false, create: false, edit: false, delete: false, approve: false, export: false, tenantScope: false, branchScope: false, mfaRequired: false }
      };
      
      const moduleMap = roleMap[moduleKey] || {
        view: false, create: false, edit: false, delete: false, approve: false, export: false, tenantScope: false, branchScope: false, mfaRequired: false
      };

      const updatedModule = {
        ...moduleMap,
        [field]: !moduleMap[field]
      };

      return {
        ...prev,
        [selectedRole]: {
          ...roleMap,
          [moduleKey]: updatedModule
        }
      };
    });
  };

  return (
    <div className="space-y-6">
      <div className="card p-5 bg-white border border-slate-200/80 shadow-sm rounded-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="font-black text-slate-800 text-sm tracking-wider uppercase flex items-center gap-2">
              <ShieldCheck className="h-4.5 w-4.5 text-indigo-500" />
              RBAC Matrix: {selectedRole}
            </h3>
            <p className="text-[10px] text-slate-400 font-semibold mt-0.5 uppercase tracking-wider">
              Read-Only Display — Mutation Wiring Deferred
            </p>
          </div>
          <button
            type="button"
            disabled
            aria-disabled="true"
            data-testid="permissionmatrix-save-button"
            title="Permission mutations are not yet wired. The role-permission matrix is read-only in this UI."
            className="btn bg-slate-200 text-slate-500 font-bold text-xs py-1.5 px-4 rounded-xl cursor-not-allowed opacity-60"
          >
            Save Role Permissions
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="p-3 text-slate-500 font-extrabold uppercase tracking-wider w-64">Module / Resource</th>
                <th className="p-3 text-slate-500 font-extrabold uppercase tracking-wider text-center">View</th>
                <th className="p-3 text-slate-500 font-extrabold uppercase tracking-wider text-center">Create</th>
                <th className="p-3 text-slate-500 font-extrabold uppercase tracking-wider text-center">Edit</th>
                <th className="p-3 text-slate-500 font-extrabold uppercase tracking-wider text-center">Delete</th>
                <th className="p-3 text-slate-500 font-extrabold uppercase tracking-wider text-center">Approve</th>
                <th className="p-3 text-slate-500 font-extrabold uppercase tracking-wider text-center">Export</th>
                <th className="p-3 text-slate-500 font-extrabold uppercase tracking-wider text-center whitespace-nowrap">Tenant Scope</th>
                <th className="p-3 text-slate-500 font-extrabold uppercase tracking-wider text-center whitespace-nowrap">Branch Scope</th>
                <th className="p-3 text-slate-500 font-extrabold uppercase tracking-wider text-center whitespace-nowrap">MFA</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {MODULES.map((mod) => {
                const roleData = matrixState[selectedRole] || {};
                const perm = roleData[mod.key] || {
                  view: false, create: false, edit: false, delete: false, approve: false, export: false, tenantScope: false, branchScope: false, mfaRequired: false
                };

                return (
                  <tr key={mod.key} className="hover:bg-indigo-50/10 transition-colors">
                    <td className="p-3">
                      <div className="font-bold text-slate-800">{mod.label}</div>
                      <div className="text-[9px] text-slate-400 mt-0.5 leading-relaxed font-semibold">
                        {mod.desc}
                      </div>
                    </td>
                    {(['view', 'create', 'edit', 'delete', 'approve', 'export', 'tenantScope', 'branchScope', 'mfaRequired'] as const).map((field) => {
                      const isChecked = perm[field];
                      return (
                        <td key={field} className="p-3 text-center">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            disabled={isReadOnly}
                            onChange={() => handleToggle(mod.key, field)}
                            className={`h-4.5 w-4.5 rounded border-slate-350 text-indigo-600 focus:ring-indigo-500/20 transition-all ${
                              isReadOnly ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'
                            }`}
                          />
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
export default PermissionMatrix;
