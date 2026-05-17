import React, { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';

export const CashierConsole: React.FC = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const processCheckout = () => {
    setIsProcessing(true);
    setSuccessMsg('');
    
    // Generate isolated Idempotency Key explicitly tied to this user action attempt
    const idempotencyKey = uuidv4();
    
    // Simulate attaching key and posting secure payload over the network
    setTimeout(() => {
      setIsProcessing(false);
      setSuccessMsg(`Transaction successfully committed. Idempotency Key: ${idempotencyKey.substring(0, 8)}...`);
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans flex flex-col">
      {/* Active Session Banner */}
      <header className="bg-[#0F172A] text-white px-8 py-5 flex items-center justify-between shadow-md z-10">
        <div>
          <h1 className="text-2xl font-bold tracking-wide uppercase">Cashier Management Console</h1>
          <p className="text-[#94A3B8] font-semibold mt-1">Clerk: Jane Doe | POS-Terminal-01</p>
        </div>
        <div className="flex space-x-4 text-right">
          <div className="bg-[#1E293B] px-4 py-2 border border-[#E2E8F0] rounded shadow-sm">
            <span className="block text-[#94A3B8] text-xs font-bold uppercase tracking-widest">Base Balance</span>
            <span className="block text-white text-lg font-bold font-mono">$1,500.00</span>
          </div>
          <div className="bg-[#16A34A] flex items-center justify-center px-4 py-2 border border-[#15803D] rounded shadow-sm">
            <span className="text-white text-sm font-extrabold tracking-widest">REGISTER: OPEN</span>
          </div>
        </div>
      </header>

      {/* Invoice Processing Panel */}
      <main className="flex-1 p-8 flex flex-col items-center">
        <div className="w-full max-w-5xl">
          <h2 className="text-[#1E293B] text-lg font-bold mb-4 uppercase tracking-wide">Outstanding Invoices</h2>
          
          <div className="bg-white border border-[#E2E8F0] rounded-lg shadow-sm overflow-hidden mb-8">
            <table className="w-full text-left text-sm text-[#1E293B]">
              <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0] uppercase text-xs font-bold tracking-wider text-[#94A3B8]">
                <tr>
                  <th className="px-6 py-4">Invoice ID</th>
                  <th className="px-6 py-4">Patient Name</th>
                  <th className="px-6 py-4">Gross Cost</th>
                  <th className="px-6 py-4 font-extrabold text-[#DC2626]">Balance Owed</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                <tr className="hover:bg-[#F8FAFC] transition-colors">
                  <td className="px-6 py-5 font-mono font-semibold">INV-90218-A</td>
                  <td className="px-6 py-5 font-bold">Arthur Morgan</td>
                  <td className="px-6 py-5 text-[#94A3B8] font-mono">$450.00</td>
                  <td className="px-6 py-5 font-extrabold text-[#DC2626] font-mono">$450.00</td>
                  <td className="px-6 py-5 text-right">
                    <button className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold text-xs uppercase px-4 py-2 rounded transition-colors shadow-sm">
                      Select
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Secured Submission Core */}
          <div className="bg-[#1E293B] border border-[#0F172A] rounded-lg shadow-md p-6 w-full max-w-xl mx-auto">
            <h3 className="text-white font-bold uppercase tracking-wider mb-2">Process Checkout (INV-90218-A)</h3>
            <p className="text-[#94A3B8] text-sm mb-6">Total Due: <span className="font-mono text-white font-bold">$450.00</span></p>
            
            <button 
              onClick={processCheckout}
              disabled={isProcessing}
              className={`w-full font-bold uppercase py-3 rounded shadow-sm transition-colors ${
                isProcessing ? 'bg-[#94A3B8] cursor-not-allowed' : 'bg-[#16A34A] hover:bg-[#15803D] text-white'
              }`}
            >
              {isProcessing ? 'PROCESSING SECURE PAYLOAD...' : 'PROCESS CHECKOUT'}
            </button>
            
            {successMsg && (
              <div className="mt-4 p-3 bg-green-900/30 border border-green-800 rounded">
                <p className="text-[#16A34A] font-bold text-sm text-center">{successMsg}</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};
