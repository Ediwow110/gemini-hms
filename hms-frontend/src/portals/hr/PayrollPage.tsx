import React from 'react';
import HRScopeFilter from './components/HRScopeFilter';
import { PayrollStatusCard } from './components/PayrollStatusCard';
import { DollarSign, FileText } from 'lucide-react';
import { ReportExportButton } from '../../components/analytics';

export const PayrollPage: React.FC = () => {
  const mockPayrollCycles = [
    { period: 'May 16 - May 31, 2026', totalEmployees: 1240, totalAmount: 12450000, status: 'PENDING' as const },
    { period: 'May 01 - May 15, 2026', totalEmployees: 1235, totalAmount: 12380000, status: 'COMPLETED' as const },
    { period: 'April 16 - April 30, 2026', totalEmployees: 1230, totalAmount: 12350000, status: 'COMPLETED' as const },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-800 tracking-tight" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Payroll Console
          </h2>
          <p className="text-xs text-slate-500 font-medium">Manage salary disbursements, deductions, and tax compliance</p>
        </div>
        <div className="flex flex-col md:flex-row gap-2">
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-1.5 text-[10px] text-amber-800 font-semibold max-w-md">
            <strong>Sandbox Notice:</strong> Payroll data is simulated. No real payouts or tax filings occur.
          </div>
          <div className="flex gap-2">
            <ReportExportButton label="Export tax records" sensitive requiresReason />
            <button type="button" disabled title="Payslip generation backend is not available yet." className="btn cursor-not-allowed bg-slate-100 text-slate-400 px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 border border-slate-200">
              <FileText className="h-4 w-4" /> Generate Pay Slips WIP
            </button>
          </div>
        </div>
      </div>

      <HRScopeFilter />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {mockPayrollCycles.map((cycle, idx) => (
          <PayrollStatusCard 
            key={idx}
            period={cycle.period}
            totalEmployees={cycle.totalEmployees}
            totalAmount={cycle.totalAmount}
            status={cycle.status}
          />
        ))}
      </div>

      <div className="card bg-white border border-slate-200/80 shadow-sm rounded-2xl p-5 space-y-4">
        <div className="flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-emerald-600" />
          <h4 className="text-sm font-black text-slate-800 tracking-tight uppercase">Recent Payroll Activity Shell</h4>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                <th className="pb-3 pl-2">Employee</th>
                <th className="pb-3">Gross Pay</th>
                <th className="pb-3">Deductions</th>
                <th className="pb-3">Net Pay</th>
                <th className="pb-3 text-right pr-2">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              <tr className="hover:bg-slate-50/50 transition-colors">
                <td className="py-3 pl-2 font-bold text-slate-800">Dr. Gregory House</td>
                <td className="py-3 text-slate-600">₱140,000.00</td>
                <td className="py-3 text-rose-500">-₱15,000.00</td>
                <td className="py-3 font-black text-slate-900">₱125,000.00</td>
                <td className="py-3 text-right pr-2">
                  <span className="text-[9px] bg-emerald-50 text-emerald-700 font-bold px-1.5 py-0.5 rounded border border-emerald-100">Disbursed</span>
                </td>
              </tr>
              <tr className="hover:bg-slate-50/50 transition-colors">
                <td className="py-3 pl-2 font-bold text-slate-800">Nurse Judy Hopps</td>
                <td className="py-3 text-slate-600">₱55,000.00</td>
                <td className="py-3 text-rose-500">-₱7,000.00</td>
                <td className="py-3 font-black text-slate-900">₱48,000.00</td>
                <td className="py-3 text-right pr-2">
                  <span className="text-[9px] bg-emerald-50 text-emerald-700 font-bold px-1.5 py-0.5 rounded border border-emerald-100">Disbursed</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PayrollPage;
