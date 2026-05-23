import { useState } from 'react';
import { PageHeader } from '../../components/ui/page-header';
import { RefundVoidAlertPanel, RefundRequest } from './components/RefundVoidAlertPanel';
import { ShieldAlert, PlusCircle, AlertTriangle } from 'lucide-react';

export const RefundVoidQueuePage = () => {
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
      cashier: 'Mark Santos',
    };

    setRequests([newReq, ...requests]);
    setReceiptNo('');
    setReason('');
    setAmount('');
    setPatientName('');
    alert('Void/reversal request submitted to supervisor review queue.');
  };

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      
      {/* Sandbox Warning Banner */}
      <div className="p-4 bg-amber-50 border border-amber-150 rounded-2xl flex gap-3 text-xs text-amber-800">
        <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
        <div>
          <h5 className="font-extrabold uppercase text-[10px] tracking-wider">UI Demonstration Sandbox Shell</h5>
          <p className="font-medium mt-0.5">
            This refund desk executes in mock simulation only. Voids and reversals do not modify backend accounting systems.
          </p>
        </div>
      </div>

      <PageHeader 
        title="Reversals & Refunds Desk" 
        description="Verify transaction codes, issue receipts refund requests, and process supervisor authorizations." 
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left: Alerts & Request Queue */}
        <div className="lg:col-span-2 space-y-6">
          <RefundVoidAlertPanel 
            requests={requests} 
            onApprove={handleApprove} 
            onReject={handleReject} 
          />
        </div>

        {/* Right: Submit Request Form */}
        <div className="card p-5 bg-white border border-slate-200/80 shadow-sm rounded-2xl space-y-4">
          <h3 className="font-bold text-slate-800 text-sm tracking-wider uppercase border-b border-slate-100 pb-3 flex items-center gap-1.5">
            <PlusCircle className="h-4.5 w-4.5 text-indigo-500" />
            Request Void Reversal
          </h3>

          <form onSubmit={handleSubmitRequest} className="space-y-3.5 text-xs font-semibold text-slate-650">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-450 uppercase block">Original Receipt No</label>
              <input
                type="text"
                placeholder="RCP-2026-xxxx"
                value={receiptNo}
                onChange={(e) => setReceiptNo(e.target.value)}
                className="input py-2 bg-slate-50 border border-slate-200 rounded-xl w-full font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-450 uppercase block">Patient Name</label>
              <input
                type="text"
                placeholder="Enter patient full name"
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                className="input py-2 bg-slate-50 border border-slate-200 rounded-xl w-full"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-450 uppercase block">Refund Amount (₱)</label>
              <input
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="input py-2 bg-slate-50 border border-slate-200 rounded-xl w-full font-mono"
                step="0.01"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-450 uppercase block">Reason for Reversal</label>
              <textarea
                placeholder="Detail reason for review..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="input py-2 bg-slate-50 border border-slate-200 rounded-xl w-full min-h-[70px]"
              />
            </div>

            <div className="p-3 bg-rose-550/5 border border-rose-150/40 rounded-2xl text-[10px] text-slate-500 leading-tight">
              Submit triggers supervisor review alert. Voiding receipts requires a digital audit trail containing reasons and authorizing signatures.
            </div>

            <button
              type="submit"
              className="btn btn-primary text-xs font-black py-2.5 rounded-xl w-full flex items-center justify-center gap-1"
            >
              <ShieldAlert className="h-4 w-4" /> Submit Reversal Request
            </button>
          </form>
        </div>

      </div>

    </div>
  );
};

export default RefundVoidQueuePage;
