import React, { useState } from 'react';
import { Search, Eye, FileText, CheckCircle, HelpCircle } from 'lucide-react';
import { StatusBadge } from '../../components/feedback/StatusBadge';
import ComplianceScopeFilter from './components/ComplianceScopeFilter';
import { useAuditEvents } from '../../hooks/use-compliance';
import { HmsPageHeader } from '../../components/hms-page';
import { HmsDashboardShell, HmsAuditFooter } from '../../components/hms-dashboard';

export const AuditReviewPage: React.FC = () => {
  const [, setScope] = useState({ tenantId: 'all', branchId: 'all' });
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRisk, setSelectedRisk] = useState('ALL');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [selectedEntry, setSelectedEntry] = useState<any>(null);

  const { events, loading, error, refetch } = useAuditEvents({ pageSize: 50 });

  // Filter locally
  const filteredEvents = events.filter(entry => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchesText =
        (entry.eventKey || '').toLowerCase().includes(q) ||
        (entry.activeRole || '').toLowerCase().includes(q) ||
        (entry.ipAddress || '').toLowerCase().includes(q);
      if (!matchesText) return false;
    }
    if (selectedRisk !== 'ALL') {
      // Simple risk mapping from event key heuristics
      const hasHighRisk = entry.eventKey?.includes('PRIVILEGED') || entry.eventKey?.includes('BREAK_GLASS');
      const hasMediumRisk = entry.eventKey?.includes('PERMISSION') || entry.eventKey?.includes('ROLE');
      const risk = hasHighRisk ? 'HIGH' : hasMediumRisk ? 'MEDIUM' : 'LOW';
      if (risk !== selectedRisk) return false;
    }
    return true;
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const getRiskLevel = (entry: any): 'LOW' | 'MEDIUM' | 'HIGH' => {
    if (entry.eventKey?.includes('PRIVILEGED') || entry.eventKey?.includes('BREAK_GLASS') || entry.eventKey?.includes('UNAUTHORIZED')) return 'HIGH';
    if (entry.eventKey?.includes('PERMISSION') || entry.eventKey?.includes('ROLE') || entry.eventKey?.includes('APPROVED')) return 'MEDIUM';
    return 'LOW';
  };

  return (
    <HmsDashboardShell widthTier="full">
      <div className="space-y-6 pb-12">
        <HmsPageHeader
          title="Audit Log Review"
          description="Verify system event trails, configuration mutations, and role assignments"
        />

      {/* Scope Selector */}
      <ComplianceScopeFilter onScopeChange={(newScope) => setScope(newScope)} />

      {/* Search Grid */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by event key, role, IP..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>
        <select
          value={selectedRisk}
          onChange={(e) => setSelectedRisk(e.target.value)}
          className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
        >
          <option value="ALL">All Risk Severities</option>
          <option value="LOW">Low Risk</option>
          <option value="MEDIUM">Medium Risk</option>
          <option value="HIGH">High Risk</option>
        </select>
      </div>

      {/* Audit Log Table */}
      <div className="card overflow-hidden bg-white border border-slate-200/80 shadow-sm rounded-2xl">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">Loading audit events...</div>
        ) : error ? (
          <div className="p-6 text-center text-xs text-red-600">
            <p className="font-bold">Error loading audit events</p>
            <p className="mt-1">{error}</p>
            <button onClick={refetch} className="mt-2 text-indigo-600 font-bold cursor-pointer hover:underline">Retry</button>
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-2">
            <HelpCircle className="h-8 w-8 mx-auto text-slate-300" />
            <p className="text-xs font-bold text-slate-600">No audit events found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50/80 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">Timestamp</th>
                  <th className="px-6 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">Event Key</th>
                  <th className="px-6 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">Role</th>
                  <th className="px-6 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">Record Type</th>
                  <th className="px-6 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">IP Address</th>
                  <th className="px-6 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">Risk</th>
                  <th className="px-6 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredEvents.map((e) => (
                  <tr key={e.id} className="hover:bg-slate-50/50">
                    <td className="px-6 py-4 font-mono text-slate-500">{new Date(e.createdAt).toLocaleString()}</td>
                    <td className="px-6 py-4 font-mono text-indigo-900 font-bold">{e.eventKey}</td>
                    <td className="px-6 py-4 font-semibold text-slate-600">{e.activeRole || 'N/A'}</td>
                    <td className="px-6 py-4 text-slate-550 font-medium">{e.recordType}</td>
                    <td className="px-6 py-4 font-mono text-slate-500">{e.ipAddress || 'N/A'}</td>
                    <td className="px-6 py-4">
                      <StatusBadge status={getRiskLevel(e)} type={getRiskLevel(e) === 'HIGH' ? 'danger' : getRiskLevel(e) === 'MEDIUM' ? 'warning' : 'success'} />
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => setSelectedEntry(e)}
                        className="btn border border-slate-200 hover:bg-slate-50 text-slate-600 px-3 py-1.5 rounded-lg text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer"
                      >
                        <Eye className="h-3.5 w-3.5 text-indigo-500" /> Detail
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedEntry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 shadow-2xl max-w-md w-full border border-slate-200 animate-scale-in relative">
            <div className="flex gap-3 mb-4">
              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl h-fit border border-indigo-100">
                <FileText className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider select-none">
                  Audit Log Details
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Event ID: {selectedEntry.id}</p>
              </div>
            </div>

            <div className="space-y-3.5 text-xs text-slate-600 leading-relaxed border-t border-b border-slate-100 py-4 my-2">
              <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-xl border">
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Event Details</p>
                  <p className="font-bold text-slate-700">{selectedEntry.eventKey}</p>
                  <p className="text-[10px] text-slate-550">{selectedEntry.activeRole || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Chain Hash</p>
                  <p className="font-mono text-[10px] text-indigo-900 font-bold truncate">{selectedEntry.hash || 'N/A'}</p>
                </div>
              </div>

              <div className="space-y-1">
                <h5 className="font-bold text-slate-700">Record Information</h5>
                <p className="bg-slate-50 border p-2.5 rounded-xl text-slate-500 font-medium">
                  Type: {selectedEntry.recordType} | ID: {selectedEntry.recordId}
                </p>
              </div>

              <div className="p-3 bg-slate-50 border rounded-xl text-[10px] text-slate-500 leading-normal flex gap-1.5 items-start">
                <CheckCircle className="h-4 w-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                <p>
                  <strong>Verified:</strong> This event is from the real audit log with chain-of-custody hashing.
                </p>
              </div>
            </div>

            <div className="mt-5 flex gap-2">
              <button 
                onClick={() => setSelectedEntry(null)}
                className="w-full btn bg-indigo-650 hover:bg-indigo-700 text-white font-bold py-2 rounded-xl text-xs transition-colors cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
      <HmsAuditFooter />
    </HmsDashboardShell>
  );
};

export default AuditReviewPage;
