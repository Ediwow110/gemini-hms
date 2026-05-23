import React, { useState } from 'react';
import { Search, AlertTriangle, HelpCircle } from 'lucide-react';
import ComplianceScopeFilter from './components/ComplianceScopeFilter';
import ExportEventTable, { ExportEvent } from './components/ExportEventTable';

export const ExportLogsPage: React.FC = () => {
  const [scope, setScope] = useState({ tenantId: 'all', branchId: 'all' });
  const [search, setSearch] = useState('');
  const [formatFilter, setFormatFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const mockExportEvents: ExportEvent[] = [
    {
      id: "EXP-001",
      timestamp: "2026-05-21 12:45:00",
      actorEmail: "billing.support@mediclinics.org",
      actorRole: "Finance",
      tenantName: "MediClinics Group",
      branchName: "MediClinics Central",
      recordsCount: 140,
      format: "CSV",
      destination: "Local Downloads folder",
      status: "SUCCESS"
    },
    {
      id: "EXP-002",
      timestamp: "2026-05-21 11:30:15",
      actorEmail: "nurse.vance@stjude.org",
      actorRole: "Nurse",
      tenantName: "St. Jude Hospital Network",
      branchName: "St. Jude Metro",
      recordsCount: 88,
      format: "PDF",
      destination: "Email attachment to patient",
      status: "SUCCESS"
    },
    {
      id: "EXP-003",
      timestamp: "2026-05-21 10:15:22",
      actorEmail: "unknown.user@anonymous.net",
      actorRole: "External API Agent",
      tenantName: "St. Jude Hospital Network",
      branchName: "St. Jude North",
      recordsCount: 1500,
      format: "JSON",
      destination: "External IP: 198.51.100.12",
      status: "BLOCKED"
    },
    {
      id: "EXP-004",
      timestamp: "2026-05-20 16:22:11",
      actorEmail: "dr.martinez@stjude.org",
      actorRole: "Doctor",
      tenantName: "St. Jude Hospital Network",
      branchName: "St. Jude Metro",
      recordsCount: 5,
      format: "ZIP",
      destination: "Encrypted Flash Drive (Radiology)",
      status: "SUCCESS"
    }
  ];

  // Filtering
  const filteredEvents = mockExportEvents.filter(e => {
    if (scope.tenantId !== 'all') {
      const matchTenant = scope.tenantId === 'TEN-001' ? 'St. Jude Hospital Network' : scope.tenantId === 'TEN-002' ? 'MediClinics Group' : 'Apex Healthcare Services';
      if (e.tenantName !== matchTenant) return false;
    }
    if (scope.branchId !== 'all') {
      const matchBranch = scope.branchId === 'BR-001' ? 'St. Jude Metro' : scope.branchId === 'BR-002' ? 'St. Jude North' : scope.branchId === 'BR-003' ? 'MediClinics Central' : 'Apex West';
      if (e.branchName !== matchBranch) return false;
    }
    if (search) {
      const query = search.toLowerCase();
      if (!e.actorEmail.toLowerCase().includes(query) && !e.destination.toLowerCase().includes(query)) return false;
    }
    if (formatFilter !== 'ALL' && e.format !== formatFilter) return false;
    if (statusFilter !== 'ALL' && e.status !== statusFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-800 tracking-tight" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Patient Data Export Logs
          </h2>
          <p className="text-xs text-slate-500 font-medium">Trace all external data packaging actions, file downloads, and bulk extraction tasks</p>
        </div>
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex gap-2 text-[10px] text-amber-800 leading-normal max-w-md">
          <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
          <p>
            <strong>Sandbox Safety Rule:</strong> Export event audits are visual simulators. No patient database files are compiled, zipped, or downloaded during this mock process.
          </p>
        </div>
      </div>

      {/* Scope Selector */}
      <ComplianceScopeFilter onScopeChange={(newScope) => setScope(newScope)} />

      {/* Advanced Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
        {/* Text Search */}
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by initiator email or destination..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>

        {/* Format Select */}
        <select
          value={formatFilter}
          onChange={(e) => setFormatFilter(e.target.value)}
          className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
        >
          <option value="ALL">All File Formats</option>
          <option value="CSV">CSV Format</option>
          <option value="PDF">PDF Document</option>
          <option value="JSON">JSON Data</option>
          <option value="ZIP">Encrypted ZIP Archive</option>
        </select>

        {/* Status Select */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
        >
          <option value="ALL">All Event Statuses</option>
          <option value="SUCCESS">Success Only</option>
          <option value="FAILED">Failed Only</option>
          <option value="BLOCKED">Blocked Alerts Only</option>
        </select>
      </div>

      {/* Main Table view */}
      <div className="space-y-4">
        <div className="flex justify-between items-center px-1">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Showing {filteredEvents.length} Export Events
          </span>
        </div>

        {filteredEvents.length > 0 ? (
          <ExportEventTable events={filteredEvents} />
        ) : (
          <div className="card bg-slate-50/50 border border-dashed border-slate-350 rounded-2xl p-12 text-center text-slate-400 space-y-2">
            <HelpCircle className="h-8 w-8 mx-auto text-slate-300" />
            <p className="text-xs font-bold text-slate-655 text-slate-600">No export logs found</p>
            <p className="text-[11px] text-slate-450">Try broadening your search query or filters.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExportLogsPage;
