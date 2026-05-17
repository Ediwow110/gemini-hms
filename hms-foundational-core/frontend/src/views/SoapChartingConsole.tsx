import React, { useState, useEffect } from 'react';

export const SoapChartingConsole: React.FC = () => {
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);

  const [soapForm, setSoapForm] = useState({
    subjective: '',
    objective: '',
    assessment: '',
    plan: ''
  });

  useEffect(() => {
    // Auto-Save Telemetry Tracker (Debounced Runtime Execution)
    const debounceTimer = setTimeout(() => {
      // Validate array block not empty
      if (Object.values(soapForm).some(v => v.length > 0)) {
        setIsSaving(true);
        // Dispatch to background processing
        setTimeout(() => {
          setIsSaving(false);
          setLastSaved(new Date().toLocaleTimeString());
        }, 600);
      }
    }, 1200);

    return () => clearTimeout(debounceTimer);
  }, [soapForm]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans">
      {/* Header Panel */}
      <header className="bg-[#0F172A] text-white px-8 py-4 flex items-center justify-between shadow-md z-10">
        <div>
          <h1 className="text-xl font-bold tracking-tight uppercase">Active Clinical Documentation</h1>
          <p className="text-[#94A3B8] text-sm font-medium mt-1">Encounter Timeline ID: <span className="font-mono text-[#E2E8F0]">ENC-2026-0517-A9</span></p>
        </div>
        
        {/* Dynamic Demographics Block */}
        <div className="flex items-center space-x-6">
          <div className="text-right">
            <p className="font-bold text-lg text-[#F8FAFC]">Michael Sterling</p>
            <p className="text-[#3B82F6] text-sm font-semibold">DOB: 1982-11-04 (Age 43)</p>
          </div>
          {/* Allergies Warning Badge */}
          <div className="bg-[#DC2626] text-white font-extrabold px-4 py-2 rounded shadow-sm flex items-center border border-red-800 tracking-wide text-sm">
            <span className="mr-2">⚠️</span> ALLERGY: PENICILLIN
          </div>
        </div>
      </header>

      {/* Main Split-Pane Workspace */}
      <main className="flex-1 p-6 flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[#1E293B] text-lg font-bold uppercase tracking-wide">SOAP Chart Entry</h2>
          
          {/* Auto-Save Telemetry Margin Indicator */}
          <div className="flex items-center text-sm font-bold h-8">
            {isSaving ? (
              <span className="text-[#D97706] animate-pulse">Syncing Telemetry Block...</span>
            ) : lastSaved ? (
              <span className="text-[#16A34A]">✓ Saved to secure cluster at {lastSaved}</span>
            ) : null}
          </div>
        </div>

        <div className="flex-1 grid grid-cols-2 gap-6">
          
          {/* Left Pane: Subjective & Objective */}
          <div className="space-y-6 flex flex-col">
            <div className="flex-1 flex flex-col bg-white border border-[#E2E8F0] rounded-lg shadow-sm overflow-hidden">
              <div className="bg-[#1E293B] text-white px-4 py-2 font-bold uppercase text-xs tracking-wider border-b border-[#E2E8F0]">Subjective</div>
              <textarea 
                value={soapForm.subjective}
                onChange={(e) => setSoapForm({ ...soapForm, subjective: e.target.value })}
                placeholder="Patient's primary complaint, symptoms, medical history narratives..."
                className="flex-1 p-4 w-full h-full resize-none focus:outline-none focus:ring-inset focus:ring-2 focus:ring-[#2563EB] text-[#0F172A]"
              ></textarea>
            </div>
            
            <div className="flex-1 flex flex-col bg-white border border-[#E2E8F0] rounded-lg shadow-sm overflow-hidden">
              <div className="bg-[#1E293B] text-white px-4 py-2 font-bold uppercase text-xs tracking-wider border-b border-[#E2E8F0]">Objective</div>
              <textarea 
                value={soapForm.objective}
                onChange={(e) => setSoapForm({ ...soapForm, objective: e.target.value })}
                placeholder="Vitals, physical examination findings, lab observation inputs..."
                className="flex-1 p-4 w-full h-full resize-none focus:outline-none focus:ring-inset focus:ring-2 focus:ring-[#2563EB] text-[#0F172A]"
              ></textarea>
            </div>
          </div>

          {/* Right Pane: Assessment & Plan */}
          <div className="space-y-6 flex flex-col">
            <div className="flex-1 flex flex-col bg-white border border-[#E2E8F0] rounded-lg shadow-sm overflow-hidden relative">
              <div className="bg-[#1E293B] text-white px-4 py-2 font-bold uppercase text-xs tracking-wider border-b border-[#E2E8F0] flex justify-between items-center">
                <span>Assessment</span>
                <span className="text-[#3B82F6] text-[10px]">AI ICD-10 EXTRACTION ACTIVE</span>
              </div>
              <textarea 
                value={soapForm.assessment}
                onChange={(e) => setSoapForm({ ...soapForm, assessment: e.target.value })}
                placeholder="Differential diagnostics, medical inferences..."
                className="flex-1 p-4 w-full h-full resize-none focus:outline-none focus:ring-inset focus:ring-2 focus:ring-[#2563EB] text-[#0F172A]"
              ></textarea>
            </div>
            
            <div className="flex-1 flex flex-col bg-white border border-[#E2E8F0] rounded-lg shadow-sm overflow-hidden">
              <div className="bg-[#1E293B] text-white px-4 py-2 font-bold uppercase text-xs tracking-wider border-b border-[#E2E8F0]">Plan</div>
              <textarea 
                value={soapForm.plan}
                onChange={(e) => setSoapForm({ ...soapForm, plan: e.target.value })}
                placeholder="Treatment orders, electronic prescriptions, follow-up scheduling..."
                className="flex-1 p-4 w-full h-full resize-none focus:outline-none focus:ring-inset focus:ring-2 focus:ring-[#2563EB] text-[#0F172A]"
              ></textarea>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
