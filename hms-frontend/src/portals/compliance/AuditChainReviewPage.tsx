import React, { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { AuditChainStatusPanel, AuditBlock } from './components/AuditChainStatusPanel';
import ComplianceScopeFilter from './components/ComplianceScopeFilter';

export const AuditChainReviewPage: React.FC = () => {
  const [scope, setScope] = useState({ tenantId: 'all', branchId: 'all' });
  const blocks: AuditBlock[] = [
    {
      blockIndex: 124,
      timestamp: "2026-05-21 14:00:00",
      transactionCount: 15,
      previousHash: "0x3f5b8c9e1201aa99",
      blockHash: "0x8f2ae911bcdaef44",
      verificationStatus: "VERIFIED"
    },
    {
      blockIndex: 123,
      timestamp: "2026-05-21 13:30:00",
      transactionCount: 42,
      previousHash: "0x12a5ff431b99cb55",
      blockHash: "0x3f5b8c9e1201aa99",
      verificationStatus: "VERIFIED"
    },
    {
      blockIndex: 122,
      timestamp: "2026-05-21 13:00:00",
      transactionCount: 8,
      previousHash: "0xaa2290f112e445ba",
      blockHash: "0x12a5ff431b99cb55",
      verificationStatus: "VERIFIED"
    },
    {
      blockIndex: 121,
      timestamp: "2026-05-21 12:30:00",
      transactionCount: 22,
      previousHash: "0x55aa66dd9922eebb",
      blockHash: "0xaa2290f112e445ba",
      verificationStatus: "VERIFIED"
    }
  ];

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-800 tracking-tight" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Audit Chain Verification
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            Verify system event ledger integrity with hash chaining diagnostics and anti-tamper validations (Tenant: {scope.tenantId}, Branch: {scope.branchId})
          </p>
        </div>
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex gap-2 text-[10px] text-amber-800 leading-normal max-w-md">
          <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
          <p>
            <strong>Sandbox Safety Rule:</strong> Hashing and chain link verification are simulated processes. No backend databases are scanned, and no live SHA-256 validation is occurring on production server clusters.
          </p>
        </div>
      </div>

      {/* Scope Selector */}
      <ComplianceScopeFilter onScopeChange={(newScope) => setScope(newScope)} />

      {/* Chain Status Panel Component */}
      <div className="space-y-4">
        <AuditChainStatusPanel blocks={blocks} onVerifyChain={() => console.log('Audit chain verification simulation triggered')} />
      </div>
    </div>
  );
};

export default AuditChainReviewPage;
