import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FlaskConical, Barcode, Printer, Check, UserCheck, ShieldAlert, AlertTriangle } from 'lucide-react';
import { PageHeader } from '../../components/ui/page-header';
import { useClinicalWorkQueue, usePatientLabResults } from '../../hooks/use-clinical-workflow';
import axios from 'axios';

export const NurseSpecimenCollectionPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activePatientId = searchParams.get('patientId') || null;

  const { data: queueData, isLoading: isQueueLoading, error: queueError } = useClinicalWorkQueue();
  const { data: labResults, isLoading: isLabLoading, error: labError } = usePatientLabResults(activePatientId ?? '');

  const [barcodePrinted, setBarcodePrinted] = useState(false);
  const [labelConfirmed, setLabelConfirmed] = useState(false);
  const [isCollecting, setIsCollecting] = useState(false);
  const [localCollected, setLocalCollected] = useState<Record<string, boolean>>({});

  const isLoading = isQueueLoading || (!!activePatientId && isLabLoading);
  const errorObj = queueError || (activePatientId ? labError : null);

  const pendingOrders = queueData
    ? queueData.filter(item => item.serviceType === 'LABORATORY' && item.status !== 'COMPLETED' && item.status !== 'CANCELLED')
    : [];

  const activeQueueItem = queueData?.find(item => item.patientId === activePatientId && item.serviceType === 'LABORATORY');

  const handleSelectOrder = (patientId: string) => {
    setSearchParams({ patientId });
    setBarcodePrinted(false);
    setLabelConfirmed(false);
  };

  const handlePrintBarcode = () => {
    setBarcodePrinted(true);
    alert('Mock Barcode label dispatched to local laboratory printer.');
  };

  const handleCompleteCollection = () => {
    if (!activePatientId) return;
    setIsCollecting(true);
    setTimeout(() => {
      setLocalCollected(prev => ({ ...prev, [activePatientId]: true }));
      setIsCollecting(false);
      setSearchParams({});
      alert('Specimen registered, barcode scanned, and transferred to Lab Intake Queue.');
    }, 1000);
  };

  if (errorObj) {
    const isForbidden = axios.isAxiosError(errorObj) && (errorObj.response?.status === 403 || errorObj.response?.status === 401);
    return (
      <div className="p-8 text-center space-y-4 animate-fade-in">
        <div className="mx-auto w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center">
          <AlertTriangle className="h-8 w-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-800">
          {isForbidden ? 'Access Restricted' : 'Connection Error'}
        </h2>
        <p className="text-slate-500 max-w-md mx-auto">
          {isForbidden 
            ? 'You do not have permission to view the specimen collection workspace. Please contact your administrator.' 
            : 'Failed to connect to the clinical service. Please check your network connection or try again later.'}
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-8 text-center space-y-4 animate-fade-in">
        <div className="animate-spin mx-auto w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full" />
        <p className="text-slate-500 font-medium tracking-wide animate-pulse">Loading specimen workstation...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Sandbox Warning Banner */}
      <div className="p-4 bg-amber-50 border border-amber-150 rounded-2xl flex gap-3 text-xs text-amber-800">
        <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
        <div>
          <h5 className="font-extrabold uppercase text-[10px] tracking-wider">UI Demonstration Sandbox Shell</h5>
          <p className="font-medium mt-0.5">
            This phlebotomy and specimen collection desk runs in a hybrid read-only mode. Active orders are loaded from the clinical work queue, but barcode printing, sample collection logs, and queue routing actions remain mock/UI-only.
          </p>
        </div>
      </div>

      <PageHeader 
        title="Specimen Collection Desk" 
        description="Verify patient identities, print laboratory barcode labels, log phlebotomy collections, and route tubes to the lab." 
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Column: Specimen orders queue */}
        <div className="space-y-4">
          <div className="card p-5 bg-white border border-slate-200/80 shadow-sm rounded-2xl space-y-4">
            <h3 className="font-bold text-slate-800 text-sm tracking-wider uppercase flex items-center gap-2 border-b border-slate-100 pb-3">
              <FlaskConical className="h-4.5 w-4.5 text-indigo-500" />
              Pending Lab Orders
            </h3>

            <div className="space-y-2.5">
              {pendingOrders.length === 0 ? (
                <p className="text-center text-slate-400 py-6 text-xs font-semibold">No pending laboratory orders found.</p>
              ) : (
                pendingOrders.map((ord) => {
                  const isActive = ord.patientId === activePatientId;
                  const isCollected = localCollected[ord.patientId];
                  return (
                    <button
                      key={ord.id}
                      onClick={() => handleSelectOrder(ord.patientId)}
                      className={`w-full text-left p-3.5 rounded-xl border flex flex-col gap-1.5 transition-all duration-200 cursor-pointer ${
                        isActive 
                          ? 'bg-gradient-to-r from-indigo-50 to-violet-50 border-indigo-200 shadow-sm'
                          : 'bg-white border-slate-200/60 hover:bg-slate-50 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <span className={`font-bold text-xs ${isActive ? 'text-indigo-800' : 'text-slate-800'}`}>
                          {ord.patientName || '[REDACTED]'}
                        </span>
                        <span className={`text-[8px] font-extrabold uppercase px-1.5 py-0.5 rounded-md border ${
                          isCollected
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-150'
                            : 'bg-amber-50 text-amber-700 border-amber-150 animate-pulse'
                        }`}>
                          {isCollected ? 'collected' : ord.status.toLowerCase()}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-600 font-semibold">Order: {ord.queueNumber}</p>
                      <div className="flex justify-between items-center text-[9px] text-slate-400 font-bold uppercase mt-1">
                        <span>Type: LAB PATHOLOGY</span>
                        <span>ID: {ord.patientNumber}</span>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Collection workstation */}
        <div className="lg:col-span-2">
          {!activeQueueItem ? (
            <div className="card p-12 bg-white border border-slate-200/80 shadow-sm rounded-2xl text-center space-y-3 flex flex-col items-center">
              <Barcode className="h-10 w-10 text-slate-300" />
              <h3 className="font-bold text-slate-700 text-sm">No Specimen Selected</h3>
              <p className="text-xs text-slate-400 max-w-sm">Select a pending laboratory order from the queue to open the phlebotomy collection guidelines and print tube labels.</p>
            </div>
          ) : (
            <div className="card p-6 bg-white border border-slate-200/80 shadow-sm rounded-2xl space-y-6 animate-fade-in">
              {/* Header details */}
              <div className="border-b border-slate-100 pb-4 space-y-2">
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <h3 className="font-extrabold text-slate-800 text-sm">{activeQueueItem.patientName || '[REDACTED]'}</h3>
                    <p className="text-[10px] text-slate-400 font-semibold font-mono mt-0.5">MRN: {activeQueueItem.patientNumber} • Queue Ref: {activeQueueItem.queueNumber}</p>
                  </div>
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-2 text-center text-xs font-bold text-slate-700">
                    Container: Lavender Top (EDTA) (Default)
                  </div>
                </div>
              </div>

              {/* Phlebotomy details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Specimen Type</span>
                  <p className="text-xs font-bold text-slate-700">Whole Blood (Default)</p>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Test Requested</span>
                  <p className="text-xs font-bold text-slate-700">Complete Blood Count (CBC) (Default)</p>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Ordering Clinician</span>
                  <p className="text-xs font-bold text-slate-700">Dr. Frankenstein (Default)</p>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Intake Status</span>
                  <p className="text-xs font-bold text-indigo-600 capitalize">
                    {localCollected[activeQueueItem.patientId] ? 'collected' : activeQueueItem.status.toLowerCase()}
                  </p>
                </div>
              </div>

              {/* Active Lab Results summary */}
              {labResults && labResults.length > 0 && (
                <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50/30 space-y-3">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Patient Lab Results History</h4>
                  <div className="space-y-2">
                    {labResults.map((res) => (
                      <div key={res.id} className="flex justify-between items-center text-xs p-2 bg-white border border-slate-100 rounded-lg">
                        <div>
                          <p className="font-bold text-slate-800">Order: {res.orderNumber}</p>
                          <p className="text-[10px] text-slate-400 font-medium">Status: {res.status}</p>
                        </div>
                        <span className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded border ${
                          res.isReleased 
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                            : 'bg-amber-50 text-amber-700 border-amber-100'
                        }`}>
                          {res.isReleased ? 'Released' : 'Pending'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* barcode checklist steps */}
              <div className="bg-slate-50 border border-slate-200/60 p-5 rounded-2xl space-y-4">
                <h4 className="font-bold text-slate-700 text-xs tracking-wider uppercase flex items-center gap-1.5">
                  <Barcode className="h-4.5 w-4.5 text-indigo-500" /> Collection Safety Sequence
                </h4>

                <div className="space-y-3.5">
                  {/* Step 1: Print Barcode */}
                  <div className="flex items-center justify-between gap-4 bg-white p-3 rounded-xl border border-slate-100">
                    <div className="space-y-0.5">
                      <span className="text-[11px] font-bold text-slate-700 block">1. Dispatched Tube Barcode</span>
                      <p className="text-[10px] text-slate-400 font-medium">Verify MRN matches patient wristband before labeling.</p>
                    </div>
                    <button
                      type="button"
                      onClick={handlePrintBarcode}
                      className={`btn text-[10px] font-extrabold px-3 py-1.5 rounded-lg border flex items-center gap-1 transition-all ${
                        barcodePrinted 
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                          : 'bg-indigo-600 text-white hover:bg-indigo-700 border-transparent shadow-sm'
                      }`}
                    >
                      {barcodePrinted ? <Check className="h-3 w-3" /> : <Printer className="h-3.5 w-3.5" />}
                      {barcodePrinted ? 'Printed' : 'Print Label'}
                    </button>
                  </div>

                  {/* Step 2: Confirm Label Attached */}
                  <div className="flex items-center justify-between gap-4 bg-white p-3 rounded-xl border border-slate-100">
                    <div className="space-y-0.5">
                      <span className="text-[11px] font-bold text-slate-700 block">2. Affix and Verify Label</span>
                      <p className="text-[10px] text-slate-400 font-medium">Confirm barcodes are scanned and securely attached to the container.</p>
                    </div>
                    <input
                      type="checkbox"
                      disabled={!barcodePrinted}
                      checked={labelConfirmed}
                      onChange={(e) => setLabelConfirmed(e.target.checked)}
                      className="h-4.5 w-4.5 text-indigo-600 focus:ring-indigo-500 border-slate-350 rounded cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-between items-center border-t border-slate-100 pt-4">
                <span className="text-[10px] text-rose-500 font-extrabold bg-rose-50 border border-rose-100 px-3 py-1.5 rounded-xl uppercase flex items-center gap-1">
                  <ShieldAlert className="h-3.5 w-3.5" /> High Risk Verification Required
                </span>

                <button
                  type="button"
                  disabled={!labelConfirmed || isCollecting || localCollected[activeQueueItem.patientId]}
                  onClick={handleCompleteCollection}
                  className="btn btn-primary bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-100 disabled:text-slate-400 disabled:border-transparent text-white text-xs px-5 py-2 font-extrabold flex items-center gap-1.5 rounded-xl shadow-md transition-all"
                >
                  <UserCheck className="h-4 w-4" />
                  {isCollecting ? 'Filing Collection...' : 'Confirm Sample Collected'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NurseSpecimenCollectionPage;

