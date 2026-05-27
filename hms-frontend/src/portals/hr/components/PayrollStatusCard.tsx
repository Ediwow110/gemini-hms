import React from 'react';
import { DollarSign, Play, CheckCircle2 } from 'lucide-react';

interface PayrollStatusCardProps {
  period: string;
  totalEmployees: number;
  totalAmount: number;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED';
}

export const PayrollStatusCard: React.FC<PayrollStatusCardProps> = ({
  period,
  totalEmployees,
  totalAmount,
  status
}) => {
  return (
    <div className="bg-white border border-slate-200/80 shadow-sm rounded-2xl p-5 space-y-4">
      <div className="flex justify-between items-start">
        <div className="h-10 w-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
          <DollarSign className="h-5 w-5" />
        </div>
        <div className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border flex items-center gap-1.5 ${
          status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
          status === 'PROCESSING' ? 'bg-amber-50 text-amber-700 border-amber-100 animate-pulse' :
          'bg-slate-50 text-slate-700 border-slate-100'
        }`}>
          {status === 'COMPLETED' && <CheckCircle2 className="h-3 w-3" />}
          {status}
        </div>
      </div>

      <div>
        <h4 className="text-sm font-black text-slate-800 tracking-tight">{period}</h4>
        <div className="mt-1 flex justify-between items-end">
          <div>
            <p className="text-[10px] text-slate-400 font-medium">Net Disbursement</p>
            <p className="text-lg font-black text-slate-900">₱{totalAmount.toLocaleString()}</p>
          </div>
          <p className="text-[10px] text-slate-500 font-bold">{totalEmployees} Employees</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 pt-2">
        <button type="button" disabled title="Payroll report export endpoint is not available yet." className="flex cursor-not-allowed items-center justify-center gap-1.5 py-2 bg-slate-100 text-slate-400 border border-slate-200 rounded-xl text-[10px] font-bold">
          Report WIP
        </button>
        {status === 'PENDING' ? (
          <button type="button" disabled title="Payroll execution backend is not available from this sandbox page." className="flex cursor-not-allowed items-center justify-center gap-1.5 py-2 bg-slate-100 text-slate-400 rounded-xl text-[10px] font-bold border border-slate-200">
            <Play className="h-3 w-3" /> Execute WIP
          </button>
        ) : (
          <button className="flex items-center justify-center gap-1.5 py-2 bg-white border border-slate-200 text-slate-400 rounded-xl text-[10px] font-bold cursor-not-allowed">
            View Details
          </button>
        )}
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 text-[10px] text-amber-800 font-semibold mt-2">
        <strong>Shell Notice:</strong> Payroll execution is simulated. No real funds are disbursed and no bank files are generated.
      </div>
    </div>
  );
};
