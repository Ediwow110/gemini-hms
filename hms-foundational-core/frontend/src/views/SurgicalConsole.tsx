import React, { useState } from 'react';

export const SurgicalConsole: React.FC = () => {
  const [criticalVariance, setCriticalVariance] = useState(false);

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans flex flex-col">
      {/* Universal Navy Operations Header Array */}
      <header className="bg-[#0F172A] text-white px-8 py-5 flex items-center justify-between shadow-md z-10">
        <div>
          <h1 className="text-2xl font-bold tracking-wide uppercase">Surgical Overwatch Console</h1>
          <p className="text-[#94A3B8] font-semibold mt-1">Perioperative Allocation & Telemetry Matrix</p>
        </div>
        <div className="flex space-x-4 items-center">
           <div className="bg-[#1E293B] px-4 py-2 border border-[#E2E8F0] rounded shadow-sm text-center">
              <span className="block text-[#94A3B8] text-xs font-bold uppercase tracking-widest">Active OR Suites</span>
              <span className="block text-[#16A34A] text-lg font-bold font-mono">5 ACTIVE</span>
           </div>
           
           <button onClick={() => setCriticalVariance(true)} className="bg-[#0F172A] border-2 border-[#DC2626] hover:bg-[#7F1D1D] text-white font-bold text-xs px-3 py-2 rounded transition-colors tracking-widest uppercase">
             Simulate Variance
           </button>
           <button onClick={() => setCriticalVariance(false)} className="bg-[#0F172A] border-2 border-[#16A34A] hover:bg-[#064E3B] text-white font-bold text-xs px-3 py-2 rounded transition-colors tracking-widest uppercase">
             Restore Status
           </button>
        </div>
      </header>

      {/* Main Structural Layout Viewport */}
      <main className="flex-1 p-6 grid grid-cols-2 gap-8 h-full overflow-hidden">
        
        {/* Left Vertical Section: Physical Room Allocation */}
        <section className="flex flex-col space-y-4">
          <h2 className="text-[#1E293B] text-lg font-bold uppercase tracking-wide">Physical Operating Rooms</h2>
          <div className="flex-1 bg-white border border-[#E2E8F0] rounded-lg shadow-sm overflow-y-auto p-4 space-y-4">
             
             {/* OR-101 Standard Occupied Block */}
             <div className="p-5 rounded border-2 border-[#3B82F6] bg-[#EFF6FF] shadow-sm">
                <div className="flex justify-between items-start mb-3">
                   <h3 className="text-[#0F172A] font-bold text-2xl uppercase tracking-widest">OR-101</h3>
                   <span className="bg-[#16A34A] text-white text-[10px] font-extrabold uppercase px-2 py-1 rounded shadow border border-[#14532D]">OCCUPIED - SURGERY ACTIVE</span>
                </div>
                <div className="flex flex-col text-sm text-[#94A3B8] space-y-1">
                   <span className="flex items-center"><span className="w-16 font-bold uppercase text-[10px] text-[#1E293B]">Patient:</span> <strong className="text-[#1E293B]">Jane Smith (MRN-442)</strong></span>
                   <span className="flex items-center"><span className="w-16 font-bold uppercase text-[10px] text-[#1E293B]">Surgeon:</span> <strong className="text-[#1E293B]">Dr. Alpha</strong></span>
                   <span className="flex items-center"><span className="w-16 font-bold uppercase text-[10px] text-[#1E293B]">Profile:</span> Coronary Artery Bypass</span>
                </div>
             </div>

             {/* OR-102 Sterilization Required Block */}
             <div className="p-5 rounded border-2 border-[#E2E8F0] bg-white shadow-sm opacity-60">
                <div className="flex justify-between items-start mb-3">
                   <h3 className="text-[#0F172A] font-bold text-2xl uppercase tracking-widest">OR-102</h3>
                   <span className="bg-[#D97706] text-white text-[10px] font-extrabold uppercase px-2 py-1 rounded shadow border border-[#92400E]">STERILIZATION_REQUIRED</span>
                </div>
                <div className="flex flex-col text-sm text-[#94A3B8] space-y-1">
                   <span className="flex items-center"><span className="w-16 font-bold uppercase text-[10px] text-[#1E293B]">Patient:</span> --</span>
                   <span className="flex items-center"><span className="w-16 font-bold uppercase text-[10px] text-[#1E293B]">Surgeon:</span> --</span>
                   <span className="flex items-center"><span className="w-32 font-bold uppercase text-[10px] text-[#1E293B]">Cooldown Timer:</span> <strong className="text-[#1E293B] font-mono bg-[#E2E8F0] px-2 rounded">14:22 MINS</strong></span>
                </div>
             </div>

          </div>
        </section>

        {/* Right Vertical Section: Real-Time Anesthesia Tracker */}
        <section className="flex flex-col space-y-4">
          <h2 className="text-[#1E293B] text-lg font-bold uppercase tracking-wide flex justify-between items-center">
             <span>Anesthesia Telemetry Stream (OR-101)</span>
          </h2>
          
          <div className={`flex-1 bg-[#0F172A] rounded-lg shadow-xl border-4 ${criticalVariance ? 'border-[#DC2626]' : 'border-[#1E293B]'} overflow-hidden flex flex-col p-6 transition-colors duration-500`}>
             
             {/* Upper Telemetry Metric Data Points */}
             <div className="grid grid-cols-2 gap-6 mb-6">
                <div className="bg-[#1E293B] p-5 rounded border border-[#334155] shadow-inner">
                   <span className="text-[#94A3B8] text-[10px] font-bold uppercase tracking-widest block mb-2">Target Safety Curve Baseline</span>
                   <span className="text-white text-4xl font-mono font-bold">2.14%</span>
                </div>
                <div className={`p-5 rounded border shadow-inner ${criticalVariance ? 'bg-[#7F1D1D] border-[#DC2626] animate-pulse' : 'bg-[#1E293B] border-[#334155]'}`}>
                   <span className={`${criticalVariance ? 'text-white' : 'text-[#94A3B8]'} text-[10px] font-bold uppercase tracking-widest block mb-2`}>Active Agent Concentration</span>
                   <span className={`text-4xl font-mono font-bold ${criticalVariance ? 'text-white' : 'text-[#3B82F6]'}`}>{criticalVariance ? '4.50%' : '2.18%'}</span>
                </div>
             </div>

             {/* Dynamic Physiological Curve Simulation Render */}
             <div className="flex-1 bg-[#000000]/50 rounded border border-[#334155] p-4 flex items-end justify-between relative overflow-hidden">
                <div className="absolute inset-0 flex flex-col justify-between py-4 z-0">
                  <div className="w-full h-px bg-[#334155]"></div>
                  <div className="w-full h-px bg-[#334155]"></div>
                  <div className="w-full h-px bg-[#334155]"></div>
                  <div className="w-full h-px bg-[#334155]"></div>
                </div>
                {/* Embedded SVG Path Tracking Visuals */}
                <svg className="absolute inset-0 w-full h-full z-10" preserveAspectRatio="none">
                  <path d={criticalVariance ? "M0,80 Q50,90 100,70 T200,80 T300,75 T400,20 T500,10" : "M0,80 Q50,90 100,70 T200,80 T300,75 T400,80 T500,90"} fill="none" stroke={criticalVariance ? "#DC2626" : "#3B82F6"} strokeWidth={criticalVariance ? "5" : "3"} opacity="0.9" />
                </svg>
             </div>

             {/* Hostile Variance Deviation Boundary Box */}
             {criticalVariance && (
                <div className="mt-6 bg-[#991B1B] text-white p-5 rounded shadow-[0_0_20px_rgba(220,38,38,0.8)] border-2 border-[#DC2626] animate-bounce text-center">
                   <span className="font-extrabold tracking-widest uppercase text-md">
                     🚨 ANESTHETIC DOSAGE INVARIANT DEVIATION: VENTILATOR OVERRIDE ACTIVE
                   </span>
                </div>
             )}

          </div>
        </section>

      </main>
    </div>
  );
};
