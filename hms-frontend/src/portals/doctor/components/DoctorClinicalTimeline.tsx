import { Clock, Calendar } from 'lucide-react';

interface TimelineEvent {
  id: string;
  date: string;
  type: 'OPD Encounter' | 'IPD Encounter' | 'Lab Result' | 'Rx Refill';
  title: string;
  provider: string;
  details: string;
}

interface DoctorClinicalTimelineProps {
  patientId: string;
}

export const DoctorClinicalTimeline = ({ patientId }: DoctorClinicalTimelineProps) => {
  const events: TimelineEvent[] = [
    {
      id: 'EV-01',
      date: '2026-05-10',
      type: 'OPD Encounter',
      title: 'Routine General Medicine Checkup',
      provider: 'Provider 001 (Internal Medicine)',
      details: 'Patient complained of episodic headaches and fatigue. Vitals normal. Advised hydration and follow up.',
    },
    {
      id: 'EV-02',
      date: '2026-04-12',
      type: 'Rx Refill',
      title: 'Medication Refill: Metformin 500mg',
      provider: 'Provider 001 (Internal Medicine)',
      details: 'Refilled prescription for diabetes management. HbA1c checked (6.8%).',
    },
    {
      id: 'EV-03',
      date: '2026-03-01',
      type: 'Lab Result',
      title: 'Lipid Profile & HbA1c Panel',
      provider: 'Provider 002 (Pathologist)',
      details: 'Cholesterol: 198 mg/dL (Normal). HbA1c: 6.8% (Stable). Triglycerides: 145 mg/dL.',
    },
  ];

  return (
    <div data-patient-id={patientId} className="card p-5 bg-white border border-slate-200/80 shadow-sm space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <h3 className="font-bold text-slate-800 text-sm tracking-wider uppercase flex items-center gap-2">
          <Clock className="h-4 w-4 text-indigo-500" />
          Clinical Timeline & History
        </h3>
        <span className="bg-indigo-50 text-indigo-700 text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase">
          {events.length} Events
        </span>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-1.5 text-[10px] text-amber-800 font-semibold">
      </div>

      {/* Timeline items */}
      <div className="relative pl-4 space-y-5 border-l-2 border-slate-100 max-h-[350px] overflow-y-auto pr-1">
        {events.map((event) => (
          <div key={event.id} className="relative group text-xs">
            {/* Dot marker */}
            <div className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full border bg-white border-indigo-500 group-hover:bg-indigo-600 transition-colors" />

            <div className="space-y-1">
              <div className="flex flex-wrap items-center justify-between gap-1.5">
                <span className="bg-slate-100 text-slate-600 text-[9px] font-extrabold px-1.5 py-0.5 rounded uppercase tracking-wider">
                  {event.type}
                </span>
                <span className="text-[10px] text-slate-400 font-semibold flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {event.date}
                </span>
              </div>

              <p className="font-extrabold text-slate-800">{event.title}</p>
              <p className="text-[10px] text-slate-500 font-semibold">{event.provider}</p>
              <p className="text-[11px] text-slate-500 leading-relaxed bg-slate-50/50 p-2 rounded-lg border border-slate-100 mt-1">
                {event.details}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
