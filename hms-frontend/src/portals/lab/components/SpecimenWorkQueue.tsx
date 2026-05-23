import { useNavigate } from 'react-router-dom';
import { 
  FlaskConical, 
  ArrowRight, 
  Clock, 
  ShieldAlert 
} from 'lucide-react';
import { LabStatusBadge, LabStatus } from './LabStatusBadge';

export interface SpecimenItem {
  id: string;
  patientName: string;
  mrn: string;
  specimenType: string;
  container: string;
  testName: string;
  collectedTime: string;
  status: LabStatus;
  urgency: 'Routine' | 'STAT';
}

interface SpecimenWorkQueueProps {
  specimens: SpecimenItem[];
  limit?: number;
  className?: string;
}

export const SpecimenWorkQueue = ({ specimens, limit, className = '' }: SpecimenWorkQueueProps) => {
  const navigate = useNavigate();
  const displayItems = limit ? specimens.slice(0, limit) : specimens;

  return (
    <div className={`card p-5 bg-white border border-slate-200/80 shadow-sm rounded-2xl space-y-4 ${className}`}>
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <h3 className="font-bold text-slate-800 text-sm tracking-wider uppercase flex items-center gap-2">
          <FlaskConical className="h-4.5 w-4.5 text-indigo-500" />
          Specimen Worklist Queue
        </h3>
        <button 
          onClick={() => navigate('/lab/specimens')}
          className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-0.5"
        >
          View All Specimens <ArrowRight className="h-4 w-4" />
        </button>
      </div>

      <div className="divide-y divide-slate-100">
        {displayItems.length === 0 ? (
          <div className="text-center py-10 text-slate-400 font-semibold text-xs">
            No specimens currently in this branch queue.
          </div>
        ) : (
          displayItems.map((item) => (
            <div key={item.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-black text-slate-800 text-sm">{item.patientName}</span>
                  <span className="text-[10px] font-mono text-slate-400">MRN: {item.mrn}</span>
                  {item.urgency === 'STAT' && (
                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-rose-50 text-rose-700 font-extrabold text-[9px] border border-rose-150 animate-pulse">
                      <ShieldAlert className="h-3 w-3" /> STAT
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-slate-500 font-semibold">
                  <span className="font-bold text-slate-600">{item.testName}</span>
                  <span>•</span>
                  <span>{item.specimenType} ({item.container})</span>
                  <span>•</span>
                  <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> Collected: {item.collectedTime}</span>
                </div>
              </div>

              <div className="flex items-center gap-3.5 justify-between sm:justify-end">
                <LabStatusBadge status={item.status} />

                {item.status === 'Collected' && (
                  <button
                    onClick={() => navigate(`/lab/specimens?id=${item.id}`)}
                    className="btn border border-slate-200 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 px-3.5 py-1.5 text-[11px] font-extrabold rounded-xl shadow-sm transition-all"
                  >
                    Receive Sample
                  </button>
                )}

                {item.status === 'Received' && (
                  <button
                    onClick={() => navigate(`/lab/encoding?id=${item.id}`)}
                    className="btn border border-slate-200 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 px-3.5 py-1.5 text-[11px] font-extrabold rounded-xl shadow-sm transition-all"
                  >
                    Encode Result
                  </button>
                )}

                {item.status === 'Encoded' && (
                  <button
                    onClick={() => navigate(`/lab/validation?id=${item.id}`)}
                    className="btn border border-slate-200 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 px-3.5 py-1.5 text-[11px] font-extrabold rounded-xl shadow-sm transition-all"
                  >
                    Validate
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default SpecimenWorkQueue;
