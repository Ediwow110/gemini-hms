import React, { useState } from 'react';
import { Send, ShieldCheck, Truck } from 'lucide-react';

export interface QuoteSubmissionValues {
  rfqId: string;
  totalAmount: number;
  deliveryLeadTime: string;
}

interface QuoteSubmissionPanelProps {
  rfqId: string;
  onSubmit: (values: QuoteSubmissionValues) => Promise<void> | void;
  submitting?: boolean;
}

export const QuoteSubmissionPanel: React.FC<QuoteSubmissionPanelProps> = ({
  rfqId,
  onSubmit,
  submitting = false,
}) => {
  const [totalAmount, setTotalAmount] = useState('');
  const [deliveryLeadTime, setDeliveryLeadTime] = useState('7-14 days');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const numericAmount = Number(totalAmount);
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      setError('Enter a valid positive quote amount.');
      return;
    }

    setError(null);
    await onSubmit({ rfqId, totalAmount: numericAmount, deliveryLeadTime });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
    >
      <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">Submit quote</h3>
          <p className="mt-1 text-xs text-slate-500">
            Quote a specific RFQ using the connected supplier API.
          </p>
        </div>
        <span className="font-mono text-[10px] text-slate-500">
          {rfqId.slice(0, 12)}
        </span>
      </div>

      <label className="block text-[11px] font-semibold text-slate-500">
        <span className="mb-1 block">Total amount (PHP)</span>
        <input
          type="number"
          min="0.01"
          step="0.01"
          required
          value={totalAmount}
          onChange={(event) => setTotalAmount(event.target.value)}
          className="min-h-10 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
        />
      </label>

      <label className="block text-[11px] font-semibold text-slate-500">
        <span className="mb-1 block">Delivery lead time</span>
        <select
          value={deliveryLeadTime}
          onChange={(event) => setDeliveryLeadTime(event.target.value)}
          className="min-h-10 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
        >
          <option>7-14 days</option>
          <option>14-21 days</option>
          <option>30+ days</option>
        </select>
      </label>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="flex items-start gap-2 rounded-xl border border-indigo-100 bg-indigo-50 p-3">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-indigo-600" />
          <p className="text-[11px] leading-5 text-indigo-800">
            Warranty terms must match the selected RFQ and supplier agreement.
          </p>
        </div>
        <div className="flex items-start gap-2 rounded-xl border border-emerald-100 bg-emerald-50 p-3">
          <Truck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
          <p className="text-[11px] leading-5 text-emerald-800">
            Delivery commitments become part of the submitted commercial offer.
          </p>
        </div>
      </div>

      {error && (
        <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-700">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <Send className="h-4 w-4" />
        {submitting ? 'Submitting…' : 'Submit quote'}
      </button>
    </form>
  );
};

export default QuoteSubmissionPanel;
