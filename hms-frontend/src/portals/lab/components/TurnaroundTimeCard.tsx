import { Clock, AlertCircle, CheckCircle } from 'lucide-react';

export interface TurnaroundTimeData {
  testName: string;
  targetMinutes: number;
  averageMinutes: number;
  complianceRate: number; // e.g. 0.985 for 98.5%
  totalTests: number;
  overdueCount: number;
}

interface TurnaroundTimeCardProps {
  data: TurnaroundTimeData;
  className?: string;
}

export const TurnaroundTimeCard = ({ data, className = '' }: TurnaroundTimeCardProps) => {
  const isHighCompliance = data.complianceRate >= 0.95;
  const isOverdueAlert = data.overdueCount > 0;
  
  // Calculate percentage for progress bar
  const ratio = (data.averageMinutes / data.targetMinutes) * 100;
  const progressPercent = Math.min(100, ratio);

  return (
    <div className={`card p-5 bg-white border border-slate-200/80 shadow-sm rounded-2xl space-y-4 ${className}`}>
      <div className="flex justify-between items-start gap-4">
        <div>
          <h4 className="font-extrabold text-slate-800 text-sm tracking-tight">{data.testName}</h4>
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mt-0.5">
            SLA SLA Target: {data.targetMinutes} min
          </span>
        </div>

        <div className="text-right">
          <span className={`inline-flex items-center gap-1 text-[10px] font-black uppercase px-2 py-0.5 rounded-lg border ${
            isHighCompliance 
              ? 'bg-emerald-50 text-emerald-700 border-emerald-150' 
              : 'bg-amber-50 text-amber-700 border-amber-150'
          }`}>
            {isHighCompliance ? <CheckCircle className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
            {(data.complianceRate * 100).toFixed(1)}% In SLA
          </span>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-3 gap-2 border-t border-b border-slate-100 py-3 text-xs">
        <div className="text-center">
          <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block">Average Turnaround</span>
          <span className="text-sm font-black text-slate-800 flex items-center justify-center gap-0.5 mt-1">
            <Clock className="h-3.5 w-3.5 text-indigo-500" /> {data.averageMinutes} min
          </span>
        </div>

        <div className="text-center border-l border-r border-slate-100">
          <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block">Total Encoded</span>
          <span className="text-sm font-black text-slate-700 block mt-1">{data.totalTests}</span>
        </div>

        <div className="text-center">
          <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block">Currently Overdue</span>
          <span className={`text-sm font-black block mt-1 ${isOverdueAlert ? 'text-rose-600 animate-pulse font-extrabold' : 'text-slate-500'}`}>
            {data.overdueCount}
          </span>
        </div>
      </div>

      {/* Progress SLA Visual */}
      <div className="space-y-1">
        <div className="flex justify-between items-center text-[9px] text-slate-400 font-bold uppercase tracking-wider">
          <span>Actual TAT Ratio</span>
          <span className={ratio > 100 ? 'text-rose-600 font-extrabold' : 'text-indigo-600'}>
            {ratio.toFixed(0)}% of SLA Limit
          </span>
        </div>
        <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
          <div 
            className={`h-full rounded-full transition-all duration-500 ${
              ratio > 100 
                ? 'bg-rose-500' 
                : ratio > 80 
                  ? 'bg-amber-400' 
                  : 'bg-gradient-to-r from-indigo-500 to-violet-500'
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>
    </div>
  );
};

export default TurnaroundTimeCard;
