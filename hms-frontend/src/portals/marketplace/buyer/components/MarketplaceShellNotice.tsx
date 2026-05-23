import React from 'react';
import { ShieldAlert } from 'lucide-react';

export const MarketplaceShellNotice: React.FC = () => {
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex gap-4 items-start shadow-sm">
      <div className="p-2 bg-blue-100 rounded-xl">
        <ShieldAlert className="h-5 w-5 text-blue-600" />
      </div>
      <div>
        <h4 className="text-sm font-black text-blue-900 tracking-tight">Marketplace Buyer Sandbox</h4>
        <p className="text-xs text-blue-700 font-medium leading-relaxed mt-0.5">
          This buyer portal is a <strong>functional prototype shell</strong>. Product listings, quotes, and order tracking 
          are mock-generated for demonstration purposes. No real procurement actions (ordering, payment, stock reservation) 
          are performed in this phase.
        </p>
      </div>
    </div>
  );
};

export default MarketplaceShellNotice;
