import React, { useState } from 'react';

export const AncillaryConsole: React.FC = () => {
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans flex flex-col">
      {/* Header Banner */}
      <header className="bg-[#0F172A] text-white px-8 py-5 shadow-md z-10 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-wide uppercase">Ancillary Operations Console</h1>
          <p className="text-[#94A3B8] font-semibold mt-1">LIS & Pharmacy Integrated Mesh</p>
        </div>
        <div className="flex space-x-4">
           <div className="bg-[#1E293B] px-4 py-2 border border-[#E2E8F0] rounded shadow-sm text-center">
              <span className="block text-[#94A3B8] text-xs font-bold uppercase tracking-widest">Pending Labs</span>
              <span className="block text-white text-lg font-bold">14</span>
           </div>
           <div className="bg-[#1E293B] px-4 py-2 border border-[#E2E8F0] rounded shadow-sm text-center">
              <span className="block text-[#94A3B8] text-xs font-bold uppercase tracking-widest">Low Stock Alerts</span>
              <span className="block text-[#DC2626] text-lg font-bold">3</span>
           </div>
        </div>
      </header>

      <main className="flex-1 p-6 grid grid-cols-2 gap-8">
        
        {/* LIS Split Screen Workspace */}
        <section className="flex flex-col space-y-4">
          <h2 className="text-[#1E293B] text-lg font-bold uppercase tracking-wide">Laboratory Information System</h2>
          <div className="flex-1 flex border border-[#E2E8F0] bg-white rounded-lg shadow-sm overflow-hidden">
            
            {/* Left Margin: Pending Orders List */}
            <div className="w-1/3 bg-[#F8FAFC] border-r border-[#E2E8F0] overflow-y-auto">
              <div 
                className={`p-4 border-b border-[#E2E8F0] cursor-pointer transition-colors ${selectedOrder === 'ord-1' ? 'bg-[#2563EB] text-white' : 'hover:bg-[#E2E8F0] text-[#1E293B]'}`}
                onClick={() => setSelectedOrder('ord-1')}
              >
                <p className="font-bold text-sm">ORD-9011-B</p>
                <p className={`text-xs ${selectedOrder === 'ord-1' ? 'text-blue-100' : 'text-[#94A3B8]'}`}>Complete Blood Count</p>
              </div>
              <div className="p-4 border-b border-[#E2E8F0] cursor-pointer hover:bg-[#E2E8F0] text-[#1E293B]">
                <p className="font-bold text-sm">ORD-9012-C</p>
                <p className="text-xs text-[#94A3B8]">Lipid Panel</p>
              </div>
            </div>

            {/* Right Pane: Multi-Version Audit Pane */}
            <div className="flex-1 p-6 flex flex-col bg-white">
              {selectedOrder === 'ord-1' ? (
                <>
                  <div className="flex justify-between items-center mb-6 border-b border-[#E2E8F0] pb-4">
                    <h3 className="font-bold text-lg text-[#0F172A]">Historical Audit Trail</h3>
                    <span className="bg-[#16A34A] text-white text-xs font-bold px-3 py-1 rounded">PROCESSING</span>
                  </div>
                  
                  <div className="space-y-4 overflow-y-auto flex-1">
                    <div className="border border-[#E2E8F0] rounded p-4 bg-[#F8FAFC]">
                      <div className="flex justify-between items-center mb-2">
                        <span className="bg-[#0F172A] text-white text-xs font-bold px-2 py-1 rounded">VERSION 2 (LATEST)</span>
                        <span className="text-xs font-mono text-[#94A3B8]">14:32:11 | Tech ID: 44-X</span>
                      </div>
                      <p className="text-sm text-[#1E293B]">RBC Count 4.8 million cells/mcL. WBC 7,500 cells/mcL. Values updated post-centrifuge recalibration.</p>
                    </div>

                    <div className="border border-[#E2E8F0] rounded p-4 bg-gray-50 opacity-75">
                      <div className="flex justify-between items-center mb-2">
                        <span className="bg-[#94A3B8] text-white text-xs font-bold px-2 py-1 rounded">VERSION 1 (ARCHIVED)</span>
                        <span className="text-xs font-mono text-[#94A3B8]">14:15:00 | Tech ID: 44-X</span>
                      </div>
                      <p className="text-sm text-[#1E293B]">RBC Count 4.6 million cells/mcL. Pending differential.</p>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-[#94A3B8] font-semibold text-sm">
                  SELECT AN ORDER TO VIEW AUDIT TRAIL
                </div>
              )}
            </div>

          </div>
        </section>

        {/* Pharmacy Inventory Matrix */}
        <section className="flex flex-col space-y-4">
          <h2 className="text-[#1E293B] text-lg font-bold uppercase tracking-wide">Pharmacy Inventory Matrix</h2>
          <div className="flex-1 border border-[#E2E8F0] bg-white rounded-lg shadow-sm overflow-hidden">
            <table className="w-full text-left text-sm text-[#1E293B]">
              <thead className="bg-[#0F172A] text-white text-xs uppercase font-bold tracking-wider">
                <tr>
                  <th className="px-6 py-4">Medication Name</th>
                  <th className="px-6 py-4">Master Stock</th>
                  <th className="px-6 py-4">Branch Stock</th>
                  <th className="px-6 py-4 text-center">Status Tag</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                <tr className="hover:bg-[#F8FAFC] transition-colors">
                  <td className="px-6 py-4 font-bold text-[#0F172A]">Amoxicillin 500mg</td>
                  <td className="px-6 py-4 font-mono text-[#94A3B8]">1,200</td>
                  <td className="px-6 py-4 font-mono font-bold text-[#1E293B]">450</td>
                  <td className="px-6 py-4 text-center">
                    <span className="bg-[#16A34A] text-white text-[10px] font-bold px-3 py-1 rounded-full tracking-wider">NOMINAL</span>
                  </td>
                </tr>
                {/* Emergency Threat Level Array */}
                <tr className="hover:bg-[#F8FAFC] transition-colors bg-red-50">
                  <td className="px-6 py-4 font-bold text-[#0F172A]">Epinephrine Auto-Injector</td>
                  <td className="px-6 py-4 font-mono text-[#94A3B8]">25</td>
                  <td className="px-6 py-4 font-mono font-bold text-[#DC2626]">4</td>
                  <td className="px-6 py-4 text-center">
                    <span className="bg-[#DC2626] text-white text-[10px] font-extrabold tracking-widest px-3 py-1 rounded border border-red-800">
                      CRITICAL DEPLETION
                    </span>
                  </td>
                </tr>
                {/* Warning Threat Level Array */}
                <tr className="hover:bg-[#F8FAFC] transition-colors bg-yellow-50">
                  <td className="px-6 py-4 font-bold text-[#0F172A]">Lisinopril 10mg</td>
                  <td className="px-6 py-4 font-mono text-[#94A3B8]">300</td>
                  <td className="px-6 py-4 font-mono font-bold text-[#D97706]">18</td>
                  <td className="px-6 py-4 text-center">
                    <span className="bg-[#D97706] text-white text-[10px] font-extrabold tracking-widest px-3 py-1 rounded border border-yellow-800">
                      WARNING LEVEL
                    </span>
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
