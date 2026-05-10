import { Check } from "lucide-react";

export const LabResultFlagBadge = ({ flag }: { flag: 'Normal' | 'High' | 'Low' | 'Critical' }) => {
  const styles = {
    Normal: "bg-slate-50 text-slate-600 border border-slate-200/60",
    High: "bg-amber-50 text-amber-700 border border-amber-200/60",
    Low: "bg-blue-50 text-blue-700 border border-blue-200/60",
    Critical: "bg-rose-600 text-white font-bold animate-alert-pulse shadow-sm shadow-rose-200",
  };
  return <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] uppercase font-bold ${styles[flag]}`}>{flag}</span>;
};

export const WorkflowTimeline = ({ currentStep }: { currentStep: number }) => {
  const steps = ["Ordered", "Collected", "Received", "Encoded", "Approved", "Released"];
  return (
    <div className="flex items-center justify-between py-5 px-2 border-b border-slate-100 mb-4">
      {steps.map((step, idx) => (
        <div key={step} className="flex flex-col items-center relative">
          {/* Connector line */}
          {idx < steps.length - 1 && (
            <div className={`absolute top-[11px] left-[50%] w-[calc(100%+2rem)] h-0.5 ${
              idx < currentStep ? "bg-gradient-to-r from-indigo-500 to-indigo-400" : "bg-slate-200"
            }`} />
          )}
          {/* Step dot */}
          <div className={`relative z-10 w-6 h-6 rounded-full mb-2 flex items-center justify-center transition-all duration-300 ${
            idx <= currentStep 
              ? "bg-gradient-to-br from-indigo-500 to-violet-500 shadow-md shadow-indigo-200/50" 
              : "bg-slate-200"
          }`}>
            {idx < currentStep ? (
              <Check className="h-3 w-3 text-white" />
            ) : idx === currentStep ? (
              <div className="w-2 h-2 bg-white rounded-full" />
            ) : null}
          </div>
          <span className={`text-[10px] font-bold uppercase tracking-wider ${
            idx <= currentStep ? "text-indigo-600" : "text-slate-400"
          }`}>{step}</span>
        </div>
      ))}
    </div>
  );
};
