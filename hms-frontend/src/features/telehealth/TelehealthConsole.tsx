import React, { useState } from 'react';

export const TelehealthConsole: React.FC = () => {
  const [packetLoss, setPacketLoss] = useState(0.05); // Nominal baseline simulation parameter (5%)

  // Stream bandwidth recalibration engine: B_target = max(250, 2500 * (1 - 4.5 * L^2))
  const bitrate = Math.round(Math.max(250, 2500 * (1 - 4.5 * Math.pow(packetLoss, 2))));
  const isCongested = packetLoss >= 0.25;

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans flex flex-col">
      
      {/* Universal Workspace Header Array */}
      <header className="bg-[#0F172A] text-white px-8 py-5 flex items-center justify-between shadow-md z-10">
        <div>
          <h1 className="text-2xl font-bold tracking-wide uppercase">Virtual Care Telehealth Suite</h1>
          <p className="text-[#94A3B8] font-semibold mt-1">Real-Time WebRTC Secure Media Grid</p>
        </div>
        <div className="flex space-x-4 items-center">
           <div className="bg-[#1E293B] px-4 py-2 border border-[#E2E8F0] rounded shadow-sm text-center">
              <span className="block text-[#94A3B8] text-xs font-bold uppercase tracking-widest">Active Connection</span>
              <span className="block text-[#16A34A] text-lg font-bold uppercase">CONNECTED</span>
           </div>
           
           <button onClick={() => setPacketLoss(0.25)} className="bg-[#0F172A] border-2 border-[#DC2626] hover:bg-[#7F1D1D] text-white font-bold text-xs px-3 py-2 rounded transition-colors">
             Simulate 25% Loss
           </button>
           <button onClick={() => setPacketLoss(0.02)} className="bg-[#0F172A] border-2 border-[#16A34A] hover:bg-[#064E3B] text-white font-bold text-xs px-3 py-2 rounded transition-colors">
             Restore Network
           </button>
        </div>
      </header>

      {/* Embedded Presentation Viewport Layout */}
      <main className="flex-1 p-6 grid grid-cols-3 gap-6 h-full overflow-hidden">
        
        {/* Left Side: WebRTC Primary Media Component Frame */}
        <section className="col-span-2 flex flex-col space-y-4">
          <div className="flex justify-between items-center">
             <h2 className="text-[#1E293B] text-lg font-bold uppercase tracking-wide">
               Live Consultation Stream
             </h2>
             {/* Aggressive Warning Diagnostic Indicator */}
             {isCongested && (
                <span className="bg-[#FEF3C7] text-[#D97706] text-[10px] font-extrabold tracking-widest px-3 py-2 rounded shadow-md border-2 border-[#FCD34D] animate-pulse">
                  ⚠️ NETWORK CONGESTION: STREAMING RECALIBRATED TO AUDIO-ONLY PRIORITIZATION
                </span>
             )}
          </div>
          
          <div className="flex-1 relative bg-black rounded-lg shadow-xl border-4 border-[#1E293B] overflow-hidden flex items-center justify-center min-h-[600px]">
            {/* Massive Remote Patient Backdrop Simulation */}
            <div className={`absolute inset-0 flex items-center justify-center transition-colors duration-700 ${isCongested ? 'bg-[#1E293B]' : 'bg-[#0F172A]'}`}>
              {isCongested ? (
                 <div className="flex flex-col items-center">
                    <span className="text-6xl mb-4 animate-bounce">🎙️</span>
                    <span className="text-[#94A3B8] font-bold uppercase tracking-widest text-center px-8">Video Stream Dropped<br/>Audio Quality Prioritized</span>
                 </div>
              ) : (
                 <span className="text-[#94A3B8] font-bold uppercase tracking-widest">Remote Patient Video Matrix Render</span>
              )}
            </div>

            {/* Local Practitioner Layout Frame Overlay */}
            <div className="absolute bottom-6 right-6 w-56 h-40 bg-[#1E293B] border-2 border-[#E2E8F0] shadow-2xl flex items-center justify-center rounded">
               <span className="text-[#94A3B8] font-bold text-[10px] uppercase text-center tracking-widest">Local Cam<br/>(Practitioner Context)</span>
            </div>

            {/* Embedded Live WebRTC Telemetry Tracking Display */}
            <div className="absolute top-6 left-6 flex flex-col space-y-3 z-20">
               <div className="bg-[#000000]/80 border border-[#334155] text-white text-xs font-mono tracking-widest px-3 py-2 rounded shadow-lg backdrop-blur">
                 PACKET LOSS RATE: <span className={isCongested ? 'text-[#DC2626] font-bold' : 'text-[#16A34A] font-bold'}>{(packetLoss * 100).toFixed(1)}%</span>
               </div>
               <div className="bg-[#000000]/80 border border-[#334155] text-[#3B82F6] text-xs font-mono tracking-widest px-3 py-2 rounded shadow-lg backdrop-blur">
                 TARGET BITRATE ALLOCATION: <span className="text-white font-bold">{bitrate} kbps</span>
               </div>
            </div>
          </div>
        </section>

        {/* Right Side: High-Density Embedded EMR Diagnostic Mapping Form */}
        <section className="col-span-1 flex flex-col space-y-4">
          <h2 className="text-[#1E293B] text-lg font-bold uppercase tracking-wide">Integrated Clinical EMR</h2>
          <div className="flex-1 bg-white border border-[#E2E8F0] rounded-lg shadow-sm flex flex-col p-6">
             <div className="border-b border-[#E2E8F0] pb-3 mb-5">
               <h3 className="text-[#0F172A] font-bold text-md uppercase">Active Patient SOAP Chart</h3>
               <p className="text-[#94A3B8] text-xs font-semibold uppercase tracking-widest mt-1">Real-Time Dual-Pane Capture Matrix</p>
             </div>
             
             <div className="flex-1 space-y-5 overflow-y-auto pr-2">
                <div className="space-y-2">
                  <label className="text-[11px] font-extrabold text-[#1E293B] uppercase tracking-widest flex items-center"><span className="w-1.5 h-1.5 bg-[#3B82F6] rounded-full mr-2"></span>Subjective (S)</label>
                  <textarea className="w-full h-24 border border-[#E2E8F0] rounded bg-[#F8FAFC] p-3 text-sm focus:border-[#3B82F6] focus:outline-none shadow-inner" placeholder="Patient reports..." />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-extrabold text-[#1E293B] uppercase tracking-widest flex items-center"><span className="w-1.5 h-1.5 bg-[#16A34A] rounded-full mr-2"></span>Objective (O)</label>
                  <textarea className="w-full h-24 border border-[#E2E8F0] rounded bg-[#F8FAFC] p-3 text-sm focus:border-[#3B82F6] focus:outline-none shadow-inner" placeholder="Clinical observations..." />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-extrabold text-[#1E293B] uppercase tracking-widest flex items-center"><span className="w-1.5 h-1.5 bg-[#D97706] rounded-full mr-2"></span>Assessment (A)</label>
                  <textarea className="w-full h-20 border border-[#E2E8F0] rounded bg-[#F8FAFC] p-3 text-sm focus:border-[#3B82F6] focus:outline-none shadow-inner" placeholder="Diagnostic mapping..." />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-extrabold text-[#1E293B] uppercase tracking-widest flex items-center"><span className="w-1.5 h-1.5 bg-[#DC2626] rounded-full mr-2"></span>Plan (P)</label>
                  <textarea className="w-full h-20 border border-[#E2E8F0] rounded bg-[#F8FAFC] p-3 text-sm focus:border-[#3B82F6] focus:outline-none shadow-inner" placeholder="Prescription & Treatment route..." />
                </div>
             </div>
          </div>
        </section>

      </main>
    </div>
  );
};
