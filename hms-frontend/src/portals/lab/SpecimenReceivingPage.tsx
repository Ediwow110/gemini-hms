import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PageHeader } from '../../components/ui/page-header';
import { 
  FlaskConical, 
  Barcode, 
  CheckCircle, 
  XCircle, 
  User, 
  Clock, 
  Tag, 
  AlertTriangle
} from 'lucide-react';

interface SpecimenQueueItem {
  id: string;
  patientName: string;
  mrn: string;
  specimenType: string;
  container: string;
  testName: string;
  collectedTime: string;
  collectorName: string;
  volume: string;
  status: 'Collected' | 'Received' | 'Rejected';
  rejectReason?: string;
}

const mockSpecimens: SpecimenQueueItem[] = [
  {
    id: 'SPC-01',
    patientName: 'Victor Frankenstein',
    mrn: 'MRN-2026-0810',
    specimenType: 'Whole Blood',
    container: 'Lavender Top (EDTA)',
    testName: 'Complete Blood Count (CBC)',
    collectedTime: 'Today, 08:45 AM',
    collectorName: 'Nurse Jane Doe',
    volume: '4.0 mL',
    status: 'Collected'
  },
  {
    id: 'SPC-02',
    patientName: 'Arthur Pendleton',
    mrn: 'MRN-2026-0042',
    specimenType: 'Random Urine',
    container: 'Sterile Urine Cup',
    testName: 'Urinalysis (UA)',
    collectedTime: 'Today, 08:30 AM',
    collectorName: 'Nurse Jane Doe',
    volume: '30 mL',
    status: 'Collected'
  },
  {
    id: 'SPC-03',
    patientName: 'Eleanor Vance',
    mrn: 'MRN-2026-0091',
    specimenType: 'Venous Blood',
    container: 'Red Top (Serum Clot)',
    testName: 'Basic Metabolic Panel (BMP)',
    collectedTime: 'Today, 08:15 AM',
    collectorName: 'Nurse Jane Doe',
    volume: '5.0 mL',
    status: 'Collected'
  }
];

export const SpecimenReceivingPage = () => {
  const [searchParams] = useSearchParams();
  const initialId = searchParams.get('id') || '';
  
  const [queue, setQueue] = useState<SpecimenQueueItem[]>(mockSpecimens);
  const [selectedId, setSelectedId] = useState<string>(initialId || mockSpecimens[0]?.id || '');
  const [rejectMode, setRejectMode] = useState(false);
  const [rejectReasonText, setRejectReasonText] = useState('');

  const selectedItem = queue.find(x => x.id === selectedId) || queue[0];

  const handleReceive = (id: string) => {
    alert(`Specimen ${id} has been accepted, registered, and status set to Received.`);
    setQueue(queue.map(q => q.id === id ? { ...q, status: 'Received' } : q));
  };

  const handleRejectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectReasonText.trim()) return;

    setQueue(queue.map(q => q.id === selectedId ? { ...q, status: 'Rejected', rejectReason: rejectReasonText } : q));
    alert(`Specimen rejected: "${rejectReasonText}". Triggered auto redraw request for nurse queue.`);
    setRejectMode(false);
    setRejectReasonText('');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Mock/WIP Warning Banner */}
      <div className="p-4 bg-amber-50 border border-amber-150 rounded-2xl flex gap-3 text-xs text-amber-800">
        <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
        <div>
          <h5 className="font-extrabold uppercase text-[10px] tracking-wider">Specimen Receiving (WIP/Mock)</h5>
          <p className="font-medium mt-0.5">
            This receiving desk is currently running in demo mode with simulated specimens. Integration with the real LIS inventory and specimen registry is pending.
          </p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <PageHeader 
          title="Specimen Receiving Desk" 
          description="Log and scan incoming clinical biosamples, inspect label alignment, check volume sufficiency, and register tubes into LIS processing." 
        />
        
        <div className="text-[10px] font-black uppercase text-indigo-700 bg-indigo-50 border border-indigo-150 px-3.5 py-1.5 rounded-xl select-none">
          LIS Log-in Terminal
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Intake List */}
        <div className="space-y-4">
          <div className="card p-5 bg-white border border-slate-200/80 shadow-sm rounded-2xl">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-3 flex items-center gap-1.5">
              <FlaskConical className="h-4.5 w-4.5 text-indigo-500" />
              Intake Log-in Queue
            </h3>
            
            <div className="divide-y divide-slate-100 mt-2">
              {queue.map(q => (
                <div
                  key={q.id}
                  onClick={() => {
                    setSelectedId(q.id);
                    setRejectMode(false);
                  }}
                  className={`py-3.5 px-3 rounded-xl border transition-all cursor-pointer text-xs flex justify-between items-center gap-3 mt-1.5 ${
                    selectedId === q.id 
                      ? 'border-indigo-500 bg-indigo-50/20 shadow-sm' 
                      : 'border-transparent hover:bg-slate-50/50'
                  }`}
                >
                  <div className="space-y-1">
                    <h4 className="font-black text-slate-800">{q.patientName}</h4>
                    <p className="text-[10px] text-slate-400 font-bold uppercase">{q.testName}</p>
                    <div className="flex items-center gap-2 text-[10px] text-slate.500 font-medium">
                      <span>{q.specimenType}</span>
                      <span>•</span>
                      <span>{q.id}</span>
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end gap-1">
                    <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                      q.status === 'Received' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                      q.status === 'Rejected' ? 'bg-rose-50 text-rose-700 border border-rose-100' :
                      'bg-amber-50 text-amber-700 border border-amber-100 animate-pulse'
                    }`}>
                      {q.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Receiving Workspace */}
        <div className="lg:col-span-2 space-y-4">
          {selectedItem ? (
            <div className="card p-6 bg-white border border-slate-200/80 shadow-sm rounded-2xl space-y-6">
              
              <div className="flex justify-between items-start border-b border-slate-100 pb-4">
                <div>
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Specimen ID</span>
                  <span className="text-sm font-black text-slate-800 font-mono flex items-center gap-1.5 mt-0.5">
                    <Barcode className="h-4.5 w-4.5 text-indigo-500" />
                    {selectedItem.id}
                  </span>
                </div>

                <div className="text-right">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Patient MRN</span>
                  <span className="text-sm font-black text-slate-850 font-mono mt-0.5 block">{selectedItem.mrn}</span>
                </div>
              </div>

              {/* Patient and Collector Info Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="p-4 bg-slate-50 border border-slate-200/60 rounded-xl space-y-2">
                  <h4 className="font-extrabold text-slate-450 uppercase text-[10px] tracking-wider">Patient Details</h4>
                  <p className="font-black text-slate-800">{selectedItem.patientName}</p>
                  <p className="text-slate.500 font-semibold">Test panel: {selectedItem.testName}</p>
                </div>

                <div className="p-4 bg-slate-50 border border-slate-200/60 rounded-xl space-y-2">
                  <h4 className="font-extrabold text-slate-450 uppercase text-[10px] tracking-wider">Specimen Metadata</h4>
                  <div className="space-y-1 text-slate.600 font-semibold">
                    <p className="flex items-center gap-1.5"><Tag className="h-3.5 w-3.5 text-slate-400" /> Container: {selectedItem.container}</p>
                    <p className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5 text-slate-400" /> Collected: {selectedItem.collectedTime}</p>
                    <p className="flex items-center gap-1.5"><User className="h-3.5 w-3.5 text-slate-400" /> Collector: {selectedItem.collectorName}</p>
                  </div>
                </div>
              </div>

              {/* Integrity Review Checks */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Biosample Integrity Inspection Checklist
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-slate.600 font-semibold">
                  <label className="p-3 bg-slate-50 border border-slate-200/60 rounded-xl flex items-center gap-2.5 cursor-pointer">
                    <input type="checkbox" defaultChecked className="rounded text-indigo-600 focus:ring-indigo-500" />
                    <span>Barcode Label Verified</span>
                  </label>
                  
                  <label className="p-3 bg-slate-50 border border-slate-200/60 rounded-xl flex items-center gap-2.5 cursor-pointer">
                    <input type="checkbox" defaultChecked className="rounded text-indigo-600 focus:ring-indigo-500" />
                    <span>Volume Sufficient ({selectedItem.volume})</span>
                  </label>

                  <label className="p-3 bg-slate-50 border border-slate-200/60 rounded-xl flex items-center gap-2.5 cursor-pointer">
                    <input type="checkbox" defaultChecked className="rounded text-indigo-600 focus:ring-indigo-500" />
                    <span>No Hemolysis / Clots</span>
                  </label>
                </div>
              </div>

              {/* Status and Action Buttons */}
              <div className="border-t border-slate-100 pt-6">
                {selectedItem.status === 'Collected' && !rejectMode ? (
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleReceive(selectedItem.id)}
                      className="btn bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold px-6 py-3 rounded-xl flex items-center gap-2 shadow-sm"
                    >
                      <CheckCircle className="h-4 w-4" /> Accept & Log-In Specimen
                    </button>
                    
                    <button
                      onClick={() => setRejectMode(true)}
                      className="btn border border-rose-200 hover:bg-rose-50 text-rose-700 text-xs font-bold px-6 py-3 rounded-xl flex items-center gap-2"
                    >
                      <XCircle className="h-4 w-4" /> Reject biosample
                    </button>
                  </div>
                ) : rejectMode ? (
                  <form onSubmit={handleRejectSubmit} className="space-y-4">
                    <div className="p-4 bg-rose-50/50 border border-rose-100 rounded-xl flex gap-3 text-xs">
                      <AlertTriangle className="h-5 w-5 text-rose-600 mt-0.5 flex-shrink-0 animate-pulse" />
                      <div>
                        <h5 className="font-extrabold text-rose-800">Rejection Protocol</h5>
                        <p className="text-[10px] text-slate.500 font-semibold mt-0.5">
                          Rejecting this sample will dispatch an automatic notification to the nurse team and flag a required redraw on the patient queue.
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase block">Reason for Rejection</label>
                      <select 
                        value={rejectReasonText}
                        onChange={(e) => setRejectReasonText(e.target.value)}
                        className="input text-xs py-2.5 w-full bg-white rounded-xl border border-slate-200"
                        required
                      >
                        <option value="">Select reason...</option>
                        <option value="Hemolyzed Sample">Hemolyzed Sample</option>
                        <option value="Insufficient Sample Volume (QNS)">Insufficient Sample Volume (QNS)</option>
                        <option value="Mismatched Label / Incorrect Patient">Mismatched Label / Incorrect Patient</option>
                        <option value="Clotted EDTA Tube">Clotted EDTA Tube</option>
                        <option value="Contaminated Specimen">Contaminated Specimen</option>
                      </select>
                    </div>

                    <div className="flex gap-2">
                      <button
                        type="submit"
                        className="btn bg-rose-600 hover:bg-rose-750 text-white text-xs font-extrabold px-5 py-2.5 rounded-xl shadow-sm"
                      >
                        Confirm Rejection
                      </button>
                      <button
                        type="button"
                        onClick={() => setRejectMode(false)}
                        className="btn border border-slate-200 text-slate-650 hover:bg-slate-50 text-xs font-semibold px-4 py-2.5 rounded-xl"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="p-4 bg-slate-50 border border-slate-200/60 rounded-xl flex items-center justify-between gap-4 text-xs font-bold text-slate-700">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-emerald-600" />
                      <span>This specimen is already received and registered. Ready for diagnostic encoding.</span>
                    </div>
                  </div>
                )}
              </div>

            </div>
          ) : (
            <div className="card p-12 text-center text-slate-400 font-semibold text-xs bg-white border border-slate-200/80 shadow-sm rounded-2xl">
              Select a specimen to perform log-in validation.
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default SpecimenReceivingPage;
