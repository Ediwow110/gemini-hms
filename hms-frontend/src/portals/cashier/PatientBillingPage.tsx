import { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { PageHeader } from '../../components/ui/page-header';
import { 
  User, 
  Coins, 
  ShieldCheck, 
  CheckCircle, 
  AlertTriangle, 
  ArrowLeft, 
  Receipt,
  FileText
} from 'lucide-react';
import { InvoiceSummaryCard, BillItem } from './components/InvoiceSummaryCard';
import { PaymentMethodPanel } from './components/PaymentMethodPanel';
import { useInvoices, useActiveSession, useCreatePayment } from '../../hooks/use-billing';

export const PatientBillingPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const invoiceId = searchParams.get('invoice') || '';

  const { invoices, loading: invLoading, error: invError } = useInvoices();
  const { session, loading: sessionLoading } = useActiveSession();
  const { postPayment, loading: payLoading, error: payError } = useCreatePayment();

  const [paymentMethod, setPaymentMethod] = useState<string>('cash');
  const [showReceipt, setShowReceipt] = useState<boolean>(false);
  const [showConfirmation, setShowConfirmation] = useState<boolean>(false);
  const [receiptData, setReceiptData] = useState<{ id?: string } | null>(null);
  const [submitError, setSubmitError] = useState<string>('');

  const invoice = invoices.find(inv => inv.id === invoiceId || inv.invoiceNumber === invoiceId);

  if (invLoading || sessionLoading) {
    return (
      <div className="p-8 text-center space-y-4 animate-fade-in">
        <div className="animate-spin mx-auto w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full" />
        <p className="text-slate-500 font-medium tracking-wide animate-pulse">Loading billing details...</p>
      </div>
    );
  }

  if (invError || !invoice) {
    return (
      <div className="p-8 text-center space-y-4 animate-fade-in">
        <div className="mx-auto w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center">
          <AlertTriangle className="h-8 w-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-800">Invoice Not Found</h2>
        <p className="text-slate-500 max-w-md mx-auto">
          The requested invoice could not be located in this branch. Please verify the invoice ID or browse directory list.
        </p>
        <button onClick={() => navigate('/cashier/invoices')} className="btn btn-primary text-xs font-bold px-4 py-2 rounded-xl">
          Return to Directory
        </button>
      </div>
    );
  }

  const patientName = invoice.order?.patient 
    ? `${invoice.order.patient.firstName} ${invoice.order.patient.lastName}`
    : 'Walk-in Patient';

  const patient = {
    name: patientName,
    mrn: invoice.order?.patient?.patientNumber || 'WALK-IN',
    age: 'N/A',
    gender: 'N/A',
    insurance: 'Self Pay',
    policyNo: 'N/A',
    coPayPercent: 100
  };

  const billItems: BillItem[] = [
    {
      id: invoice.id,
      name: `Invoice #${invoice.invoiceNumber || invoice.id.substring(0, 8)}`,
      category: 'Billing Charges',
      quantity: 1,
      unitPrice: Number(invoice.totalAmount),
      subtotal: Number(invoice.totalAmount),
    }
  ];

  const amountPaid = Number(invoice.paidAmount);
  const totalAmount = Number(invoice.totalAmount);
  const remainingBalance = totalAmount - amountPaid;

  const handleMethodChange = (methodId: string) => {
    setPaymentMethod(methodId);
  };

  const handleProcessSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');
    if (!session) {
      setSubmitError('No active cashier session. You must open a cashier shift drawer session before processing checkout payments.');
      return;
    }
    if (remainingBalance <= 0) {
      setSubmitError('This invoice has already been fully paid.');
      return;
    }
    setShowConfirmation(true);
  };

  const handleConfirmPayment = async () => {
    setShowConfirmation(false);
    setSubmitError('');
    if (!session) return;
    try {
      // eslint-disable-next-line react-hooks/purity
      const idempotencyKey = `PAY-${invoice.id}-${Date.now()}`;
      const res = await postPayment({
        invoiceId: invoice.id,
        cashierSessionId: session.id,
        amount: remainingBalance,
        paymentMethod: paymentMethod.toUpperCase(),
      }, idempotencyKey);
      setReceiptData(res as { id?: string });
      setShowReceipt(true);
    } catch (err) {
      setSubmitError((err as Error).message || 'Payment failed to process');
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      {!session && (
        <div className="p-4 bg-amber-50 border border-amber-150 rounded-2xl flex gap-3 text-xs text-amber-805 font-bold">
          <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
          <div>
            <h5 className="font-extrabold uppercase text-[10px] tracking-wider">Active Shift Drawer Session Required</h5>
            <p className="font-medium mt-0.5">
              Please open a cashier shift drawer session to enable invoice checkout and payment processing.
            </p>
          </div>
        </div>
      )}

      {payError && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-750 font-bold">
          {payError}
        </div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/cashier')}
            className="p-2 border border-slate-200 hover:bg-slate-50 text-slate-500 hover:text-slate-800 rounded-xl transition-all"
          >
            <ArrowLeft className="h-4.5 w-4.5" />
          </button>
          <PageHeader 
            title="Patient Payment Desk" 
            description="Reconcile physician consults, clinic procedures, and LIS/RIS orders to process patient checkout bills." 
          />
        </div>
      </div>

      <div className="card p-5 bg-white border border-slate-200/80 shadow-sm rounded-2xl grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="flex items-center gap-3.5 border-b md:border-b-0 md:border-r border-slate-100 pb-4 md:pb-0">
          <div className="h-11 w-11 rounded-2xl bg-indigo-50 border border-indigo-150 flex items-center justify-center text-indigo-600 shadow-sm">
            <User className="h-5 w-5" />
          </div>
          <div>
            <h4 className="font-black text-slate-800 text-[13px] leading-tight">{patient.name}</h4>
            <span className="text-[10px] text-slate-400 font-mono font-bold uppercase">MRN: {patient.mrn}</span>
          </div>
        </div>

        <div className="space-y-1 text-xs">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Billing Status</span>
          <p className="font-bold text-slate-700">{invoice.status}</p>
        </div>

        <div className="space-y-1 text-xs col-span-2">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Payer Policy</span>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 font-bold text-indigo-755 bg-indigo-50 border border-indigo-150 px-2 py-0.5 rounded-lg">
              <ShieldCheck className="h-3.5 w-3.5 text-indigo-500" /> {patient.insurance}
            </span>
          </div>
        </div>
      </div>

      {!showReceipt ? (
        <form onSubmit={handleProcessSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <InvoiceSummaryCard
              invoiceNo={invoice.invoiceNumber || invoice.id.substring(0, 8)}
              items={billItems}
              discount={0}
              tax={0}
              hmoShare={0}
            />

            <div className="card p-5 bg-white border border-slate-200/80 shadow-sm rounded-2xl space-y-4">
              <h3 className="font-bold text-slate-800 text-sm tracking-wider uppercase border-b border-slate-100 pb-3 flex items-center gap-1.5">
                <Coins className="h-4.5 w-4.5 text-indigo-500" />
                Billing Adjustments & Discounts
              </h3>
              <p className="text-xs text-slate-500 font-medium leading-relaxed">
                Special senior citizen discounts and HMO adjudications must be requested and approved in billing workflows prior to payment posting.
              </p>
            </div>
          </div>

          <div className="space-y-6">
            <PaymentMethodPanel 
              amountDue={remainingBalance} 
              onMethodChange={handleMethodChange} 
            />

            <div className="card p-5 bg-white border border-slate-200/80 shadow-sm rounded-2xl space-y-4">
              <h4 className="font-bold text-slate-800 text-xs tracking-wider uppercase border-b border-slate-100 pb-2">
                Checkout Summary
              </h4>
              <div className="space-y-3.5 text-xs font-semibold">
                <div className="flex justify-between">
                  <span className="text-slate-500">Already Paid:</span>
                  <span className="font-mono text-slate-800">₱{amountPaid.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between border-t border-slate-100 pt-2 text-sm">
                  <span className="text-slate-900 font-bold">Remaining Due:</span>
                  <span className="font-mono text-slate-900 font-black">₱{remainingBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Payment Mode:</span>
                  <span className="font-black text-slate-800 capitalize">{paymentMethod}</span>
                </div>

                {submitError && (
                  <p className="text-[10px] text-rose-650 font-extrabold uppercase tracking-wide">
                    {submitError}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={payLoading || remainingBalance <= 0 || !session}
                  className="btn btn-success w-full py-3 text-xs font-black rounded-xl shadow-md flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <CheckCircle className="h-4.5 w-4.5" /> {payLoading ? 'Processing...' : 'Process Payment Clearance'}
                </button>
              </div>
            </div>
          </div>
        </form>
      ) : (
        /* Receipt preview */
        <div className="card p-8 bg-white border border-slate-200 shadow-lg rounded-3xl max-w-xl mx-auto space-y-6 animate-scale-in relative">
          
          <div className="text-center space-y-1">
            <Receipt className="h-10 w-10 text-emerald-600 mx-auto" />
            <h3 className="font-extrabold text-slate-800 text-lg uppercase tracking-wider">Gemini Hospital Billing</h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Branch POS Receipt Terminal</p>
          </div>

          <div className="border-t border-b border-slate-100 py-4 space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-400 font-bold">Receipt ID:</span>
              <span className="font-mono font-black text-slate-800">{receiptData?.id?.substring(0, 8) || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400 font-bold">Invoice Cleared:</span>
              <span className="font-mono font-black text-slate-800">{invoice.invoiceNumber || invoice.id.substring(0, 8)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400 font-bold">Patient Name:</span>
              <span className="font-black text-slate-800">{patient.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400 font-bold">MRN:</span>
              <span className="font-mono font-bold text-slate-850">{patient.mrn}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400 font-bold">Processed Time:</span>
              <span className="font-bold text-slate-800">Today, Just now</span>
            </div>
          </div>

          <div className="space-y-2 text-xs">
            <h5 className="font-black text-slate-400 uppercase text-[10px] tracking-wider">Cleared Charges</h5>
            {billItems.map((bi) => (
              <div key={bi.id} className="flex justify-between font-semibold">
                <span className="text-slate-700">{bi.name} x{bi.quantity}</span>
                <span className="font-mono text-slate-800">₱{bi.subtotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
              </div>
            ))}
          </div>

          <div className="border-t border-slate-100 pt-4 space-y-2 text-xs">
            <div className="flex justify-between font-bold text-slate-900 text-sm">
              <span>Amount Paid:</span>
              <span className="font-mono">₱{remainingBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between text-[10px] text-slate-450 font-bold uppercase">
              <span>Payment Mode:</span>
              <span>{paymentMethod}</span>
            </div>
          </div>

          <div className="p-3 bg-emerald-50 border border-emerald-150 rounded-2xl flex gap-2 text-xs text-emerald-800 font-bold justify-center items-center">
            <CheckCircle className="h-4.5 w-4.5 text-emerald-600 flex-shrink-0" />
            Billing cleared. POS Terminal receipt registered in audit logs.
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => {
                setShowReceipt(false);
                navigate('/cashier');
              }}
              className="btn bg-indigo-600 hover:bg-indigo-755 text-white text-xs font-black py-2.5 rounded-xl w-full"
            >
              Done & Return
            </button>
          </div>
        </div>
      )}

      <div className="max-w-xl mx-auto p-4.5 bg-slate-50 border border-slate-150/70 rounded-2xl text-[10px] text-slate-450 font-bold uppercase tracking-wider flex items-center gap-2">
        <FileText className="h-4.5 w-4.5 text-indigo-500" />
        <span>Branch POS POS terminal audit logs auto-generated on checkout confirm.</span>
      </div>

      {showConfirmation && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white border border-slate-200/85 rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-xl animate-scale-in">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-amber-50 border border-amber-150 flex items-center justify-center text-amber-600">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h4 className="font-extrabold text-slate-800 text-sm uppercase tracking-wider">Confirm Payment</h4>
                <p className="text-[10px] text-slate-400 font-bold uppercase">Invoice #{invoice.invoiceNumber || invoice.id.substring(0, 8)}</p>
              </div>
            </div>
            <p className="text-xs font-semibold text-slate-500 leading-relaxed">
              Are you sure you want to process the payment of <span className="text-slate-800 font-bold">₱{remainingBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span> using <span className="text-indigo-650 font-bold capitalize">{paymentMethod}</span>?
            </p>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmation(false)}
                className="btn border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-bold py-2.5 rounded-xl flex-1 transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmPayment}
                disabled={payLoading}
                className="btn btn-success text-xs font-black py-2.5 rounded-xl flex-1 flex items-center justify-center gap-1.5 shadow-sm"
              >
                <CheckCircle className="h-4.5 w-4.5" /> Confirm
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default PatientBillingPage;
