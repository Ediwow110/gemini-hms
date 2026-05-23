import { CheckCircle2, Play, Circle, Calendar } from 'lucide-react';

export interface MovementStep {
  id: string;
  label: string;
  description: string;
  time?: string;
  status: 'completed' | 'active' | 'pending';
}

interface PatientMovementTimelineProps {
  steps: MovementStep[];
  patientName: string;
  mrn: string;
  className?: string;
}

export const PatientMovementTimeline = ({ steps, patientName, mrn, className = '' }: PatientMovementTimelineProps) => {
  return (
    <div className={`card p-5 bg-white border border-slate-200/80 shadow-sm space-y-5 ${className}`}>
      <div className="flex justify-between items-start border-b border-slate-100 pb-3">
        <div>
          <h3 className="font-bold text-slate-800 text-sm tracking-wider uppercase flex items-center gap-2">
            <Calendar className="h-4 w-4 text-indigo-500" />
            Patient Flow Tracking
          </h3>
          <p className="text-[10px] font-semibold text-slate-400 mt-0.5">{patientName} • {mrn}</p>
        </div>
      </div>

      <div className="relative pl-6 space-y-6">
        {/* Continuous background line */}
        <div className="absolute left-2.5 top-1.5 bottom-1.5 w-[2px] bg-slate-100" />

        {steps.map((step) => {
          const isCompleted = step.status === 'completed';
          const isActive = step.status === 'active';

          return (
            <div key={step.id} className="relative group flex gap-4 text-xs">
              {/* Status node markers */}
              <div className="absolute -left-6 top-0.5 flex items-center justify-center">
                {isCompleted ? (
                  <div className="bg-emerald-50 text-emerald-600 rounded-full p-0.5 border border-emerald-200 z-10 transition-transform group-hover:scale-110">
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                ) : isActive ? (
                  <div className="bg-indigo-50 text-indigo-600 rounded-full p-1 border border-indigo-200 z-10 animate-pulse">
                    <Play className="h-2.5 w-2.5" />
                  </div>
                ) : (
                  <div className="bg-white text-slate-300 rounded-full p-1 border border-slate-200 z-10">
                    <Circle className="h-2.5 w-2.5 fill-slate-100" />
                  </div>
                )}
              </div>

              {/* Step content wrapper */}
              <div className="flex-1 space-y-1">
                <div className="flex justify-between items-start">
                  <h4 className={`font-bold ${
                    isCompleted 
                      ? 'text-slate-500 line-through' 
                      : isActive 
                        ? 'text-indigo-700 font-extrabold text-[13px]' 
                        : 'text-slate-700'
                  }`}>
                    {step.label}
                  </h4>
                  {step.time && (
                    <span className="font-mono text-[10px] text-slate-400 font-semibold">{step.time}</span>
                  )}
                </div>
                <p className={`text-[11px] leading-relaxed ${
                  isCompleted 
                    ? 'text-slate-400' 
                    : isActive 
                      ? 'text-slate-600 font-medium' 
                      : 'text-slate-400'
                }`}>
                  {step.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PatientMovementTimeline;
