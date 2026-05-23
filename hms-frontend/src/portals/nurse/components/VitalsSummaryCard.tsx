import { Heart, Thermometer, Wind, Activity, AlertCircle } from 'lucide-react';

interface VitalsData {
  bpSystolic: number;
  bpDiastolic: number;
  temperature: number; // in Celcius
  pulse: number; // bpm
  respiration: number; // breaths/min
}

interface VitalsSummaryCardProps {
  vitals: VitalsData;
  className?: string;
}

export const VitalsSummaryCard = ({ vitals, className = '' }: VitalsSummaryCardProps) => {
  // Safe physiological thresholds
  const alerts = {
    fever: vitals.temperature >= 38.0 || vitals.temperature < 35.5,
    tachycardia: vitals.pulse > 100 || vitals.pulse < 60,
    hypertension: vitals.bpSystolic >= 140 || vitals.bpDiastolic >= 90 || vitals.bpSystolic < 90,
    tachypnea: vitals.respiration > 20 || vitals.respiration < 12,
  };

  const getStatusBorder = () => {
    const activeAlertsCount = Object.values(alerts).filter(Boolean).length;
    if (activeAlertsCount >= 2) return 'border-rose-200 bg-rose-50/10';
    if (activeAlertsCount === 1) return 'border-amber-200 bg-amber-50/10';
    return 'border-slate-200/80 bg-white';
  };

  return (
    <div className={`card p-5 border shadow-sm rounded-2xl space-y-4 ${getStatusBorder()} ${className}`}>
      <div className="flex justify-between items-center border-b border-slate-100 pb-3">
        <h4 className="font-bold text-slate-700 text-xs tracking-wider uppercase flex items-center gap-1.5 select-none">
          <Activity className="h-4 w-4 text-indigo-500" />
          Recorded Vital Signs
        </h4>
        {Object.values(alerts).some(Boolean) && (
          <span className="flex items-center gap-1 text-[10px] font-extrabold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-lg border border-rose-100 animate-pulse">
            <AlertCircle className="h-3 w-3" />
            Physiological Alarm
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
        {/* Blood Pressure */}
        <div className={`p-3.5 rounded-2xl border transition-all duration-200 ${
          alerts.hypertension 
            ? 'bg-rose-50/40 border-rose-100 text-rose-900 shadow-sm shadow-rose-100/20' 
            : 'bg-slate-50/50 border-slate-100 text-slate-700 hover:bg-slate-50'
        }`}>
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">BP</span>
            <Activity className={`h-4 w-4 ${alerts.hypertension ? 'text-rose-500' : 'text-slate-400'}`} />
          </div>
          <p className="text-base font-black mt-1.5">{vitals.bpSystolic}/{vitals.bpDiastolic}</p>
          <span className="text-[9px] text-slate-400 font-semibold block mt-0.5">mmHg</span>
        </div>

        {/* Temperature */}
        <div className={`p-3.5 rounded-2xl border transition-all duration-200 ${
          alerts.fever 
            ? 'bg-rose-50/40 border-rose-100 text-rose-900 shadow-sm shadow-rose-100/20' 
            : 'bg-slate-50/50 border-slate-100 text-slate-700 hover:bg-slate-50'
        }`}>
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Temp</span>
            <Thermometer className={`h-4 w-4 ${alerts.fever ? 'text-rose-500' : 'text-slate-400'}`} />
          </div>
          <p className="text-base font-black mt-1.5">{vitals.temperature.toFixed(1)}°C</p>
          <span className="text-[9px] text-slate-400 font-semibold block mt-0.5">
            {vitals.temperature >= 38.0 ? 'Fever' : vitals.temperature < 35.5 ? 'Hypothermia' : 'Normal'}
          </span>
        </div>

        {/* Pulse */}
        <div className={`p-3.5 rounded-2xl border transition-all duration-200 ${
          alerts.tachycardia 
            ? 'bg-rose-50/40 border-rose-100 text-rose-900 shadow-sm shadow-rose-100/20' 
            : 'bg-slate-50/50 border-slate-100 text-slate-700 hover:bg-slate-50'
        }`}>
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pulse</span>
            <Heart className={`h-4 w-4 ${alerts.tachycardia ? 'text-rose-500 animate-pulse' : 'text-slate-400'}`} />
          </div>
          <p className="text-base font-black mt-1.5">{vitals.pulse}</p>
          <span className="text-[9px] text-slate-400 font-semibold block mt-0.5">bpm</span>
        </div>

        {/* Respiration */}
        <div className={`p-3.5 rounded-2xl border transition-all duration-200 ${
          alerts.tachypnea 
            ? 'bg-rose-50/40 border-rose-100 text-rose-900 shadow-sm shadow-rose-100/20' 
            : 'bg-slate-50/50 border-slate-100 text-slate-700 hover:bg-slate-50'
        }`}>
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Resp Rate</span>
            <Wind className={`h-4 w-4 ${alerts.tachypnea ? 'text-rose-500' : 'text-slate-400'}`} />
          </div>
          <p className="text-base font-black mt-1.5">{vitals.respiration}</p>
          <span className="text-[9px] text-slate-400 font-semibold block mt-0.5">/min</span>
        </div>


      </div>
    </div>
  );
};

export default VitalsSummaryCard;
