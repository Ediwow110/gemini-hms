
import { AlertTriangle, Clock } from "lucide-react";

export const ComingSoon = ({ moduleName }: { moduleName?: string }) => {
  return (
    <div className="space-y-6 pb-12 animate-fade-in flex flex-col items-center justify-center min-h-[60vh]">
      <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mb-4">
        <Clock className="h-10 w-10 text-indigo-500" />
      </div>
      <h1 className="text-3xl font-extrabold text-slate-900" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
        {moduleName || "Module"} Coming Soon
      </h1>
      <p className="text-slate-500 max-w-md text-center">
        This feature is part of a future release phase according to the HMS Production Blueprint. 
        We are prioritizing core patient, billing, and laboratory workflows first.
      </p>
      <div className="mt-8 flex items-center gap-2 p-4 bg-amber-50 text-amber-800 rounded-xl border border-amber-200/60 text-sm font-medium">
        <AlertTriangle className="h-5 w-5 flex-shrink-0" />
        <span>Development delayed to ensure audit, permission, and workflow foundations are stable.</span>
      </div>
    </div>
  );
};
