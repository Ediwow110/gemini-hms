import { useState, useCallback } from 'react';
import { HmsPageHeader } from '../../components/hms-page';
import { HmsAuditFooter } from '../../components/hms-dashboard';
import { usePendingSpecimens } from '../../hooks/use-lab';
import {
  FlaskConical,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Loader2,
  ArrowRight,
  ClipboardList,
} from 'lucide-react';
import { format } from 'date-fns';

export const SpecimenReceivingPage = () => {
  const { specimens, isLoading, error, receiveSpecimen } = usePendingSpecimens();
  const [receivingId, setReceivingId] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [selectedSpecimenId, setSelectedSpecimenId] = useState<string | null>(null);

  const selectedSpecimen = specimens.find(s => s.id === selectedSpecimenId) || null;

  const handleReceive = useCallback(async (id: string) => {
    setReceivingId(id);
    setSuccessMsg(null);
    try {
      await receiveSpecimen(id);
      setSuccessMsg(`Specimen received and logged successfully.`);
      if (selectedSpecimenId === id) {
        setSelectedSpecimenId(null);
      }
    } catch {
      setSuccessMsg(null);
    } finally {
      setReceivingId(null);
    }
  }, [receiveSpecimen, selectedSpecimenId]);

  return (
    <div className="space-y-4 animate-fade-in font-sans">
      {/* Mock/WIP Warning Banner */}
      <div className="p-3 bg-amber-50/20 border border-amber-100 rounded-lg flex gap-2.5 text-[12px] text-amber-800">
        <AlertTriangle className="h-4.5 w-4.5 text-amber-600 mt-0.5 flex-shrink-0" />
        <div>
          <h5 className="font-extrabold uppercase text-[10px] tracking-wider font-sans">Specimen Receiving (Partial — Real)</h5>
          <p className="font-medium mt-0.5 leading-normal">
            Specimen intake from collected orders is backed by the real API. Full LIS specimen tracking, barcoding, and analyzer integration remain out of scope.
          </p>
        </div>
      </div>

      <HmsPageHeader
        title="Specimen Receiving Desk"
        description="Receive and register collected lab specimens into the LIS processing pipeline."
        badge="LIS Lab Intake"
      />

      {successMsg && (
        <div className="p-2.5 bg-emerald-50 border border-emerald-250 rounded-lg text-[12px] text-emerald-800 font-semibold flex items-center gap-2">
          <CheckCircle className="h-4 w-4 text-emerald-600" />
          {successMsg}
        </div>
      )}

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-[12px] text-rose-700 font-semibold flex items-center gap-2">
          <XCircle className="h-4 w-4 text-rose-600" />
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="bg-white border border-slate-200 shadow-sm rounded-lg p-10 text-center space-y-2">
          <Loader2 className="h-6 w-6 text-blue-600 mx-auto animate-spin" />
          <p className="text-[12px] font-semibold text-slate-500 animate-pulse">Loading pending specimens...</p>
        </div>
      ) : specimens.length === 0 ? (
        <div className="bg-white border border-slate-200 shadow-sm rounded-lg p-10 text-center space-y-2 flex flex-col items-center">
          <CheckCircle className="h-7 w-7 text-emerald-500" />
          <p className="text-[12px] font-bold text-slate-700">No pending specimens to receive</p>
          <p className="text-[11px] text-slate-400">All collected specimens have been registered.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* List */}
          <div className="space-y-3">
            <div className="bg-white border border-slate-200 shadow-sm rounded-lg p-4 space-y-3">
              <h3 className="text-[11px] font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2 flex items-center gap-1.5">
                <FlaskConical className="h-4 w-4 text-blue-500" />
                Pending Intake ({specimens.length})
              </h3>

              <div className="space-y-1.5 divide-y divide-slate-100/50 max-h-[500px] overflow-y-auto pr-1">
                {specimens.map((s) => {
                  const isActive = s.id === selectedSpecimenId;
                  return (
                    <div
                      key={s.id}
                      onClick={() => setSelectedSpecimenId(s.id)}
                      className={`pt-2 pb-2 px-2.5 rounded-lg transition-all text-[12px] flex justify-between items-center gap-3 cursor-pointer border ${
                        isActive 
                          ? 'bg-slate-900 border-slate-900 text-white shadow-sm'
                          : 'bg-white border-transparent hover:bg-slate-50 hover:border-slate-200 text-slate-700'
                      }`}
                    >
                      <div className="space-y-0.5 min-w-0 flex-1">
                        <h4 className={`font-bold truncate ${isActive ? 'text-white' : 'text-slate-900'}`}>{s.patientName}</h4>
                        <p className={`text-[10px] font-bold uppercase truncate ${isActive ? 'text-slate-350' : 'text-slate-450'}`}>{s.testNames?.join(', ') || s.specimenType}</p>
                        <div className={`flex items-center gap-1.5 text-[10px] font-mono ${isActive ? 'text-slate-400' : 'text-slate-400'}`}>
                          <span>{s.specimenType}</span>
                          <span>•</span>
                          <span className="font-bold">{s.orderNumber}</span>
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleReceive(s.id);
                        }}
                        disabled={receivingId === s.id}
                        className="bg-blue-650 hover:bg-blue-755 text-white text-[10px] font-bold px-2 py-1 rounded-md flex items-center gap-1 shrink-0 disabled:opacity-50 cursor-pointer"
                      >
                        {receivingId === s.id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <ArrowRight className="h-3 w-3" />
                        )}
                        Receive
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Details Area */}
          <div className="lg:col-span-2">
            {!selectedSpecimen ? (
              <div className="bg-white border border-slate-200 shadow-sm rounded-lg p-10 text-center space-y-2 flex flex-col items-center justify-center min-h-[200px]">
                <ClipboardList className="h-7 w-7 text-slate-300" />
                <h4 className="text-[12px] font-bold text-slate-700">No Specimen Selected</h4>
                <p className="text-[11px] text-slate-455 max-w-xs leading-normal">
                  Select a specimen from the pending list to view details and perform registered logging operations.
                </p>
              </div>
            ) : (
              <div className="bg-white border border-slate-200 shadow-sm rounded-lg p-5 space-y-4">
                <div className="border-b border-slate-100 pb-3 flex justify-between items-start">
                  <div>
                    <h3 className="text-[13px] font-bold text-slate-900 uppercase tracking-tight">Specimen Intake Receipt</h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">Order identifier: <span className="font-mono font-bold text-slate-700">{selectedSpecimen.orderNumber}</span></p>
                  </div>
                  <span className="bg-blue-50 border border-blue-150 text-blue-700 font-bold text-[10px] px-2 py-0.5 rounded-lg font-mono">
                    ID: {selectedSpecimen.id.slice(0, 8)}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[12px]">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Patient Demographics</span>
                    <p className="font-bold text-slate-900">{selectedSpecimen.patientName}</p>
                    <p className="text-[11px] text-slate-550 font-mono">MRN: {selectedSpecimen.patientMrn}</p>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Specimen Details</span>
                    <p className="font-bold text-slate-900">{selectedSpecimen.specimenType}</p>
                    <p className="text-[11px] text-slate-550 font-sans">Mode: {selectedSpecimen.collectionMode || 'Standard'}</p>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Collected Date/Time</span>
                    <p className="font-bold text-slate-750 font-mono">
                      {selectedSpecimen.collectedAt ? format(new Date(selectedSpecimen.collectedAt), 'yyyy-MM-dd HH:mm:ss') : 'N/A'}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Tests Requested</span>
                    <div className="flex flex-wrap gap-1 mt-0.5">
                      {selectedSpecimen.testNames && selectedSpecimen.testNames.length > 0 ? (
                        selectedSpecimen.testNames.map((name, i) => (
                          <span key={i} className="bg-slate-100 text-slate-750 text-[10px] font-semibold px-2 py-0.5 rounded-lg border border-slate-200">
                            {name}
                          </span>
                        ))
                      ) : (
                        <span className="text-slate-400 text-[11px] italic">No test codes defined</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-3 flex justify-end">
                  <button
                    onClick={() => handleReceive(selectedSpecimen.id)}
                    disabled={receivingId === selectedSpecimen.id}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] px-4 py-1.5 rounded-lg flex items-center gap-1.5 shadow-sm cursor-pointer"
                  >
                    {receivingId === selectedSpecimen.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <CheckCircle className="h-3.5 w-3.5" />
                    )}
                    Log Specimen Receipt
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <HmsAuditFooter dataSource="Laboratory LIS Service" lastRefreshed={new Date()} />
    </div>
  );
};

export default SpecimenReceivingPage;
