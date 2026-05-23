import React from 'react';
import { AlertCircle, ArrowRight } from 'lucide-react';

export interface Ticket {
  id: string;
  asset: string;
  issue: string;
  priority: 'HIGH' | 'NORMAL';
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED';
  date: string;
}

interface ServiceTicketCardProps {
  ticket: Ticket;
}

export const ServiceTicketCard: React.FC<ServiceTicketCardProps> = ({ ticket }) => {
  return (
    <div className="p-5 hover:bg-slate-50 transition-colors flex items-center justify-between group cursor-pointer border-b border-slate-100 last:border-0">
      <div className="flex items-center gap-4">
        <div className={`h-10 w-10 rounded-xl flex items-center justify-center border ${
          ticket.priority === 'HIGH' ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-slate-50 text-slate-600 border-slate-100'
        }`}>
          <AlertCircle className="h-5 w-5" />
        </div>
        <div>
          <h4 className="text-sm font-black text-slate-800">{ticket.asset}</h4>
          <p className="text-xs font-medium text-slate-500">{ticket.issue}</p>
          <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">{ticket.id} · {ticket.date}</p>
        </div>
      </div>

      <div className="flex items-center gap-8">
        <div className="text-right">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Status</p>
          <span className={`text-[9px] font-black px-2 py-0.5 rounded-lg uppercase border ${
            ticket.status === 'OPEN' ? 'bg-amber-100 text-amber-700 border-amber-200' :
            ticket.status === 'IN_PROGRESS' ? 'bg-indigo-100 text-indigo-700 border-indigo-200' :
            'bg-emerald-100 text-emerald-700 border-emerald-200'
          }`}>
            {ticket.status.replace('_', ' ')}
          </span>
        </div>
        <ArrowRight className="h-5 w-5 text-slate-300 group-hover:text-indigo-600 transition-colors" />
      </div>
    </div>
  );
};

export default ServiceTicketCard;
