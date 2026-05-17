import React, { useState } from 'react';

export const AnalyticsConsole: React.FC = () => {
  const [userRole] = useState('admin'); // Executive Operator Context
  
  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans flex flex-col">
      {/* Master Utility Header */}
      <header className="bg-[#0F172A] text-white px-8 py-5 shadow-md z-10 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-wide uppercase">Corporate Analytics Console</h1>
          <p className="text-[#94A3B8] font-semibold mt-1">Enterprise Data Governance & Reporting Matrix</p>
        </div>
      </header>

      {/* Security Access Notification Banner */}
      {userRole === 'admin' && (
        <div className="bg-[#022C22] border-b-2 border-[#16A34A] px-8 py-3 flex items-center justify-between shadow-inner">
           <div className="flex items-center text-[#34D399] font-bold text-xs uppercase tracking-widest">
             <span className="w-2 h-2 rounded-full bg-[#34D399] mr-3 animate-pulse"></span>
             Active Privacy Masking Matrix Engaged (PHI Encrypted via SHA-256 Rules)
           </div>
           <span className="bg-[#064E3B] px-3 py-1 text-[10px] text-white font-extrabold tracking-widest rounded shadow-sm border border-[#047857]">
             CLEARANCE LEVEL: EXECUTIVE
           </span>
        </div>
      )}

      {/* Main Reporting Array */}
      <main className="flex-1 p-8 grid grid-cols-3 gap-8 overflow-y-auto">
        
        {/* Financial Summary Ledger Segment */}
        <section className="col-span-3">
          <h2 className="text-[#1E293B] text-lg font-bold uppercase tracking-wide mb-4">Financial Summary Ledger</h2>
          <div className="grid grid-cols-3 gap-6">
            <div className="bg-white border-2 border-[#E2E8F0] p-6 rounded-lg shadow-sm flex flex-col justify-center">
              <span className="text-[#94A3B8] text-xs font-bold uppercase tracking-widest block mb-2">Gross Operational Revenue</span>
              <span className="text-3xl font-bold text-[#0F172A] font-mono">$1,500,000.00</span>
            </div>
            <div className="bg-white border-2 border-[#16A34A]/30 p-6 rounded-lg shadow-sm flex flex-col justify-center bg-green-50/20">
              <span className="text-[#94A3B8] text-xs font-bold uppercase tracking-widest block mb-2">Settled Capital Balance</span>
              <span className="text-3xl font-bold text-[#16A34A] font-mono">$1,200,000.00</span>
            </div>
            <div className="bg-white border-2 border-[#DC2626]/40 p-6 rounded-lg shadow-sm flex flex-col justify-center bg-red-50/50">
              <span className="text-[#DC2626] text-xs font-bold uppercase tracking-widest block mb-2">Total Collections Deficit</span>
              <span className="text-3xl font-bold text-[#991B1B] font-mono">$300,000.00</span>
            </div>
          </div>
        </section>

        {/* Patient Intake Density Grid */}
        <section className="col-span-3 mt-4">
          <h2 className="text-[#1E293B] text-lg font-bold uppercase tracking-wide mb-4">Patient Intake Density Grid</h2>
          <div className="bg-white border border-[#E2E8F0] rounded-lg shadow-sm overflow-hidden">
            <table className="w-full text-left text-sm text-[#1E293B]">
              <thead className="bg-[#F8FAFC] text-xs uppercase font-bold text-[#94A3B8] border-b border-[#E2E8F0]">
                <tr>
                  <th className="px-6 py-4 w-1/4">Facility Branch</th>
                  <th className="px-6 py-4 w-1/2">Active Triage Throughput</th>
                  <th className="px-6 py-4 text-center">Capacity Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                <tr className="hover:bg-[#F8FAFC] transition-colors">
                  <td className="px-6 py-5 font-bold text-[#0F172A] uppercase tracking-wide">North Wing</td>
                  <td className="px-6 py-5">
                    <div className="flex items-center w-full max-w-sm">
                      <span className="font-mono font-bold w-24">45 Patients</span>
                      <div className="flex-1 bg-[#E2E8F0] rounded-full h-2">
                        <div className="bg-[#D97706] h-2 rounded-full transition-all duration-500" style={{ width: '80%' }}></div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-center">
                    <span className="bg-[#FEF3C7] text-[#D97706] text-[10px] font-extrabold tracking-widest px-3 py-1 rounded border border-[#FCD34D]">HIGH LOAD</span>
                  </td>
                </tr>
                <tr className="hover:bg-[#F8FAFC] transition-colors">
                  <td className="px-6 py-5 font-bold text-[#0F172A] uppercase tracking-wide">South Wing</td>
                  <td className="px-6 py-5">
                    <div className="flex items-center w-full max-w-sm">
                      <span className="font-mono font-bold w-24">22 Patients</span>
                      <div className="flex-1 bg-[#E2E8F0] rounded-full h-2">
                        <div className="bg-[#16A34A] h-2 rounded-full transition-all duration-500" style={{ width: '40%' }}></div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-center">
                    <span className="bg-[#DCFCE7] text-[#16A34A] text-[10px] font-extrabold tracking-widest px-3 py-1 rounded border border-[#86EFAC]">NOMINAL</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

      </main>
    </div>
  );
};
