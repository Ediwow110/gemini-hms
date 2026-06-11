import { useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { LabOrderHeader } from './components/LabOrderHeader';
import { LabStatus, LabStatusBadge } from './components/LabStatusBadge';
import { 
  Search,
  Printer,
  Calendar,
  Activity,
  AlertTriangle,
  Loader2,
  CheckCircle2,
  X,
  TestTube,
  User,
  Hash,
  FlaskConical,
} from 'lucide-react';
import { 
  useClinicalWorkQueue, 
  usePatientLabResults, 
  useReceiveLabOrder,
  usePatientClinicalSummary
} from '../../hooks/use-clinical-workflow';
import { format, differenceInYears } from 'date-fns';
import axios from 'axios';
import { HmsPageHeader } from '../../components/hms-page';
import {
  HmsDashboardShell,
  HmsToolbar,
  HmsAuditFooter,
  HmsLoadingSkeleton,
  HmsDataUnavailable,
  HmsStatusChip,
} from '../../components/hms-dashboard';

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
  const { data: labResults } = usePatientLabResults(activePatientId ?? '');
  const { data: patientSummary, isLoading: isSummaryLoading } = usePatientClinicalSummary(activePatientId ?? '');

  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [localStatuses, setLocalStatuses] = useState<Record<string, LabStatus>>({});

  const [receiveModal, setReceiveModal] = useState<{ patientId: string; orderId: string } | null>(null);
  const [specimenType, setSpecimenType] = useState('');
  const [accessionNumber, setAccessionNumber] = useState('');
  const [collectionMode, setCollectionMode] = useState('ROUTINE');

  const receiveLabMutation = useReceiveLabOrder();

  const isLoading = isQueueLoading; 
  const errorObj = queueError;

  const orders: LabOrder[] = useMemo(() => {
    if (!queueData) return [];
    return queueData
      .filter(item => item.serviceType === 'LABORATORY')
      .map(item => {
        let baseStatus: LabStatus = 'Ordered';
        if (item.status === 'WAITING') baseStatus = 'Ordered';
        else if (item.status === 'CALLING') baseStatus = 'Collected';
        else if (item.status === 'SERVING') baseStatus = 'Received';
        else if (item.status === 'COMPLETED') baseStatus = 'Released';

        const status = localStatuses[item.id] || baseStatus;

        return {
          id: item.id,
          patientName: item.patientName || '[REDACTED]',
          patientAge: 0,
          patientGender: 'Unknown',
          mrn: item.patientNumber || '[REDACTED]',
          dob: 'N/A',
          accessCode: `LIS-${item.queueNumber}`,
          physician: 'Attending Physician',
          department: 'Clinical Unit',
          billingStatus: 'Prepaid',
          testPanels: [],
          status,
          orderDate: item.timestamp ? format(new Date(item.timestamp), 'yyyy-MM-dd hh:mm a') : 'N/A',
          urgency: item.category === 'EMERGENCY' ? 'STAT' : 'Routine'
        };
      });
  }, [queueData, localStatuses]);

  const selectedOrderRaw = useMemo(() => orders.find(o => o.id === activePatientId) || null, [orders, activePatientId]);

  const selectedOrder = useMemo(() => {
    if (!selectedOrderRaw) return null;
    if (!patientSummary) return selectedOrderRaw;

    return {
      ...selectedOrderRaw,
      patientAge: patientSummary.dob ? differenceInYears(new Date(), new Date(patientSummary.dob)) : 0,
      patientGender: patientSummary.gender || 'Unknown',
      dob: patientSummary.dob ? format(new Date(patientSummary.dob), 'yyyy-MM-dd') : 'N/A',
    };
  }, [selectedOrderRaw, patientSummary]);

  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      const matchesSearch = o.patientName.toLowerCase().includes(search.toLowerCase()) || 
                            o.id.toLowerCase().includes(search.toLowerCase()) ||
                            o.mrn.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = filterStatus === 'ALL' || o.status === filterStatus;
      return matchesSearch && matchesStatus;
    });
  }, [orders, search, filterStatus]);

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
      <HmsDashboardShell>
        <HmsPageHeader
          title="Lab Orders Intake Queue"
          description="View all laboratory diagnostic requests submitted by clinical departments."
          badge="LIS Intake"
        />
        <HmsDataUnavailable
          sectionName={isForbidden ? 'Access Restricted' : 'Connection Error'}
          expectedApi={
            isForbidden
              ? 'You do not have permission to view the LIS queue.'
              : 'Failed to connect to the clinical service. Please check your network connection.'
          }
        />
      </HmsDashboardShell>
    );
  }

  if (isLoading) {
    return (
      <HmsDashboardShell>
        <HmsPageHeader
          title="Lab Orders Intake Queue"
          description="View all laboratory diagnostic requests submitted by clinical departments."
          badge="LIS Intake"
        />
        <HmsLoadingSkeleton rows={8} />
      </HmsDashboardShell>
    );
  }

  return (
    <>
    <HmsDashboardShell
      toolbar={
        <HmsToolbar>
          <div className="flex items-center gap-4 w-full">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search patient, order, or MRN..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input pl-9 text-xs py-1.5 w-full bg-slate-50 border-slate-200"
              />
            </div>
            
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="input text-xs py-1.5 w-[160px] bg-white border border-slate-200"
            >
              <option value="ALL">All Statuses</option>
              <option value="Ordered">Ordered</option>
              <option value="Collected">Collected</option>
              <option value="Received">Received</option>
              <option value="Encoded">Encoded</option>
              <option value="Validated">Validated</option>
              <option value="Released">Released</option>
            </select>

            <div className="flex-grow" />
            <button
              onClick={() => window.location.reload()}
              className="text-xs font-semibold text-slate-500 hover:text-slate-700 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors"
            >
              Refresh Queue
            </button>
          </div>
        </HmsToolbar>
      }
      footer={<HmsAuditFooter dataSource="useClinicalWorkQueue + useReceiveLabOrder + usePatientClinicalSummary" />}
    >
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <HmsPageHeader 
          title="Lab Orders Intake Queue" 
          description="View all laboratory diagnostic requests submitted by clinical departments, verify billing clearance, and track collection routing." 
        />
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-black uppercase text-indigo-700 bg-indigo-50 border border-indigo-150 px-3 py-1 rounded-full">
            LIS Production Interface
          </span>
        </div>
      </div>

      {/* Honesty Banner: Now Narrowed since demographics are live */}
      <div className="p-4 bg-amber-50 border border-amber-150 rounded-2xl flex gap-3 text-xs text-amber-800">
        <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
        <div>
          <h5 className="font-extrabold uppercase text-[10px] tracking-wider">LIS Intake Workspace (Real — Partial)</h5>
          <p className="font-medium mt-0.5">
            Patient demographics (Age/Gender/DOB) are now enriched from the clinical summary. Physician/Department source and specific test panel itemization remain placeholder until Phase 7B audit completion.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Orders List */}
        <div className="space-y-4">
          <div className="card p-3 bg-white border border-slate-200/80 shadow-sm rounded-2xl space-y-2 max-h-[600px] overflow-y-auto">
            {filteredOrders.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs font-bold italic">
                No orders match current criteria.
              </div>
            ) : (
              filteredOrders.map(o => (
                <div
                  key={o.id}
                  onClick={() => setSearchParams({ patientId: o.id })}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer text-xs space-y-2 ${
                    activePatientId === o.id
                      ? 'border-indigo-500 bg-indigo-50/20 shadow-sm ring-1 ring-indigo-500/20'
                      : 'border-slate-100 hover:bg-slate-50/50'
                  }`}
                >
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <span className="font-mono text-[10px] font-black text-indigo-600 block">{o.accessCode}</span>
                      <h4 className="font-black text-slate-800 text-sm mt-0.5">{o.patientName}</h4>
                    </div>
                    {o.urgency === 'STAT' && (
                      <span className="bg-rose-50 text-rose-700 font-extrabold text-[9px] px-2 py-0.5 rounded border border-rose-150 animate-pulse">
                        STAT
                      </span>
                    )}
                  </div>

                  <div className="flex justify-between items-center border-t border-slate-100/60 pt-2 text-[10px] text-slate-400 font-bold uppercase">
                    <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {o.orderDate}</span>
                    <LabStatusBadge status={o.status} showIcon={false} className="px-2 py-0.5 text-[9px] rounded-lg" />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Column: Selected Order Detail */}
        <div className="lg:col-span-2 space-y-6">
          {selectedOrder ? (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              
              {isSummaryLoading ? (
                <div className="h-32 bg-slate-50 animate-pulse rounded-2xl border border-slate-200" />
              ) : (
                <LabOrderHeader order={selectedOrder} />
              )}

              <div className="card p-6 bg-white border border-slate-200/80 shadow-sm rounded-2xl space-y-8">
                
                <div>
                  <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest border-b border-slate-100 pb-3 flex items-center gap-2">
                    <Activity className="h-4 w-4 text-indigo-500" />
                    Diagnostic Panel Authorization
                  </h3>
                  
                  <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Test panels are still partially placeholder in this phase */}
                    <div className="p-4 bg-slate-50 border border-slate-200/60 rounded-xl space-y-2 relative overflow-hidden">
                       <div className="absolute top-0 right-0 p-2 opacity-10">
                        <FlaskConical className="h-12 w-12" />
                      </div>
                      <h4 className="font-black text-slate-700 text-sm">Routine Diagnostic Request</h4>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">System Ref: {selectedOrder.accessCode}</p>
                      <div className="flex items-center gap-2 mt-3">
                        <HmsStatusChip status="Awaiting Collection" variant="warning" />
                      </div>
                    </div>

                    <div className="p-4 border border-slate-150 border-dashed rounded-xl flex flex-center items-center justify-center text-slate-400 text-[10px] font-bold uppercase text-center italic">
                      Panel details itemization pending LIS integration
                    </div>
                  </div>
                </div>

                {/* Real Lab Results Section */}
                {labResults && labResults.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      Historical Result Correlation
                    </h3>
                    <div className="grid grid-cols-1 gap-2.5">
                      {labResults.map((res) => (
                        <div key={res.id} className="p-4 bg-slate-50 border border-slate-200/60 rounded-xl flex justify-between items-center text-xs group hover:bg-white hover:border-indigo-200 transition-all cursor-pointer">
                          <div className="flex items-center gap-4">
                            <div className="h-8 w-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-400">
                               <Hash className="h-4 w-4" />
                            </div>
                            <div>
                              <span className="font-black text-slate-700 block text-sm">Order {res.orderNumber}</span>
                              <span className="text-[10px] text-slate-450 font-bold block mt-0.5 uppercase tracking-tight">Released: {res.releasedAt ? format(new Date(res.releasedAt), 'MMM dd, yyyy') : 'Pending'}</span>
                            </div>
                          </div>
                          <HmsStatusChip 
                            status={res.isReleased ? 'Released' : 'Pending'} 
                            variant={res.isReleased ? 'success' : 'warning'} 
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="border-t border-slate-100 pt-8 space-y-6">
                  <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest">
                    Portal Specimen & Intake Actions
                  </h4>

                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={() => alert('Printing clinical barcode labels...')}
                      className="btn bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-black px-5 py-3 rounded-xl flex items-center gap-2 shadow-sm transition-all"
                    >
                      <Printer className="h-4 w-4" /> Print Barcodes
                    </button>

                    {selectedOrder.status === 'Ordered' && (
                      <button
                        onClick={() => {
                          const queueItem = queueData?.find(r => r.id === selectedOrder.id);
                          if (queueItem?.patientId) {
                            openReceiveModal(queueItem.patientId, selectedOrder.id);
                          } else {
                            alert('Cannot receive: No patient context found.');
                          }
                        }}
                        className="btn bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black px-5 py-3 rounded-xl flex items-center gap-2 shadow-md transition-all active:scale-95"
                      >
                        <TestTube className="h-4 w-4" /> Receive Specimen
                      </button>
                    )}

                    {selectedOrder.status === 'Received' && (
                      <button
                        onClick={() => {
                          const queueItem = queueData?.find(r => r.id === selectedOrder.id);
                          const patientId = queueItem?.patientId || '';
                          navigate(`/lab/encoding?patientId=${patientId}&orderId=${selectedOrder.id}`);
                        }}
                        className="btn bg-violet-600 hover:bg-violet-700 text-white text-xs font-black px-5 py-3 rounded-xl flex items-center gap-2 shadow-md transition-all active:scale-95"
                      >
                        <Activity className="h-4 w-4" /> Encode Results
                      </button>
                    )}
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl flex gap-3 text-[11px] text-slate-600 leading-relaxed font-medium">
                  <User className="h-5 w-5 text-indigo-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-black text-slate-800 uppercase tracking-tight text-[10px]">Verification Protocol</p>
                    <p className="mt-1">
                      Order placed on {selectedOrder.orderDate}. Clinical details must be verified against the physical laboratory request form before specimen accessioning.
                    </p>
                  </div>
                </div>

              </div>
            </div>
          ) : (
            <div className="h-full min-h-[400px] flex flex-col items-center justify-center card p-12 text-center bg-white border border-slate-200/80 shadow-sm rounded-2xl">
              <div className="h-16 w-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                <Search className="h-8 w-8 text-slate-200" />
              </div>
              <p className="font-black text-slate-400 text-xs uppercase tracking-widest">
                Select an intake request
              </p>
              <p className="text-[11px] text-slate-300 font-bold mt-2">
                Click an order from the queue to view diagnostic details
              </p>
            </div>
          )}
        </div>

      </div>
    </HmsDashboardShell>

    {receiveModal && (
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => { if (!receiveLabMutation.isPending) setReceiveModal(null); }}>
        <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 space-y-6 animate-scale-in" role="dialog" aria-modal="true" aria-labelledby="receive-specimen-title" onClick={e => e.stopPropagation()}>
          <div className="flex justify-between items-center border-b border-slate-100 pb-4">
            <h3 id="receive-specimen-title" className="text-lg font-black text-slate-800 tracking-tight">Receive Lab Specimen</h3>
            <button onClick={() => { if (!receiveLabMutation.isPending) setReceiveModal(null); }} className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100" aria-label="Close receive specimen modal">
              <X className="h-5 w-5" />
            </button>
          </div>

          {receiveLabMutation.isSuccess && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3 animate-in fade-in zoom-in-95">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0" />
              <p className="text-sm font-black text-emerald-700">Specimen received successfully.</p>
            </div>
          )}

          {!receiveLabMutation.isSuccess && (
            <>
              {receiveLabMutation.isError && (
                <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-[11px] text-rose-600 font-black uppercase">
                  {receiveLabMutation.error instanceof axios.AxiosError && (receiveLabMutation.error.response?.status === 403 || receiveLabMutation.error.response?.status === 401)
                    ? 'Access Restricted'
                    : 'System Error: Failed to receive specimen'}
                </div>
              )}

              <div className="space-y-5">
                <div className="space-y-2">
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">Specimen Type *</label>
                  <select
                    value={specimenType}
                    onChange={e => setSpecimenType(e.target.value)}
                    className="input text-sm py-3 rounded-xl border-slate-200"
                  >
                    <option value="">Select type...</option>
                    <option value="Whole Blood">Whole Blood</option>
                    <option value="Serum">Serum</option>
                    <option value="Plasma">Plasma</option>
                    <option value="Urine">Urine</option>
                    <option value="Stool">Stool</option>
                    <option value="Sputum">Sputum</option>
                    <option value="Swab">Swab</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">Accession Number</label>
                  <input
                    type="text"
                    value={accessionNumber}
                    onChange={e => setAccessionNumber(e.target.value)}
                    placeholder="e.g. ACC-2026-001"
                    className="input text-sm py-3 rounded-xl border-slate-200"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">Collection Mode</label>
                  <select
                    value={collectionMode}
                    onChange={e => setCollectionMode(e.target.value)}
                    className="input text-sm py-3 rounded-xl border-slate-200"
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
                className="btn bg-indigo-600 hover:bg-indigo-700 text-white w-full justify-center py-4 text-sm font-black gap-2 rounded-2xl disabled:opacity-50 shadow-lg shadow-indigo-200 transition-all active:scale-95"
              >
                {receiveLabMutation.isPending ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Processing...</>
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
