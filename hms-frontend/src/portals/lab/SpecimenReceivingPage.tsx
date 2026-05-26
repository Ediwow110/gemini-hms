import { useState, useCallback } from 'react';
import { PageHeader } from '../../components/ui/page-header';
import { usePendingSpecimens } from '../../hooks/use-lab';
import {
  FlaskConical,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Loader2,
  ArrowRight,
} from 'lucide-react';

export const SpecimenReceivingPage = () => {
  const { specimens, isLoading, error, receiveSpecimen } = usePendingSpecimens();
  const [receivingId, setReceivingId] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleReceive = useCallback(async (id: string) => {
    setReceivingId(id);
    setSuccessMsg(null);
    try {
      await receiveSpecimen(id);
      setSuccessMsg(`Specimen received and logged successfully.`);
    } catch {
      setSuccessMsg(null);
    } finally {
      setReceivingId(null);
    }
  }, [receiveSpecimen]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Mock/WIP Warning Banner */}
      <div className="p-4 bg-amber-50 border border-amber-150 rounded-2xl flex gap-3 text-xs text-amber-800">
        <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
        <div>
          <h5 className="font-extrabold uppercase text-[10px] tracking-wider">Specimen Receiving (Partial — Real)</h5>
          <p className="font-medium mt-0.5">
            Specimen intake from collected orders is backed by the real API. Full LIS specimen tracking, barcoding, and analyzer integration remain out of scope.
          </p>
        </div>
      </div>

      <PageHeader
        title="Specimen Receiving Desk"
        description="Receive and register collected lab specimens into the LIS processing pipeline."
      />

      {successMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-semibold flex items-center gap-2">
          <CheckCircle className="h-4 w-4 text-emerald-600" />
          {successMsg}
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-semibold flex items-center gap-2">
          <XCircle className="h-4 w-4 text-rose-600" />
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="card p-12 bg-white border border-slate-200/80 shadow-sm rounded-2xl text-center space-y-3">
          <Loader2 className="h-8 w-8 text-indigo-500 mx-auto animate-spin" />
          <p className="text-sm font-semibold text-slate-500 animate-pulse">Loading pending specimens...</p>
        </div>
      ) : specimens.length === 0 ? (
        <div className="card p-12 bg-white border border-slate-200/80 shadow-sm rounded-2xl text-center space-y-3">
          <CheckCircle className="h-8 w-8 text-emerald-400 mx-auto" />
          <p className="text-sm font-semibold text-slate-600">No pending specimens to receive</p>
          <p className="text-xs text-slate-400">All collected specimens have been logged into the system.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* List */}
          <div className="space-y-4">
            <div className="card p-5 bg-white border border-slate-200/80 shadow-sm rounded-2xl">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-3 flex items-center gap-1.5">
                <FlaskConical className="h-4.5 w-4.5 text-indigo-500" />
                Pending Intake ({specimens.length})
              </h3>

              <div className="divide-y divide-slate-100 mt-2">
                {specimens.map((s) => (
                  <div
                    key={s.id}
                    className="py-3 px-3 rounded-xl transition-all text-xs flex justify-between items-center gap-3 mt-1"
                  >
                    <div className="space-y-1">
                      <h4 className="font-black text-slate-800">{s.patientName}</h4>
                      <p className="text-[10px] text-slate-400 font-bold uppercase">{s.testNames?.join(', ') || s.specimenType}</p>
                      <div className="flex items-center gap-2 text-[10px] text-slate.500 font-medium">
                        <span>{s.specimenType}</span>
                        <span>•</span>
                        <span className="font-mono">{s.orderNumber}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleReceive(s.id)}
                      disabled={receivingId === s.id}
                      className="btn bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-extrabold px-3 py-1.5 rounded-xl flex items-center gap-1 shrink-0 disabled:opacity-50"
                    >
                      {receivingId === s.id ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <ArrowRight className="h-3 w-3" />
                      )}
                      Receive
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Details Area */}
          <div className="lg:col-span-2">
            <div className="card p-6 bg-white border border-slate-200/80 shadow-sm rounded-2xl space-y-6">
              <p className="text-xs text-slate-400 font-semibold text-center py-12">
                Select a specimen from the pending list to view details, or click "Receive" to log it directly.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SpecimenReceivingPage;
