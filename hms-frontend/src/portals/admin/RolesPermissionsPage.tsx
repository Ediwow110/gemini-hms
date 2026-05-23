import React, { useState } from 'react';
import { PageHeader } from '../../components/ui/page-header';
import { PermissionMatrix } from './components/PermissionMatrix';
import { Shield, AlertTriangle, Key, Users } from 'lucide-react';

export const RolesPermissionsPage: React.FC = () => {
  const mockRoles = [
    'Super Admin',
    'Branch Admin',
    'Doctor',
    'Nurse',
    'Lab Technician',
    'Cashier'
  ];

  const [selectedRole, setSelectedRole] = useState<string>('Super Admin');

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Sandbox Warning Banner */}
      <div className="p-4 bg-amber-50 border border-amber-150 rounded-2xl flex gap-3 text-xs text-amber-800">
        <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
        <div>
          <h5 className="font-extrabold uppercase text-[10px] tracking-wider">UI RBAC Sandbox Shell</h5>
          <p className="font-medium mt-0.5">
            This administration matrix operates in local sandbox memory. Multi-factor authentication (MFA) requirements, granular authorization rules, and tenant/branch scoped permissions are simulated. No database mappings are altered.
          </p>
        </div>
      </div>

      <div className="flex justify-between items-center">
        <PageHeader 
          title="RBAC Governance & Permissions" 
          description="Edit application authorization roles, map permissions, and verify role bounds." 
        />
      </div>

      {/* Role Details and Configuration */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Role List & Scoping Metadata */}
        <div className="space-y-6">
          <div className="card p-5 bg-white border border-slate-200/80 shadow-sm rounded-2xl space-y-4">
            <h3 className="font-bold text-slate-800 text-sm tracking-wider uppercase border-b border-slate-100 pb-3 flex items-center gap-2">
              <Users className="h-4.5 w-4.5 text-indigo-500" />
              HMS Application Roles
            </h3>

            <div className="space-y-2">
              {mockRoles.map((role) => {
                const isActive = selectedRole === role;
                return (
                  <button
                    key={role}
                    onClick={() => setSelectedRole(role)}
                    className={`w-full p-3.5 border text-left transition-all duration-200 rounded-xl flex items-center justify-between text-xs cursor-pointer group ${
                      isActive
                        ? 'bg-gradient-to-r from-indigo-50 to-violet-50/50 border-indigo-200 shadow-sm text-indigo-900 font-bold'
                        : 'bg-slate-50 hover:bg-slate-100/50 border-slate-200/60 hover:border-slate-250 text-slate-700 font-medium'
                    }`}
                  >
                    <div>
                      <p className={`font-bold ${isActive ? 'text-indigo-900' : 'text-slate-800 group-hover:text-slate-900'}`}>{role}</p>
                      <p className="text-[9px] text-slate-400 font-semibold mt-0.5 uppercase tracking-wide">
                        {role === 'Super Admin' 
                          ? 'Global Governance Access' 
                          : role.includes('Admin') 
                          ? 'Tenant Scope Scoped' 
                          : 'Branch Context Scoped'}
                      </p>
                    </div>
                    
                    <div className="flex gap-2">
                      <span className={`text-[8px] font-black px-1.5 py-0.5 rounded border uppercase tracking-wider ${
                        role === 'Super Admin' || role === 'Branch Admin'
                          ? 'bg-rose-50 text-rose-700 border-rose-100'
                          : 'bg-slate-150 text-slate-500 border-slate-200'
                      }`}>
                        MFA REQUIRED
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="card p-5 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs space-y-3 leading-relaxed">
            <h4 className="font-bold text-slate-700 flex items-center gap-1.5">
              <Shield className="h-4.5 w-4.5 text-slate-500" />
              Tenant & Branch Scoping Rules
            </h4>
            <p className="text-slate-500">
              Security permissions map to distinct containment scopes. **Super Admin** bypasses branch boundary constraints. **Branch Admin** has dashboard views across branches but mutations are limited. **Doctors, Nurses, Lab Technicians, and Cashiers** are strictly bound to their selected branch contexts.
            </p>
            <div className="flex items-center gap-2 text-indigo-600 font-bold bg-indigo-50/50 p-2.5 rounded-xl border border-indigo-100">
              <Key className="h-4 w-4" />
              <span>Session constraints are enforced locally.</span>
            </div>
          </div>
        </div>

        {/* Right Column: Permission Matrix */}
        <div className="lg:col-span-2">
          <PermissionMatrix selectedRole={selectedRole} />
        </div>
      </div>
    </div>
  );
};
export default RolesPermissionsPage;
