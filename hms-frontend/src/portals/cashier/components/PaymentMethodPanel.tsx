import { useState } from 'react';
import { Banknote, CreditCard, Smartphone, ShieldCheck } from 'lucide-react';

export interface PaymentDetails {
  receivedAmount: number;
  referenceNo: string;
  cardholderName: string;
  lastFour: string;
  authCode: string;
}

interface PaymentMethodPanelProps {
  amountDue: number;
  onMethodChange: (method: string, details: PaymentDetails) => void;
  className?: string;
}

export const PaymentMethodPanel = ({ amountDue, onMethodChange, className = '' }: PaymentMethodPanelProps) => {
  const [method, setMethod] = useState<'cash' | 'card' | 'online' | 'hmo'>('cash');
  const [details, setDetails] = useState<PaymentDetails>({
    receivedAmount: amountDue,
    referenceNo: '',
    cardholderName: '',
    lastFour: '',
    authCode: '',
  });

  const methods = [
    { id: 'cash', label: 'Cash', icon: Banknote, style: 'border-emerald-500 bg-emerald-50 text-emerald-700' },
    { id: 'card', label: 'Card Payment', icon: CreditCard, style: 'border-indigo-500 bg-indigo-50 text-indigo-700' },
    { id: 'online', label: 'Digital/E-Wallet', icon: Smartphone, style: 'border-blue-500 bg-blue-50 text-blue-700' },
    { id: 'hmo', label: 'HMO Allocation', icon: ShieldCheck, style: 'border-violet-500 bg-violet-50 text-violet-750' },
  ];

  const handleMethodSelect = (selected: 'cash' | 'card' | 'online' | 'hmo') => {
    setMethod(selected);
    const updated = {
      ...details,
      receivedAmount: selected === 'hmo' ? amountDue : details.receivedAmount,
    };
    setDetails(updated);
    onMethodChange(selected, updated);
  };

  const handleInputChange = (field: string, val: string | number) => {
    const updated = { ...details, [field]: val };
    setDetails(updated);
    onMethodChange(method, updated);
  };

  const changeAmount = method === 'cash' ? Math.max(0, details.receivedAmount - amountDue) : 0;

  return (
    <div className={`card p-5 bg-white border border-slate-200/80 shadow-sm rounded-2xl space-y-4 ${className}`}>
      <div>
        <label className="text-[10px] font-black text-slate-400 uppercase block mb-2 tracking-wider">
          Payment Method Mode
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {methods.map((m) => {
            const Icon = m.icon;
            const active = method === m.id;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => handleMethodSelect(m.id as 'cash' | 'card' | 'online' | 'hmo')}
                className={`flex flex-col items-center justify-center gap-1.5 py-3.5 px-2.5 rounded-xl border-2 text-[11px] font-extrabold transition-all cursor-pointer ${
                  active
                    ? `${m.style} shadow-sm`
                    : 'border-slate-100 bg-slate-50 hover:bg-slate-100/60 text-slate-500'
                }`}
              >
                <Icon className="h-5 w-5" />
                {m.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-3.5 border-t border-slate-550/10 pt-3">
        {method === 'cash' && (
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-450 uppercase block">Cash Received</label>
              <input
                type="number"
                value={details.receivedAmount}
                onChange={(e) => handleInputChange('receivedAmount', parseFloat(e.target.value) || 0)}
                className="input font-mono font-bold text-slate-800 text-sm py-2 bg-slate-50 border border-slate-200 rounded-xl w-full"
                step="0.01"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-450 uppercase block">Cash Change Due</label>
              <div className="h-10 border border-slate-100 bg-slate-50 rounded-xl flex items-center px-3.5 font-mono font-black text-emerald-600 text-sm">
                ₱{changeAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </div>
            </div>
          </div>
        )}

        {method === 'card' && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-450 uppercase block">Cardholder Name</label>
              <input
                type="text"
                placeholder="Name on card"
                value={details.cardholderName}
                onChange={(e) => handleInputChange('cardholderName', e.target.value)}
                className="input text-xs py-2 bg-slate-50 border border-slate-200 rounded-xl w-full"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-450 uppercase block">Last 4 Digits</label>
              <input
                type="text"
                placeholder="xxxx"
                maxLength={4}
                value={details.lastFour}
                onChange={(e) => handleInputChange('lastFour', e.target.value)}
                className="input text-xs py-2 font-mono bg-slate-50 border border-slate-200 rounded-xl w-full"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-450 uppercase block">Authorization Code</label>
              <input
                type="text"
                placeholder="Auth approval ID"
                value={details.authCode}
                onChange={(e) => handleInputChange('authCode', e.target.value)}
                className="input text-xs py-2 font-mono bg-slate-50 border border-slate-200 rounded-xl w-full"
              />
            </div>
          </div>
        )}

        {method === 'online' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-450 uppercase block">E-Wallet Provider</label>
              <select
                className="input text-xs py-2 bg-slate-50 border border-slate-200 rounded-xl w-full"
                onChange={(e) => handleInputChange('referenceNo', e.target.value + ' Ref: ' + details.referenceNo)}
              >
                <option value="GCash">GCash Wallet</option>
                <option value="PayMaya">Maya Wallet</option>
                <option value="GrabPay">GrabPay Direct</option>
                <option value="BankTransfer">InstaPay Bank Transfer</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-450 uppercase block">Transaction Reference No</label>
              <input
                type="text"
                placeholder="Enter trace / transaction ref"
                value={details.referenceNo}
                onChange={(e) => handleInputChange('referenceNo', e.target.value)}
                className="input text-xs py-2 font-mono bg-slate-50 border border-slate-200 rounded-xl w-full"
              />
            </div>
          </div>
        )}

        {method === 'hmo' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-450 uppercase block">LOA Approval Number</label>
              <input
                type="text"
                placeholder="Enter Letter of Auth code"
                value={details.authCode}
                onChange={(e) => handleInputChange('authCode', e.target.value)}
                className="input text-xs py-2 font-mono bg-slate-50 border border-slate-200 rounded-xl w-full"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-450 uppercase block">Co-Pay Required (Private Balance)</label>
              <div className="h-10 border border-slate-100 bg-slate-50 rounded-xl flex items-center px-3.5 font-mono text-slate-500 text-xs font-semibold">
                ₱0.00 (100% HMO Coverage allocated)
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentMethodPanel;
