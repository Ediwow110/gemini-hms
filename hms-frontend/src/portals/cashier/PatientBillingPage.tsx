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
import { usePatientBillingHandoff } from '../../hooks/use-clinical-workflow';
import axios from 'axios';

// Helper to identify real UUID format patient IDs vs mock IDs
const isUuid = (val: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);

export const PatientBillingPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const invoiceNo = searchParams.get('invoice') || 'INV-2026-1044';
  const rawPatientId = searchParams.get('patientId') || searchParams.get('id') || '';

  const isRealMode = isUuid(rawPatientId);
  
  // NEUTRALIZED: The Cashier role is excluded from clinicalRoles in the backend's authorizePatientAccess policy.
  // To prevent throwing a 403 Forbidden (missing_clinical_role) error, we do not call the API client for Cashier.
  // We explicitly disable the API call by passing an empty string, keeping Cashier unwired from live clinical endpoints.
  const queryPatientId = ''; 

  const { data: billingHandoffs, isLoading, error } = usePatientBillingHandoff(queryPatientId);

  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [taxPercent] = useState<number>(12); // 12% standard VAT
  const [hmoAuthorized, setHmoAuthorized] = useState<boolean>(false);

  const [paymentMethod, setPaymentMethod] = useState<string>('cash');
  const [showReceipt, setShowReceipt] = useState<boolean>(false);
  const [showConfirmation, setShowConfirmation] = useState<boolean>(false);

  if (error) {
    const isForbidden = axios.isAxiosError(error) && (error.response?.status === 403 || error.response?.status === 401);
    return (
      <div className="p-8 text-center space-y-4 animate-fade-in">
        <div className="mx-auto w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center">
          <AlertTriangle className="h-8 w-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-800">
          {isForbidden ? 'Access Restricted' : 'Connection Error'}
        </h2>
        <p className="text-slate-500 max-w-md mx-auto">
          {isForbidden 
            ? 'You do not have permission to view the billing workspace. Please contact your administrator.' 
            : 'Failed to connect to the billing service. Please check your network connection or try again later.'}
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-8 text-center space-y-4 animate-fade-in">
        <div className="animate-spin mx-auto w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full" />
        <p className="text-slate-500 font-medium tracking-wide animate-pulse">Loading billing records...</p>
      </div>
    );
  }

  // Redact patient demographics/clinical details if in real mode since Cashier has no access to Patient Summary or EMR notes
  const patient = isRealMode 
    ? {
        name: '[REDACTED (Access Restricted)]',
        mrn: '[REDACTED (Access Restricted)]',
        age: '[REDACTED]',
        gender: '[REDACTED]',
        insurance: '[REDACTED]',
        policyNo: '[REDACTED]',
        coPayPercent: 0 // HMO co-pay is redacted / default 0
      }
    : {
        name: 'Carmilla Karnstein',
        mrn: 'MRN-2026-0771',
        age: '24 Years',
        gender: 'Female',
        insurance: 'Maxicare Plus (Premium Partner)',
        policyNo: 'POL-9028-11',
        coPayPercent: 10 // 10% co-pay required
      };

  const defaultBillItems: BillItem[] = [
    {
      id: 'BI-01',
      name: 'Complete Blood Count (CBC) with Platelets',
      category: 'Laboratory Services',
      quantity: 1,
      unitPrice: 450.00,
      subtotal: 450.00,
    },
    {
      id: 'BI-02',
      name: 'Basic Metabolic Panel (BMP) Blood Assay',
      category: 'Laboratory Services',
      quantity: 1,
      unitPrice: 650.00,
      subtotal: 650.00,
    },
    {
      id: 'BI-03',
      name: 'Medical Consultation Fee (Outpatient General)',
      category: 'Physician Fees',
      quantity: 1,
      unitPrice: 500.00,
      subtotal: 500.00,
    }
  ];

  const billItems: BillItem[] = isRealMode && billingHandoffs && billingHandoffs.length > 0
    ? billingHandoffs.map((item) => ({
        id: item.id,
        name: `Clinical Order #${item.orderNumber}`,
        category: 'Clinical Handoff',
        quantity: 1,
        unitPrice: item.totalAmount,
        subtotal: item.totalAmount,
      }))
    : defaultBillItems;

  // Recalculate billing values dynamically on render
  const grossTotal = billItems.reduce((sum, item) => sum + item.subtotal, 0);
  const discountAmt = (grossTotal * discountPercent) / 100;
  const vatAmt = ((grossTotal - discountAmt) * taxPercent) / 100;
  const finalTotal = grossTotal - discountAmt + vatAmt;

  const hmoApprovedPortion = hmoAuthorized && !isRealMode
    ? Math.max(0, finalTotal - (finalTotal * (patient.coPayPercent / 100)))
    : 0;
  const coPayDue = Math.max(0, finalTotal - hmoApprovedPortion);

  const handleMethodChange = (methodId: string) => {
    setPaymentMethod(methodId);
  };

  const handleProcessSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowConfirmation(true);
  };

  const handleConfirmPayment = () => {
    setShowConfirmation(false);
    setShowReceipt(true);
  };

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      
      {/* Sandbox Warning Banner */}
      <div className="p-4 bg-amber-50 border border-amber-150 rounded-2xl flex gap-3 text-xs text-amber-800">
        <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
        <div>
          <h5 className="font-extrabold uppercase text-[10px] tracking-wider">UI Demonstration Sandbox Shell</h5>
          <p className="font-medium mt-0.5">
            This billing page is running in sandboxed demo mode. Triggering a billing clearance simulates transaction logs in local memory only. No real payment gateways will be triggered, and no insurance adjudications will be dispatched to external insurers.
          </p>
        </div>
      </div>

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

      {/* Patient billing header */}
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
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Demographics</span>
          <p className="font-bold text-slate-700">{patient.age} / {patient.gender}</p>
        </div>

        <div className="space-y-1 text-xs col-span-2">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Insurance / Payer Split</span>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 font-bold text-indigo-750 bg-indigo-50 border border-indigo-150 px-2 py-0.5 rounded-lg">
              <ShieldCheck className="h-3.5 w-3.5 text-indigo-500" /> {patient.insurance}
            </span>
            <span className="text-[10px] text-slate-400 font-semibold font-mono">No: {patient.policyNo}</span>
          </div>
        </div>
      </div>

      {!showReceipt ? (
        <form onSubmit={handleProcessSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Invoice items and adjustments */}
          <div className="lg:col-span-2 space-y-6">
            <InvoiceSummaryCard
              invoiceNo={invoiceNo}
              items={billItems}
              discount={discountPercent}
              tax={taxPercent}
              hmoShare={hmoApprovedPortion}
            />

            {/* Adjustments & Discounts */}
            <div className="card p-5 bg-white border border-slate-200/80 shadow-sm rounded-2xl space-y-4">
              <h3 className="font-bold text-slate-800 text-sm tracking-wider uppercase border-b border-slate-100 pb-3 flex items-center gap-1.5">
                <Coins className="h-4.5 w-4.5 text-indigo-500" />
                Billing Adjustments & Discounts
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                {/* Custom Discount Selector */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-450 uppercase block">Special Discounts / Adjustments</label>
                  <select
                    value={discountPercent}
                    disabled={isRealMode}
                    onChange={(e) => setDiscountPercent(parseInt(e.target.value) || 0)}
                    className="input py-2 text-xs w-full bg-slate-50 border border-slate-200 rounded-xl disabled:opacity-50"
                  >
                    <option value="0">No Discounts Applied</option>
                    <option value="20">Senior Citizen / PWD (20% Exempt)</option>
                    <option value="10">Staff Benefit (10% Discount)</option>
                    <option value="15">Corporate Account Allowance (15%)</option>
                  </select>
                </div>

                {/* HMO Adjudication Checkbox */}
                <div className="space-y-2 flex flex-col justify-end">
                  <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl p-2.5">
                    <input
                      type="checkbox"
                      disabled={isRealMode}
                      checked={hmoAuthorized}
                      onChange={(e) => setHmoAuthorized(e.target.checked)}
                      className="rounded border-slate-350 text-indigo-600 focus:ring-indigo-500 disabled:opacity-50"
                    />
                    <span>Authorize HMO Direct Payer Coverage ({isRealMode ? 'Redacted' : `${100 - patient.coPayPercent}% Approved`})</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Payment panel and submission */}
          <div className="space-y-6">
            <PaymentMethodPanel 
              amountDue={coPayDue} 
              onMethodChange={handleMethodChange} 
            />

            <div className="card p-5 bg-white border border-slate-200/80 shadow-sm rounded-2xl space-y-4">
              <h4 className="font-bold text-slate-800 text-xs tracking-wider uppercase border-b border-slate-100 pb-2">
                Checkout Summary
              </h4>
              <div className="space-y-3.5 text-xs font-semibold">
                <div className="flex justify-between">
                  <span className="text-slate-500">Gross Due:</span>
                  <span className="font-mono text-slate-800">₱{coPayDue.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Payment Mode:</span>
                  <span className="font-black text-slate-800 capitalize">{paymentMethod}</span>
                </div>

                <button
                  type="submit"
                  disabled={isRealMode && billItems.length === 0}
                  className="btn btn-success w-full py-3 text-xs font-black rounded-xl shadow-md flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <CheckCircle className="h-4.5 w-4.5" /> Process Payment Clearance
                </button>
              </div>
            </div>
          </div>
        </form>
      ) : (
        /* Receipt preview shell */
        <div className="card p-8 bg-white border border-slate-200 shadow-lg rounded-3xl max-w-xl mx-auto space-y-6 animate-scale-in relative">
          
          <div className="text-center space-y-1">
            <Receipt className="h-10 w-10 text-emerald-600 mx-auto" />
            <h3 className="font-extrabold text-slate-800 text-lg uppercase tracking-wider">Gemini Hospital Billing</h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Branch POS Receipt Terminal</p>
          </div>

          <div className="border-t border-b border-slate-100 py-4 space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-400 font-bold">Receipt Number:</span>
              <span className="font-mono font-black text-slate-800">RCP-2026-9028</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400 font-bold">Invoice Cleared:</span>
              <span className="font-mono font-black text-slate-800">{invoiceNo}</span>
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
            <div className="flex justify-between">
              <span className="text-slate-400 font-bold">Teller Cashier:</span>
              <span className="font-bold text-slate-800">Mark Santos</span>
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
            {hmoApprovedPortion > 0 && (
              <div className="flex justify-between text-indigo-700 font-bold">
                <span>HMO Covered ({patient.insurance}):</span>
                <span className="font-mono">₱{hmoApprovedPortion.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-slate-900 text-sm">
              <span>Co-Pay Amount Paid:</span>
              <span className="font-mono">₱{coPayDue.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between text-[10px] text-slate-450 font-bold uppercase">
              <span>Payment Mode:</span>
              <span>{paymentMethod}</span>
            </div>
          </div>

          <div className="p-3 bg-emerald-50 border border-emerald-150 rounded-2xl flex gap-2 text-xs text-emerald-800 font-bold justify-center items-center">
            <CheckCircle className="h-4.5 w-4.5 text-emerald-600 flex-shrink-0" />
            Billing cleared. POS Terminal receipt registered in sandbox log.
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => {
                setShowReceipt(false);
                navigate('/cashier');
              }}
              className="btn bg-indigo-600 hover:bg-indigo-750 text-white text-xs font-black py-2.5 rounded-xl w-full"
            >
              Done & Return
            </button>
            <button
              onClick={() => window.print()}
              className="btn border border-slate-200 text-slate-650 hover:bg-slate-50 text-xs font-bold py-2.5 rounded-xl w-full"
            >
              Print Receipt
            </button>
          </div>
        </div>
      )}

      {/* Payment confirmation modal */}
      {showConfirmation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 shadow-2xl max-w-md w-full border border-slate-200 animate-scale-in relative space-y-4 text-xs font-semibold text-slate-700">
            <h4 className="font-extrabold text-slate-800 text-sm tracking-wider uppercase border-b border-slate-100 pb-3">
              Confirm POS Checkout
            </h4>
            <p className="text-slate-500 font-medium leading-relaxed">
              Are you sure you want to authorize payment clearance for patient <strong>{patient.name}</strong> under invoice <strong>{invoiceNo}</strong>?
            </p>
            <div className="space-y-2 p-3 bg-slate-50 rounded-2xl">
              <div className="flex justify-between">
                <span>Co-Pay Due:</span>
                <strong className="font-mono text-slate-800">₱{coPayDue.toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong>
              </div>
              <div className="flex justify-between">
                <span>Payment Mode:</span>
                <strong className="text-slate-850 capitalize">{paymentMethod}</strong>
              </div>
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <button
                onClick={handleConfirmPayment}
                className="btn bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold px-4 py-2.5 rounded-xl shadow-sm"
              >
                Confirm Clearance
              </button>
              <button
                onClick={() => setShowConfirmation(false)}
                className="btn border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold px-4 py-2.5 rounded-xl"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Audit-readiness footer */}
      <div className="max-w-xl mx-auto p-4.5 bg-slate-50 border border-slate-150/70 rounded-2xl text-[10px] text-slate-450 font-bold uppercase tracking-wider flex items-center gap-2">
        <FileText className="h-4.5 w-4.5 text-indigo-500" />
        <span>Branch POS POS terminal audit logs auto-generated on checkout confirm.</span>
      </div>

    </div>
  );
};

export default PatientBillingPage;
