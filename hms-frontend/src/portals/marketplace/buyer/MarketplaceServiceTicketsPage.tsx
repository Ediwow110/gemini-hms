import React, { useState } from 'react';
import { Plus, MessageSquare } from 'lucide-react';
import MarketplaceShellNotice from './components/MarketplaceShellNotice';
import ServiceTicketCard, { Ticket } from './components/ServiceTicketCard';

export const MarketplaceServiceTicketsPage: React.FC = () => {
  // Service ticket creation and history for buyer marketplace items is shell-only.
  const [tickets] = useState<Ticket[]>([]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-800 tracking-tight">Service Desk</h2>
          <p className="text-xs text-slate-500 font-medium">Request maintenance and report equipment issues</p>
        </div>
        <button className="flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white px-6 py-2.5 rounded-xl text-xs font-black transition-all shadow-md cursor-pointer" disabled title="Shell - no backend ticket creation">
          <Plus className="h-4 w-4" /> Create Service Ticket (Shell)
        </button>
      </div>

      <MarketplaceShellNotice />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-3 space-y-4">
          <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
            <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">Recent Tickets</h3>
            </div>
            
            <div className="divide-y divide-slate-100">
              {tickets.length === 0 ? (
                <div className="p-6 text-sm text-slate-500">No service tickets. Buyer service ticket tracking is a prototype shell (no backend support for marketplace item tickets yet).</div>
              ) : tickets.map((t) => (
                <ServiceTicketCard key={t.id} ticket={t} />
              ))}
            </div>
          </div>
        </div>

        <aside className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-4">
            <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest">Service Overview</h4>
            <div className="space-y-4">
               <div className="flex items-center justify-between px-1">
                 <span className="text-[11px] font-bold text-slate-500">Active Tickets</span>
                 <span className="text-sm font-black text-slate-800">2</span>
               </div>
               <div className="flex items-center justify-between px-1">
                 <span className="text-[11px] font-bold text-slate-500">Pending Actions</span>
                 <span className="text-sm font-black text-amber-600">1</span>
               </div>
               <div className="flex items-center justify-between px-1 border-t border-slate-50 pt-4">
                 <span className="text-[11px] font-bold text-slate-500">Avg. Response Time</span>
                 <span className="text-sm font-black text-slate-800">4.2 Hrs</span>
               </div>
            </div>
          </div>

          <div className="p-5 bg-indigo-50 border border-indigo-100 rounded-3xl flex flex-col items-center text-center space-y-3">
             <div className="h-10 w-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200">
               <MessageSquare className="h-5 w-5" />
             </div>
             <div>
               <p className="text-xs font-black text-indigo-900">Live Support Chat</p>
               <p className="text-[10px] text-indigo-600 font-bold uppercase mt-0.5">Talk to a product specialist</p>
             </div>
             <button className="w-full py-2 bg-white text-indigo-600 rounded-xl text-[10px] font-black shadow-sm">Start Conversation</button>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default MarketplaceServiceTicketsPage;
