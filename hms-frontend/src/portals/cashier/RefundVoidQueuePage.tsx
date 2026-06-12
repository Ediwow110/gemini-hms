import { useState } from 'react';
import { 
  HmsDashboardShell, 
  HmsToolbar, 
  HmsAuditFooter, 
  HmsStatusChip 
} from '../../components/hms-dashboard';
import { HmsPageHeader, HmsFormContainer } from '../../components/hms-page';
import { ShieldAlert, PlusCircle, CheckCircle, ArrowRightCircle, Info, RefreshCw, Loader2 } from 'lucide-react';
import { useUser } from '../../hooks/use-user';
import { useRequestRefund, useRequestVoid, useMyReversals } from '../../hooks/use-billing';
import type { MyReversalDto } from '../../services/billing-frontend.service';

const formatDate = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
};

const statusLabel: Record<string, string> = {
  PENDING: 'Pending',
  APPLIED: 'Applied',
  REJECTED: 'Rejected',
  CANCELLED: 'Cancelled',
};

const statusVariant: Record<string, 'warning' | 'success' | 'critical' | 'default'> = {
  PENDING: 'warning',
  APPLIED: 'success',
  REJECTED: 'critical',
  CANCELLED: 'default',
};

export const RefundVoidQueuePage = () => {
  const user = useUser();
  const { requestRefund, loading: refundLoading, error: refundError } = useRequestRefund();
  const { requestVoid, loading: voidLoading, error: voidError } = useRequestVoid();
  const { reversals, loading: queueLoading, error: queueError, refetch } = useMyReversals();

  const [requestType, setRequestType] = useState<'REFUND' | 'VOID'>('REFUND');
  const [paymentId, setPaymentId] = useState('');
  const [reason, setReason] = useState('');
  const [amount, setAmount] = useState('');
  const [submitResult, setSubmitResult] = useState<string | null>(null);

  const submitting = refundLoading || voidLoading;
  const submitError = refundError || voidError;

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitResult(null);

    if (!paymentId || !reason) {
      alert('Payment ID and reason are required.');
      return;
    }

    if (requestType === 'REFUND' && (!amount || parseFloat(amount) <= 0)) {
      alert('A positive refund amount is required.');
      return;
    }

    try {
      if (requestType === 'REFUND') {
        await requestRefund({ paymentId, amount: parseFloat(amount), reason });
        setSubmitResult(`Refund request submitted for payment ${paymentId}. Pending supervisor approval.`);
      } else {
        await requestVoid({ paymentId, reason });
        setSubmitResult(`Void request submitted for payment ${paymentId}. Pending supervisor approval.`);
      }
      setPaymentId('');
      setReason('');
      setAmount('');
      refetch();
    } catch {
      // error is surfaced via submitError from the hook
    }
  };

  return (
    <HmsDashboardShell
      toolbar={
        <HmsToolbar 
          branchName={user?.branchId ? `Branch ID: ${user.branchId}` : 'Main Clinic'}
          role={user?.roles?.join(', ')}
        />
      }
      footer={<HmsAuditFooter dataSource="Reversal data: live API" />}
    >
      <HmsPageHeader 
        title="Reversals & Refunds Desk" 
        description="Submit and track refund/void requests. Approvals require supervisor action via the Approval Center."
        badge="Exception Workflow"
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        
        {/* Left: Live Queue */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
            <div className="border-b border-slate-100 px-3 py-2.5 flex items-center justify-between">
              <h3 className="text-[13px] font-bold text-slate-800 uppercase tracking-tight flex items-center gap-1.5 font-sans">
                <ShieldAlert className="h-4 w-4 text-indigo-500" />
                My Reversal Requests
              </h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={refetch}
                  disabled={queueLoading}
                  className="text-[10px] font-bold text-slate-500 hover:text-slate-700 bg-slate-50 border border-slate-200 px-2 py-1 rounded-md flex items-center gap-1 transition-colors"
                >
                  <RefreshCw className={`h-3 w-3 ${queueLoading ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
                <span className="text-[10px] bg-slate-50 border border-slate-200 text-slate-500 font-bold px-2 py-0.5 rounded-md font-sans">
                  {reversals.length} {reversals.length === 1 ? 'Request' : 'Requests'}
                </span>
              </div>
            </div>

            {queueError && (
              <div className="px-3 py-2 bg-rose-50 border-b border-rose-100 text-[10px] text-rose-700 flex items-center gap-1.5 font-medium">
                <Info className="h-3 w-3 shrink-0" />
                {queueError}
              </div>
            )}

            <div className="divide-y divide-slate-100 font-sans">
              {queueLoading && reversals.length === 0 ? (
                <div className="py-12 flex items-center justify-center gap-2 text-slate-400 font-bold text-[12px] uppercase tracking-wider">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading...
                </div>
              ) : reversals.length === 0 ? (
                <div className="py-12 text-center text-slate-400 font-bold text-[12px] uppercase tracking-wider">
                  No reversal requests yet
                </div>
              ) : (
                reversals.map((req: MyReversalDto) => (
                  <div key={req.id} className="p-4 hover:bg-slate-50/50 transition-colors flex flex-col md:flex-row justify-between gap-4">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-black text-slate-900 text-[14px] leading-none">
                          {req.patientName ?? 'Unknown Patient'}
                        </span>
                        {req.receiptNumber && (
                          <span className="font-mono text-[11px] font-bold text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100">
                            {req.receiptNumber}
                          </span>
                        )}
                        <HmsStatusChip status={statusLabel[req.status] ?? req.status} variant={statusVariant[req.status] ?? 'default'} />
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-y-1 text-[11px] font-semibold text-slate-500">
                        <div className="flex items-center gap-1.5">
                          <span className="text-slate-400 uppercase text-[9px] font-black">Type:</span>
                          <span className={req.type === 'REFUND' ? 'text-blue-600' : 'text-rose-600'}>
                            {req.type === 'REFUND' ? 'Refund' : 'Void'}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-slate-400 uppercase text-[9px] font-black">Amount:</span>
                          <span className="font-mono font-bold text-rose-600">₱{req.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                        </div>
                        <div className="flex items-center gap-1.5 md:col-span-3">
                          <span className="text-slate-400 uppercase text-[9px] font-black">Reason:</span>
                          <span className="text-slate-700 italic">"{req.reason}"</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-slate-400 uppercase text-[9px] font-black">Date:</span>
                          <span className="font-mono">{formatDate(req.requestedAt)}</span>
                        </div>
                        {req.invoiceNumber && (
                          <div className="flex items-center gap-1.5">
                            <span className="text-slate-400 uppercase text-[9px] font-black">Invoice:</span>
                            <span className="font-mono">{req.invoiceNumber}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-lg flex gap-2.5 text-[11px] text-indigo-700">
            <ArrowRightCircle className="h-4 w-4 text-indigo-500 mt-0.5 shrink-0" />
            <p className="font-medium">
              To approve or reject a reversal request, go to <strong>Approval Center</strong> in the main navigation.
            </p>
          </div>
        </div>

        {/* Right: Submit Request Form */}
        <div className="space-y-4">
          <HmsFormContainer
            title="Submit Reversal Request"
            description="Create a refund or void request that will be sent to the live API for supervisor approval."
            onSubmit={handleSubmitRequest}
            columns={1}
            error={submitError || undefined}
            actions={
              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white text-[12px] font-bold py-2 rounded-lg flex items-center justify-center gap-1.5 shadow-sm transition-all"
              >
                <PlusCircle className="h-4 w-4" /> {submitting ? 'Submitting...' : 'Submit Request'}
              </button>
            }
          >
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wide block">Request Type</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setRequestType('REFUND')}
                  className={`flex-1 py-1.5 text-[11px] font-bold rounded-lg border transition-all ${
                    requestType === 'REFUND'
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300'
                  }`}
                >
                  Refund
                </button>
                <button
                  type="button"
                  onClick={() => setRequestType('VOID')}
                  className={`flex-1 py-1.5 text-[11px] font-bold rounded-lg border transition-all ${
                    requestType === 'VOID'
                      ? 'bg-rose-600 text-white border-rose-600'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-rose-300'
                  }`}
                >
                  Void
                </button>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wide block">Payment ID (UUID)</label>
              <input
                type="text"
                placeholder="e.g. a1b2c3d4-..."
                value={paymentId}
                onChange={(e) => setPaymentId(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[12px] font-mono font-bold focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {requestType === 'REFUND' && (
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wide block">Refund Amount (₱)</label>
                <input
                  type="number"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[12px] font-mono font-bold focus:outline-none focus:ring-1 focus:ring-blue-500"
                  step="0.01"
                />
              </div>
            )}

            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wide block">Reason</label>
              <textarea
                placeholder="Detail reason..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[12px] font-medium min-h-[80px] focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </HmsFormContainer>

          {submitResult && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex gap-2 text-[11px] text-emerald-800">
              <CheckCircle className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
              <p className="font-medium">{submitResult}</p>
            </div>
          )}

          <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg text-[11px] text-blue-700 space-y-1.5 font-sans">
            <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-[10px]">
              <ShieldAlert className="h-3.5 w-3.5" />
              Authorization Notice
            </div>
            <p className="font-medium leading-relaxed">
              Submit creates an approval request requiring supervisor authorization. Voiding receipts requires a digital audit trail containing reasons and authorizing signatures.
            </p>
          </div>
        </div>

      </div>

    </HmsDashboardShell>
  );
};

export default RefundVoidQueuePage;
