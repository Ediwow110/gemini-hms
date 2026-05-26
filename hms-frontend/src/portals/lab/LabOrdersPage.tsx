import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { PageHeader } from '../../components/ui/page-header';
import { LabOrderHeader } from './components/LabOrderHeader';
import { LabStatusBadge, LabStatus } from './components/LabStatusBadge';
import { 
  Search,
  Filter,
  Printer,
  Calendar,
  Activity,
  AlertTriangle,
  Loader2,
  CheckCircle2,
  X,
  TestTube
} from 'lucide-react';
import { useClinicalWorkQueue, usePatientLabResults, useReceiveLabOrder } from '../../hooks/use-clinical-workflow';
import { format } from 'date-fns';
import axios from 'axios';

interface LabOrder {
  id: string;
  patientName: string;
  patientAge: number;
  patientGender: string;
  mrn: string;
  dob: string;
  accessCode: string;
  physician: string;
  department: string;
  billingStatus: 'Prepaid' | 'HMO Cleared' | 'Pending Payment' | 'On Account';
  insuranceProvider?: string;
  testPanels: string[];
  status: LabStatus;
  orderDate: string;
  urgency: 'Routine' | 'STAT';
}

export const LabOrdersPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const activePatientId = searchParams.get('patientId') || null;

  const { data: queueData, isLoading: isQueueLoading, error: queueError } = useClinicalWorkQueue();
  const { data: labResults, isLoading: isLabLoading, error: labError } = usePatientLabResults(activePatientId ?? '');

  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [localStatuses, setLocalStatuses] = useState<Record<string, LabStatus>>({});

  const [receiveModal, setReceiveModal] = useState<{ patientId: string; orderId: string } | null>(null);
  const [specimenType, setSpecimenType] = useState('');
  const [accessionNumber, setAccessionNumber] = useState('');
  const [collectionMode, setCollectionMode] = useState('ROUTINE');

  const receiveLabMutation = useReceiveLabOrder();

  const isLoading = isQueueLoading || (!!activePatientId && isLabLoading);
  const errorObj = queueError || (activePatientId ? labError : null);

  const rawOrders = (queueData || [])
    .filter(item => item.serviceType === 'LABORATORY');

  const orders: LabOrder[] = rawOrders.map(item => {
    let baseStatus: LabStatus = 'Ordered';
    if (item.status === 'WAITING') baseStatus = 'Ordered';
    else if (item.status === 'CALLING') baseStatus = 'Collected';
    else if (item.status === 'SERVING') baseStatus = 'Received';
    else if (item.status === 'COMPLETED') baseStatus = 'Released';

    // Override with local simulation state if applicable
    const status = localStatuses[item.id] || baseStatus;

    return {
      id: item.id,
      patientName: item.patientName || '[REDACTED]',
      patientAge: 0,
      patientGender: '[REDACTED]',
      mrn: item.patientNumber,
      dob: 'N/A',
      accessCode: `LIS-${item.queueNumber}`,
      physician: '[REDACTED]',
      department: '[REDACTED]',
      billingStatus: 'Prepaid',
      testPanels: [],
      status,
      orderDate: item.timestamp ? format(new Date(item.timestamp), 'yyyy-MM-dd hh:mm a') : 'N/A',
      urgency: item.category === 'EMERGENCY' ? 'STAT' : 'Routine'
    };
  });

  const selectedOrder = orders.find(o => o.id === activePatientId) || null;

  const filteredOrders = orders.filter(o => {
    const matchesSearch = o.patientName.toLowerCase().includes(search.toLowerCase()) || 
                          o.id.toLowerCase().includes(search.toLowerCase()) ||
                          o.mrn.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = filterStatus === 'ALL' || o.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const openReceiveModal = (patientId: string, orderId: string) => {
    setSpecimenType('');
    setAccessionNumber('');
    setCollectionMode('ROUTINE');
    setReceiveModal({ patientId, orderId });
  };

  const handleReceiveLab = async () => {
    if (!receiveModal) return;
    try {
      await receiveLabMutation.mutateAsync({
        patientId: receiveModal.patientId,
        orderId: receiveModal.orderId,
        data: {
          specimenType,
          accessionNumber: accessionNumber || undefined,
          collectionMode,
        },
      });
      setLocalStatuses(prev => ({ ...prev, [receiveModal.orderId]: 'Received' }));
      setReceiveModal(null);
    } catch {
      // error state handled by mutation
    }
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
            ? 'You do not have permission to view the LIS queue. Please contact your administrator.' 
            : 'Failed to connect to the clinical service. Please check your network connection or try again later.'}
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-8 text-center space-y-4 animate-fade-in">
        <div className="animate-spin mx-auto w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full" />
        <p className="text-slate-500 font-medium tracking-wide animate-pulse">Loading LIS queue...</p>
      </div>
    );
  }

  return (
    <>
    <div className="space-y-6 animate-fade-in">
      {/* Sandbox Warning Banner */}
      <div className="p-4 bg-amber-50 border border-amber-150 rounded-2xl flex gap-3 text-xs text-amber-800">
        <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
        <div>
          <h5 className="font-extrabold uppercase text-[10px] tracking-wider">LIS Order Intake Queue (WIP/Mock)</h5>
          <p className="font-medium mt-0.5">
            This workspace uses real queue data but lacks full LIS demographics and clinical details. Patient demographics and test panels are intentionally masked to prevent clinical misinformation.
          </p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <PageHeader 
          title="Lab Orders Intake Queue" 
          description="View all laboratory diagnostic requests submitted by clinical departments, verify billing clearance, and track collection routing." 
        />
        <div className="text-[10px] font-black uppercase text-indigo-700 bg-indigo-50 border border-indigo-150 px-3.5 py-1.5 rounded-xl select-none">
          Demo LIS Database
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Filter and Orders List */}
        <div className="space-y-4">
          <div className="card p-4 bg-white border border-slate-200/80 shadow-sm rounded-2xl space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search patient, order, or MRN..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input pl-9 text-xs py-2 w-full rounded-xl"
              />
            </div>
            
            <div className="flex gap-2">
              <div className="flex-1">
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="input text-xs py-2 w-full rounded-xl bg-white border border-slate-200/60"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="Ordered">Ordered</option>
                  <option value="Collected">Collected</option>
                  <option value="Received">Received</option>
                  <option value="Encoded">Encoded</option>
                  <option value="Validated">Validated</option>
                  <option value="Released">Released</option>
                </select>
              </div>
              <button className="btn border border-slate-200/60 p-2 rounded-xl text-slate-500 hover:text-slate-700">
                <Filter className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Orders list */}
          <div className="card p-3 bg-white border border-slate-200/80 shadow-sm rounded-2xl space-y-2 max-h-[550px] overflow-y-auto">
            {filteredOrders.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs font-semibold">
                No orders match criteria.
              </div>
            ) : (
              filteredOrders.map(o => (
                <div
                  key={o.id}
                  onClick={() => setSearchParams({ patientId: o.id })}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer text-xs space-y-2 ${
                    selectedOrder?.id === o.id
                      ? 'border-indigo-500 bg-indigo-50/20 shadow-sm'
                      : 'border-slate-100 hover:bg-slate-50/50'
                  }`}
                >
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <span className="font-mono text-[10px] font-black text-indigo-600 block">{o.accessCode}</span>
                      <h4 className="font-black text-slate-800 text-sm mt-0.5">{o.patientName}</h4>
                    </div>
                    {o.urgency === 'STAT' && (
                      <span className="bg-rose-50 text-rose-700 font-extrabold text-[9px] px-2 py-0.5 rounded border border-rose-100 animate-pulse">
                        STAT
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {o.testPanels.map((panel, idx) => (
                      <span key={idx} className="bg-slate-100 text-slate-600 font-bold px-1.5 py-0.5 rounded text-[9px]">
                        {panel}
                      </span>
                    ))}
                  </div>

                  <div className="flex justify-between items-center border-t border-slate-100/60 pt-2 text-[10px] text-slate-400 font-bold uppercase">
                    <span>{o.orderDate}</span>
                    <LabStatusBadge status={o.status} showIcon={false} className="px-2 py-0.5 text-[9px] rounded-lg" />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Column: Selected Order Work Detail */}
        <div className="lg:col-span-2 space-y-4">
          {selectedOrder ? (
            <div className="space-y-6">
              
              {/* Order Identity Block */}
              <LabOrderHeader order={selectedOrder} />

              {/* Order Panels and Workflow Actions */}
              <div className="card p-6 bg-white border border-slate-200/80 shadow-sm rounded-2xl space-y-6">
                
                <div>
                  <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-3 flex items-center gap-1.5">
                    <Activity className="h-4.5 w-4.5 text-indigo-500" />
                    Requested Diagnostic Panels
                  </h3>
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedOrder.testPanels.map((panel, idx) => (
                      <div key={idx} className="p-4 bg-slate-50 border border-slate-200/60 rounded-xl space-y-2">
                        <h4 className="font-extrabold text-slate-700 text-xs">{panel}</h4>
                        <p className="text-[10px] text-slate-400 font-medium">Specimen: Whole Blood / Red Top Vacutainer</p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-[9px] font-bold bg-indigo-50 border border-indigo-100 text-indigo-600 px-2 py-0.5 rounded">
                            Analyzer: Sysmex XN
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Real Lab Results Section */}
                {labResults && labResults.length > 0 && (
                  <div className="border-t border-slate-100 pt-6">
                    <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider pb-3 flex items-center gap-1.5">
                      <Activity className="h-4.5 w-4.5 text-indigo-500" />
                      Recorded Laboratory Assays
                    </h3>
                    <div className="mt-2 space-y-2.5">
                      {labResults.map((res) => (
                        <div key={res.id} className="p-3 bg-slate-50 border border-slate-200/60 rounded-xl flex justify-between items-center text-xs">
                          <div>
                            <span className="font-extrabold text-slate-700 block">Order Ref: {res.orderNumber}</span>
                            <span className="text-[10px] text-slate-450 font-bold block mt-0.5">Approved By: {res.approvedBy || 'N/A'}</span>
                          </div>
                          <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-lg border ${
                            res.isReleased 
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-150'
                              : 'bg-amber-50 text-amber-700 border-amber-150'
                          }`}>
                            {res.isReleased ? 'Released' : 'Pending'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Workflow Simulation / Real Mutation triggers */}
                <div className="border-t border-slate-100 pt-6 space-y-4">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Portal Specimen & Intake Dispatch Controls
                  </h4>

                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={() => alert('Printing Barcode Labels for tubes...')}
                      className="btn border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold px-4 py-2.5 rounded-xl flex items-center gap-2"
                    >
                      <Printer className="h-4 w-4" /> Print Specimen Barcodes
                    </button>

                    {selectedOrder.status === 'Ordered' && (
                      <button
                        onClick={() => {
                          const queueItem = rawOrders.find(r => r.id === selectedOrder.id);
                          if (queueItem?.patientId) {
                            openReceiveModal(queueItem.patientId, selectedOrder.id);
                          } else {
                            alert('Cannot receive: No patient context available for this order.');
                          }
                        }}
                        className="btn bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-sm"
                      >
                        <TestTube className="h-4 w-4" /> Receive Specimen
                      </button>
                    )}

                    {selectedOrder.status === 'Received' && (
                      <button
                        onClick={() => navigate(`/lab/encoding?id=${selectedOrder.id}`)}
                        className="btn bg-violet-600 hover:bg-violet-700 text-white text-xs font-extrabold px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-sm"
                      >
                        Encode Diagnostic Results
                      </button>
                    )}
                  </div>
                </div>

                {/* System Alert Info */}
                <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl flex gap-3 text-xs">
                  <Calendar className="h-5 w-5 text-indigo-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-extrabold text-slate-700">Order Placed: {selectedOrder.orderDate}</p>
                    <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                      This order has been verified against billing. Results will not be viewable by patient accounts until released by a certified clinical validation officer.
                    </p>
                  </div>
                </div>

              </div>
            </div>
          ) : (
            <div className="card p-12 text-center text-slate-400 font-semibold text-xs bg-white border border-slate-200/80 shadow-sm rounded-2xl">
              Select a laboratory order to view diagnostic details.
            </div>
          )}
        </div>

      </div>
    </div>

    {receiveModal && (
      <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => { if (!receiveLabMutation.isPending) setReceiveModal(null); }}>
        <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-5" onClick={e => e.stopPropagation()}>
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold text-slate-800">Receive Lab Specimen</h3>
            <button onClick={() => { if (!receiveLabMutation.isPending) setReceiveModal(null); }} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100">
              <X className="h-5 w-5" />
            </button>
          </div>

          {receiveLabMutation.isSuccess && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0" />
              <p className="text-sm font-bold text-emerald-700">Specimen received successfully.</p>
            </div>
          )}

          {!receiveLabMutation.isSuccess && (
            <>
              {receiveLabMutation.isError && (
                <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-sm text-rose-600 font-medium">
                  {receiveLabMutation.error instanceof axios.AxiosError && (receiveLabMutation.error.response?.status === 403 || receiveLabMutation.error.response?.status === 401)
                    ? 'Access Restricted'
                    : 'Failed to receive specimen. Please try again.'}
                </div>
              )}

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Specimen Type *</label>
                  <select
                    value={specimenType}
                    onChange={e => setSpecimenType(e.target.value)}
                    className="input text-sm py-2.5"
                  >
                    <option value="">Select specimen type...</option>
                    <option value="Whole Blood">Whole Blood</option>
                    <option value="Serum">Serum</option>
                    <option value="Plasma">Plasma</option>
                    <option value="Urine">Urine</option>
                    <option value="Stool">Stool</option>
                    <option value="Sputum">Sputum</option>
                    <option value="Swab">Swab</option>
                    <option value="CSF">CSF</option>
                    <option value="Tissue">Tissue</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Accession Number</label>
                  <input
                    type="text"
                    value={accessionNumber}
                    onChange={e => setAccessionNumber(e.target.value)}
                    placeholder="e.g. ACC-20260522-001"
                    maxLength={50}
                    className="input text-sm py-2.5"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Collection Mode</label>
                  <select
                    value={collectionMode}
                    onChange={e => setCollectionMode(e.target.value)}
                    className="input text-sm py-2.5"
                  >
                    <option value="ROUTINE">Routine</option>
                    <option value="STAT">STAT</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>
              </div>

              <button
                onClick={handleReceiveLab}
                disabled={!specimenType || receiveLabMutation.isPending}
                className="btn bg-indigo-600 hover:bg-indigo-700 text-white w-full justify-center py-3 text-sm gap-2 rounded-xl disabled:opacity-50"
              >
                {receiveLabMutation.isPending ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Receiving Specimen...</>
                ) : (
                  <><TestTube className="h-4 w-4" /> Confirm Specimen Receipt</>
                )}
              </button>
            </>
          )}
        </div>
      </div>
    )}
    </>
  );
};

export default LabOrdersPage;
