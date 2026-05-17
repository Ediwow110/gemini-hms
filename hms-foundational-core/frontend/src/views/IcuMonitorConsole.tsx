import React, { useState } from 'react';

export const IcuMonitorConsole: React.FC = () => {
  const [criticalArrest, setCriticalArrest] = useState(false);

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans flex flex-col">
      <header className="bg-[#0F172A] text-white px-8 py-5 flex items-center justify-between shadow-md z-10">
        <div>
          <h1 className="text-2xl font-bold tracking-wide uppercase">ICU Continuous Monitoring Console</h1>
          <p className="text-[#94A3B8] font-semibold mt-1">High-Velocity Vital Telemetry & Waveform Streaming</p>
        </div>
        <div className="flex space-x-4 items-center">
           <div className="bg-[#1E293B] px-4 py-2 border border-[#E2E8F0] rounded shadow-sm text-center">
              <span className="block text-[#94A3B8] text-xs font-bold uppercase tracking-widest">Active Monitored Beds</span>
              <span className="block text-[#16A34A] text-lg font-bold font-mono">14 UNITS</span>
           </div>
           
           <button onClick={() => setCriticalArrest(true)} className="bg-[#0F172A] border-2 border-[#DC2626] hover:bg-[#7F1D1D] text-white font-bold text-xs px-3 py-2 rounded transition-colors tracking-widest uppercase">
             Simulate Cardiac Arrest
           </button>
           <button onClick={() => setCriticalArrest(false)} className="bg-[#0F172A] border-2 border-[#16A34A] hover:bg-[#064E3B] text-white font-bold text-xs px-3 py-2 rounded transition-colors tracking-widest uppercase">
             Restore Stream
           </button>
        </div>
      </header>

      {/* Main Streaming Grid Matrix Array */}
      <main className="flex-1 p-6 grid grid-cols-4 gap-6 h-full overflow-hidden">
        
        {/* Left Navigation Pane: Unit Listing */}
        <section className="col-span-1 flex flex-col space-y-4">
          <h2 className="text-[#1E293B] text-lg font-bold uppercase tracking-wide">Occupied ICU Beds</h2>
          <div className="flex-1 bg-white border border-[#E2E8F0] rounded-lg shadow-sm overflow-y-auto p-4 space-y-3">
             
             {/* Bed 1 Component Block */}
             <div className="p-4 rounded border-2 border-[#3B82F6] bg-[#EFF6FF] shadow-sm flex justify-between items-center">
                <div>
                  <h3 className="text-[#0F172A] font-bold text-md uppercase tracking-widest">Bed 01A</h3>
                  <p className="text-xs text-[#94A3B8] font-bold uppercase mt-1">Pt: J.D. | <span className="text-[#1E293B]">ONLINE</span></p>
                </div>
                <span className="w-3 h-3 bg-[#16A34A] rounded-full shadow-[0_0_8px_rgba(22,163,74,0.8)] animate-pulse"></span>
             </div>

             {/* Bed 2 Component Block with Dynamic Flashing Properties */}
             <div className={`p-4 rounded border-2 ${criticalArrest ? 'border-[#DC2626] bg-red-50' : 'border-[#E2E8F0] bg-white'} shadow-sm flex justify-between items-center transition-colors duration-300`}>
                <div>
                  <h3 className="text-[#0F172A] font-bold text-md uppercase tracking-widest">Bed 02B</h3>
                  <p className="text-[10px] text-[#94A3B8] font-bold uppercase mt-1">Pt: M.S. | <span className={`${criticalArrest ? 'text-[#DC2626]' : 'text-[#1E293B]'}`}>{criticalArrest ? 'CRITICAL_VITAL_ARREST' : 'ONLINE'}</span></p>
                </div>
                <span className={`w-3 h-3 rounded-full animate-pulse ${criticalArrest ? 'bg-[#DC2626] shadow-[0_0_8px_rgba(220,38,38,0.8)]' : 'bg-[#16A34A] shadow-[0_0_8px_rgba(22,163,74,0.8)]'}`}></span>
             </div>

          </div>
        </section>

        {/* Main Dynamic Panel: High Velocity Telemetry Waveforms */}
        <section className="col-span-3 flex flex-col space-y-4">
          <h2 className="text-[#1E293B] text-lg font-bold uppercase tracking-wide flex justify-between items-center">
             <span>Live Telemetry Waveform Matrix (Bed 02B)</span>
          </h2>
          
          <div className={`flex-1 bg-[#0F172A] rounded-lg shadow-xl border-4 ${criticalArrest ? 'border-[#DC2626]' : 'border-[#1E293B]'} overflow-hidden flex flex-col transition-colors duration-300`}>
             
             {/* Upper Dynamic Patient Vital Numeric Block Data */}
             <div className="grid grid-cols-3 border-b border-[#334155] bg-[#1E293B]">
                <div className="p-6 border-r border-[#334155] flex flex-col items-center">
                   <span className="text-[#16A34A] text-sm font-bold uppercase tracking-widest mb-1">Heart Rate (ECG)</span>
                   <span className={`text-6xl font-mono font-bold ${criticalArrest ? 'text-[#DC2626] animate-pulse' : 'text-[#16A34A]'}`}>{criticalArrest ? '0' : '72'} <span className="text-lg text-[#94A3B8]">bpm</span></span>
                </div>
                <div className="p-6 border-r border-[#334155] flex flex-col items-center">
                   <span className="text-[#3B82F6] text-sm font-bold uppercase tracking-widest mb-1">SpO2 (Pulse Ox)</span>
                   <span className={`text-6xl font-mono font-bold ${criticalArrest ? 'text-[#94A3B8]' : 'text-[#3B82F6]'}`}>{criticalArrest ? '--' : '98'} <span className="text-lg text-[#94A3B8]">%</span></span>
                </div>
                <div className="p-6 flex flex-col items-center">
                   <span className="text-[#D97706] text-sm font-bold uppercase tracking-widest mb-1">MAP (Arterial)</span>
                   <span className={`text-6xl font-mono font-bold ${criticalArrest ? 'text-[#94A3B8]' : 'text-[#D97706]'}`}>{criticalArrest ? '12' : '84'} <span className="text-lg text-[#94A3B8]">mmHg</span></span>
                </div>
             </div>

             {/* Live Streaming Physiological Vector Visual Arrays */}
             <div className="flex-1 p-6 flex flex-col space-y-6 relative overflow-hidden bg-[#000000]">
                
                {/* Continuous ECG Trace */}
                <div className="flex-1 relative border-b border-[#334155] pb-2">
                   <span className="absolute top-0 left-0 text-[10px] text-[#16A34A] font-bold tracking-widest uppercase">ECG Lead II</span>
                   <svg className="w-full h-full" preserveAspectRatio="none">
                     {criticalArrest ? (
                        <path d="M0,50 L800,50" fill="none" stroke="#DC2626" strokeWidth="2" strokeDasharray="10, 5" className="animate-pulse" />
                     ) : (
                        <path d="M0,50 L40,50 L50,20 L60,80 L70,50 L100,50 L120,40 L130,50 L180,50 L190,20 L200,80 L210,50 L240,50 L260,40 L270,50 L800,50" fill="none" stroke="#16A34A" strokeWidth="2.5" />
                     )}
                   </svg>
                </div>

                {/* Continuous Pulse Oximetry Trace */}
                <div className="flex-1 relative">
                   <span className="absolute top-0 left-0 text-[10px] text-[#3B82F6] font-bold tracking-widest uppercase">SpO2 Pleth</span>
                   <svg className="w-full h-full" preserveAspectRatio="none">
                     {criticalArrest ? (
                        <path d="M0,80 L800,80" fill="none" stroke="#94A3B8" strokeWidth="2" opacity="0.4" />
                     ) : (
                        <path d="M0,70 Q50,20 100,70 T200,70 T300,70 T400,70 T500,70 T600,70 T700,70" fill="none" stroke="#3B82F6" strokeWidth="2.5" />
                     )}
                   </svg>
                </div>
             </div>

             {/* Asystole / VFib Emergency Resuscitation Bounding Box */}
             {criticalArrest && (
                <div className="m-5 bg-[#991B1B] text-white p-5 rounded shadow-[0_0_35px_rgba(220,38,38,0.9)] border-2 border-[#DC2626] animate-bounce text-center">
                   <span className="font-extrabold tracking-widest uppercase text-xl block mb-1">
                     🚨 VENTRICULAR ARREST EXCEPTION
                   </span>
                   <span className="text-sm font-bold uppercase tracking-widest">Immediate Emergency Resuscitation Crash Cart Dispatched</span>
                </div>
             )}

          </div>
        </section>

      </main>
    </div>
  );
};
