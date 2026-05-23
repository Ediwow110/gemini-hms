import React, { useState } from 'react';
import { Search, AlertTriangle, Eye, FileText, CheckCircle } from 'lucide-react';
import { StatusBadge } from '../../components/feedback/StatusBadge';
import ComplianceScopeFilter from './components/ComplianceScopeFilter';

interface AuditLogEntry {
  id: string;
  timestamp: string;
  actor: string;
  role: string;
  action: string;
  ipAddress: string;
  tenantName: string;
  branchName: string;
  signatureHash: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  details: string;
}

export const AuditReviewPage: React.FC = () => {
  const [scope, setScope] = useState({ tenantId: 'all', branchId: 'all' });
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRisk, setSelectedRisk] = useState('ALL');
  const [selectedEntry, setSelectedEntry] = useState<AuditLogEntry | null>(null);

  const mockEntries: AuditLogEntry[] = [
    {
      id: "AUD-991",
      timestamp: "2026-05-21 14:02:11",
      actor: "Super Admin Support",
      role: "Super Admin",
      action: "tenant.settings.update",
      ipAddress: "192.0.2.55",
      tenantName: "St. Jude Hospital Network",
      branchName: "All Branches",
      signatureHash: "0x8f7c9e120199da20",
      riskLevel: "MEDIUM",
      details: "Modified patient data retention thresholds from 7 to 10 years globally."
    },
    {
      id: "AUD-992",
      timestamp: "2026-05-21 13:58:02",
      actor: "Dr. Evelyn Martinez",
      role: "Doctor",
      action: "patient.emr.decrypt",
      ipAddress: "192.168.1.101",
      tenantName: "St. Jude Hospital Network",
      branchName: "St. Jude Metro",
      signatureHash: "0x12a5ff431b99cb55",
      riskLevel: "LOW",
      details: "Decrypted lab result payload for Jesse Pinkman (PAT-3304)."
    },
    {
      id: "AUD-993",
      timestamp: "2026-05-21 12:10:44",
      actor: "Nurse Marcus Vance",
      role: "Nurse",
      action: "patient.record.breakglass",
      ipAddress: "192.168.1.120",
      tenantName: "St. Jude Hospital Network",
      branchName: "St. Jude Metro",
      signatureHash: "0xaa2290f112e445ba",
      riskLevel: "HIGH",
      details: "Triggered emergency break-glass override. Reason: ICU patient cardiac arrest status."
    },
    {
      id: "AUD-994",
      timestamp: "2026-05-21 11:30:15",
      actor: "Cashier Sarah Connor",
      role: "Cashier",
      action: "billing.invoice.void",
      ipAddress: "192.168.3.14",
      tenantName: "MediClinics Group",
      branchName: "MediClinics Central",
      signatureHash: "0x55aa66dd9922eebb",
      riskLevel: "HIGH",
      details: "Voided medical services invoice INV-0044. Reason: HMO coverage error."
    }
  ];

  // Filtering
  const filteredEntries = mockEntries.filter(entry => {
    if (scope.tenantId !== 'all') {
      const matchTenant = scope.tenantId === 'TEN-001' ? 'St. Jude Hospital Network' : scope.tenantId === 'TEN-002' ? 'MediClinics Group' : 'Apex Healthcare Services';
      if (entry.tenantName !== matchTenant) return false;
    }
    if (scope.branchId !== 'all') {
      const matchBranch = scope.branchId === 'BR-001' ? 'St. Jude Metro' : scope.branchId === 'BR-002' ? 'St. Jude North' : scope.branchId === 'BR-003' ? 'MediClinics Central' : 'Apex West';
      if (entry.branchName !== matchBranch && entry.branchName !== 'All Branches') return false;
    }
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesText = 
        entry.actor.toLowerCase().includes(query) ||
        entry.action.toLowerCase().includes(query) ||
        entry.details.toLowerCase().includes(query) ||
        entry.ipAddress.toLowerCase().includes(query);
      if (!matchesText) return false;
    }
    if (selectedRisk !== 'ALL' && entry.riskLevel !== selectedRisk) {
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
            Audit Log Review
          </h2>
          <p className="text-xs text-slate-500 font-medium">Verify system event trails, configuration mutations, and role assignments</p>
        </div>
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex gap-2 text-[10px] text-amber-800 leading-normal max-w-md">
          <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
          <p>
            <strong>Sandbox Safety Rule:</strong> Audit logs reviewed in this workspace are for visualization and mock testing. Mutating, archiving, or deleting audit event logs is disabled.
          </p>
        </div>
      </div>

      {/* Scope Selector */}
      <ComplianceScopeFilter onScopeChange={(newScope) => setScope(newScope)} />

      {/* Search Grid */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by actor, action, details, IP..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>

        {/* Risk Dropdown */}
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
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50/80 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">Timestamp</th>
                <th className="px-6 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">Actor / Role</th>
                <th className="px-6 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">Action</th>
                <th className="px-6 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">Tenant / Branch</th>
                <th className="px-6 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">IP Address</th>
                <th className="px-6 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">Risk</th>
                <th className="px-6 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredEntries.map((e) => (
                <tr key={e.id} className="hover:bg-slate-50/50">
                  <td className="px-6 py-4 font-mono text-slate-500">{e.timestamp}</td>
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-bold text-slate-800">{e.actor}</p>
                      <p className="text-[10px] text-slate-400 font-semibold">{e.role}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-mono text-indigo-900 font-bold">{e.action}</td>
                  <td className="px-6 py-4 text-slate-550 font-medium">
                    <p>{e.tenantName}</p>
                    <p className="text-[10px] text-slate-400 font-semibold">{e.branchName}</p>
                  </td>
                  <td className="px-6 py-4 font-mono text-slate-500">{e.ipAddress}</td>
                  <td className="px-6 py-4">
                    <StatusBadge status={e.riskLevel} type={e.riskLevel === 'HIGH' ? 'danger' : e.riskLevel === 'MEDIUM' ? 'warning' : 'success'} />
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
                <p className="text-xs text-slate-400 mt-0.5">Mock Signature Trail Verification</p>
              </div>
            </div>

            <div className="space-y-3.5 text-xs text-slate-600 leading-relaxed border-t border-b border-slate-100 py-4 my-2">
              <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-xl border">
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Actor Account</p>
                  <p className="font-bold text-slate-700">{selectedEntry.actor}</p>
                  <p className="text-[10px] text-slate-550">{selectedEntry.role}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Cryptographic Signature</p>
                  <p className="font-mono text-[10px] text-indigo-900 font-bold">{selectedEntry.signatureHash}</p>
                </div>
              </div>

              <div className="space-y-1">
                <h5 className="font-bold text-slate-700">Action Description</h5>
                <p className="bg-slate-50 border p-2.5 rounded-xl text-slate-500 font-medium">
                  {selectedEntry.details}
                </p>
              </div>

              <div className="p-3 bg-slate-50 border rounded-xl text-[10px] text-slate-500 leading-normal flex gap-1.5 items-start">
                <CheckCircle className="h-4 w-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                <p>
                  <strong>Signature Verified:</strong> Hash links successfully parsed. Sandbox security logs are structurally valid.
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
  );
};

export default AuditReviewPage;
