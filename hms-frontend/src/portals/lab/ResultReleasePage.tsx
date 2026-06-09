import { useState, useCallback } from 'react';
import { HmsPageHeader } from '../../components/hms-page';
import { useReleasableResults, useReleaseResult } from '../../hooks/use-lab';
import {
  Send,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Loader2,
  ShieldAlert,
} from 'lucide-react';
import {
  HmsDashboardShell,
  HmsToolbar,
  HmsAuditFooter,
  HmsDataUnavailable,
  HmsLoadingSkeleton,
  HmsDrilldownTable,
} from '../../components/hms-dashboard';

export const ResultReleasePage = () => {
  const { data: results = [], isLoading, error, refetch } = useReleasableResults();
  const releaseMutation = useReleaseResult();
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleRelease = useCallback(async (resultId: string) => {
    setSuccessMsg(null);
    releaseMutation.mutate(resultId, {
      onSuccess: () => {
        setSuccessMsg('Result released successfully. Signature and notification logged.');
      },
    });
  }, [releaseMutation]);

  const columns = [
    {
      key: 'patient',
      header: 'Patient',
      width: 'w-[180px]',
      render: (r: typeof results[number]) => (
        <div className="font-sans">
          <p className="font-bold text-slate-800 text-xs leading-tight">{r.patientName}</p>
          <p className="text-[10px] text-slate-400 font-mono mt-0.5">MRN: {r.patientMrn}</p>
        </div>
      ),
    },
    {
      key: 'orderId',
      header: 'Order ID',
      width: 'w-[120px]',
      render: (r: typeof results[number]) => (
        <span className="text-[10px] text-blue-650 font-bold">{r.orderNumber}</span>
      ),
    },
    {
      key: 'tests',
      header: 'Tests',
      render: (r: typeof results[number]) => (
        <span className="text-[10px] text-slate-600 font-semibold font-sans">
          {r.testNames?.join(', ') || 'N/A'}
        </span>
      ),
    },
    {
      key: 'validated',
      header: 'Validated',
      width: 'w-[100px]',
      render: () => (
        <span className="inline-flex items-center px-1.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded text-[9px] font-bold uppercase">
          Approved
        </span>
      ),
    },
    {
      key: 'validatedAt',
      header: 'Validated At',
      width: 'w-[140px]',
      render: (r: typeof results[number]) => (
        <span className="text-[10px] text-slate-500 font-mono">
          {r.validatedAt ? new Date(r.validatedAt).toLocaleString() : 'N/A'}
        </span>
      ),
    },
    {
      key: 'action',
      header: 'Action',
      width: 'w-[140px]',
      render: (r: typeof results[number]) => (
        <button
          onClick={(e) => { e.stopPropagation(); handleRelease(r.id); }}
          disabled={releaseMutation.isPending && releaseMutation.variables === r.id}
          className="bg-blue-650 hover:bg-blue-755 text-white font-bold px-3 py-1.5 rounded-lg text-[11px] shadow-sm flex items-center gap-1 mx-auto disabled:opacity-50 cursor-pointer"
        >
          {releaseMutation.isPending && releaseMutation.variables === r.id ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <Send className="h-3 w-3" />
          )}
          Release
        </button>
      ),
    },
  ];

  const releaseError = releaseMutation.error
    ? ((releaseMutation.error as { response?: { data?: { message?: string } } })?.response?.data?.message || releaseMutation.error.message || 'Failed to release result')
    : null;

  return (
    <div className="space-y-4 animate-fade-in font-sans text-slate-700">
      {/* Sandbox Warning Banner */}
      <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex gap-2.5 text-xs text-amber-800">
        <AlertTriangle className="h-4.5 w-4.5 text-amber-600 mt-0.5 flex-shrink-0" />
        <div>
          <h5 className="font-bold uppercase text-[10px] tracking-wider">Diagnostic Dispatch (Partial — Real)</h5>
          <p className="font-medium mt-0.5">
            Result release uses the real API with signature, audit log, and notification. Full LIS release policy automation and critical-result escalation remain out of scope.
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <HmsPageHeader
          title="Diagnostic Dispatch & Release Desk"
          description="Review and release validated lab results. Released results are signed, audited, and dispatched to patient EMR."
        />
        <div className="text-[10px] font-bold uppercase text-blue-700 bg-blue-50 border border-blue-150 px-2.5 py-1 rounded-lg select-none">
          LIS Director Desk
        </div>
      </div>

      {successMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-250 rounded-lg text-xs font-semibold text-emerald-800 flex items-center gap-2 animate-scale-in font-sans">
          <CheckCircle className="h-4 w-4 text-emerald-600" />
          {successMsg}
        </div>
      )}

      {releaseError && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs font-semibold text-rose-700 flex items-center gap-2 font-sans">
          <XCircle className="h-4 w-4 text-rose-600" />
          {releaseError}
        </div>
      )}

      <HmsDashboardShell
        toolbar={<HmsToolbar onRefresh={refetch} />}
        footer={<HmsAuditFooter dataSource="Laboratory LIS Service" lastRefreshed={new Date()} />}
      >
        {isLoading ? (
          <HmsLoadingSkeleton rows={6} />
        ) : error ? (
          <HmsDataUnavailable sectionName="Result Release Desk" expectedApi="GET /api/v1/lab/results/releasable" />
        ) : results.length === 0 ? (
          <HmsDataUnavailable sectionName="Results Awaiting Release" expectedApi="GET /api/v1/lab/results/releasable" />
        ) : (
          <div className="space-y-4">
            <HmsDrilldownTable
              title="Validated Results Awaiting Release"
              description={`${results.length} result(s) ready for diagnostic dispatch`}
              columns={columns}
              data={results}
              keyExtractor={(r) => r.id}
            />
            <div className="p-3 bg-blue-50/30 border border-blue-100/60 rounded-lg text-xs text-blue-800 font-medium space-y-1">
              <h4 className="font-bold text-blue-900 uppercase tracking-wider text-[10px] flex items-center gap-1">
                <ShieldAlert className="h-3.5 w-3.5" />
                Release Authorization Protocol
              </h4>
              <p className="text-[10.5px] leading-relaxed">
                Releasing a result is officially recorded and audited. This updates the result status for downstream clinical visibility and patient EMR access. Only validated (APPROVED) results can be released.
              </p>
            </div>
          </div>
        )}
      </HmsDashboardShell>
    </div>
  );
};

export default ResultReleasePage;
