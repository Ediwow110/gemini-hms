import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../../components/ui/page-header';
import { 
  Banknote, 
  CreditCard, 
  FileText, 
  ShieldAlert, 
  History, 
  PlusCircle, 
  Coins, 
  Scale, 
  AlertTriangle 
} from 'lucide-react';
import { CashierSessionCard } from './components/CashierSessionCard';
import { PaymentQueueTable, QueueItem } from './components/PaymentQueueTable';
import { RefundVoidAlertPanel, RefundRequest } from './components/RefundVoidAlertPanel';

export const CashierDashboard = () => {
  const navigate = useNavigate();

  // Mock Cashier Session
  const session = {
    id: 'SESS-2026-0521',
    cashierName: 'Mark Santos',
    status: 'Active' as const,
    startedAt: 'Today, 08:00 AM',
    startingCash: 5000,
    expectedCash: 23450,
    actualCash: 23450,
  };

  // Mock Queue
  const [queueItems] = useState<QueueItem[]>([
    {
      id: 'Q-901',
      patientName: 'Carmilla Karnstein',
      mrn: 'MRN-2026-0771',
      invoiceNo: 'INV-2026-1044',
      department: 'Laboratory Services',
      amount: 1450.00,
      priority: 'STAT',
      status: 'Unpaid',
    },
    {
      id: 'Q-902',
      patientName: 'Arthur Pendleton',
      mrn: 'MRN-2026-0042',
      invoiceNo: 'INV-2026-1045',
      department: 'General Consultation',
      amount: 500.00,
      priority: 'Routine',
      hmoProvider: 'Maxicare Plus',
      status: 'Partial',
    },
    {
      id: 'Q-903',
      patientName: 'Eleanor Vance',
      mrn: 'MRN-2026-0091',
      invoiceNo: 'INV-2026-1046',
      department: 'Pharmacy / Drug Dispensation',
      amount: 2180.50,
      priority: 'Routine',
      status: 'Unpaid',
    }
  ]);

  // Mock Refund/Void Alerts
  const [refundRequests, setRefundRequests] = useState<RefundRequest[]>([
    {
      id: 'REF-081',
      receiptNo: 'RCP-2026-5120',
      patientName: 'Jonathan Harker',
      reason: 'Duplicate lab test charge ordered in error',
      amount: 850.00,
      requestDate: 'Today, 10:14 AM',
      status: 'Pending Review',
      cashier: 'Mark Santos',
    }
  ]);

  const handleApproveRefund = (id: string) => {
    setRefundRequests(refundRequests.map(r => 
      r.id === id ? { ...r, status: 'Approved' } : r
    ));
    alert(`Refund/Void Request ${id} approved successfully and audit log updated.`);
  };

  const handleRejectRefund = (id: string) => {
    setRefundRequests(refundRequests.map(r => 
      r.id === id ? { ...r, status: 'Rejected' } : r
    ));
    alert(`Refund/Void Request ${id} rejected.`);
  };

  // Mock KPIs
  const grossCollections = 18450;
  const cashOnHand = session.startingCash + grossCollections;
  const unpaidInvoices = 4030.50;
  const hmoPending = 15400.00;
  const refundRequestsTotal = 850.00;
  const variance = 0;

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Sandbox Banner Warning */}
      <div className="p-4 bg-amber-50 border border-amber-150 rounded-2xl flex gap-3 text-xs text-amber-800">
        <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
        <div>
          <h5 className="font-extrabold uppercase text-[10px] tracking-wider">UI Demonstration Sandbox Shell</h5>
          <p className="font-medium mt-0.5">
            This Cashier Workspace terminal is currently running in demonstration mode. Payments processed, receipts issued, and session reconciliations performed simulate transaction changes in local memory only. No real financial operations, invoice mutations, or bank/insurance communications will be triggered.
          </p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <PageHeader 
          title="Cashier Terminal Dashboard" 
          description="Manage daily POS transactions, collect payments, audit unpaid invoices, and reconcile cashier session cash drawers." 
        />
        <div className="text-[10px] font-black uppercase text-indigo-700 bg-indigo-50 border border-indigo-150 px-3.5 py-1.5 rounded-xl select-none">
          Drawer Session ID: {session.id}
        </div>
      </div>

      {/* Grid: KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        
        <div className="card p-4.5 bg-white border border-slate-200/80 shadow-sm rounded-2xl space-y-2">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-[10px] font-black uppercase tracking-wider">Session Collections</span>
            <Coins className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="space-y-0.5">
            <h3 className="font-black text-slate-800 text-lg">₱{grossCollections.toLocaleString('en-US')}</h3>
            <p className="text-[9px] font-semibold text-slate-400">Since session launch</p>
          </div>
        </div>

        <div className="card p-4.5 bg-white border border-slate-200/80 shadow-sm rounded-2xl space-y-2">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-[10px] font-black uppercase tracking-wider">Cash on Hand</span>
            <Banknote className="h-4 w-4 text-indigo-500" />
          </div>
          <div className="space-y-0.5">
            <h3 className="font-black text-slate-800 text-lg">₱{cashOnHand.toLocaleString('en-US')}</h3>
            <p className="text-[9px] font-semibold text-slate-400">Starting drawer + cash collections</p>
          </div>
        </div>

        <div className="card p-4.5 bg-white border border-slate-200/80 shadow-sm rounded-2xl space-y-2">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-[10px] font-black uppercase tracking-wider">Unpaid Invoices</span>
            <FileText className="h-4 w-4 text-rose-500" />
          </div>
          <div className="space-y-0.5">
            <h3 className="font-black text-slate-800 text-lg">₱{unpaidInvoices.toLocaleString('en-US')}</h3>
            <p className="text-[9px] font-semibold text-rose-500 animate-pulse">Pending branch collections</p>
          </div>
        </div>

        <div className="card p-4.5 bg-white border border-slate-200/80 shadow-sm rounded-2xl space-y-2">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-[10px] font-black uppercase tracking-wider">HMO Pending</span>
            <CreditCard className="h-4 w-4 text-blue-500" />
          </div>
          <div className="space-y-0.5">
            <h3 className="font-black text-slate-800 text-lg">₱{hmoPending.toLocaleString('en-US')}</h3>
            <p className="text-[9px] font-semibold text-slate-400">Unsubmitted HMO invoices</p>
          </div>
        </div>

        <div className="card p-4.5 bg-white border border-slate-200/80 shadow-sm rounded-2xl space-y-2">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-[10px] font-black uppercase tracking-wider">Refund Requests</span>
            <ShieldAlert className="h-4 w-4 text-rose-500" />
          </div>
          <div className="space-y-0.5">
            <h3 className="font-black text-slate-800 text-lg">₱{refundRequestsTotal.toLocaleString('en-US')}</h3>
            <p className="text-[9px] font-semibold text-rose-500">Awaiting approval</p>
          </div>
        </div>

        <div className="card p-4.5 bg-white border border-slate-200/80 shadow-sm rounded-2xl space-y-2">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-[10px] font-black uppercase tracking-wider">Variance</span>
            <Scale className="h-4 w-4 text-slate-450" />
          </div>
          <div className="space-y-0.5">
            <h3 className={`font-black text-lg ${variance !== 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
              ₱{variance.toFixed(2)}
            </h3>
            <p className="text-[9px] font-semibold text-slate-400">Drawer count match</p>
          </div>
        </div>

      </div>

      {/* Grid: Main sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left/Middle: Payment Queue and Refund Alerts */}
        <div className="lg:col-span-2 space-y-6">
          <PaymentQueueTable items={queueItems} />
          <RefundVoidAlertPanel 
            requests={refundRequests} 
            onApprove={handleApproveRefund} 
            onReject={handleRejectRefund} 
          />
        </div>

        {/* Right: Session monitor, Quick actions, and recent receipts */}
        <div className="space-y-6">
          <CashierSessionCard session={session} />

          {/* Quick Actions */}
          <div className="card p-5 bg-white border border-slate-200/80 shadow-sm rounded-2xl space-y-4">
            <h3 className="font-bold text-slate-800 text-sm tracking-wider uppercase border-b border-slate-100 pb-3 flex items-center gap-1.5">
              <PlusCircle className="h-4.5 w-4.5 text-indigo-500" />
              Cashier Actions
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <button 
                onClick={() => navigate('/cashier/billing')}
                className="btn border border-slate-200 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 py-3.5 text-center text-xs font-black rounded-2xl flex flex-col items-center justify-center gap-2 shadow-sm transition-all"
              >
                <CreditCard className="h-5 w-5 text-indigo-500" />
                Process Billing
              </button>
              <button 
                onClick={() => navigate('/cashier/reconciliation')}
                className="btn border border-slate-200 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 py-3.5 text-center text-xs font-black rounded-2xl flex flex-col items-center justify-center gap-2 shadow-sm transition-all"
              >
                <Scale className="h-5 w-5 text-indigo-500" />
                Daily Balance
              </button>
            </div>
          </div>

          {/* Recent Receipts Widget */}
          <div className="card p-5 bg-white border border-slate-200/80 shadow-sm rounded-2xl space-y-4">
            <h3 className="font-bold text-slate-800 text-sm tracking-wider uppercase border-b border-slate-100 pb-3 flex items-center gap-1.5">
              <History className="h-4.5 w-4.5 text-indigo-500" />
              Recent Drawer Receipts
            </h3>
            <div className="divide-y divide-slate-100 text-xs">
              <div className="py-2.5 flex justify-between items-center">
                <div>
                  <div className="font-bold text-slate-700">Jonathan Harker</div>
                  <div className="text-[10px] text-slate-400 font-mono">RCP-2026-5120 • 09:30 AM</div>
                </div>
                <div className="text-right">
                  <div className="font-black text-slate-800">₱850.00</div>
                  <span className="inline-block text-[9px] bg-rose-50 text-rose-700 border border-rose-150 px-1 rounded-md font-bold uppercase select-none">Void Requested</span>
                </div>
              </div>
              <div className="py-2.5 flex justify-between items-center">
                <div>
                  <div className="font-bold text-slate-700">Mina Murray</div>
                  <div className="text-[10px] text-slate-400 font-mono">RCP-2026-5119 • 09:12 AM</div>
                </div>
                <div className="text-right">
                  <div className="font-black text-slate-800">₱5,120.00</div>
                  <span className="inline-block text-[9px] bg-emerald-50 text-emerald-700 border border-emerald-150 px-1 rounded-md font-bold uppercase select-none">Cash Paid</span>
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};

export default CashierDashboard;
