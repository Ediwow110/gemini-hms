import { useState, useEffect, useCallback } from "react";
import { PageHeader } from "../../components/ui/page-header";
import { ApprovalStatusBadge } from "../../components/ui/approval-badges";
import { ConfirmationModal, ReasonModal } from "../../components/ui/approval-modals";
import { AlertTriangle, ShieldCheck, RefreshCw, Loader2, Info } from "lucide-react";
import { useUser } from "../../hooks/use-user";
import { RequirePermission } from "../../components/ui/RequirePermission";
import { approvalService, ApprovalRequest } from "../../services/approval.service";
import { logger } from "../../lib/logger";

// Helper to normalize backend status/risk for the UI components
const normalize = (val: string) => {
  if (!val) return val;
  return val.charAt(0).toUpperCase() + val.slice(1).toLowerCase();
};

const getActionErrorMessage = (mode: string, error: unknown) => {
  const fallback = `Failed to ${mode.toLowerCase()} request. Please try again.`;
  const err = error as { response?: { data?: { message?: string } }; message?: string } | null;
  return err?.response?.data?.message || err?.message || fallback;
};

export const ApprovalCenter = () => {
  const [requests, setRequests] = useState<ApprovalRequest[]>([]);
  const [selected, setSelected] = useState<ApprovalRequest | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [modals, setModals] = useState({ confirm: false, reason: false, mode: "" });
  const [approvalAuthChecked, setApprovalAuthChecked] = useState(false);
  const [approvalAuthError, setApprovalAuthError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [listError, setListError] = useState<string | null>(null);
  const currentUser = useUser();

  const fetchRequests = useCallback(async (showLoading = true) => {
    if (showLoading) setIsLoading(true);
    setListError(null);
    try {
      // Explicit first-page fetch; server now caps at 200 to prevent unbounded lists.
      const data = await approvalService.getRequests({ page: 1, pageSize: 50 });
      setRequests(data);
      // Update selected reference if it exists
      if (selected) {
        const updatedSelected = data.find(r => r.id === selected.id);
        if (updatedSelected) setSelected(updatedSelected);
      }
    } catch (error) {
      logger.error("Failed to fetch approvals:", error);
      setListError('Failed to load approval requests. Please retry.');
      setRequests([]);
    } finally {
      setIsLoading(false);
    }
  }, [selected]);

  useEffect(() => {
    fetchRequests(false);
  }, [fetchRequests]);

  const resetApprovalConfirmation = () => {
    setApprovalAuthChecked(false);
    setApprovalAuthError(null);
  };

  const closeApprovalModal = () => {
    resetApprovalConfirmation();
    setActionError(null);
    setModals({ ...modals, confirm: false });
  };

  const handleRefresh = () => {
    void fetchRequests();
  };

  const openApprovalModal = () => {
    resetApprovalConfirmation();
    setActionError(null);
    setModals({ confirm: true, reason: false, mode: "Approve" });
  };

  const openRejectModal = () => {
    setActionError(null);
    setModals({ confirm: false, reason: true, mode: "Reject" });
  };

  const closeRejectModal = () => {
    setActionError(null);
    setModals({ ...modals, reason: false });
  };

  const handleAction = async (remarks: string) => {
    if (!selected) return;
    setIsProcessing(true);
    setActionError(null);
    try {
      if (modals.mode === "Approve") {
        await approvalService.approveRequest(selected.id, selected.type, remarks, selected.details);
      } else {
        await approvalService.rejectRequest(selected.id, selected.type, remarks, selected.details);
      }
      await fetchRequests();
      setActionError(null);
      setModals({ confirm: false, reason: false, mode: "" });
      if (modals.mode === "Approve") {
        resetApprovalConfirmation();
      }
    } catch (error) {
      logger.error(`Failed to ${modals.mode.toLowerCase()} request:`, error);
      setActionError(getActionErrorMessage(modals.mode, error));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleApproveConfirm = () => {
    if (!approvalAuthChecked) {
      setApprovalAuthError("Confirm policy authorization before approving this request.");
      return;
    }
    void handleAction("Approved per policy");
  };

  const handleRetry = () => {
    void fetchRequests(true);
  };

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      <div className="flex justify-between items-center">
        <PageHeader title="Approval Center" description="Review and authorize high-risk clinical and operational requests." />
        <button 
          onClick={handleRefresh}
          disabled={isLoading}
          className="p-2.5 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors disabled:opacity-50"
          title="Refresh"
        >
          <RefreshCw className={`h-5 w-5 text-slate-500 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>
      
      {listError && (
        <div role="alert" className="mb-3 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-700">
          {listError}
        </div>
      )}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card overflow-hidden animate-slide-up stagger-1">
          {isLoading && requests.length === 0 ? (
            <div className="py-20 flex flex-col items-center justify-center text-slate-400">
              <Loader2 className="h-8 w-8 animate-spin mb-4 text-indigo-500" />
              <p className="font-medium">Loading requests...</p>
            </div>
          ) : requests.length === 0 ? (
            <div className="py-20 flex flex-col items-center justify-center text-slate-400">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                <ShieldCheck className="h-8 w-8 text-slate-300" />
              </div>
              <p className="font-medium">No pending approval requests.</p>
            </div>
          ) : (
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50/80 text-slate-500 font-medium border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-center">Risk</th>
                  <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider">ID</th>
                  <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider">Requester</th>
                  <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {requests.map(a => (
                  <tr 
                    key={a.id} 
                    className={`cursor-pointer transition-colors group ${selected?.id === a.id ? 'bg-indigo-50/50' : 'hover:bg-indigo-50/30'}`} 
                    onClick={() => setSelected(a)}
                  >
                    <td className="px-6 py-4">
                      <div className="flex justify-center">
                        <span className={`w-2.5 h-2.5 rounded-full ${
                          a.riskLevel === 'CRITICAL' ? 'bg-rose-500 animate-pulse' : 
                          a.riskLevel === 'HIGH' ? 'bg-orange-500' : 
                          a.riskLevel === 'MEDIUM' ? 'bg-amber-500' : 'bg-slate-300'
                        }`} title={a.riskLevel} />
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-mono text-slate-500" title={a.id}>{a.id.length > 8 ? `${a.id.slice(0, 8)}\u2026` : a.id}</span>
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-900">
                      {a.type.replace(/_/g, ' ')}
                    </td>
                    <td className="px-6 py-4 text-slate-600 group-hover:text-indigo-700">
                      {a.requester?.email || 'Unknown'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center">
                        <ApprovalStatusBadge status={normalize(a.status)} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="card p-6 h-fit space-y-5 animate-slide-up stagger-2">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-4">
            <div className="p-1.5 bg-indigo-50 rounded-lg">
              <ShieldCheck className="h-5 w-5 text-indigo-600" />
            </div>
            <h2 className="font-bold text-slate-900" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Request Details</h2>
          </div>

          {selected ? (
            <div className="space-y-5 animate-fade-in">
              {selected.riskLevel === 'CRITICAL' && (
                <div className="flex items-center gap-2 p-3 bg-rose-50 text-rose-800 rounded-xl border border-rose-100 text-xs font-semibold">
                  <AlertTriangle className="h-4 w-4 flex-shrink-0 animate-pulse" />
                  <span>High-risk request. Requires careful review.</span>
                </div>
              )}
              
              <div className="space-y-4">
                <div className="flex justify-between items-center text-sm border-b border-slate-50 pb-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Type</span>
                  <span className="font-semibold text-slate-900">{selected.type.replace(/_/g, ' ')}</span>
                </div>
                <div className="flex justify-between items-center text-sm border-b border-slate-50 pb-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Requester</span>
                  <span className="font-semibold text-slate-900">{selected.requester?.email || 'Unknown'}</span>
                </div>
                <div className="flex justify-between items-center text-sm border-b border-slate-50 pb-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Record ID</span>
                  <span className="font-mono font-bold text-indigo-600 text-xs truncate max-w-[150px]">{selected.recordId}</span>
                </div>
                <div className="flex justify-between items-center text-sm border-b border-slate-50 pb-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Date</span>
                  <span className="font-medium text-slate-700">{new Date(selected.createdAt).toLocaleDateString()}</span>
                </div>
                {selected.reason && (
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Request Reason</span>
                    <div className="p-2.5 bg-slate-50 rounded-lg text-xs text-slate-600 italic border border-slate-100">
                      "{selected.reason}"
                    </div>
                  </div>
                )}
                <div className="flex justify-between items-center text-sm pt-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status</span>
                  <ApprovalStatusBadge status={normalize(selected.status)} />
                </div>
              </div>

              {/* Dynamic Details based on type */}
              {selected.details && (
                <div className="p-3 bg-indigo-50/30 rounded-xl border border-indigo-100 space-y-2">
                  <div className="flex items-center gap-1.5 mb-2">
                    <Info className="h-3.5 w-3.5 text-indigo-600" />
                    <span className="text-[10px] font-bold text-indigo-900 uppercase tracking-wider">Metadata Details</span>
                  </div>
                  {Object.entries(selected.details).map(([key, val]) => (
                    typeof val !== 'object' && (
                      <div key={key} className="flex justify-between items-center text-[11px]">
                        <span className="text-indigo-700/70 font-medium capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                        <span className="font-bold text-indigo-900">{String(val)}</span>
                      </div>
                    )
                  ))}
                </div>
              )}
              
              <div className="pt-4">
                {selected.requesterId === currentUser?.id ? (
                  <div className="p-3 bg-amber-50 text-amber-800 rounded-xl text-xs font-medium border border-amber-100 text-center">
                    You cannot approve your own request. (Maker-Checker rule enforced)
                  </div>
                ) : selected.status !== "PENDING" ? (
                  <div className="p-3 bg-slate-50 text-slate-500 rounded-xl text-xs font-medium border border-slate-100 text-center">
                    This request has already been processed ({normalize(selected.status)}).
                  </div>
                ) : (
                  <RequirePermission 
                    permission="approval.request.process" 
                    fallback={
                      <div className="p-3 bg-slate-50 text-slate-500 rounded-xl text-xs font-medium border border-slate-100 text-center">
                        You do not have permission to process approvals.
                      </div>
                    }
                  >
                    <div className="grid grid-cols-2 gap-3">
                      <button 
                        onClick={openApprovalModal}
                        disabled={isProcessing}
                        className="btn btn-success py-2.5 disabled:opacity-50"
                      >
                        {isProcessing && modals.mode === "Approve" ? <Loader2 className="h-4 w-4 animate-spin" /> : "Approve"}
                      </button>
                      <button 
                        onClick={openRejectModal}
                        disabled={isProcessing}
                        className="btn btn-danger py-2.5 disabled:opacity-50"
                      >
                         {isProcessing && modals.mode === "Reject" ? <Loader2 className="h-4 w-4 animate-spin" /> : "Reject"}
                      </button>
                    </div>
                  </RequirePermission>
                )}
              </div>
            </div>
      ) : (
        <div className="py-20 flex flex-col items-center justify-center text-slate-400">
          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
            <ShieldCheck className="h-8 w-8 text-slate-300" />
          </div>
          <p className="font-medium">No pending approval requests.</p>
          {listError && (
            <button onClick={handleRetry} className="mt-3 text-xs text-indigo-600 underline">Retry</button>
          )}
        </div>
      )}
        </div>
      </div>

      <ConfirmationModal 
        isOpen={modals.confirm} 
        title="Approve Request" 
        warning="This action will be permanently recorded in the audit log and the change will be applied." 
        onConfirm={handleApproveConfirm}
        onClose={closeApprovalModal}
      >
        <p className="mb-2">Are you sure you want to approve request <strong className="text-slate-900">{selected?.id}</strong>?</p>
        <div className="mt-4 flex items-start gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
          <input
            type="checkbox"
            id="auth-check"
            checked={approvalAuthChecked}
            onChange={(event) => {
              setApprovalAuthChecked(event.target.checked);
              if (event.target.checked) {
                setApprovalAuthError(null);
              }
            }}
            className="mt-0.5 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
          />
          <label htmlFor="auth-check" className="text-xs text-slate-600 font-medium leading-tight">
            I confirm I have verified the details and am authorized to approve this request per hospital policy.
          </label>
        </div>
        {approvalAuthError && (
          <p role="alert" className="mt-2 text-xs font-semibold text-rose-700">
            {approvalAuthError}
          </p>
        )}
        {actionError && modals.mode === "Approve" && (
          <p role="alert" className="mt-2 text-xs font-semibold text-rose-700">
            {actionError}
          </p>
        )}
      </ConfirmationModal>

      <ReasonModal 
        isOpen={modals.reason} 
        title="Reject Request" 
        guidance="Please provide a mandatory reason for rejection." 
        onConfirm={(remarks) => handleAction(remarks)} 
        onClose={closeRejectModal}
        error={modals.mode === "Reject" ? actionError : null}
      />
    </div>
  );
};
