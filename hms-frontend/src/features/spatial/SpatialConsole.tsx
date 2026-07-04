import React, { useState } from 'react';
import { AlertCircle } from 'lucide-react';

export const SpatialConsole: React.FC = () => {
  const [criticalFall, setCriticalFall] = useState(false);

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans flex flex-col">
      {/* Body-level sandbox notice: Spatial Overwatch Console is a prototype demo visualizer.
          The patient beacon data shown below is simulated — no real patient data is fetched.
          Prior versions rendered hardcoded pop-culture names (John Doe, Jane Smith) without
          disclosure. This has been replaced with neutral sandbox identifiers. */}
      <div
        role="status"
        data-testid="spatial-console-notice"
        className="bg-amber-50 border-b border-amber-200 px-8 py-3 flex gap-3 items-center"
      >
        <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" aria-hidden="true" />
        <p className="text-xs font-semibold text-amber-800">
          <span className="font-black uppercase tracking-wide mr-1">Sandbox Notice:</span>
          Spatial Overwatch Console is a prototype IT/operations visualizer. Beacon data, patient
          identifiers, locations, and impact simulations are fabricated demo examples — no real
          patient data or live IoT feeds are connected in this build.
        </p>
      </div>
      <header className="bg-[#0F172A] text-white px-8 py-5 flex items-center justify-between shadow-md z-10">
        <div>
          <h1 className="text-2xl font-bold tracking-wide uppercase">Spatial Overwatch Console</h1>
          <p className="text-[#94A3B8] font-semibold mt-1">Biometric Telemetry & Geofence Matrix</p>
        </div>
        <div className="flex space-x-4 items-center">
           <div className="bg-[#1E293B] px-4 py-2 border border-[#E2E8F0] rounded shadow-sm text-center">
              <span className="block text-[#94A3B8] text-xs font-bold uppercase tracking-widest">Active Beacons</span>
              <span className="block text-[#3B82F6] text-lg font-bold font-mono">24 UNITS</span>
           </div>
           
           <button onClick={() => setCriticalFall(true)} className="bg-[#0F172A] border-2 border-[#DC2626] hover:bg-[#7F1D1D] text-white font-bold text-xs px-3 py-2 rounded transition-colors tracking-widest uppercase">
             Simulate Impact Vector
           </button>
           <button onClick={() => setCriticalFall(false)} className="bg-[#0F172A] border-2 border-[#16A34A] hover:bg-[#064E3B] text-white font-bold text-xs px-3 py-2 rounded transition-colors tracking-widest uppercase">
             Restore Status
           </button>
        </div>
      </header>

      <main className="flex-1 p-6 grid grid-cols-3 gap-6 h-full overflow-hidden">
        
        {/* Left Margin Panel: High-Density Active Beacon List */}
        <section className="col-span-1 flex flex-col space-y-4">
          <h2 className="text-[#1E293B] text-lg font-bold uppercase tracking-wide">Active Patient Beacons</h2>
          <div className="flex-1 bg-white border border-[#E2E8F0] rounded-lg shadow-sm overflow-y-auto p-4 space-y-4">
             
             {/* Nominal Beacon Frame */}
             <div className={`p-5 rounded border-2 transition-opacity duration-300 ${criticalFall ? 'border-[#E2E8F0] opacity-40' : 'border-[#3B82F6] bg-[#EFF6FF] shadow-md'}`}>
                <div className="flex justify-between items-start mb-3">
                   <h3 className="text-[#0F172A] font-bold text-lg">Patient Beacon 01 (SIM-001)</h3>
                   <span className="bg-[#16A34A] text-white text-[10px] font-extrabold uppercase px-2 py-1 rounded shadow border border-[#14532D]">ACTIVE</span>
                </div>
                <div className="flex flex-col text-sm text-[#94A3B8] space-y-1">
                   <span>Location: Ward 4 (Cardio)</span>
                   <span>Battery: <strong className="text-[#1E293B]">92%</strong></span>
                   <span className="font-mono bg-[#E2E8F0] text-[#1E293B] px-2 py-1 rounded w-max mt-2 text-xs font-bold">XYZ: 12.4 | 44.2 | 1.0</span>
                </div>
             </div>

             {/* Compromised Euclidean Fall Logic Frame */}
             {criticalFall && (
               <div className="p-5 rounded border-2 border-[#DC2626] bg-red-50 relative overflow-hidden shadow-inner">
                  <div className="absolute top-0 right-0 h-full w-2 bg-[#DC2626] animate-pulse"></div>
                  <div className="flex flex-col mb-2 space-y-2">
                     <div className="flex justify-between items-center w-full">
                       <h3 className="text-[#0F172A] font-bold text-lg">Patient Beacon 02 (SIM-002)</h3>
                     </div>
                     <span className="bg-[#991B1B] text-white text-[10px] font-extrabold uppercase px-3 py-1 rounded shadow-md animate-pulse border border-[#7F1D1D] w-full text-center tracking-widest">
                       🚨 HARSH IMPACT EXCEPTION: CRITICAL FALL DETECTED
                     </span>
                  </div>
                  <div className="flex flex-col text-sm text-[#94A3B8] space-y-1 mt-4">
                     <span>Location: Hallway B</span>
                     <span>Battery: <strong className="text-[#1E293B]">88%</strong></span>
                     <span className="font-mono bg-[#FECACA] text-[#991B1B] px-2 py-1 rounded w-max mt-2 text-xs font-bold border border-[#F87171]">Vector Spike (||A||): 5.22G</span>
                  </div>
               </div>
             )}

          </div>
        </section>

        {/* Main Dynamic Panel: Floor Grid Matrix */}
        <section className="col-span-2 flex flex-col space-y-4">
          <h2 className="text-[#1E293B] text-lg font-bold uppercase tracking-wide">Facility Floor Grid Matrix</h2>
          <div className="flex-1 bg-white border border-[#E2E8F0] rounded-lg shadow-sm flex items-center justify-center relative overflow-hidden bg-[radial-gradient(#E2E8F0_1px,transparent_1px)] [background-size:20px_20px]">
             
             {/* Center Safe Zone Bounding Ring */}
             <div className="w-96 h-96 border-4 border-[#3B82F6]/30 rounded-full flex items-center justify-center">
                <span className="text-[#3B82F6]/30 font-bold uppercase tracking-widest text-4xl transform rotate-45 select-none">Safe Zone Bounds</span>
             </div>

             {/* Nominal Geolocation Blip */}
             <div className="absolute top-1/3 left-1/2 w-4 h-4 bg-[#16A34A] rounded-full shadow-[0_0_10px_rgba(22,163,74,0.8)] animate-pulse"></div>

             {/* Critical Impact Blip */}
             {criticalFall && (
               <div className="absolute top-1/2 left-1/4">
                 <div className="relative">
                   <div className="absolute -inset-4 bg-[#DC2626] rounded-full blur-md opacity-70 animate-pulse"></div>
                   <div className="w-6 h-6 bg-[#991B1B] rounded-full relative z-10 border-2 border-white flex items-center justify-center shadow-2xl">
                     <div className="w-2 h-2 bg-white rounded-full"></div>
                   </div>
                 </div>
               </div>
             )}

          </div>
        </section>

      </main>
    </div>
  );
};
