import React, { useState } from 'react';
import { Search, Filter, HelpCircle, AlertTriangle } from 'lucide-react';
import ComplianceScopeFilter from './components/ComplianceScopeFilter';
import PHIAccessTable, { PHIAccessEvent } from './components/PHIAccessTable';

export const PHIAccessMonitorPage: React.FC = () => {
  const [scope, setScope] = useState({ tenantId: 'all', branchId: 'all' });
  const [actorSearch, setActorSearch] = useState('');
  const [patientSearch, setPatientSearch] = useState('');
  const [accessFilter, setAccessFilter] = useState('ALL');

  // Full set of mock PHI Access Events
  const mockEvents: PHIAccessEvent[] = [
    {
      id: 'EVT-1002',
      timestamp: '2026-05-21 13:45:10',
      actorName: 'Dr. Evelyn Martinez',
      actorRole: 'Doctor',
      patientName: 'John Doe',
      patientId: 'PAT-8812',
      tenantName: 'St. Jude Hospital Network',
      branchName: 'St. Jude Metro',
      accessType: 'ROUTINE',
      reason: 'Standard EMR charting during consultation',
      riskScore: 12
    },
    {
      id: 'EVT-1003',
      timestamp: '2026-05-21 12:30:15',
      actorName: 'Nurse Marcus Vance',
      actorRole: 'Nurse',
      patientName: 'Jane Smith',
      patientId: 'PAT-4322',
      tenantName: 'St. Jude Hospital Network',
      branchName: 'St. Jude Metro',
      accessType: 'EMERGENCY',
      reason: 'Break-glass trigger: Critical triage entry in ICU',
      riskScore: 68
    },
    {
      id: 'EVT-1004',
      timestamp: '2026-05-21 11:15:00',
      actorName: 'Unknown Administrator',
      actorRole: 'System Admin',
      patientName: 'Robert Johnson',
      patientId: 'PAT-7019',
      tenantName: 'MediClinics Group',
      branchName: 'MediClinics Central',
      accessType: 'UNAUTHORIZED',
      reason: 'Access from anomalous IP range outside subnet',
      riskScore: 92
    },
    {
      id: 'EVT-1005',
      timestamp: '2026-05-21 09:12:44',
      actorName: 'Cashier Sarah Connor',
      actorRole: 'Cashier',
      patientName: 'Alice Williams',
      patientId: 'PAT-9012',
      tenantName: 'St. Jude Hospital Network',
      branchName: 'St. Jude North',
      accessType: 'ROUTINE',
      reason: 'Invoice payment collection processing',
      riskScore: 25
    },
    {
      id: 'EVT-1006',
      timestamp: '2026-05-20 16:50:12',
      actorName: 'Lab Tech Walter White',
      actorRole: 'Lab Technician',
      patientName: 'Jesse Pinkman',
      patientId: 'PAT-3304',
      tenantName: 'Apex Healthcare Services',
      branchName: 'Apex West',
      accessType: 'ROUTINE',
      reason: 'Encoding blood test lab panels',
      riskScore: 18
    }
  ];

  // Filtering Logic
  const filteredEvents = mockEvents.filter(e => {
    // Tenant Scope
    if (scope.tenantId !== 'all') {
      const matchTenant = scope.tenantId === 'TEN-001' ? 'St. Jude Hospital Network' : scope.tenantId === 'TEN-002' ? 'MediClinics Group' : 'Apex Healthcare Services';
      if (e.tenantName !== matchTenant) return false;
    }
    // Branch Scope
    if (scope.branchId !== 'all') {
      const matchBranch = scope.branchId === 'BR-001' ? 'St. Jude Metro' : scope.branchId === 'BR-002' ? 'St. Jude North' : scope.branchId === 'BR-003' ? 'MediClinics Central' : 'Apex West';
      if (e.branchName !== matchBranch) return false;
    }
    // Actor search
    if (actorSearch && !e.actorName.toLowerCase().includes(actorSearch.toLowerCase())) {
      return false;
    }
    // Patient search
    if (patientSearch && !e.patientName.toLowerCase().includes(patientSearch.toLowerCase())) {
      return false;
    }
    // Access type filter
    if (accessFilter !== 'ALL' && e.accessType !== accessFilter) {
      return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-800 tracking-tight" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            PHI Access Monitor
          </h2>
          <p className="text-xs text-slate-500 font-medium">Detailed audit logs of protected health information access events with tenant isolation context</p>
        </div>
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex gap-2 text-[10px] text-amber-800 leading-normal max-w-md">
          <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0 animate-pulse" />
          <p>
            <strong>Sandbox Notice:</strong> PHI Access logs are simulated. Investigation, flagging, or compliance audits on these records do not write to backend persistence databases.
          </p>
        </div>
      </div>

      {/* Scope Filtering */}
      <ComplianceScopeFilter onScopeChange={(newScope) => setScope(newScope)} />

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
        {/* Actor Filter */}
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={actorSearch}
            onChange={(e) => setActorSearch(e.target.value)}
            placeholder="Filter by Actor/User..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>

        {/* Patient Filter */}
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={patientSearch}
            onChange={(e) => setPatientSearch(e.target.value)}
            placeholder="Filter by Patient name/ID..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>

        {/* Access Type Filter */}
        <div className="relative">
          <Filter className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
          <select
            value={accessFilter}
            onChange={(e) => setAccessFilter(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer appearance-none"
          >
            <option value="ALL">All Access Types</option>
            <option value="ROUTINE">Routine Access Only</option>
            <option value="EMERGENCY">Emergency (Break-glass) Only</option>
            <option value="UNAUTHORIZED">Unauthorized Access Only</option>
          </select>
        </div>
      </div>

      {/* Main Table view */}
      <div className="space-y-4">
        <div className="flex justify-between items-center px-1">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Showing {filteredEvents.length} PHI Access Events
          </span>
        </div>

        {filteredEvents.length > 0 ? (
          <PHIAccessTable events={filteredEvents} />
        ) : (
          <div className="card bg-slate-50/50 border border-dashed border-slate-350 rounded-2xl p-12 text-center text-slate-400 space-y-2">
            <HelpCircle className="h-8 w-8 mx-auto text-slate-300" />
            <p className="text-xs font-bold text-slate-655 text-slate-600">No matching PHI access events found</p>
            <p className="text-[11px] text-slate-450">Try broadening your filter parameters.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PHIAccessMonitorPage;
