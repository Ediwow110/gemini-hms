import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { 
  Coins, 
  CheckCircle, 
  AlertTriangle, 
  Receipt,
  FileText
} from 'lucide-react';
import { InvoiceSummaryCard, BillItem } from './components/InvoiceSummaryCard';
import { PaymentMethodPanel } from './components/PaymentMethodPanel';
import { useInvoices, useActiveSession, useCreatePayment } from '../../hooks/use-billing';
import { usePatientBillingHandoff } from '../../hooks/use-clinical-workflow';
import { useUser } from '../../hooks/use-user';
import { useAutoDraft } from '../../lib/autodraft/useAutoDraft';
import { DraftRecoveryDialog } from '../../lib/autodraft/DraftRecoveryDialog';
import { safeDeleteAutoDraft } from '../../lib/autodraft/indexedDbDraftStore';
import { HmsDashboardShell, HmsToolbar, HmsAuditFooter } from '../../components/hms-dashboard';
import { HmsPageHeader, HmsSafetyBar } from '../../components/hms-page';
import { safeMoney } from '../../lib/safe-money';

type BillingDraftData = {
  paymentMethod: string;
};

export const PatientBillingPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const invoiceId = searchParams.get('invoice') || '';
  const currentUser = useUser();

  const { invoices, loading: invLoading, error: invError } = useInvoices();
  const { session, loading: sessionLoading } = useActiveSession();
  const { postPayment, loading: payLoading, error: payError } = useCreatePayment();

  const [formData, setFormData] = useState<BillingDraftData>({ paymentMethod: 'cash' });
  const [isDirty, setIsDirty] = useState(false);
  const [showRecovery, setShowRecovery] = useState(true);
  const [showReceipt, setShowReceipt] = useState<boolean>(false);
  const [showConfirmation, setShowConfirmation] = useState<boolean>(false);
  const [receiptData, setReceiptData] = useState<{ receiptId?: string } | null>(null);
  const [submitError, setSubmitError] = useState<string>('');
  const [lastUpdated, setLastUpdated] = useState<Date | undefined>(undefined);
  const idempotencyKeyRef = useRef<string>('');

  useEffect(() => {
    if (!invLoading && !sessionLoading) {
      setLastUpdated(new Date());
    }
  }, [invLoading, sessionLoading]);

  const paymentMethod = formData.paymentMethod;

  useEffect(() => {
    setShowRecovery(true);
    setFormData({ paymentMethod: 'cash' });
    setIsDirty(false);
    idempotencyKeyRef.current = '';
  }, [invoiceId]);

  const route = useMemo(
    () => `/cashier/billing?invoice=${invoiceId}`,
    [invoiceId]
  );

  const autoDraft = useAutoDraft<BillingDraftData>({
    enabled: true,
    userId: currentUser?.id ?? '',
    module: 'billing-invoice',
    entityId: invoiceId || 'new',
    route,
    formData,
    isDirty,
    ttlHours: 72,
  });

  const { draftId, discardDraft, clearRecoveredDraft } = autoDraft;

  const handleResume = useCallback(
    (draftFormData: BillingDraftData) => {
      setFormData(draftFormData);
      setIsDirty(true);
      clearRecoveredDraft();
    },
    [clearRecoveredDraft]
  );

  const handleClose = useCallback(() => setShowRecovery(false), []);

  const invoice = useMemo(() => invoices.find(inv => inv.id === invoiceId || inv.invoiceNumber === invoiceId), [invoices, invoiceId]);
  const patientId = invoice?.order?.patient?.id || '';
  // Load clinical handoff data if patientId exists (required for Target 12)
  const { data: handoffData } = usePatientBillingHandoff(patientId);
  const hasHandoff = !!handoffData;

  const patientName = invoice?.order?.patient
    ? `${invoice.order.patient.firstName} ${invoice.order.patient.lastName}`
    : 'Walk-in Patient';

  const patient = {
    name: patientName,
    mrn: invoice?.order?.patient?.patientNumber
      ? invoice.order.patient.patientNumber
      : 'WALK-IN',
    age: 'N/A',
    gender: 'N/A',
    insurance: 'Unavailable',
    policyNo: 'Unavailable',
    coPayPercent: 100
  };

  const billItems: BillItem[] = useMemo(() => {
    if (!invoice) return [];
    return [
      {
        id: invoice.id,
        name: `Invoice #${invoice.invoiceNumber || invoice.id.substring(0, 8)}`,
        category: 'Billing Charges',
        quantity: 1,
        unitPrice: safeMoney(invoice.totalAmount),
        subtotal: safeMoney(invoice.totalAmount),
      }
    ];
  }, [invoice]);

  const amountPaid = invoice ? safeMoney(invoice.paidAmount) : 0;
  const totalAmount = invoice ? safeMoney(invoice.totalAmount) : 0;
  const remainingBalance = totalAmount - amountPaid;

  const handleMethodChange = (methodId: string) => {
    setFormData((prev) => ({ ...prev, paymentMethod: methodId }));
    setIsDirty(true);
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
    if (!session || !invoice) return;
    try {
      if (!idempotencyKeyRef.current) {
        idempotencyKeyRef.current = `PAY-${invoice.id}-${Math.random().toString(36).substring(2, 15)}`;
      }
      const idempotencyKey = idempotencyKeyRef.current;
      const res = await postPayment({
        invoiceId: invoice.id,
        cashierSessionId: session.id,
        amount: remainingBalance,
        paymentMethod: paymentMethod.toUpperCase(),
      }, idempotencyKey);
      setIsDirty(false);
      await safeDeleteAutoDraft(draftId, "billing-payment-success");
      const paymentResult = res as { payment?: { receiptNumber?: string } };
      setReceiptData({ receiptId: paymentResult.payment?.receiptNumber });
      setShowReceipt(true);
    } catch (err) {
      setSubmitError((err as Error).message || 'Payment failed to process');
    }
  };

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
      <div className="p-8 text-center space-y-4 bg-white border border-slate-200 rounded-lg max-w-md mx-auto mt-12 shadow-sm animate-fade-in">
        <div className="mx-auto w-12 h-12 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center">
          <AlertTriangle className="h-6 w-6" />
        </div>
        <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider font-sans">Invoice Not Found</h2>
        <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed font-sans">
          The requested invoice could not be located in this branch. Please verify the invoice ID or browse the directory list.
        </p>
        <button 
          onClick={() => navigate('/cashier')} 
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-colors font-sans shadow-sm"
        >
          Return to Directory
        </button>
      </div>
    );
  }

  return (
    <HmsDashboardShell
      toolbar={
        <HmsToolbar 
          branchName={currentUser?.branchId || undefined} 
          role={currentUser?.roles?.join(', ') || 'Cashier Operator'} 
          lastRefreshed={lastUpdated}
        />
      }
      footer={<HmsAuditFooter lastRefreshed={lastUpdated} dataSource="Billing POS Service" version="v2.1" />}
    >
      {!session && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex gap-2 text-xs text-amber-800 font-bold font-sans justify-between items-center">
          <div className="flex gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <h5 className="font-extrabold uppercase text-[10px] tracking-wider">Active Shift Drawer Session Required</h5>
              <p className="font-medium mt-0.5 text-slate-700">
                Please open a cashier shift drawer session to enable invoice checkout and payment processing.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => navigate('/cashier/session')}
            className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg shadow-sm transition-colors whitespace-nowrap"
          >
            Open Session
          </button>
        </div>
      )}

      {/* Recovery dialog */}
      {showRecovery ? (
        <DraftRecoveryDialog
          draft={autoDraft.recoveredDraft}
          onResume={handleResume}
          onDiscard={discardDraft}
          onClose={handleClose}
          message="Recovered billing draft — review all fields carefully before submitting payment. This is local browser data, not a processed payment or receipt."
        />
      ) : null}

      {autoDraft.lastDraft ? (
        <p className="text-[10px] text-slate-400 text-right -mb-2 font-sans font-medium">
          Local draft saved <span className="font-mono">{new Date(autoDraft.lastDraft.updatedAt).toLocaleTimeString()}</span>
        </p>
      ) : null}

      {payError && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 font-bold font-sans">
          {payError}
        </div>
      )}

      <HmsPageHeader 
        title="Patient Payment Desk" 
        description="Reconcile physician consults, clinic procedures, and LIS/RIS orders to process patient checkout bills."
        onBack={() => navigate('/cashier')}
      />

      <HmsSafetyBar
        patientName={patient.name}
        mrn={patient.mrn}
        dob={undefined}
        age={patient.age}
        gender={patient.gender}
        allergies="N/A"
        insurance={patient.insurance}
        policyNo={patient.policyNo}
      />

      {!showReceipt ? (
        <form onSubmit={handleProcessSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          <div className="lg:col-span-2 space-y-3">
            <InvoiceSummaryCard
              invoiceNo={invoice.invoiceNumber || invoice.id.substring(0, 8)}
              items={billItems}
              discount={0}
              tax={0}
              hmoShare={0}
              className="!rounded-lg"
            />

            <div className="bg-white border border-slate-200 p-4 rounded-lg shadow-sm space-y-2">
              <h3 className="font-bold text-slate-900 text-[10px] tracking-wider uppercase border-b border-slate-100 pb-1.5 flex items-center gap-1 font-sans">
                <Coins className="h-4 w-4 text-blue-500" />
                Billing Adjustments & Discounts
              </h3>
              <p className="text-xs text-slate-500 font-medium leading-relaxed font-sans">
                Special senior citizen discounts and HMO adjudications must be requested and approved in billing workflows prior to payment posting.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <PaymentMethodPanel 
              amountDue={remainingBalance} 
              onMethodChange={handleMethodChange} 
              className="!rounded-lg"
            />

            <div className="bg-white border border-slate-200 p-4 rounded-lg shadow-sm space-y-3">
              <h4 className="font-bold text-slate-900 text-[10px] tracking-wider uppercase border-b border-slate-100 pb-1.5 font-sans">
                Checkout Summary
              </h4>
              <div className="space-y-2 text-xs font-semibold font-sans">
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
                  <span className="font-bold text-slate-800 capitalize">{paymentMethod}</span>
                </div>

                {hasHandoff && (
                  <div className="text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-lg py-1 text-center font-bold uppercase tracking-wider font-sans">
                    Clinical Handoff Active
                  </div>
                )}

                {submitError && (
                  <p className="text-[10px] text-rose-650 font-extrabold uppercase tracking-wide font-sans">
                    {submitError}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={payLoading || remainingBalance <= 0 || !session}
                  className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-sm flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-sans"
                >
                  <CheckCircle className="h-4 w-4" /> {payLoading ? 'Processing...' : 'Process Payment Clearance'}
                </button>
              </div>
            </div>
          </div>
        </form>
      ) : (
        /* Receipt preview */
        <div className="bg-white border border-slate-200 p-6 shadow-sm rounded-lg max-w-md mx-auto space-y-4 animate-scale-in">
          <div className="text-center space-y-1">
            <Receipt className="h-8 w-8 text-emerald-600 mx-auto" />
            <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wider font-sans">Gemini Hospital Billing</h3>
            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest font-sans">Branch POS Receipt Terminal</p>
          </div>

          <div className="border-t border-b border-slate-100 py-3 space-y-1.5 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-400 font-bold font-sans">Receipt ID:</span>
              <span className="font-mono font-bold text-slate-800">{receiptData?.receiptId?.substring(0, 8) || invoice.invoiceNumber || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400 font-bold font-sans">Invoice Cleared:</span>
              <span className="font-mono font-bold text-slate-800">{invoice.invoiceNumber || invoice.id.substring(0, 8)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400 font-bold font-sans">Patient Name:</span>
              <span className="font-bold text-slate-800 font-sans">{patient.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400 font-bold font-sans">MRN:</span>
              <span className="font-mono font-bold text-slate-800">{patient.mrn}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400 font-bold font-sans">Processed Time:</span>
              <span className="font-bold text-slate-800 font-sans">Today, Just now</span>
            </div>
          </div>

          <div className="space-y-1.5 text-xs font-sans">
            <h5 className="font-bold text-slate-400 uppercase text-[9px] tracking-wider font-sans">Cleared Charges</h5>
            {billItems.map((bi) => (
              <div key={bi.id} className="flex justify-between font-semibold">
                <span className="text-slate-700">{bi.name} x{bi.quantity}</span>
                <span className="font-mono text-slate-800">₱{bi.subtotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
              </div>
            ))}
          </div>

          <div className="border-t border-slate-100 pt-3 space-y-1.5 text-xs">
            <div className="flex justify-between font-bold text-slate-900 text-sm font-sans">
              <span>Amount Paid:</span>
              <span className="font-mono">₱{remainingBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between text-[9px] text-slate-450 font-bold uppercase font-sans">
              <span>Payment Mode:</span>
              <span>{paymentMethod}</span>
            </div>
          </div>

          <div className="p-2.5 bg-emerald-50 border border-emerald-150 rounded-lg flex gap-1.5 text-xs text-emerald-800 font-bold justify-center items-center font-sans">
            <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0" />
            Billing cleared. Payment posted successfully.
          </div>

          <button
            onClick={() => {
              setShowReceipt(false);
              navigate('/cashier');
            }}
            className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-colors font-sans shadow-sm"
          >
            Done & Return
          </button>
        </div>
      )}

      <div className="max-w-md mx-auto p-3 bg-slate-50 border border-slate-200 rounded-lg text-[9px] text-slate-500 font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 font-sans shadow-sm">
        <FileText className="h-4 w-4 text-blue-500" />
        <span>Branch POS terminal audit logs auto-generated on checkout confirm.</span>
      </div>

      {showConfirmation && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div role="dialog" aria-modal="true" aria-labelledby="confirm-payment-title" className="bg-white border border-slate-200 rounded-lg p-5 max-w-sm w-full space-y-3 shadow-md">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
                <AlertTriangle className="h-4.5 w-4.5" aria-hidden="true" />
              </div>
              <div>
                <h4 id="confirm-payment-title" className="font-bold text-slate-900 text-xs uppercase tracking-wider font-sans">Confirm Payment</h4>
                <p className="text-[9px] text-slate-400 font-bold uppercase font-mono">Invoice #{invoice.invoiceNumber || invoice.id.substring(0, 8)}</p>
              </div>
            </div>
            <p className="text-xs font-semibold text-slate-500 leading-relaxed font-sans">
              Are you sure you want to process the payment of <span className="text-slate-800 font-bold">₱{remainingBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span> using <span className="text-blue-600 font-bold capitalize">{paymentMethod}</span>?
            </p>
            <div className="flex gap-2 pt-1 font-sans">
              <button
                type="button"
                onClick={() => setShowConfirmation(false)}
                className="border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-bold py-1.5 rounded-lg flex-1 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmPayment}
                disabled={payLoading}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-1.5 rounded-lg flex-1 flex items-center justify-center gap-1.5 shadow-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
              >
                <CheckCircle className="h-4 w-4" aria-hidden="true" /> Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </HmsDashboardShell>
  );
};

export default PatientBillingPage;
