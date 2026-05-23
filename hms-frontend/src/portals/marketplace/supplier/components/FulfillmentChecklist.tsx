import React from 'react';
import { CheckCircle2, FileText, Truck, ClipboardCheck } from 'lucide-react';

export const FulfillmentChecklist: React.FC = () => {
  const steps = [
    { id: '1', title: 'Inventory Reservation', status: 'COMPLETED' },
    { id: '2', title: 'Serial Number Mapping', status: 'IN_PROGRESS' },
    { id: '3', title: 'QC Verification', status: 'PENDING' },
    { id: '4', title: 'Specialized Packing', status: 'PENDING' },
    { id: '5', title: 'Logistics Handover', status: 'PENDING' },
  ];

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-6 shadow-sm">
      <div className="flex justify-between items-center pb-4 border-b border-slate-100">
        <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
          <ClipboardCheck className="h-4 w-4 text-indigo-500" />
          Fulfillment Workflow
        </h3>
      </div>

      <div className="space-y-4">
        {steps.map((step) => (
          <div key={step.id} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-2xl">
            <div className="flex items-center gap-3">
              <div className={`h-6 w-6 rounded-full flex items-center justify-center border ${
                step.status === 'COMPLETED' ? 'bg-emerald-500 border-emerald-500 text-white' :
                step.status === 'IN_PROGRESS' ? 'bg-indigo-100 border-indigo-200 text-indigo-600' :
                'bg-white border-slate-200 text-slate-300'
              }`}>
                {step.status === 'COMPLETED' ? <CheckCircle2 className="h-3.5 w-3.5" /> : <span className="text-[10px] font-black">{step.id}</span>}
              </div>
              <span className={`text-xs font-bold ${step.status === 'PENDING' ? 'text-slate-400' : 'text-slate-700'}`}>{step.title}</span>
            </div>
            <span className={`text-[9px] font-black px-2 py-0.5 rounded-lg uppercase ${
              step.status === 'COMPLETED' ? 'text-emerald-600' :
              step.status === 'IN_PROGRESS' ? 'text-indigo-600 animate-pulse' :
              'text-slate-300'
            }`}>
              {step.status.replace('_', ' ')}
            </span>
          </div>
        ))}
      </div>

      <div className="pt-4 grid grid-cols-2 gap-4">
        <button className="flex flex-col items-center justify-center p-4 bg-slate-50 border border-slate-100 rounded-2xl hover:border-indigo-300 transition-all group">
          <FileText className="h-5 w-5 text-slate-400 group-hover:text-indigo-600 mb-1.5" />
          <span className="text-[10px] font-black text-slate-600 uppercase">Upload Docs</span>
        </button>
        <button className="flex flex-col items-center justify-center p-4 bg-slate-900 border border-slate-900 rounded-2xl hover:bg-black transition-all">
          <Truck className="h-5 w-5 text-white mb-1.5" />
          <span className="text-[10px] font-black text-white uppercase">Mark Shipped</span>
        </button>
      </div>
    </div>
  );
};

export default FulfillmentChecklist;
