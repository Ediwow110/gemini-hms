import React, { useState } from 'react';
import { ShieldCheck, RefreshCw, AlertTriangle, Lock, Cpu, Server } from 'lucide-react';
import { StatusBadge } from '../../../components/feedback/StatusBadge';

export interface AuditBlock {
  blockIndex: number;
  timestamp: string;
  transactionCount: number;
  previousHash: string;
  blockHash: string;
  verificationStatus: 'VERIFIED' | 'WARNING' | 'FAILED';
}

interface AuditChainStatusPanelProps {
  blocks: AuditBlock[];
  onVerifyChain?: () => void;
}

export const AuditChainStatusPanel: React.FC<AuditChainStatusPanelProps> = ({ blocks, onVerifyChain }) => {
  const [verifying, setVerifying] = useState(false);
  const [log, setLog] = useState<string[]>([]);
  const [verificationResult, setVerificationResult] = useState<'IDLE' | 'SUCCESS' | 'WARNING'>('IDLE');

  const triggerVerification = () => {
    if (verifying) return;
    setVerifying(true);
    setVerificationResult('IDLE');
    setLog(['[Chain Audit] Launching cryptographic verification...', '[Chain Audit] Fetching root hash...']);

    if (onVerifyChain) {
      onVerifyChain();
    }

    setTimeout(() => {
      setLog(prev => [
        ...prev,
        '[Verification] Block 0 (Genesis Block) hash matched: 0x00000000001a9f...',
        '[Verification] Checking backlink hashes for blocks 1-124...'
      ]);
    }, 600);

    setTimeout(() => {
      setLog(prev => [
        ...prev,
        '[Signature Verification] Validating RSA-3072 public key structures...',
        '[Merkle Tree] Recalculating transactions tree root... MATCHED'
      ]);
    }, 1300);

    setTimeout(() => {
      setLog(prev => [
        ...prev,
        '[Verification Complete] All block links intact. Chain integrity 100%.',
        '[Audit Log] Sealed with HMAC-SHA256 signature.'
      ]);
      setVerificationResult('SUCCESS');
      setVerifying(false);
    }, 2200);
  };

  return (
    <div className="card bg-white border border-slate-200/80 shadow-sm rounded-2xl p-5 space-y-5">
      {/* Header */}
      <div className="flex justify-between items-start flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-650">
            <Lock className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Cryptographic Hash Chain</h4>
            <p className="text-[10px] text-slate-400 font-semibold">Ledger anti-tampering verification</p>
          </div>
        </div>

        <div className="flex gap-2 items-center">
          <StatusBadge status={verificationResult === 'SUCCESS' ? 'SECURE' : 'UNVERIFIED'} type={verificationResult === 'SUCCESS' ? 'success' : 'warning'} />
          <button
            onClick={triggerVerification}
            disabled={verifying}
            className="py-1.5 px-3 border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${verifying ? 'animate-spin text-indigo-600' : 'text-slate-400'}`} />
            {verifying ? 'Verifying...' : 'Verify Chain'}
          </button>
        </div>
      </div>

      {/* Stats Block */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-3 bg-slate-50 border rounded-xl flex items-center gap-3">
          <div className="p-2 bg-white border rounded-lg text-slate-400">
            <Server className="h-4 w-4" />
          </div>
          <div>
            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Total Blocks</p>
            <p className="text-sm font-extrabold text-slate-800 font-mono">{blocks.length}</p>
          </div>
        </div>

        <div className="p-3 bg-slate-50 border rounded-xl flex items-center gap-3">
          <div className="p-2 bg-white border rounded-lg text-slate-400">
            <Cpu className="h-4 w-4" />
          </div>
          <div>
            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Verification Engine</p>
            <p className="text-sm font-extrabold text-slate-800 font-mono">HMAC-SHA256</p>
          </div>
        </div>

        <div className="p-3 bg-slate-50 border rounded-xl flex items-center gap-3">
          <div className="p-2 bg-white border rounded-lg text-slate-400">
            <ShieldCheck className="h-4 w-4" />
          </div>
          <div>
            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Drift Warning Rate</p>
            <p className="text-sm font-extrabold text-emerald-600 font-mono">0.00%</p>
          </div>
        </div>
      </div>

      {/* Terminal View */}
      {log.length > 0 && (
        <div className="bg-slate-900 text-emerald-400 font-mono text-[10px] p-3.5 rounded-xl space-y-1 h-32 overflow-y-auto border border-slate-950">
          {log.map((entry, index) => (
            <p key={index} className={entry.includes('[Verification Complete]') ? 'text-indigo-300 font-bold' : ''}>
              {entry}
            </p>
          ))}
        </div>
      )}

      {/* Blocks Grid/List */}
      <div className="space-y-2">
        <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Recent Chain Blocks</h5>
        <div className="overflow-x-auto border border-slate-200/60 rounded-xl">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 border-b">
              <tr>
                <th className="px-4 py-2 font-bold text-slate-500 uppercase tracking-wider">Block</th>
                <th className="px-4 py-2 font-bold text-slate-500 uppercase tracking-wider">Timestamp</th>
                <th className="px-4 py-2 font-bold text-slate-500 uppercase tracking-wider">Prev Hash</th>
                <th className="px-4 py-2 font-bold text-slate-500 uppercase tracking-wider">Block Hash</th>
                <th className="px-4 py-2 font-bold text-slate-500 uppercase tracking-wider text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {blocks.map((b) => (
                <tr key={b.blockIndex} className="hover:bg-slate-50/50">
                  <td className="px-4 py-2.5 font-bold text-slate-700">#{b.blockIndex}</td>
                  <td className="px-4 py-2.5 text-slate-500 text-[10px]">{b.timestamp}</td>
                  <td className="px-4 py-2.5 text-slate-400 text-[10px]">{b.previousHash}</td>
                  <td className="px-4 py-2.5 text-indigo-900 text-[10px] font-bold">{b.blockHash}</td>
                  <td className="px-4 py-2.5 text-center">
                    <span className={`inline-block text-[10px] px-2 py-0.5 rounded-full font-bold font-sans ${
                      b.verificationStatus === 'VERIFIED' 
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-rose-50 text-rose-700 border border-rose-200'
                    }`}>
                      {b.verificationStatus}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Warning Box */}
      <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex gap-2 text-[10px] text-amber-800 leading-normal">
        <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
        <p>
          <strong>Simulated Chain Verification:</strong> Verification runs mock checks in sandbox memory. Cryptographic verification, block audits, or hashing of database transactions are simulated to verify frontend capabilities only.
        </p>
      </div>
    </div>
  );
};

export default AuditChainStatusPanel;
