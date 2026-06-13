import React, { useState } from 'react';
import { ShieldCheck, RefreshCw, AlertTriangle, Lock, CheckCircle2, XCircle, FileWarning } from 'lucide-react';
import { useChainVerification } from '../../hooks/use-compliance';
import { StatusBadge } from '../../components/feedback/StatusBadge';
import { HmsDashboardShell } from '../../components/hms-dashboard';
import { HmsPageHeader } from '../../components/hms-page';

export const AuditChainReviewPage: React.FC = () => {
  const [verificationLog, setVerificationLog] = useState<string[]>([]);
  const [showSignatures, setShowSignatures] = useState(true);
  const { result, loading, error, verifyChain, verifyChainWithSignatures } = useChainVerification();

  const handleVerify = async () => {
    setVerificationLog([
      '[Chain Audit] Launching cryptographic verification...',
      '[Chain Audit] Fetching root hash from database...',
    ]);
    if (showSignatures) {
      await verifyChainWithSignatures();
    } else {
      await verifyChain();
    }
    setVerificationLog(prev => [
      ...prev,
      '[Verification Complete] All block links checked.',
    ]);
  };

  return (
    <HmsDashboardShell widthTier="full">
      <HmsPageHeader
        title="Audit Chain Verification"
        description="Verify system event ledger integrity with hash chaining and HMAC signature validation"
      />

      <div className="card bg-white border border-slate-200/80 shadow-sm rounded-2xl p-5 space-y-5">
        <div className="flex justify-between items-start flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-650">
              <Lock className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Hash Chain Integrity</h4>
              <p className="text-[10px] text-slate-400 font-semibold">
                Checks hash backlinks and HMAC-SHA256 signatures
              </p>
            </div>
          </div>

          <div className="flex gap-2 items-center">
            {result && (
              <StatusBadge
                status={result.isValid ? 'VERIFIED' : 'TAMPERED'}
                type={result.isValid ? 'success' : 'danger'}
              />
            )}
            <button
              onClick={handleVerify}
              disabled={loading}
              className="py-1.5 px-3 border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin text-indigo-600' : 'text-slate-400'}`} />
              {loading ? 'Verifying...' : 'Verify Chain'}
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="includeSignatures"
            checked={showSignatures}
            onChange={(e) => setShowSignatures(e.target.checked)}
            className="rounded border-slate-300"
          />
          <label htmlFor="includeSignatures" className="text-xs font-medium text-slate-600">
            Include HMAC signature verification
          </label>
        </div>

        {error && (
          <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-xs text-rose-700">
            {error}
          </div>
        )}

        {result && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-3 bg-slate-50 border rounded-xl flex items-center gap-3">
              <div className={`p-2 rounded-lg ${result.isValid ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                {result.isValid ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
              </div>
              <div>
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Chain Status</p>
                <p className="text-sm font-extrabold text-slate-800">{result.isValid ? 'INTACT' : 'CORRUPTED'}</p>
              </div>
            </div>
            <div className="p-3 bg-slate-50 border rounded-xl flex items-center gap-3">
              <div className="p-2 bg-white border rounded-lg text-slate-400">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <div>
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Verification Engine</p>
                <p className="text-sm font-extrabold text-slate-800 font-mono">HMAC-SHA256</p>
              </div>
            </div>
            <div className="p-3 bg-slate-50 border rounded-xl flex items-center gap-3">
              <div className="p-2 bg-white border rounded-lg text-slate-400">
                <FileWarning className="h-4 w-4" />
              </div>
              <div>
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Corrupted Logs</p>
                <p className="text-sm font-extrabold text-slate-800 font-mono">{result.corruptedLogIds?.length || 0}</p>
              </div>
            </div>
            {result.signatureErrors && (
              <div className="p-3 bg-slate-50 border rounded-xl flex items-center gap-3">
                <div className="p-2 bg-white border rounded-lg text-slate-400">
                  <AlertTriangle className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Signature Errors</p>
                  <p className="text-sm font-extrabold text-slate-800 font-mono">{result.signatureErrors.length}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {verificationLog.length > 0 && (
          <div className="bg-slate-900 text-emerald-400 font-mono text-[10px] p-3.5 rounded-xl space-y-1 h-28 overflow-y-auto border border-slate-950">
            {verificationLog.map((entry, index) => (
              <p key={index}>{entry}</p>
            ))}
          </div>
        )}

        {result && !result.isValid && result.corruptedLogIds && result.corruptedLogIds.length > 0 && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl space-y-3">
            <h5 className="text-xs font-bold text-rose-800 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Tampered Log Entries
            </h5>
            <div className="space-y-1.5">
              {result.corruptedLogIds.map((logId) => (
                <div key={logId} className="flex items-center justify-between bg-white p-2 rounded-lg border border-rose-100">
                  <span className="text-xs font-mono font-bold text-rose-800">{logId}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 font-bold">
                    CORRUPTED
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </HmsDashboardShell>
  );
};

export default AuditChainReviewPage;
