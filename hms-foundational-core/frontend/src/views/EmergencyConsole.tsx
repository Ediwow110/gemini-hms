import React, { useState } from 'react';

export const EmergencyConsole: React.FC = () => {
  const [diversionMode, setDiversionMode] = useState(false);

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans flex flex-col">
      {/* Universal Emergency Header Layout Block */}
      <header className="bg-[#0F172A] text-white px-8 py-5 flex items-center justify-between shadow-md z-10 relative overflow-hidden">
        {/* Diversion Banner Emergency Overlay Constraint */}
        {diversionMode && (
          <div className="absolute inset-0 bg-[#991B1B] text-white flex items-center justify-center animate-pulse z-20 shadow-inner">
             <span className="font-extrabold text-xl uppercase tracking-widest text-center px-6 py-2 border-2 border-white rounded shadow-2xl bg-[#DC2626]">
               🚨 ER CAPACITY CRISIS: SURGE INDEX OUT OF BOUNDS - DIVERSION PROTOCOL ENGAGED
             </span>
          </div>
        )}
        
        <div className="z-10 relative">
          <h1 className="text-2xl font-bold tracking-wide uppercase">Emergency Command Center</h1>
          <p className="text-[#94A3B8] font-semibold mt-1">Disaster Surge Protocol Matrix</p>
        </div>
        <div className="flex space-x-4 items-center z-10 relative">
           <div className="bg-[#1E293B] px-4 py-2 border border-[#E2E8F0] rounded shadow-sm text-center">
              <span className="block text-[#94A3B8] text-xs font-bold uppercase tracking-widest">Active ESI Load</span>
              <span className={`block ${diversionMode ? 'text-[#DC2626]' : 'text-[#D97706]'} text-lg font-bold font-mono transition-colors`}>{diversionMode ? '45 CRITICAL' : '15 CRITICAL'}</span>
           </div>
           
           <button onClick={() => setDiversionMode(true)} className="bg-[#0F172A] border-2 border-[#DC2626] hover:bg-[#7F1D1D] text-white font-bold text-xs px-3 py-2 rounded transition-colors tracking-widest uppercase shadow">
             Simulate ER Surge
           </button>
           <button onClick={() => setDiversionMode(false)} className="bg-[#0F172A] border-2 border-[#16A34A] hover:bg-[#064E3B] text-white font-bold text-xs px-3 py-2 rounded transition-colors tracking-widest uppercase shadow">
             Restore Normalcy
           </button>
        </div>
      </header>

      <main className="flex-1 p-6 grid grid-cols-2 gap-8 h-full overflow-hidden">
        
        {/* Left Column: Sorted Triage Inbound Vector Array */}
        <section className="flex flex-col space-y-4">
          <h2 className="text-[#1E293B] text-lg font-bold uppercase tracking-wide">Triage Admissions Queue</h2>
          <div className="flex-1 bg-white border border-[#E2E8F0] rounded-lg shadow-sm overflow-y-auto p-4 space-y-3">
             
             {/* ESI 1 (Resuscitation) Element Wrapper */}
             <div className="p-4 rounded border-l-8 border-[#DC2626] bg-[#FEF2F2] shadow-sm flex flex-col justify-between">
                <div className="flex justify-between items-start mb-3">
                   <div className="flex space-x-4 items-center">
                     <span className="bg-[#DC2626] text-white text-[12px] font-extrabold uppercase px-3 py-1 rounded shadow">ESI 1</span>
                     <h3 className="text-[#0F172A] font-bold text-lg uppercase tracking-widest">John Doe</h3>
                   </div>
                   <span className="bg-[#991B1B] text-white text-[10px] font-extrabold uppercase px-2 py-1 rounded shadow animate-pulse border border-[#7F1D1D]">AIRBORNE ISO REQUIRED</span>
                </div>
                <div className="flex justify-between items-center text-sm text-[#94A3B8] font-bold">
                   <span className="uppercase">Wait Time: <strong className="text-[#DC2626] font-mono">00:00</strong></span>
                   <span className="font-mono font-bold bg-[#E2E8F0] px-3 py-1 rounded text-[#1E293B] border border-[#CBD5E1]">GCS: 6</span>
                </div>
             </div>

             {/* ESI 2 (Emergent) Element Wrapper */}
             <div className="p-4 rounded border-l-8 border-[#D97706] bg-[#FFFBEB] shadow-sm flex flex-col justify-between">
                <div className="flex justify-between items-start mb-3">
                   <div className="flex space-x-4 items-center">
                     <span className="bg-[#D97706] text-white text-[12px] font-extrabold uppercase px-3 py-1 rounded shadow">ESI 2</span>
                     <h3 className="text-[#0F172A] font-bold text-lg uppercase tracking-widest">Jane Smith</h3>
                   </div>
                </div>
                <div className="flex justify-between items-center text-sm text-[#94A3B8] font-bold">
                   <span className="uppercase">Wait Time: <strong className="text-[#D97706] font-mono">04:12</strong></span>
                   <span className="font-mono font-bold bg-[#E2E8F0] px-3 py-1 rounded text-[#1E293B] border border-[#CBD5E1]">GCS: 12</span>
                </div>
             </div>

             {/* ESI 5 (Non-Urgent) Element Wrapper */}
             <div className="p-4 rounded border-l-8 border-[#94A3B8] bg-[#F8FAFC] shadow-sm flex flex-col justify-between">
                <div className="flex justify-between items-start mb-3">
                   <div className="flex space-x-4 items-center">
                     <span className="bg-[#94A3B8] text-white text-[12px] font-extrabold uppercase px-3 py-1 rounded shadow">ESI 5</span>
                     <h3 className="text-[#0F172A] font-bold text-lg uppercase tracking-widest">Mark Miller</h3>
                   </div>
                </div>
                <div className="flex justify-between items-center text-sm text-[#94A3B8] font-bold">
                   <span className="uppercase">Wait Time: <strong className="text-[#1E293B] font-mono">45:30</strong></span>
                   <span className="font-mono font-bold bg-[#E2E8F0] px-3 py-1 rounded text-[#1E293B] border border-[#CBD5E1]">GCS: 15</span>
                </div>
             </div>

          </div>
        </section>

        {/* Right Column: Physical Bay Allocation Grid Matrix */}
        <section className="flex flex-col space-y-4">
          <h2 className="text-[#1E293B] text-lg font-bold uppercase tracking-wide">Emergency Trauma Bays</h2>
          <div className="flex-1 bg-white border border-[#E2E8F0] rounded-lg shadow-sm overflow-hidden flex flex-col p-4 space-y-5">
             
             {/* Vacant Standard Bay Element */}
             <div className={`p-6 rounded border-2 border-dashed ${diversionMode ? 'border-[#DC2626] bg-[#FEF2F2]' : 'border-[#CBD5E1] bg-[#F8FAFC]'} flex flex-col items-center justify-center transition-colors duration-300`}>
                <h3 className={`font-bold text-2xl uppercase tracking-widest mb-2 ${diversionMode ? 'text-[#DC2626]' : 'text-[#64748B]'}`}>Trauma Bay 1</h3>
                <span className={`text-[12px] font-extrabold uppercase px-4 py-2 rounded mb-4 shadow ${diversionMode ? 'bg-[#991B1B] text-white border border-[#7F1D1D]' : 'bg-[#E2E8F0] text-[#64748B]'}`}>{diversionMode ? 'DIVERSION_FORCED' : 'VACANT'}</span>
                {!diversionMode && (
                   <button className="bg-[#3B82F6] hover:bg-[#2563EB] text-white text-xs font-bold uppercase px-6 py-3 rounded shadow transition-colors w-full tracking-widest">
                     Assign Priority Patient
                   </button>
                )}
             </div>

             {/* Occupied Negative Pressure Isolation Sequence */}
             <div className="p-6 rounded border-2 border-[#1E293B] bg-[#0F172A] text-white flex flex-col shadow-xl">
                <div className="flex justify-between items-center mb-4">
                   <h3 className="font-bold text-2xl uppercase tracking-widest">Trauma Bay 4</h3>
                   <span className="bg-[#991B1B] text-white text-[10px] font-extrabold uppercase px-3 py-1 rounded shadow animate-pulse border border-[#7F1D1D]">NEGATIVE PRESSURE ISO</span>
                </div>
                <div className="bg-[#1E293B] p-4 rounded flex justify-between items-center border border-[#334155]">
                   <span className="text-md font-bold tracking-widest uppercase">Occupied (J. Doe)</span>
                   <span className="text-sm font-mono text-[#94A3B8] font-bold">Admitted: 14m ago</span>
                </div>
             </div>

          </div>
        </section>

      </main>
    </div>
  );
};
