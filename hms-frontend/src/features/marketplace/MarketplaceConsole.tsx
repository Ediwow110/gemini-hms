import React, { useState } from 'react';

export const MarketplaceConsole: React.FC = () => {
  const [cartItems, setCartItems] = useState(0);

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans flex flex-col">
      
      {/* Universal Header Block */}
      <header className="bg-[#0F172A] text-white px-8 py-5 flex items-center justify-between shadow-md z-10">
        <div>
          <h1 className="text-2xl font-bold tracking-wide uppercase">B2B Procurement Marketplace</h1>
          <p className="text-[#94A3B8] font-semibold mt-1">Enterprise Supply Chain & Logistics Hub</p>
        </div>
        <div className="flex space-x-4">
           <div className="bg-[#1E293B] px-4 py-2 border border-[#E2E8F0] rounded shadow-sm">
              <span className="block text-[#94A3B8] text-xs font-bold uppercase tracking-widest">Active Cart</span>
              <span className="block text-[#3B82F6] text-lg font-bold font-mono">{cartItems} ITEMS</span>
           </div>
           <div className="bg-[#1E293B] px-4 py-2 border border-[#E2E8F0] rounded shadow-sm text-center">
              <span className="block text-[#94A3B8] text-xs font-bold uppercase tracking-widest">Awaiting Approval</span>
              <span className="block text-[#D97706] text-lg font-bold">12 Orders</span>
           </div>
        </div>
      </header>

      {/* Primary Workspace Viewport */}
      <main className="flex-1 p-6 grid grid-cols-2 gap-8 h-full overflow-hidden">
        
        {/* Left Vertical Section: Product Catalog Grid */}
        <section className="flex flex-col space-y-4">
          <h2 className="text-[#1E293B] text-lg font-bold uppercase tracking-wide">Medical Supply Catalog</h2>
          
          <div className="grid grid-cols-1 gap-4 overflow-y-auto pb-4">
            
            {/* Standard Bulk Consumable Card */}
            <div className="bg-white border border-[#E2E8F0] rounded-lg shadow-sm p-5 flex flex-col justify-between hover:border-[#2563EB] transition-all">
               <div className="flex justify-between items-start mb-2">
                 <h3 className="font-bold text-[#0F172A] text-lg">Surgical Masks (Box of 50)</h3>
                 <span className="bg-[#E0F2FE] text-[#0369A1] text-[10px] font-extrabold tracking-widest px-2 py-1 rounded border border-[#BAE6FD]">VOLUMETRIC DISCOUNT (-12% @ 50+)</span>
               </div>
               <p className="font-mono text-[#94A3B8] font-bold mb-4">Base Price: $22.00</p>
               <button 
                 onClick={() => setCartItems(c => c + 1)}
                 className="bg-[#0F172A] hover:bg-[#1E293B] text-white font-bold text-xs uppercase px-4 py-2 rounded transition-colors self-start tracking-wider shadow"
               >
                 Add to Cart
               </button>
            </div>

            {/* Restricted Cold-Chain Pharmaceutical Card */}
            <div className="bg-white border border-[#E2E8F0] rounded-lg shadow-sm p-5 flex flex-col justify-between hover:border-[#2563EB] transition-all">
               <div className="flex justify-between items-start mb-2">
                 <h3 className="font-bold text-[#0F172A] text-lg">Cold-Chain Vaccine Series</h3>
                 <div className="flex flex-col space-y-1 items-end">
                   <span className="bg-[#FEF2F2] text-[#991B1B] text-[10px] font-extrabold px-2 py-1 tracking-widest rounded border border-[#FECACA]">RESTRICTED - FDA LICENSE REQ</span>
                   <span className="bg-[#EFF6FF] text-[#1D4ED8] text-[10px] font-extrabold px-2 py-1 tracking-widest rounded border border-[#BFDBFE]">COLD-CHAIN (2°C - 8°C)</span>
                 </div>
               </div>
               <p className="font-mono text-[#94A3B8] font-bold mb-4">Base Price: $450.00</p>
               <button 
                 onClick={() => setCartItems(c => c + 1)}
                 className="bg-[#0F172A] hover:bg-[#1E293B] text-white font-bold text-xs uppercase px-4 py-2 rounded transition-colors self-start tracking-wider shadow"
               >
                 Add to Cart
               </button>
            </div>

          </div>
        </section>

        {/* Right Vertical Section: Active Order Routing Ledger */}
        <section className="flex flex-col space-y-4">
          <h2 className="text-[#1E293B] text-lg font-bold uppercase tracking-wide">Active Order Ledger</h2>
          <div className="flex-1 bg-white border border-[#E2E8F0] rounded-lg shadow-sm overflow-hidden flex flex-col">
             
             <div className="p-4 border-b border-[#E2E8F0] bg-[#F8FAFC]">
               <h3 className="text-xs font-bold uppercase text-[#94A3B8] tracking-widest">Awaiting Financial Approval (Manager View)</h3>
             </div>
             
             <div className="flex-1 p-4 space-y-4 overflow-y-auto">
               
               {/* Standard Order Card */}
               <div className="border border-[#E2E8F0] rounded p-4 bg-[#F8FAFC] shadow-sm">
                 <div className="flex justify-between items-center mb-2">
                   <span className="font-mono font-bold text-[#0F172A]">ORD-1044-X</span>
                   <span className="bg-[#FEF3C7] text-[#D97706] text-[10px] font-extrabold tracking-widest px-2 py-1 rounded border border-[#FDE68A]">PENDING_APPROVAL</span>
                 </div>
                 <p className="text-sm text-[#94A3B8]">Requestor: dr.smith | Total Cost: <strong className="font-mono text-[#1E293B] font-bold">$1,230.00</strong></p>
               </div>

               {/* COMPROMISED Logistics Alert Status Cell */}
               <div className="border border-[#DC2626] rounded p-4 bg-red-50 relative overflow-hidden shadow-sm">
                 <div className="absolute top-0 right-0 h-full w-2 bg-[#DC2626] animate-pulse"></div>
                 <div className="flex justify-between items-center mb-2">
                   <span className="font-mono font-bold text-[#0F172A]">ORD-1045-V</span>
                   <span className="bg-[#991B1B] text-white text-[10px] font-extrabold tracking-widest px-3 py-1 rounded shadow-md border border-[#7F1D1D] animate-pulse">
                     🚨 LOGISTICS COLD-CHAIN BREACH DETECTED
                   </span>
                 </div>
                 <p className="text-sm text-[#94A3B8] font-bold mt-3">Active Status: <strong className="text-[#DC2626]">COMPROMISED</strong> | Final Sensor Read: 9.8°C</p>
               </div>

             </div>

          </div>
        </section>

      </main>
    </div>
  );
};
