import React from 'react';
import { LucideIcon } from 'lucide-react';

interface PatientTimelineEventProps {
  type: string;
  title: string;
  timestamp: string;
  details: string;
  icon: LucideIcon;
  color: string;
  restricted?: boolean;
  isMock?: boolean;
}

export const PatientTimelineEvent: React.FC<PatientTimelineEventProps> = ({ type, title, timestamp, details, icon: Icon, color, restricted, isMock }) => {
  return (
    <div className="flex gap-4">
      <div className="flex flex-col items-center">
        <div className={`h-10 w-10 rounded-xl flex items-center justify-center border ${color}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="w-px h-full bg-slate-200 mt-2" />
      </div>
      <div className="pb-8 flex-1">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[9px] font-black px-2 py-0.5 rounded-lg bg-slate-100 text-slate-500 uppercase">{type}</span>
          <span className="text-[10px] text-slate-400 font-bold">{timestamp}</span>
        </div>
        <h4 className="text-sm font-black text-slate-800">
          {title}
          {isMock && <span className="ml-2 text-[9px] font-black bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">MOCK</span>}
        </h4>
        {restricted ? (
          <p className="text-[10px] text-amber-600 font-bold mt-1 flex items-center gap-1">
            Internal note — not visible to patient
          </p>
        ) : (
          <p className="text-xs text-slate-500 mt-1">{details}</p>
        )}
      </div>
    </div>
  );
};

export default PatientTimelineEvent;
