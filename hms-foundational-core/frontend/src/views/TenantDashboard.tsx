import React from 'react';

export const TenantDashboard: React.FC = () => {
  return (
    <div className="flex h-screen bg-[#F8FAFC] font-sans">
      
      {/* Static Vertical Navigation Rail */}
      <aside className="w-64 bg-[#0F172A] flex flex-col shadow-xl z-10">
        <div className="p-5 border-b border-[#1E293B]">
          <h1 className="text-white font-bold text-lg tracking-wide uppercase">General Hospital</h1>
          <p className="text-[#3B82F6] text-xs font-semibold tracking-wider mt-1">TENANT: GH-CENTRAL-01</p>
        </div>
        <nav className="flex-1 py-4">
          <ul className="space-y-1">
            <li>
              <a href="#" className="block px-6 py-3 bg-[#1E293B] text-white font-medium border-l-4 border-[#2563EB]">Workspace Console</a>
            </li>
            <li>
              <a href="#" className="block px-6 py-3 text-[#94A3B8] hover:bg-[#1E293B] hover:text-white font-medium transition-colors">Patient Registry</a>
            </li>
            <li>
              <a href="#" className="block px-6 py-3 text-[#94A3B8] hover:bg-[#1E293B] hover:text-white font-medium transition-colors">Clinical Staff</a>
            </li>
          </ul>
        </nav>
        <div className="p-4 border-t border-[#1E293B]">
          <button className="w-full text-left text-[#DC2626] font-semibold text-sm hover:text-white transition-colors">
            SECURE LOGOUT
          </button>
        </div>
      </aside>

      {/* Main Content Pane */}
      <main className="flex-1 flex flex-col overflow-hidden">
        
        {/* Horizontal Layout Title Header */}
        <header className="bg-white border-b border-[#E2E8F0] px-8 py-5 flex items-center justify-between">
          <h2 className="text-[#0F172A] text-2xl font-bold">Clinical Workspace Console</h2>
          <span className="bg-[#16A34A] text-white text-xs font-bold px-3 py-1 rounded-full shadow-sm">SYSTEM NOMINAL</span>
        </header>

        {/* Dense Content Scroll Area */}
        <div className="flex-1 overflow-auto p-8 space-y-6">
          
          {/* Core Counter Grid Blocks */}
          <div className="grid grid-cols-3 gap-6">
            <div className="bg-white border border-[#E2E8F0] p-6 rounded-lg shadow-sm flex items-center justify-between">
              <div>
                <p className="text-[#1E293B] text-sm font-bold uppercase tracking-wider">Active Appointments</p>
                <p className="text-4xl font-extrabold text-[#2563EB] mt-2">142</p>
              </div>
            </div>
            <div className="bg-white border border-[#E2E8F0] p-6 rounded-lg shadow-sm flex items-center justify-between">
              <div>
                <p className="text-[#1E293B] text-sm font-bold uppercase tracking-wider">Checked-In Patients</p>
                <p className="text-4xl font-extrabold text-[#16A34A] mt-2">38</p>
              </div>
            </div>
            <div className="bg-white border border-[#E2E8F0] p-6 rounded-lg shadow-sm flex items-center justify-between">
              <div>
                <p className="text-[#1E293B] text-sm font-bold uppercase tracking-wider">Active Staff On-Duty</p>
                <p className="text-4xl font-extrabold text-[#0F172A] mt-2">24</p>
              </div>
            </div>
          </div>

          {/* Bifurcated Column Panel Split */}
          <div className="grid grid-cols-3 gap-6">
            
            {/* Left: Tabular Itinerary (Spans 2 columns) */}
            <div className="col-span-2 bg-white border border-[#E2E8F0] rounded-lg shadow-sm flex flex-col">
              <div className="px-6 py-4 border-b border-[#E2E8F0]">
                <h3 className="text-[#0F172A] text-lg font-bold">Upcoming Medical Appointments</h3>
              </div>
              <div className="p-0 flex-1">
                <table className="w-full text-left text-sm text-[#1E293B]">
                  <thead className="bg-[#F8FAFC] text-xs uppercase font-bold text-[#1E293B] border-b border-[#E2E8F0]">
                    <tr>
                      <th className="px-6 py-3">Time</th>
                      <th className="px-6 py-3">Patient Name</th>
                      <th className="px-6 py-3">Provider</th>
                      <th className="px-6 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-[#E2E8F0] hover:bg-[#F8FAFC]">
                      <td className="px-6 py-4 font-semibold">09:00 AM</td>
                      <td className="px-6 py-4">Michael Sterling</td>
                      <td className="px-6 py-4">Dr. Sarah Connor</td>
                      <td className="px-6 py-4"><span className="text-[#D97706] font-bold text-xs uppercase bg-yellow-50 px-2 py-1 rounded">Checked-In</span></td>
                    </tr>
                    <tr className="border-b border-[#E2E8F0] hover:bg-[#F8FAFC]">
                      <td className="px-6 py-4 font-semibold">09:30 AM</td>
                      <td className="px-6 py-4">Elena Fisher</td>
                      <td className="px-6 py-4">Dr. Nathan Drake</td>
                      <td className="px-6 py-4"><span className="text-[#2563EB] font-bold text-xs uppercase bg-blue-50 px-2 py-1 rounded">Scheduled</span></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Right: Explicit Command Triggers */}
            <div className="col-span-1 space-y-4">
              <div className="bg-[#0F172A] border border-[#1E293B] p-6 rounded-lg shadow-sm text-center">
                <h3 className="text-white text-lg font-bold mb-4">Command Operations</h3>
                <button className="w-full bg-[#16A34A] hover:bg-[#15803D] text-white font-bold py-3 px-4 rounded mb-3 transition-colors duration-200">
                  + REGISTER NEW PATIENT
                </button>
                <button className="w-full bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold py-3 px-4 rounded transition-colors duration-200">
                  BOOK APPOINTMENT SLOT
                </button>
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
};
