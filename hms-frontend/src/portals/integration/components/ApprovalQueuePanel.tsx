import React, { useState } from 'react';
import { ShieldCheck, AlertTriangle, ArrowRight } from 'lucide-react';
import { ApprovalRequestDto } from '../../../services/integration.service';
import {
  useApproveVoid,
  useRejectVoid,
  useApproveRefund,
  useRejectRefund,
} from '../../../hooks/use-billing';

interface ApprovalQueuePanelProps {
  approvals: ApprovalRequestDto[] | undefined;
  isLoading: boolean;
  error: unknown;
}

type ActionKind = 'APPROVE' | 'REJECT' | null;

function extractErrorMessage(err: unknown, fallback: string): string {
  const e = err as { response?: { data?: { message?: string } }; message?: string };
  return e?.response?.data?.message || e?.message || fallback;
}

export const ApprovalQueuePanel: React.FC<ApprovalQueuePanelProps> = ({
  approvals,
  isLoading,
  error,
}) => {
  const { approveVoid, loading: avLoading } = useApproveVoid();
  const { rejectVoid, loading: rvLoading } = useRejectVoid();
  const { approveRefund, loading: arLoading } = useApproveRefund();
  const { rejectRefund, loading: rrLoading } = useRejectRefund();

  const [selected, setSelected] = useState<ApprovalRequestDto | null>(null);
  const [modalAction, setModalAction] = useState<ActionKind>(null);
  const [modalText, setModalText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ kind: 'success' | 'error'; text: string } | null>(null);

  const isPending = avLoading || rvLoading || arLoading || rrLoading || isSubmitting;

  const openAction = (a: ApprovalRequestDto, action: ActionKind) => {
    setFeedback(null);
    if (!isBilling(a)) {
      // Non-billing shell: no modal, no backend call. Show honest feedback immediately.
      setFeedback({
        kind: 'error',
        text: `Live approval for domain "${a.sourceDomain}" is not yet implemented. This is currently a shell.`,
      });
      return;
    }
    setSelected(a);
    setModalAction(action);
    setModalText('');
  };

  const closeModal = () => {
    if (isSubmitting) return;
    setModalAction(null);
    setModalText('');
    setSelected(null);
  };

  const isRefund = (a: ApprovalRequestDto): boolean => {
    const t = `${a.recordType} ${a.title ?? ''}`.toLowerCase();
    return t.includes('refund');
  };

  const isBilling = (a: ApprovalRequestDto): boolean => a.sourceDomain === 'billing';

  const handleConfirm = async () => {
    if (!selected || !modalAction) return;
    if (modalAction === 'REJECT' && modalText.trim().length === 0) {
      // For reject we require a remark.
      setFeedback({ kind: 'error', text: 'A remark is required when rejecting.' });
      return;
    }

    setIsSubmitting(true);
    setFeedback(null);
    try {
      const remarks = modalText.trim() || undefined;
      const refund = isRefund(selected);
      if (modalAction === 'APPROVE') {
        if (refund) await approveRefund(selected.id, remarks);
        else await approveVoid(selected.id, remarks);
      } else {
        if (refund) await rejectRefund(selected.id, remarks);
        else await rejectVoid(selected.id, remarks);
      }
      setFeedback({
        kind: 'success',
        text: `Request ${selected.id} ${modalAction === 'APPROVE' ? 'approved' : 'rejected'}.`,
      });
      setModalAction(null);
      setSelected(null);
      setModalText('');
    } catch (err: unknown) {
      setFeedback({
        kind: 'error',
        text: extractErrorMessage(err, `Failed to ${modalAction === 'APPROVE' ? 'approve' : 'reject'} request.`),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
      <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
        <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-indigo-500" />
          Approval Queue
        </h3>
      </div>

      {feedback && (
        <div
          role={feedback.kind === 'error' ? 'alert' : 'status'}
          data-testid="approval-feedback"
          className={`px-5 py-3 text-xs font-bold border-b ${
            feedback.kind === 'error'
              ? 'bg-rose-50 text-rose-700 border-rose-100'
              : 'bg-emerald-50 text-emerald-700 border-emerald-100'
          }`}
        >
          {feedback.text}
        </div>
      )}

      {isLoading ? (
        <div className="p-10 text-center text-sm font-medium text-slate-500">Loading approvals...</div>
      ) : error ? (
        <div className="p-10 text-center text-sm font-bold text-rose-500">
          {(error as { response?: { status: number } })?.response?.status === 401 ||
          (error as { response?: { status: number } })?.response?.status === 403
            ? 'Unauthorized to view approvals.'
            : 'Failed to load approvals.'}
        </div>
      ) : !approvals || approvals.length === 0 ? (
        <div className="p-10 text-center text-sm font-medium text-slate-500">No approvals pending.</div>
      ) : (
        <div className="divide-y divide-slate-100">
          {approvals.map((a) => (
            <div
              key={a.id}
              className="p-5 hover:bg-slate-50 transition-colors flex items-center justify-between group"
            >
              <div className="flex items-center gap-4">
                <div
                  className={`h-10 w-10 rounded-xl flex items-center justify-center border ${
                    a.riskLevel === 'CRITICAL'
                      ? 'bg-rose-50 text-rose-600 border-rose-100'
                      : a.riskLevel === 'HIGH'
                      ? 'bg-amber-50 text-amber-600 border-amber-100'
                      : 'bg-blue-50 text-blue-600 border-blue-100'
                  }`}
                >
                  {a.riskLevel === 'CRITICAL' ? (
                    <AlertTriangle className="h-5 w-5" />
                  ) : (
                    <ShieldCheck className="h-5 w-5" />
                  )}
                </div>
                <div>
                  <h4 className="text-sm font-black text-slate-800">
                    {a.title || a.recordType.replace(/_/g, ' ')}
                    {a.isMock && (
                      <span className="ml-2 text-[9px] font-black bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">
                        MOCK
                      </span>
                    )}
                  </h4>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">
                    {a.id} · {a.sourceDomain}
                  </p>
                  <p className="text-[10px] text-slate-400 font-bold">{a.requester}</p>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <span
                  className={`text-[9px] font-black px-2 py-0.5 rounded-lg ${
                    a.riskLevel === 'CRITICAL'
                      ? 'bg-rose-50 text-rose-600'
                      : a.riskLevel === 'HIGH'
                      ? 'bg-amber-50 text-amber-600'
                      : 'bg-blue-50 text-blue-600'
                  }`}
                >
                  {a.riskLevel}
                </span>
                <span
                  className={`text-[9px] font-black px-2 py-0.5 rounded-lg border ${
                    a.status === 'PENDING'
                      ? 'bg-amber-50 text-amber-700 border-amber-100'
                      : 'bg-blue-50 text-blue-700 border-blue-100'
                  }`}
                >
                  {a.status.replace('_', ' ')}
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => openAction(a, 'APPROVE')}
                    disabled={isPending}
                    data-testid={`approve-${a.id}`}
                    className="px-3 py-1.5 bg-emerald-50 text-emerald-600 border border-emerald-200 hover:bg-emerald-100 rounded-lg text-[10px] font-black uppercase disabled:opacity-50"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => openAction(a, 'REJECT')}
                    disabled={isPending}
                    data-testid={`reject-${a.id}`}
                    className="px-3 py-1.5 bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100 rounded-lg text-[10px] font-black uppercase disabled:opacity-50"
                  >
                    Reject
                  </button>
                </div>
                <ArrowRight className="h-5 w-5 text-slate-300 group-hover:text-indigo-600 transition-colors" />
              </div>
            </div>
          ))}
        </div>
      )}

      {modalAction && selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
          data-testid="approval-modal"
        >
          <div className="bg-white rounded-3xl p-6 shadow-2xl max-w-md w-full border border-slate-200 animate-slide-up">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 border-b pb-3 border-slate-100">
              {modalAction === 'APPROVE' ? (
                <>
                  <ShieldCheck className="h-5 w-5 text-emerald-600" />
                  Approve request
                </>
              ) : (
                <>
                  <AlertTriangle className="h-5 w-5 text-rose-600" />
                  Reject request
                </>
              )}
            </h3>

            <p className="text-xs text-slate-500 mt-3 leading-relaxed">
              {selected.title || selected.recordType.replace(/_/g, ' ')} · {selected.id}
            </p>

            {isBilling(selected) ? (
              <>
                <div className="mt-4">
                  <label
                    htmlFor="approval-remarks"
                    className="block text-[10px] font-extrabold text-slate-700 uppercase"
                  >
                    {modalAction === 'APPROVE' ? 'Remarks (optional)' : 'Remarks (required for reject)'}
                  </label>
                  <textarea
                    id="approval-remarks"
                    value={modalText}
                    onChange={(e) => setModalText(e.target.value)}
                    placeholder={modalAction === 'APPROVE' ? 'Add remarks…' : 'Add a reason for rejection…'}
                    rows={3}
                    data-testid="approval-remarks"
                    className="input mt-1.5 focus:border-indigo-300 w-full"
                  />
                </div>
                <div className="mt-6 flex justify-end gap-3">
                  <button
                    disabled={isSubmitting}
                    onClick={closeModal}
                    data-testid="approval-cancel"
                    className="btn btn-secondary text-xs px-4 py-2"
                  >
                    Cancel
                  </button>
                  <button
                    disabled={
                      isSubmitting ||
                      (modalAction === 'REJECT' && modalText.trim().length === 0)
                    }
                    onClick={handleConfirm}
                    data-testid={
                      modalAction === 'APPROVE' ? 'approval-confirm-approve' : 'approval-confirm-reject'
                    }
                    className={`btn text-xs px-4 py-2 ${
                      modalAction === 'APPROVE'
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                        : 'bg-rose-600 hover:bg-rose-700 text-white'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {isSubmitting
                      ? 'Processing…'
                      : modalAction === 'APPROVE'
                      ? 'Confirm Approve'
                      : 'Confirm Reject'}
                  </button>
                </div>
              </>
            ) : (
              // Should not be reachable: openAction() short-circuits non-billing.
              <p className="mt-4 text-xs text-slate-500">No action available.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ApprovalQueuePanel;
