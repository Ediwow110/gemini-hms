import { useState } from "react";
import { PageHeader } from "../../components/ui/page-header";
import { ApprovalStatusBadge } from "../../components/ui/approval-badges";
import { ConfirmationModal, ReasonModal } from "../../components/ui/approval-modals";
import { AlertTriangle, ShieldCheck } from "lucide-react";
import { useUser } from "../../hooks/use-user";
import { RequirePermission } from "../../components/ui/RequirePermission";

interface ApprovalRequest { id: string; type: string; risk: 'Low' | 'Medium' | 'High' | 'Critical'; requester: { id: string; name: string }; record: string; status: string; amount: string; }

const MOCK_APPROVALS: ApprovalRequest[] = [
  { id: "REQ-001", type: "Refund", risk: "Medium", requester: { id: "user-1", name: "Mark Santos" }, record: "RCP-124", status: "Pending", amount: "₱1,250.00" },
  { id: "REQ-002", type: "Role Change", risk: "Critical", requester: { id: "user-current-manager", name: "You" }, record: "USER-99", status: "Pending", amount: "-" },
];

export const ApprovalCenter = () => {
  const [requests, setRequests] = useState(MOCK_APPROVALS);
  const [selected, setSelected] = useState<ApprovalRequest | null>(null);
  const [modals, setModals] = useState({ confirm: false, reason: false, mode: "" });
  const currentUser = useUser();

  const updateRequest = (status: string) => {
    if (!selected) return;
    setRequests(requests.map(r => r.id === selected.id ? { ...r, status } : r));
    setSelected({ ...selected, status });
    setModals({ confirm: false, reason: false, mode: "" });
  };

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      <div className="flex justify-between items-center">
        <PageHeader title="Approval Center" description="Review and authorize high-risk clinical and operational requests." />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card overflow-hidden animate-slide-up stagger-1">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50/80 text-slate-500 font-medium border-b border-slate-200">
              <tr>
                <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider">ID</th>
                <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider">Type</th>
                <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider">Requester</th>
                <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {requests.map(a => (
                <tr key={a.id} className={`cursor-pointer transition-colors group ${selected?.id === a.id ? 'bg-indigo-50/50' : 'hover:bg-indigo-50/30'}`} onClick={() => setSelected(a)}>
                  <td className="px-6 py-4 font-mono font-bold text-indigo-600">{a.id}</td>
                  <td className="px-6 py-4 font-semibold text-slate-900">{a.type}</td>
                  <td className="px-6 py-4 text-slate-600 group-hover:text-indigo-700">{a.requester.name}</td>
                  <td className="px-6 py-4">
                    <div className="flex justify-center">
                      <ApprovalStatusBadge status={a.status} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
              {selected.risk === 'Critical' && (
                <div className="flex items-center gap-2 p-3 bg-rose-50 text-rose-800 rounded-xl border border-rose-100 text-xs font-semibold">
                  <AlertTriangle className="h-4 w-4 flex-shrink-0 animate-pulse" />
                  <span>High-risk request. Requires careful review.</span>
                </div>
              )}
              
              <div className="space-y-4">
                <div className="flex justify-between items-center text-sm border-b border-slate-50 pb-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Type</span>
                  <span className="font-semibold text-slate-900">{selected.type}</span>
                </div>
                <div className="flex justify-between items-center text-sm border-b border-slate-50 pb-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Requester</span>
                  <span className="font-semibold text-slate-900">{selected.requester.name}</span>
                </div>
                <div className="flex justify-between items-center text-sm border-b border-slate-50 pb-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Record</span>
                  <span className="font-mono font-bold text-indigo-600">{selected.record}</span>
                </div>
                <div className="flex justify-between items-center text-sm border-b border-slate-50 pb-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Amount</span>
                  <span className="font-bold text-slate-900">{selected.amount}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status</span>
                  <ApprovalStatusBadge status={selected.status} />
                </div>
              </div>
              
              <div className="pt-4">
                {selected.requester.id === currentUser.id ? (
                  <div className="p-3 bg-amber-50 text-amber-800 rounded-xl text-xs font-medium border border-amber-100 text-center">
                    You cannot approve your own request. (Maker-Checker rule enforced)
                  </div>
                ) : selected.status !== "Pending" ? (
                  <div className="p-3 bg-slate-50 text-slate-500 rounded-xl text-xs font-medium border border-slate-100 text-center">
                    This request has already been processed.
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
                      <button onClick={() => setModals({ ...modals, confirm: true, mode: "Approve" })} className="btn btn-success py-2.5">
                        Approve
                      </button>
                      <button onClick={() => setModals({ ...modals, reason: true, mode: "Reject" })} className="btn btn-danger py-2.5">
                        Reject
                      </button>
                    </div>
                  </RequirePermission>
                )}
              </div>
            </div>
          ) : (
            <div className="py-12 text-center">
              <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                <ShieldCheck className="h-6 w-6 text-slate-400" />
              </div>
              <p className="text-sm font-medium text-slate-500">Select a request to review details and take action.</p>
            </div>
          )}
        </div>
      </div>

      <ConfirmationModal 
        isOpen={modals.confirm} 
        title="Approve Request" 
        warning="This action will be permanently recorded in the audit log." 
        onConfirm={() => updateRequest("Approved")} 
        onClose={() => setModals({ ...modals, confirm: false })}
      >
        <p className="mb-2">Are you sure you want to approve request <strong className="text-slate-900">{selected?.id}</strong>?</p>
        <div className="mt-4 flex items-start gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
          <input type="checkbox" id="auth-check" className="mt-0.5 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
          <label htmlFor="auth-check" className="text-xs text-slate-600 font-medium leading-tight">
            I confirm I have verified the details and am authorized to approve this request per hospital policy.
          </label>
        </div>
      </ConfirmationModal>

      <ReasonModal 
        isOpen={modals.reason} 
        title="Reject Request" 
        guidance="Please provide a mandatory reason for rejection." 
        onConfirm={() => updateRequest("Rejected")} 
        onClose={() => setModals({ ...modals, reason: false })} 
      />
    </div>
  );
};
