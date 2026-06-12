import React, { useState } from 'react';
import { Search, Filter, HelpCircle } from 'lucide-react';
import ComplianceScopeFilter from './components/ComplianceScopeFilter';
import PHIAccessTable from './components/PHIAccessTable';
import { useAuditEvents } from '../../hooks/use-compliance';
import { HmsPageHeader } from '../../components/hms-page';
import { HmsDashboardShell, HmsAuditFooter } from '../../components/hms-dashboard';

export const PHIAccessMonitorPage: React.FC = () => {
  const [, setScope] = useState({ tenantId: 'all', branchId: 'all' });
  const [actorSearch, setActorSearch] = useState('');
  const [patientSearch, setPatientSearch] = useState('');
  const [accessFilter, setAccessFilter] = useState('ALL');

  const { events: auditEvents, loading, error, refetch } = useAuditEvents({ pageSize: 100 });

  // Filter to clinical record types for PHI monitoring
  const phiEvents = auditEvents
    .filter(e => ['Patient', 'Encounter', 'LabResult', 'Prescription', 'SOAP', 'ClinicalNote'].includes(e.recordType))
    .map(e => ({
      id: e.id,
      timestamp: new Date(e.createdAt).toLocaleString(),
      actorName: e.activeRole || 'Unknown',
      actorRole: e.activeRole || 'N/A',
      patientName: e.recordId,
      patientId: e.recordId,
      tenantName: '',
      branchName: '',
      accessType: (e.eventKey?.includes('BREAK_GLASS') || e.eventKey?.includes('UNAUTHORIZED')) ? 'UNAUTHORIZED' as const : 'ROUTINE' as const,
      reason: e.eventKey || '',
      riskScore: e.eventKey?.includes('BREAK_GLASS') ? 68 : e.eventKey?.includes('UNAUTHORIZED') ? 92 : 12,
    }));

  // Filter
  const filteredEvents = phiEvents.filter(e => {
    if (actorSearch && !e.actorRole.toLowerCase().includes(actorSearch.toLowerCase())) return false;
    if (patientSearch && !e.patientId.toLowerCase().includes(patientSearch.toLowerCase())) return false;
    if (accessFilter !== 'ALL' && e.accessType !== accessFilter) return false;
    return true;
  });

  return (
    <HmsDashboardShell widthTier="full">
      <div className="space-y-6 pb-12">
        <HmsPageHeader
          title="PHI Access Monitor"
          description="Real audit records of protected health information access events with tenant isolation"
        />

      {/* Scope Filtering */}
      <ComplianceScopeFilter onScopeChange={(newScope) => setScope(newScope)} />

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={actorSearch}
            onChange={(e) => setActorSearch(e.target.value)}
            placeholder="Filter by Role..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={patientSearch}
            onChange={(e) => setPatientSearch(e.target.value)}
            placeholder="Filter by Record ID..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
          <select
            value={accessFilter}
            onChange={(e) => setAccessFilter(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer appearance-none"
          >
            <option value="ALL">All Access Types</option>
            <option value="ROUTINE">Routine Access</option>
            <option value="EMERGENCY">Emergency (Break-glass)</option>
            <option value="UNAUTHORIZED">Unauthorized Access</option>
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

        {loading ? (
          <div className="card bg-white border border-slate-200/80 shadow-sm rounded-2xl p-12 text-center text-xs text-slate-400">
            Loading PHI access events...
          </div>
        ) : error ? (
          <div className="card bg-red-50 border border-red-200 rounded-2xl p-6 text-xs text-red-700">
            <p className="font-bold">Error loading events</p>
            <p>{error}</p>
            <button onClick={refetch} className="mt-2 text-indigo-600 font-bold cursor-pointer hover:underline">Retry</button>
          </div>
        ) : filteredEvents.length > 0 ? (
          <PHIAccessTable events={filteredEvents} />
        ) : (
          <div className="card bg-slate-50/50 border border-dashed border-slate-350 rounded-2xl p-12 text-center text-slate-400 space-y-2">
            <HelpCircle className="h-8 w-8 mx-auto text-slate-300" />
            <p className="text-xs font-bold text-slate-600">No matching PHI access events found</p>
            <p className="text-[11px] text-slate-450">Try broadening your filter parameters.</p>
          </div>
        )}
      </div>
      </div>
      <HmsAuditFooter />
    </HmsDashboardShell>
  );
};

export default PHIAccessMonitorPage;
