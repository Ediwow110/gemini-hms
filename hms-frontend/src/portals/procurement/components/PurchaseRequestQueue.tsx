import React from 'react';
import { FilePlus, User, Building, Clock, CheckCircle2, XCircle } from 'lucide-react';

export type PurchaseRequestStatus =
  | 'SUBMITTED'
  | 'APPROVED'
  | 'REJECTED'
  | 'ORDERED'
  | 'DRAFT'
  | string;

export interface PurchaseRequest {
  id: string;
  item: string;
  itemCount?: number;
  requestedBy: string;
  branch: string;
  status: PurchaseRequestStatus;
  date: string;
  canApprove?: boolean;
  approverBlockedReason?: string;
}

interface PurchaseRequestQueueProps {
  requests: PurchaseRequest[];
  onApprove?: (request: PurchaseRequest) => void;
  onReject?: (request: PurchaseRequest) => void;
  busyRequestId?: string | null;
}

const statusBadgeClass = (status: string | undefined): string => {
  const s = (status || '').toUpperCase();
  if (s === 'APPROVED' || s === 'ORDERED') {
    return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  }
  if (s === 'REJECTED') {
    return 'bg-rose-50 text-rose-700 border-rose-200';
  }
  if (s === 'SUBMITTED' || s === 'PENDING') {
    return 'bg-amber-50 text-amber-700 border-amber-200';
  }
  return 'bg-slate-100 text-slate-500 border-slate-200';
};

const statusLabel = (status: string | undefined): string => {
  const s = (status || '').toUpperCase();
  if (s === 'SUBMITTED' || s === 'PENDING') return 'Pending Review';
  if (s === 'APPROVED') return 'Approved';
  if (s === 'REJECTED') return 'Rejected';
  if (s === 'ORDERED') return 'Ordered';
  if (s === 'DRAFT') return 'Draft';
  return s || '—';
};

export const PurchaseRequestQueue: React.FC<PurchaseRequestQueueProps> = ({
  requests,
  onApprove,
  onReject,
  busyRequestId,
}) => {
  const isLive = Boolean(onApprove || onReject);
  return (
    <div className="bg-white border border-slate-200/80 shadow-sm rounded-2xl overflow-hidden">
      <div className="p-5 border-b border-slate-100 flex justify-between items-center">
        <div>
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <FilePlus className="h-4 w-4 text-indigo-500" />
            Purchase Request Queue
          </h3>
          <p className="text-[10px] text-slate-400 font-medium">Internal stock and procurement requisitions</p>
        </div>
        <button className="text-[10px] text-indigo-600 font-bold hover:underline cursor-pointer">View All Requests</button>
      </div>

      <div className="divide-y divide-slate-50" data-testid="purchase-request-list">
        {requests.map((req) => {
          const isBusy = busyRequestId === req.id;
          return (
            <div
              key={req.id}
              className="p-4 hover:bg-slate-50 transition-colors flex items-center justify-between group"
              data-testid={`purchase-request-row-${req.id}`}
            >
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl flex items-center justify-center font-bold text-xs bg-slate-100 text-slate-600">
                  {req.item.charAt(0).toUpperCase() || 'P'}
                </div>
                <div>
                  <h4
                    className="text-xs font-bold text-slate-800"
                    data-testid={`purchase-request-item-${req.id}`}
                  >
                    {req.item}
                  </h4>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] text-slate-400 flex items-center gap-1">
                      <User className="h-3 w-3" />
                      <span data-testid={`purchase-request-requester-${req.id}`}>
                        {req.requestedBy}
                      </span>
                    </span>
                    <span className="text-[10px] text-slate-400">·</span>
                    <span className="text-[10px] text-slate-400 flex items-center gap-1">
                      <Clock className="h-3 w-3" /> {req.date}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right hidden sm:flex flex-col items-end gap-1">
                  <p
                    className="text-[10px] font-bold text-slate-700 flex items-center justify-end gap-1"
                    data-testid={`purchase-request-branch-${req.id}`}
                  >
                    <Building className="h-3 w-3 text-slate-400" />
                    {req.branch}
                  </p>
                  <span
                    className={`px-2 py-0.5 rounded text-[9px] font-extrabold border ${statusBadgeClass(req.status)}`}
                    data-testid={`purchase-request-status-${req.id}`}
                  >
                    {statusLabel(req.status)}
                  </span>
                </div>
                <div className="flex gap-2">
                  {onApprove ? (
                    <button
                      type="button"
                      title={
                        req.approverBlockedReason ||
                        (req.canApprove === false
                          ? 'Cannot approve in current state'
                          : 'Approve')
                      }
                      disabled={isBusy || req.canApprove === false}
                      onClick={() => onApprove?.(req)}
                      data-testid={`purchase-request-approve-${req.id}`}
                      className="p-1.5 hover:bg-emerald-50 text-slate-300 hover:text-emerald-600 rounded-lg transition-colors border border-transparent hover:border-emerald-100 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-slate-300"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                    </button>
                  ) : null}
                  {onReject ? (
                    <button
                      type="button"
                      title="Reject"
                      disabled={isBusy || req.canApprove === false}
                      onClick={() => onReject?.(req)}
                      data-testid={`purchase-request-reject-${req.id}`}
                      className="p-1.5 hover:bg-rose-50 text-slate-300 hover:text-rose-600 rounded-lg transition-colors border border-transparent hover:border-rose-100 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-slate-300"
                    >
                      <XCircle className="h-4 w-4" />
                    </button>
                  ) : null}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {!isLive ? (
        <div className="p-4 bg-amber-50/50 border-t border-slate-100">
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 text-[10px] text-amber-800 font-semibold">
            <strong>Sandbox Notice:</strong> Purchase requests are simulated. No real budget commitment or supplier notifications occur.
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default PurchaseRequestQueue;
