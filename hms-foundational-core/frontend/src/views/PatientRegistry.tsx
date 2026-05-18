import React, { useState } from 'react';

export const PatientRegistry: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="flex h-screen bg-[#F8FAFC] font-sans">
      
      {/* Dynamic Content Pane for Patient Registry */}
      <main className="flex-1 flex flex-col overflow-hidden">
        
        {/* Module Header */}
        <header className="bg-white border-b border-[#E2E8F0] px-8 py-5 flex items-center justify-between shadow-sm">
          <h2 className="text-[#0F172A] text-2xl font-bold tracking-tight">Secure Bounded Patient Registry</h2>
          <button className="bg-[#16A34A] hover:bg-[#15803D] text-white text-sm font-bold px-4 py-2 rounded transition-colors shadow-sm">
            + REGISTER NEW PATIENT
          </button>
        </header>

        {/* Dense Content Matrix */}
        <div className="flex-1 overflow-auto p-8 flex flex-col">
          
          {/* Global Dynamic Filter Bar */}
          <div className="bg-white border border-[#E2E8F0] p-4 rounded-t-lg flex items-center shadow-sm">
            <span className="text-[#94A3B8] font-bold mr-3">FILTER INDEX:</span>
            <input 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Query by Name, ID Token, or Date of Birth..."
              className="flex-1 px-4 py-2 border border-[#E2E8F0] rounded bg-[#F8FAFC] text-[#0F172A] text-sm focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]"
            />
          </div>

          {/* Compact Table Matrix Template */}
          <div className="flex-1 bg-white border-x border-b border-[#E2E8F0] rounded-b-lg shadow-sm overflow-hidden">
            <table className="w-full text-left text-sm text-[#1E293B]">
              <thead className="bg-[#0F172A] text-white text-xs uppercase font-bold tracking-wider">
                <tr>
                  <th className="px-6 py-4 border-b border-[#1E293B]">Patient ID Token</th>
                  <th className="px-6 py-4 border-b border-[#1E293B]">First & Last Name</th>
                  <th className="px-6 py-4 border-b border-[#1E293B]">Date of Birth</th>
                  <th className="px-6 py-4 border-b border-[#1E293B]">Gender</th>
                  <th className="px-6 py-4 border-b border-[#1E293B]">Registration Datetime</th>
                  <th className="px-6 py-4 border-b border-[#1E293B] text-right">Command Operations</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                {/* Simulated Row Data Unit */}
                <tr className="hover:bg-[#F8FAFC] transition-colors">
                  <td className="px-6 py-4 font-mono text-xs text-[#94A3B8]">pt-88fae12</td>
                  <td className="px-6 py-4 font-bold text-[#0F172A]">Arthur Morgan</td>
                  <td className="px-6 py-4 font-medium text-[#1E293B]">1980-05-12</td>
                  <td className="px-6 py-4 text-[#3B82F6] font-semibold">Male</td>
                  <td className="px-6 py-4 text-[#94A3B8]">2026-05-17 08:14:00</td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <button className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold px-3 py-1.5 rounded transition-colors">
                      OPEN EMR CHART
                    </button>
                    <button className="bg-[#F8FAFC] border border-[#E2E8F0] hover:bg-[#E2E8F0] text-[#0F172A] text-xs font-bold px-3 py-1.5 rounded transition-colors">
                      RESCHEDULE
                    </button>
                  </td>
                </tr>
                {/* Simulated Row Data Unit 2 */}
                <tr className="hover:bg-[#F8FAFC] transition-colors">
                  <td className="px-6 py-4 font-mono text-xs text-[#94A3B8]">pt-91bcc34</td>
                  <td className="px-6 py-4 font-bold text-[#0F172A]">Sadie Adler</td>
                  <td className="px-6 py-4 font-medium text-[#1E293B]">1985-09-22</td>
                  <td className="px-6 py-4 text-[#3B82F6] font-semibold">Female</td>
                  <td className="px-6 py-4 text-[#94A3B8]">2026-05-16 14:30:21</td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <button className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold px-3 py-1.5 rounded transition-colors">
                      OPEN EMR CHART
                    </button>
                    <button className="bg-[#F8FAFC] border border-[#E2E8F0] hover:bg-[#E2E8F0] text-[#0F172A] text-xs font-bold px-3 py-1.5 rounded transition-colors">
                      RESCHEDULE
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

        </div>
      </main>
    </div>
  );
};
