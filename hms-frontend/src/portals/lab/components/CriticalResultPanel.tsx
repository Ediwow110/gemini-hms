import { useNavigate } from 'react-router-dom';
import { ShieldAlert, PhoneCall, CheckCircle, ArrowRight, User } from 'lucide-react';

export interface CriticalResultItem {
  id: string;
  patientName: string;
  mrn: string;
  testName: string;
  parameterName: string;
  value: string;
  refRange: string;
  physicianName: string;
  physicianPhone: string;
  reportedAt: string;
  isNotified: boolean;
  notifiedTime?: string;
}

interface CriticalResultPanelProps {
  items: CriticalResultItem[];
  onAcknowledge?: (id: string) => void;
  className?: string;
}

export const CriticalResultPanel = ({ items, onAcknowledge, className = '' }: CriticalResultPanelProps) => {
  const navigate = useNavigate();

  return (
    <div className={`card p-5 bg-rose-50/40 border border-rose-100/90 shadow-sm rounded-2xl space-y-4 ${className}`}>
      <div className="flex items-center justify-between border-b border-rose-100 pb-3">
        <h3 className="font-bold text-rose-800 text-sm tracking-wider uppercase flex items-center gap-2">
          <ShieldAlert className="h-4.5 w-4.5 text-rose-600 animate-pulse" />
          Critical Alert Action Panel
        </h3>
        <button 
          onClick={() => navigate('/lab/critical-results')}
          className="text-xs font-bold text-rose-700 hover:text-rose-800 flex items-center gap-0.5"
        >
          View Alert Logs <ArrowRight className="h-4 w-4" />
        </button>
      </div>

      <div className="space-y-3.5">
        {items.length === 0 ? (
          <div className="text-center py-8 text-slate-400 font-semibold text-xs bg-white rounded-xl border border-slate-100">
            No active critical alerts pending physician contact.
          </div>
        ) : (
          items.map((alert) => (
            <div key={alert.id} className="bg-white border border-rose-200/60 p-4 rounded-2xl flex flex-col md:flex-row justify-between gap-4 text-xs">
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-black text-slate-800 text-sm">{alert.patientName}</span>
                  <span className="text-[10px] font-mono text-slate-400">MRN: {alert.mrn}</span>
                  <span className="bg-rose-100 text-rose-700 text-[9px] font-black px-2 py-0.5 rounded-full select-none">
                    Immediate Action
                  </span>
                </div>

                <div className="p-2.5 bg-rose-50/50 rounded-xl border border-rose-100 space-y-1">
                  <p className="text-rose-700 font-bold">
                    {alert.testName} - {alert.parameterName}: <strong className="text-sm underline">{alert.value}</strong>
                  </p>
                  <p className="text-[10px] text-slate-400 font-medium">Reference range: {alert.refRange}</p>
                </div>

                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-slate-500 font-semibold">
                  <span className="flex items-center gap-1"><User className="h-3.5 w-3.5 text-slate-400" /> Physician: {alert.physicianName}</span>
                  <span>•</span>
                  <span>Validated: {alert.reportedAt}</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row md:flex-col items-stretch justify-center gap-2 md:w-56">
                {!alert.isNotified ? (
                  <>
                    <a
                      href={`tel:${alert.physicianPhone}`}
                      className="btn bg-rose-600 hover:bg-rose-750 text-white text-[11px] font-extrabold px-3 py-2 rounded-xl text-center flex items-center justify-center gap-1.5 shadow-sm shadow-rose-200"
                    >
                      <PhoneCall className="h-3.5 w-3.5" /> Call Dr. {alert.physicianName.split(' ').pop()}
                    </a>
                    <button
                      onClick={() => onAcknowledge?.(alert.id)}
                      className="btn border border-slate-200 hover:bg-slate-50 hover:text-slate-800 text-[11px] font-extrabold px-3 py-2 rounded-xl text-center flex items-center justify-center gap-1.5 transition-colors"
                    >
                      Document Call Contact
                    </button>
                  </>
                ) : (
                  <div className="bg-emerald-50 border border-emerald-100/60 p-3 rounded-xl flex items-center justify-center gap-2 text-emerald-800 font-bold text-center">
                    <CheckCircle className="h-4.5 w-4.5 text-emerald-600" />
                    <div className="text-left">
                      <p className="text-[10px] uppercase font-extrabold leading-none">Physician Contacted</p>
                      <p className="text-[9px] text-emerald-600 font-medium mt-0.5">{alert.notifiedTime}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default CriticalResultPanel;
