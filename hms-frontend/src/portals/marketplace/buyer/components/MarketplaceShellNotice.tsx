import React from 'react';
import { ShieldAlert } from 'lucide-react';

export const MarketplaceShellNotice: React.FC = () => {
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex gap-4 items-start shadow-sm">
      <div className="p-2 bg-blue-100 rounded-xl">
        <ShieldAlert className="h-5 w-5 text-blue-600" />
      </div>
      <div>
        <h4 className="text-sm font-black text-blue-900 tracking-tight">Marketplace (WIP)</h4>
        <p className="text-xs text-blue-700 font-medium leading-relaxed mt-0.5">
          <strong>Real data:</strong> Supplier listings, RFQ responses, orders (supplier-side).
        </p>
        <p className="text-xs text-blue-700 font-medium leading-relaxed mt-0.5">
          <strong>In development:</strong> Buyer cart/checkout, product catalog browsing, order tracking, and service tickets.
        </p>
      </div>
    </div>
  );
};

export default MarketplaceShellNotice;
