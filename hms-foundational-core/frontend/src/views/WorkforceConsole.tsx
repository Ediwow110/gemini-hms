import React, { useState } from 'react';

export const WorkforceConsole: React.FC = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [password, setPassword] = useState('');
  const [promptAuth, setPromptAuth] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');

  const handleAuthorize = () => {
    // Explicit static override for demo verification boundary
    if (password === 'admin123') {
      setIsProcessing(true);
      setPromptAuth(false);
      setStatusMsg('');
      
      setTimeout(() => {
        setIsProcessing(false);
        setStatusMsg('100% Mass Remittance Dispatched Securely.');
      }, 1500);
    } else {
      setStatusMsg('INVALID CREDENTIALS: Admin Override Failed.');
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans flex flex-col">
      {/* Active Header Block */}
      <header className="bg-[#0F172A] text-white px-8 py-5 flex items-center justify-between shadow-md z-10">
        <div>
          <h1 className="text-2xl font-bold tracking-wide uppercase">Workforce Management Dashboard</h1>
          <p className="text-[#94A3B8] font-semibold mt-1">Schedules & Enterprise Payroll Hub</p>
        </div>
        <div className="flex space-x-4">
           <div className="bg-[#1E293B] px-4 py-2 border border-[#E2E8F0] rounded shadow-sm text-center">
              <span className="block text-[#94A3B8] text-xs font-bold uppercase tracking-widest">Active Staff On-Duty</span>
              <span className="block text-[#16A34A] text-lg font-bold font-mono">114</span>
           </div>
           <div className="bg-[#1E293B] px-4 py-2 border border-[#E2E8F0] rounded shadow-sm text-center">
              <span className="block text-[#94A3B8] text-xs font-bold uppercase tracking-widest">Pending Payroll (Cycle)</span>
              <span className="block text-white text-lg font-bold font-mono">$1,240,000.00</span>
           </div>
        </div>
      </header>

      {/* Main Grid Viewport */}
      <main className="flex-1 p-8 grid grid-cols-3 gap-8 overflow-hidden">
        
        {/* Master Shift Scheduler Grid */}
        <section className="col-span-2 flex flex-col bg-white border border-[#E2E8F0] rounded-lg shadow-sm">
          <div className="bg-[#1E293B] px-6 py-4 border-b border-[#E2E8F0] rounded-t-lg">
             <h2 className="text-white text-lg font-bold uppercase tracking-wide">Shift Scheduler Grid (Next 48 Hours)</h2>
          </div>
          <div className="flex-1 p-0 overflow-auto">
             <table className="w-full text-left text-sm text-[#1E293B]">
               <thead className="bg-[#F8FAFC] text-xs uppercase font-bold text-[#94A3B8] border-b border-[#E2E8F0]">
                 <tr>
                   <th className="px-6 py-4">Staff Profile</th>
                   <th className="px-6 py-4">May 20 - 08:00 AM</th>
                   <th className="px-6 py-4">May 20 - 04:00 PM</th>
                   <th className="px-6 py-4">May 21 - 12:00 AM</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-[#E2E8F0]">
                 <tr className="hover:bg-[#F8FAFC] transition-colors">
                   <td className="px-6 py-4 font-bold text-[#0F172A]">Dr. Sarah Connor</td>
                   <td className="px-6 py-4">
                     <span className="bg-[#2563EB] text-white text-[11px] font-bold px-3 py-1.5 rounded shadow-sm block text-center uppercase tracking-wider">North Branch (ER)</span>
                   </td>
                   <td className="px-6 py-4"></td>
                   <td className="px-6 py-4"></td>
                 </tr>
                 <tr className="hover:bg-[#F8FAFC] transition-colors">
                   <td className="px-6 py-4 font-bold text-[#0F172A]">Nurse Joy</td>
                   <td className="px-6 py-4"></td>
                   <td className="px-6 py-4">
                     <span className="bg-[#16A34A] text-white text-[11px] font-bold px-3 py-1.5 rounded shadow-sm block text-center uppercase tracking-wider">East Wing (ICU)</span>
                   </td>
                   <td className="px-6 py-4"></td>
                 </tr>
               </tbody>
             </table>
          </div>
        </section>

        {/* Secured Remittance Control Panel */}
        <section className="col-span-1 flex flex-col space-y-6">
          <div className="bg-white border border-[#E2E8F0] rounded-lg shadow-sm p-6">
             <h2 className="text-[#1E293B] text-lg font-bold uppercase tracking-wide mb-4 border-b border-[#E2E8F0] pb-2">Payroll Cycle Master</h2>
             
             <div className="space-y-4">
                <div className="flex justify-between items-center bg-[#F8FAFC] p-3 rounded border border-[#E2E8F0]">
                   <span className="text-sm font-semibold text-[#94A3B8]">Cycle Name</span>
                   <span className="font-bold text-[#0F172A]">CYC-MAY2026-A</span>
                </div>
                <div className="flex justify-between items-center bg-[#F8FAFC] p-3 rounded border border-[#E2E8F0]">
                   <span className="text-sm font-semibold text-[#94A3B8]">Gross Invoicing Cost</span>
                   <span className="font-mono font-bold text-[#0F172A]">$1,240,000.00</span>
                </div>
                <div className="flex justify-between items-center bg-[#F8FAFC] p-3 rounded border border-[#E2E8F0]">
                   <span className="text-sm font-semibold text-[#94A3B8]">Overall Status</span>
                   <span className="bg-[#D97706] text-white text-[10px] font-extrabold tracking-widest px-2 py-1 rounded">PENDING APPROVAL</span>
                </div>
             </div>
          </div>

          <div className="bg-[#0F172A] rounded-lg shadow-md border border-[#1E293B] p-6 text-center flex flex-col justify-center relative flex-1">
             <h3 className="text-white font-bold uppercase tracking-widest mb-6">Secured Mass Remittance</h3>
             
             {promptAuth ? (
               <div className="space-y-4">
                 <input 
                   type="password"
                   placeholder="Admin Override Password..."
                   value={password}
                   onChange={e => setPassword(e.target.value)}
                   className="w-full px-4 py-3 bg-[#1E293B] border border-[#E2E8F0] text-white rounded focus:outline-none focus:border-[#2563EB]"
                 />
                 <button 
                   onClick={handleAuthorize}
                   className="w-full bg-[#16A34A] hover:bg-[#15803D] text-white font-bold uppercase py-3 rounded shadow-sm transition-colors tracking-wider"
                 >
                   CONFIRM DISBURSEMENT
                 </button>
               </div>
             ) : (
               <button 
                 onClick={() => setPromptAuth(true)}
                 disabled={isProcessing}
                 className={`w-full font-bold uppercase py-4 rounded shadow-sm transition-colors tracking-wider ${
                   isProcessing ? 'bg-[#94A3B8] cursor-not-allowed' : 'bg-[#DC2626] hover:bg-[#991B1B] text-white'
                 }`}
               >
                 {isProcessing ? 'DISPATCHING PAYLOADS...' : 'AUTHORIZE MASS PAYOUT'}
               </button>
             )}

             {statusMsg && (
               <p className={`mt-4 font-bold text-sm tracking-wide ${statusMsg.includes('SUCCESS') || statusMsg.includes('100%') ? 'text-[#16A34A]' : 'text-[#DC2626]'}`}>
                 {statusMsg}
               </p>
             )}
          </div>
        </section>

      </main>
    </div>
  );
};
