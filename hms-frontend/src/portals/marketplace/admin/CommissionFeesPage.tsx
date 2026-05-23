import React from 'react';
import { DollarSign, Percent, Users } from 'lucide-react';
import MarketplaceAdminShellNotice from './components/MarketplaceAdminShellNotice';
import CommissionFeeSummary from './components/CommissionFeeSummary';

export const CommissionFeesPage: React.FC = () => {
  const feeRules = [
    { id: 'RULE-001', name: 'Standard Product Commission', rate: '12.5%', appliesTo: 'All Product Listings', status: 'ACTIVE' },
    { id: 'RULE-002', name: 'Service Installation Fee', rate: '8.0%', appliesTo: 'Service Listings', status: 'ACTIVE' },
    { id: 'RULE-003', name: 'Premium Supplier Discount', rate: '10.0%', appliesTo: 'Platinum Suppliers', status: 'ACTIVE' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-black text-slate-800 tracking-tight">Commission & Platform Fees</h2>
        <p className="text-xs text-slate-500 font-medium">Fee rules, pending commissions, and supplier fee breakdowns</p>
      </div>

      <MarketplaceAdminShellNotice />

      <CommissionFeeSummary />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-3xl p-5 space-y-2">
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-emerald-500" />
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pending Platform Fees (Mock)</p>
          </div>
          <p className="text-2xl font-black text-slate-900">₱125,000</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-3xl p-5 space-y-2">
          <div className="flex items-center gap-2">
            <Percent className="h-4 w-4 text-indigo-500" />
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Avg Commission (Mock)</p>
          </div>
          <p className="text-2xl font-black text-slate-900">12.5%</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-3xl p-5 space-y-2">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-blue-500" />
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Suppliers (Mock)</p>
          </div>
          <p className="text-2xl font-black text-slate-900">28</p>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
        <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
          <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">Commission Rules (Mock)</h3>
        </div>
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-50/50 border-b border-slate-100">
            <tr>
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Rule</th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Rate</th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Applies To</th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {feeRules.map((r) => (
              <tr key={r.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-6 py-4">
                  <span className="text-xs font-black text-slate-800">{r.name}</span>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">{r.id}</p>
                </td>
                <td className="px-6 py-4 text-xs font-black text-slate-900">{r.rate}</td>
                <td className="px-6 py-4 text-[10px] font-bold text-slate-500">{r.appliesTo}</td>
                <td className="px-6 py-4">
                  <span className="text-[9px] font-black px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-600">{r.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
        <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
          <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">Supplier Fee Breakdown (Mock)</h3>
        </div>
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-50/50 border-b border-slate-100">
            <tr>
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Supplier</th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">GMV</th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Commission</th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Net Payout</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            <tr className="hover:bg-slate-50/50 transition-colors">
              <td className="px-6 py-4 text-xs font-black text-slate-800">Global Med Systems</td>
              <td className="px-6 py-4 text-xs font-bold text-slate-600">₱5,200,000</td>
              <td className="px-6 py-4 text-xs font-bold text-rose-600">₱650,000</td>
              <td className="px-6 py-4 text-xs font-bold text-emerald-600">₱4,550,000</td>
            </tr>
            <tr className="hover:bg-slate-50/50 transition-colors">
              <td className="px-6 py-4 text-xs font-black text-slate-800">PharmaTech Solutions</td>
              <td className="px-6 py-4 text-xs font-bold text-slate-600">₱3,100,000</td>
              <td className="px-6 py-4 text-xs font-bold text-rose-600">₱387,500</td>
              <td className="px-6 py-4 text-xs font-bold text-emerald-600">₱2,712,500</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-4 shadow-sm">
        <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">Payout Impact (Mock)</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Commission Collected</p>
            <p className="text-lg font-black text-slate-900">₱845,000</p>
          </div>
          <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Supplier Net Payouts</p>
            <p className="text-lg font-black text-emerald-600">₱7,262,500</p>
          </div>
          <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Platform Margin</p>
            <p className="text-lg font-black text-indigo-600">10.4%</p>
          </div>
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex gap-3 items-start">
        <DollarSign className="h-5 w-5 text-amber-600 mt-0.5" />
        <div>
          <p className="text-xs font-bold text-amber-900">Fee / Payout Placeholder</p>
          <p className="text-[10px] text-amber-700 font-medium mt-0.5">Commission rules, pending fees, and payout impact are UI placeholders. No real fee or payout mutations are performed in this phase.</p>
        </div>
      </div>
    </div>
  );
};

export default CommissionFeesPage;
