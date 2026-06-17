import React from 'react';
import { ShieldCheck, AlertTriangle, ArrowRight } from 'lucide-react';
import { ApprovalRequestDto } from '../../../services/integration.service';
import { 
  useApproveVoid, 
  useRejectVoid, 
  useApproveRefund, 
  useRejectRefund 
} from '../../../hooks/use-billing';

interface ApprovalQueuePanelProps {
  approvals: ApprovalRequestDto[] | undefined;
  isLoading: boolean;
  error: unknown;
}

export const ApprovalQueuePanel: React.FC<ApprovalQueuePanelProps> = ({ approvals, isLoading, error }) => {
  const { approveVoid, loading: avLoading } = useApproveVoid();
  const { rejectVoid, loading: rvLoading } = useRejectVoid();
  const { approveRefund, loading: arLoading } = useApproveRefund();
  const { rejectRefund, loading: rrLoading } = useRejectRefund();

  const handleAction = async (a: ApprovalRequestDto, action: 'APPROVE' | 'REJECT') => {
    if (a.sourceDomain !== 'billing') {
      alert(`Live approval for domain "${a.sourceDomain}" is not yet implemented. This is currently a shell.`);
      return;
    }

    const isRefund = a.recordType.toLowerCase().includes('refund') || a.title?.toLowerCase().includes('refund');
    const remarks = window.prompt(`Enter remarks for ${action === 'APPROVE' ? 'approving' : 'rejecting'} this ${isRefund ? 'refund' : 'void'} request:`) || '';

    try {
      if (action === 'APPROVE') {
        if (isRefund) await approveRefund(a.id, remarks);
        else await approveVoid(a.id, remarks);
      } else {
        if (isRefund) await rejectRefund(a.id, remarks);
        else await rejectVoid(a.id, remarks);
      }
      alert(`Successfully ${action === 'APPROVE' ? 'approved' : 'rejected'} the request.`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      alert(`Failed to ${action === 'APPROVE' ? 'approve' : 'reject'} request: ${message}`);
    }
  };

  const isPendingAction = avLoading || rvLoading || arLoading || rrLoading;

  return (
    <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
      <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
        <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-indigo-500" />
          Approval Queue
        </h3>
      </div>
      
      {isLoading ? (
        <div className="p-10 text-center text-sm font-medium text-slate-500">Loading approvals...</div>
      ) : error ? (
        <div className="p-10 text-center text-sm font-bold text-rose-500">
          {(error as { response?: { status: number } })?.response?.status === 401 || (error as { response?: { status: number } })?.response?.status === 403 
            ? 'Unauthorized to view approvals.' 
            : 'Failed to load approvals.'}
        </div>
      ) : !approvals || approvals.length === 0 ? (
        <div className="p-10 text-center text-sm font-medium text-slate-500">No approvals pending.</div>
      ) : (
        <div className="divide-y divide-slate-100">
          {approvals.map((a) => (
          <div key={a.id} className="p-5 hover:bg-slate-50 transition-colors flex items-center justify-between group cursor-pointer">
            <div className="flex items-center gap-4">
              <div className={`h-10 w-10 rounded-xl flex items-center justify-center border ${
                a.riskLevel === 'CRITICAL' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                a.riskLevel === 'HIGH' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                'bg-blue-50 text-blue-600 border-blue-100'
              }`}>
                {a.riskLevel === 'CRITICAL' ? <AlertTriangle className="h-5 w-5" /> : <ShieldCheck className="h-5 w-5" />}
              </div>
              <div>
                <h4 className="text-sm font-black text-slate-800">
                  {a.title || a.recordType.replace(/_/g, ' ')}
                  {a.isMock && <span className="ml-2 text-[9px] font-black bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">MOCK</span>}
                </h4>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">{a.id} · {a.sourceDomain}</p>
                <p className="text-[10px] text-slate-400 font-bold">{a.requester}</p>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <span className={`text-[9px] font-black px-2 py-0.5 rounded-lg ${
                a.riskLevel === 'CRITICAL' ? 'bg-rose-50 text-rose-600' :
                a.riskLevel === 'HIGH' ? 'bg-amber-50 text-amber-600' :
                'bg-blue-50 text-blue-600'
              }`}>
                {a.riskLevel}
              </span>
              <span className={`text-[9px] font-black px-2 py-0.5 rounded-lg border ${
                a.status === 'PENDING' ? 'bg-amber-50 text-amber-700 border-amber-100' : 'bg-blue-50 text-blue-700 border-blue-100'
              }`}>
                {a.status.replace('_', ' ')}
              </span>
              <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={(e) => { e.stopPropagation(); handleAction(a, 'APPROVE'); }}
                  disabled={isPendingAction}
                  className="px-3 py-1.5 bg-emerald-50 text-emerald-600 border border-emerald-200 hover:bg-emerald-100 rounded-lg text-[10px] font-black uppercase disabled:opacity-50"
                >
                  Approve
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); handleAction(a, 'REJECT'); }}
                  disabled={isPendingAction}
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
    </div>
  );
};

export default ApprovalQueuePanel;
