import React, { useState } from 'react';
import { PageHeader } from '../../components/ui/page-header';
import { AuditEventTable } from './components/AuditEventTable';
import { AlertTriangle, Search } from 'lucide-react';

interface AuditEvent {
  id: string;
  timestamp: string;
  actor: string;
  role: string;
  action: string;
  ipAddress: string;
  tenant: string;
  branch: string;
  hash: string;
  risk: 'LOW' | 'MEDIUM' | 'HIGH';
}

export const AuditLogsPage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [selectedRisk, setSelectedRisk] = useState<string>('ALL');
  const [selectedUser, setSelectedUser] = useState<string>('ALL');
  const [selectedRole, setSelectedRole] = useState<string>('ALL');
  const [selectedTenant, setSelectedTenant] = useState<string>('ALL');
  const [selectedBranch, setSelectedBranch] = useState<string>('ALL');
  const [selectedEventType, setSelectedEventType] = useState<string>('ALL');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  const mockEvents: AuditEvent[] = [
    {
      id: "AUD-101",
      timestamp: "2026-05-21 13:12:04",
      actor: "Global Admin",
      role: "Super Admin",
      action: "user.role.assign",
      ipAddress: "192.168.1.1",
      tenant: "System-wide",
      branch: "All Branches",
      hash: "8a4f91b2c3d4e5f67a8b9c0d1e2f3a4b",
      risk: "MEDIUM"
    },
    {
      id: "AUD-102",
      timestamp: "2026-05-21 13:15:33",
      actor: "System Security Monitor",
      role: "Governance System",
      action: "security.ip.blacklist",
      ipAddress: "127.0.0.1",
      tenant: "MediClinics Group",
      branch: "Singapore Branch",
      hash: "1234567890abcdef1234567890abcdef",
      risk: "HIGH"
    },
    {
      id: "AUD-103",
      timestamp: "2026-05-21 12:40:15",
      actor: "Maria Santos",
      role: "Nurse",
      action: "patient.record.read",
      ipAddress: "192.168.4.15",
      tenant: "St. Jude Hospital Network",
      branch: "Metro Manila",
      hash: "abcde12345f67a8b9c0d1e2f3a4b5c6d",
      risk: "LOW"
    },
    {
      id: "AUD-104",
      timestamp: "2026-05-21 11:15:02",
      actor: "Mark Santos",
      role: "Cashier",
      action: "billing.invoice.void",
      ipAddress: "192.168.4.16",
      tenant: "St. Jude Hospital Network",
      branch: "Metro Manila",
      hash: "cdef12345a67b8c9d0e1f2a3b4c5d6e7",
      risk: "HIGH"
    },
    {
      id: "AUD-105",
      timestamp: "2026-05-21 09:30:00",
      actor: "Dr. Arthur Stein",
      role: "Doctor",
      action: "encounter.soap.sign",
      ipAddress: "192.168.5.12",
      tenant: "St. Jude Hospital Network",
      branch: "Cebu City",
      hash: "f12345a67b8c9d0e1f2a3b4c5d6e7890",
      risk: "MEDIUM"
    }
  ];

  const filteredEvents = mockEvents.filter(e => {
    const matchesSearch = 
      e.actor.toLowerCase().includes(search.toLowerCase()) ||
      e.action.toLowerCase().includes(search.toLowerCase()) ||
      e.ipAddress.toLowerCase().includes(search.toLowerCase());
    
    const matchesRisk = selectedRisk === 'ALL' || e.risk === selectedRisk;
    const matchesUser = selectedUser === 'ALL' || e.actor === selectedUser;
    const matchesRole = selectedRole === 'ALL' || e.role === selectedRole;
    const matchesTenant = selectedTenant === 'ALL' || e.tenant === selectedTenant;
    const matchesBranch = selectedBranch === 'ALL' || e.branch === selectedBranch;
    const matchesEventType = selectedEventType === 'ALL' || e.action === selectedEventType;

    // Simple date boundary match
    let matchesDate = true;
    if (startDate) {
      matchesDate = matchesDate && e.timestamp >= `${startDate} 00:00:00`;
    }
    if (endDate) {
      matchesDate = matchesDate && e.timestamp <= `${endDate} 23:59:59`;
    }

    return matchesSearch && matchesRisk && matchesUser && matchesRole && matchesTenant && matchesBranch && matchesEventType && matchesDate;
  });

  const uniqueUsers = Array.from(new Set(mockEvents.map(e => e.actor)));
  const uniqueRoles = Array.from(new Set(mockEvents.map(e => e.role)));
  const uniqueTenants = Array.from(new Set(mockEvents.map(e => e.tenant)));
  const uniqueBranches = Array.from(new Set(mockEvents.map(e => e.branch)));
  const uniqueEventTypes = Array.from(new Set(mockEvents.map(e => e.action)));

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Sandbox Warning Banner */}
      <div className="p-4 bg-amber-50 border border-amber-150 rounded-2xl flex gap-3 text-xs text-amber-800">
        <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
        <div>
          <h5 className="font-extrabold uppercase text-[10px] tracking-wider">UI Audit Sandbox Shell</h5>
          <p className="font-medium mt-0.5">
            This workspace registers audit records in-memory. Cryptographic logs, integrity block chaining, and actor histories are simulations for visual validation. No live audit triggers are committed to the HMS database layer.
          </p>
        </div>
      </div>

      <div className="flex justify-between items-center">
        <PageHeader 
          title="System Audit Trails" 
          description="Trace cryptographically chained event activities, user operations, and resource changes." 
        />
      </div>

      {/* Advanced Filters Grid */}
      <div className="card p-5 bg-white border border-slate-200/80 shadow-sm rounded-2xl space-y-4">
        <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Advanced Audit Filters</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 text-xs">
          {/* Text Search */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-700">Search Text</label>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <input 
                type="text"
                placeholder="IP Address, Actor, Action..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-250 rounded-xl font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
          </div>

          {/* User Filter */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-700">User / Actor</label>
            <select
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
              className="w-full p-2 bg-slate-50 border border-slate-250 rounded-xl font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
            >
              <option value="ALL">All Users</option>
              {uniqueUsers.map(user => <option key={user} value={user}>{user}</option>)}
            </select>
          </div>

          {/* Role Filter */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-700">Role</label>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="w-full p-2 bg-slate-50 border border-slate-250 rounded-xl font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
            >
              <option value="ALL">All Roles</option>
              {uniqueRoles.map(role => <option key={role} value={role}>{role}</option>)}
            </select>
          </div>

          {/* Risk Level Filter */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-700">Risk Severity</label>
            <select 
              value={selectedRisk}
              onChange={(e) => setSelectedRisk(e.target.value)}
              className="w-full p-2 bg-slate-50 border border-slate-250 rounded-xl font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
            >
              <option value="ALL">All Risk Levels</option>
              <option value="LOW">Low Risk</option>
              <option value="MEDIUM">Medium Risk</option>
              <option value="HIGH">High Risk</option>
            </select>
          </div>

          {/* Tenant Filter */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-700">Tenant Scope</label>
            <select
              value={selectedTenant}
              onChange={(e) => setSelectedTenant(e.target.value)}
              className="w-full p-2 bg-slate-50 border border-slate-250 rounded-xl font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
            >
              <option value="ALL">All Tenants</option>
              {uniqueTenants.map(tenant => <option key={tenant} value={tenant}>{tenant}</option>)}
            </select>
          </div>

          {/* Branch Filter */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-700">Branch Scope</label>
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="w-full p-2 bg-slate-50 border border-slate-250 rounded-xl font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
            >
              <option value="ALL">All Branches</option>
              {uniqueBranches.map(branch => <option key={branch} value={branch}>{branch}</option>)}
            </select>
          </div>

          {/* Event Type Filter */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-700">Event Type (Action)</label>
            <select
              value={selectedEventType}
              onChange={(e) => setSelectedEventType(e.target.value)}
              className="w-full p-2 bg-slate-50 border border-slate-250 rounded-xl font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
            >
              <option value="ALL">All Event Types</option>
              {uniqueEventTypes.map(action => <option key={action} value={action}>{action}</option>)}
            </select>
          </div>

          {/* Date Range Filters */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-700">Date Range</label>
            <div className="flex gap-1.5">
              <input 
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-1/2 p-2 bg-slate-50 border border-slate-250 rounded-xl font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
              />
              <input 
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-1/2 p-2 bg-slate-50 border border-slate-250 rounded-xl font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Audit Log Table */}
      <AuditEventTable events={filteredEvents} />
    </div>
  );
};
export default AuditLogsPage;
