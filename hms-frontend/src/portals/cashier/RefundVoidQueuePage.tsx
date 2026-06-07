import { useState } from 'react';
import { 
  HmsDashboardShell, 
  HmsToolbar, 
  HmsAuditFooter, 
  HmsStatusChip 
} from '../../components/hms-dashboard';
import { HmsPageHeader, HmsFormContainer } from '../../components/hms-page';
import { ShieldAlert, PlusCircle, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { useUser } from '../../hooks/use-user';

export interface RefundRequest {
  id: string;
  receiptNo: string;
  patientName: string;
  reason: string;
  amount: number;
  requestDate: string;
  status: 'Pending Review' | 'Approved' | 'Rejected';
  cashier: string;
}

export const RefundVoidQueuePage = () => {
  const user = useUser();
  const [requests, setRequests] = useState<RefundRequest[]>([
    {
      id: 'REF-081',
      receiptNo: 'RCP-2026-5120',
      patientName: 'Jonathan Harker',
      reason: 'Duplicate lab test charge ordered in error',
      amount: 850.00,
      requestDate: 'Today, 10:14 AM',
      status: 'Pending Review',
      cashier: 'Mark Santos',
    },
    {
      id: 'REF-080',
      receiptNo: 'RCP-2026-5110',
      patientName: 'Wilhelmina Murray',
      reason: 'Physician canceled consultation request',
      amount: 500.00,
      requestDate: 'Yesterday, 03:00 PM',
      status: 'Approved',
      cashier: 'Mark Santos',
    }
  ]);

  const [receiptNo, setReceiptNo] = useState('');
  const [reason, setReason] = useState('');
  const [amount, setAmount] = useState('');
  const [patientName, setPatientName] = useState('');

  const handleApprove = (id: string) => {
    setRequests(requests.map(r => r.id === id ? { ...r, status: 'Approved' } : r));
    alert(`Reversal ticket ${id} has been authorized and cleared in sandbox memory.`);
  };

  const handleReject = (id: string) => {
    setRequests(requests.map(r => r.id === id ? { ...r, status: 'Rejected' } : r));
    alert(`Reversal ticket ${id} has been rejected.`);
  };

  const handleSubmitRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!receiptNo || !reason || !amount || !patientName) {
      alert('Please fill out all fields to request a refund.');
      return;
    }

    const newReq: RefundRequest = {
      id: `REF-0${Math.floor(Math.random() * 90) + 10}`,
      receiptNo,
      patientName,
      reason,
      amount: parseFloat(amount) || 0,
      requestDate: 'Today, Just Now',
      status: 'Pending Review',
      cashier: user?.email || 'Mark Santos',
    };

    setRequests([newReq, ...requests]);
    setReceiptNo('');
    setReason('');
    setAmount('');
    setPatientName('');
    alert('Void/reversal request submitted to supervisor review queue.');
  };

  const getStatusVariant = (status: string) => {
    if (status === 'Approved') return 'success';
    if (status === 'Rejected') return 'critical';
    return 'warning';
  };

  return (
    <HmsDashboardShell
      toolbar={
        <HmsToolbar 
          branchName={user?.branchId ? `Branch ID: ${user.branchId}` : 'Main Clinic'}
          role={user?.roles?.join(', ')}
        >
          <span className="text-[10px] font-bold uppercase text-rose-700 bg-rose-50 border border-rose-100 px-2 py-0.5 rounded-md">
            Pending Alerts: {requests.filter(r => r.status === 'Pending Review').length}
          </span>
        </HmsToolbar>
      }
      footer={<HmsAuditFooter dataSource="Simulation Workflow Engine" />}
    >
      <HmsPageHeader 
        title="Reversals & Refunds Desk" 
        description="Verify transaction codes, issue receipt refund requests, and process supervisor authorizations."
        badge="Exception Workflow"
      />

      {/* Sandbox Warning Banner */}
      <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex gap-2.5 text-[12px] text-amber-800 animate-fade-in">
        <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
        <div>
          <h5 className="font-bold uppercase text-[10px] tracking-wider">UI Demonstration Sandbox Shell</h5>
          <p className="font-medium">
            This refund desk executes in mock simulation only. Voids and reversals do not modify backend accounting systems.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        
        {/* Left: Alerts & Request Queue */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
            <div className="border-b border-slate-100 px-3 py-2.5 flex items-center justify-between">
              <h3 className="text-[13px] font-bold text-slate-800 uppercase tracking-tight flex items-center gap-1.5 font-sans">
                <ShieldAlert className="h-4 w-4 text-indigo-500" />
                Active Reversal Queue
              </h3>
              <span className="text-[10px] bg-slate-50 border border-slate-200 text-slate-500 font-bold px-2 py-0.5 rounded-md font-sans">
                {requests.length} Requests Total
              </span>
            </div>

            <div className="divide-y divide-slate-100 font-sans">
              {requests.length === 0 ? (
                <div className="py-12 text-center text-slate-400 font-bold text-[12px] uppercase tracking-wider">
                  No active requests in queue
                </div>
              ) : (
                requests.map((req) => (
                  <div key={req.id} className="p-4 hover:bg-slate-50/50 transition-colors flex flex-col md:flex-row justify-between gap-4">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-black text-slate-900 text-[14px] leading-none">{req.patientName}</span>
                        <span className="font-mono text-[11px] font-bold text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100">
                          {req.receiptNo}
                        </span>
                        <HmsStatusChip status={req.status} variant={getStatusVariant(req.status)} />
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-y-1 text-[11px] font-semibold text-slate-500">
                        <div className="flex items-center gap-1.5">
                          <span className="text-slate-400 uppercase text-[9px] font-black">Amount:</span>
                          <span className="font-mono font-bold text-rose-600">₱{req.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                        </div>
                        <div className="flex items-center gap-1.5 md:col-span-2">
                          <span className="text-slate-400 uppercase text-[9px] font-black">Reason:</span>
                          <span className="text-slate-700 italic">"{req.reason}"</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-slate-400 uppercase text-[9px] font-black">ID:</span>
                          <span className="font-mono">{req.id}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-slate-400 uppercase text-[9px] font-black">Date:</span>
                          <span className="font-mono">{req.requestDate}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {req.status === 'Pending Review' ? (
                        <>
                          <button
                            onClick={() => handleApprove(req.id)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold px-3 py-1.5 rounded-lg shadow-sm flex items-center gap-1 transition-all"
                          >
                            <CheckCircle className="h-3.5 w-3.5" /> Approve
                          </button>
                          <button
                            onClick={() => handleReject(req.id)}
                            className="border border-slate-200 text-slate-650 hover:bg-slate-50 text-[11px] font-bold px-3 py-1.5 rounded-lg transition-all"
                          >
                            <XCircle className="h-3.5 w-3.5 text-slate-400" /> Reject
                          </button>
                        </>
                      ) : (
                        <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest border border-slate-100 px-2 py-1 rounded bg-slate-50/50">
                          Processed
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right: Submit Request Form */}
        <div className="space-y-4">
          <HmsFormContainer
            title="Request Void Reversal"
            description="Submit a new transaction for supervisor authorization."
            onSubmit={handleSubmitRequest}
            columns={1}
            actions={
              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white text-[12px] font-bold py-2 rounded-lg flex items-center justify-center gap-1.5 shadow-sm transition-all"
              >
                <PlusCircle className="h-4 w-4" /> Submit Request
              </button>
            }
          >
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wide block">Receipt No</label>
              <input
                type="text"
                placeholder="RCP-2026-xxxx"
                value={receiptNo}
                onChange={(e) => setReceiptNo(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[12px] font-mono font-bold focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wide block">Patient Name</label>
              <input
                type="text"
                placeholder="Full Name"
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[12px] font-bold focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wide block">Amount (₱)</label>
              <input
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[12px] font-mono font-bold focus:outline-none focus:ring-1 focus:ring-blue-500"
                step="0.01"
              />
            </div>

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

          <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg text-[11px] text-blue-700 space-y-1.5 font-sans">
            <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-[10px]">
              <ShieldAlert className="h-3.5 w-3.5" />
              Authorization Notice
            </div>
            <p className="font-medium leading-relaxed">
              Submit triggers supervisor review alert. Voiding receipts requires a digital audit trail containing reasons and authorizing signatures.
            </p>
          </div>
        </div>

      </div>

    </HmsDashboardShell>
  );
};

export default RefundVoidQueuePage;
