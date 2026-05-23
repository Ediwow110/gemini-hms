import { FileText, Heart, ShieldCheck } from 'lucide-react';

export interface BillItem {
  id: string;
  name: string;
  category: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

interface InvoiceSummaryCardProps {
  invoiceNo: string;
  items: BillItem[];
  discount: number;
  tax: number;
  hmoShare?: number;
  className?: string;
}

export const InvoiceSummaryCard = ({
  invoiceNo,
  items,
  discount,
  tax,
  hmoShare = 0,
  className = '',
}: InvoiceSummaryCardProps) => {
  const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
  const discountAmount = (subtotal * discount) / 100;
  const taxableAmount = subtotal - discountAmount;
  const taxAmount = (taxableAmount * tax) / 100;
  const total = taxableAmount + taxAmount;
  const patientShare = Math.max(0, total - hmoShare);

  return (
    <div className={`card p-5 bg-white border border-slate-200/80 shadow-sm rounded-2xl space-y-4 ${className}`}>
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <h3 className="font-bold text-slate-800 text-sm tracking-wider uppercase flex items-center gap-2">
          <FileText className="h-4.5 w-4.5 text-indigo-500" />
          Invoice Summary: {invoiceNo}
        </h3>
        <span className="text-[10px] bg-slate-105 border border-slate-200 text-slate-500 font-mono font-bold px-2 py-0.5 rounded-lg select-none">
          Draft Sheet
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 font-black uppercase tracking-wider">
              <th className="px-3 py-2">Item description</th>
              <th className="px-3 py-2">Category</th>
              <th className="px-3 py-2 text-center">Qty</th>
              <th className="px-3 py-2 text-right">Unit Price</th>
              <th className="px-3 py-2 text-right">Subtotal</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {items.map((item) => (
              <tr key={item.id} className="hover:bg-slate-50/40">
                <td className="px-3 py-2.5 font-bold text-slate-700">{item.name}</td>
                <td className="px-3 py-2.5 text-slate-450 font-bold">{item.category}</td>
                <td className="px-3 py-2.5 text-center font-bold text-slate-650">{item.quantity}</td>
                <td className="px-3 py-2.5 text-right font-mono font-semibold text-slate-600">
                  ₱{item.unitPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </td>
                <td className="px-3 py-2.5 text-right font-mono font-black text-slate-800">
                  ₱{item.subtotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="space-y-2 border-t border-slate-100 pt-3 text-xs">
        <div className="flex justify-between font-semibold">
          <span className="text-slate-500">Gross Charges Subtotal:</span>
          <span className="font-mono text-slate-800">₱{subtotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
        </div>
        
        {discount > 0 && (
          <div className="flex justify-between font-semibold text-emerald-600">
            <span>Special Discount / Adjustment ({discount}%):</span>
            <span className="font-mono">-₱{discountAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
          </div>
        )}

        <div className="flex justify-between font-semibold">
          <span className="text-slate-500">Tax / VAT ({tax}%):</span>
          <span className="font-mono text-slate-800">₱{taxAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
        </div>

        <div className="flex justify-between font-bold border-t border-slate-50 pt-2 text-sm">
          <span className="text-slate-900">Gross Total Bill:</span>
          <span className="font-mono text-slate-900">₱{total.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
        </div>

        {hmoShare > 0 && (
          <div className="flex justify-between font-semibold text-indigo-600">
            <span className="flex items-center gap-1"><ShieldCheck className="h-3.5 w-3.5 text-indigo-500" /> HMO Covered Portion:</span>
            <span className="font-mono">-₱{hmoShare.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
          </div>
        )}

        <div className="flex justify-between items-baseline border-t border-slate-200/80 pt-3.5">
          <span className="text-slate-900 font-black text-sm flex items-center gap-1">
            <Heart className="h-4 w-4 text-rose-500 fill-current" /> Outstanding Co-Pay Due:
          </span>
          <span className="text-rose-600 font-black text-xl font-mono">
            ₱{patientShare.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </span>
        </div>
      </div>
    </div>
  );
};

export default InvoiceSummaryCard;
