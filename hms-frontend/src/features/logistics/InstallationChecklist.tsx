import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { apiClient } from '../../lib/api';
import { logger } from '../../lib/logger';
import { PageHeader } from '../../components/ui/page-header';
import { 
  CheckSquare, 
  Square, 
  Activity, 
  ShieldCheck, 
  UserCheck, 
  AlertTriangle, 
  CloudOff, 
  CloudLightning, 
  RefreshCw, 
  Wrench,
  Clock,
  CheckCircle2
} from 'lucide-react';

interface Asset {
  id: string;
  serialNumber: string;
  model: string;
  installationStatus: 'PENDING_ASSESSMENT' | 'SITE_READY' | 'ASSEMBLING' | 'INSTALLED' | 'COMMISSIONED' | 'HANDED_OVER';
  warrantyStart: string | null;
  warrantyEnd: string | null;
}

interface InstallationJob {
  id: string;
  assetId: string;
  assignedUserId: string;
  status: 'ASSIGNED' | 'IN_PROGRESS' | 'COMMISSIONED' | 'COMPLETED' | 'FAILED';
  commissionedAt: string | null;
  handoverSignedAt: string | null;
  asset: Asset;
}

interface ChecklistItem {
  id: string;
  label: string;
  phase: 'readiness' | 'assembly' | 'commissioning' | 'handover';
}

const CHECKLIST_TEMPLATES: ChecklistItem[] = [
  { id: 'power', label: 'Power supply verified (3-phase 380V/220V stable)', phase: 'readiness' },
  { id: 'ventilation', label: 'HVAC & ventilation systems operational', phase: 'readiness' },
  { id: 'shielding', label: 'Lead lining / radiation shielding certified', phase: 'readiness' },
  { id: 'anchoring', label: 'Machine chassis anchored to slab foundation', phase: 'readiness' },
  
  { id: 'unboxing', label: 'Chassis unboxed and structurally checked', phase: 'assembly' },
  { id: 'cabling', label: 'Fiber interconnects and power routing secured', phase: 'assembly' },
  { id: 'detector', label: 'Detector array & gantry cooling calibrated', phase: 'assembly' },
  
  { id: 'calibration', label: 'Helical scan test patterns executed', phase: 'commissioning' },
  { id: 'interlocks', label: 'Door interlocks & emergency stops verified', phase: 'commissioning' },
  { id: 'laser', label: 'Alignment lasers mapped to iso-center', phase: 'commissioning' },
  
  { id: 'training', label: 'On-site clinical team initial training completed', phase: 'handover' },
  { id: 'manuals', label: 'Technical manuals & safety decals delivered', phase: 'handover' },
  { id: 'signature', label: 'Sign-off documents signed by department head', phase: 'handover' },
];

export const InstallationChecklist: React.FC = () => {
  const [jobs, setJobs] = useState<InstallationJob[]>([]);
  const [selectedJob, setSelectedJob] = useState<InstallationJob | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Offline-first State Mechanics
  const [isOffline, setIsOffline] = useState<boolean>(!navigator.onLine);
  const [lastSynced, setLastSynced] = useState<string | null>(localStorage.getItem('hms_logistics_last_synced'));
  const [checklistState, setChecklistState] = useState<Record<string, boolean>>({});
  const [technicianNote, setTechnicianNote] = useState<string>('');
  const [syncingJobId, setSyncingJobId] = useState<string | null>(null);



  // Load and memoize checklists on selection
  const selectJob = useCallback((job: InstallationJob) => {
    setSelectedJob(job);
    setTechnicianNote('');
    
    // Attempt local checklist restoration
    const cachedStateKey = `hms_logistics_checklist_${job.id}`;
    const cachedState = localStorage.getItem(cachedStateKey);
    if (cachedState) {
      setChecklistState(JSON.parse(cachedState));
    } else {
      // Default empty state
      const defaultState: Record<string, boolean> = {};
      CHECKLIST_TEMPLATES.forEach(item => {
        defaultState[item.id] = job.status === 'COMPLETED';
      });
      setChecklistState(defaultState);
    }

    const cachedNote = localStorage.getItem(`hms_logistics_note_${job.id}`);
    if (cachedNote) {
      setTechnicianNote(cachedNote);
    }
  }, []);

  // Fetch installation jobs
  const fetchJobs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.get<InstallationJob[]>('/v1/logistics/installations');
      setJobs(response.data);
      
      // Save fetch snapshot inside offline cache
      localStorage.setItem('hms_logistics_cached_jobs', JSON.stringify(response.data));
      const syncTime = new Date().toLocaleTimeString();
      localStorage.setItem('hms_logistics_last_synced', syncTime);
      setLastSynced(syncTime);
      setIsOffline(false);

      if (response.data.length > 0 && !selectedJob) {
        selectJob(response.data[0]);
      }
    } catch (err) {
      logger.warn('Logistics API failed, falling back to local storage cache:', err);
      const cached = localStorage.getItem('hms_logistics_cached_jobs');
      if (cached) {
        const parsedJobs: InstallationJob[] = JSON.parse(cached);
        setJobs(parsedJobs);
        setIsOffline(true);
        if (parsedJobs.length > 0 && !selectedJob) {
          selectJob(parsedJobs[0]);
        }
      } else {
        setError('No network connection and no local logistics cache discovered.');
      }
    } finally {
      setLoading(false);
    }
  }, [selectedJob, selectJob]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  // Toggle specific checklist index with Fitts Law target safety
  const handleToggleItem = (itemId: string) => {
    if (!selectedJob) return;
    const newState = {
      ...checklistState,
      [itemId]: !checklistState[itemId]
    };
    setChecklistState(newState);
    localStorage.setItem(`hms_logistics_checklist_${selectedJob.id}`, JSON.stringify(newState));
  };

  // Keep note buffered locally
  const handleNoteChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (!selectedJob) return;
    const val = e.target.value;
    setTechnicianNote(val);
    localStorage.setItem(`hms_logistics_note_${selectedJob.id}`, val);
  };

  // Outbox Synchronization mechanics for offline field tasks
  const handleSyncStatus = async (status: 'IN_PROGRESS' | 'COMMISSIONED' | 'COMPLETED') => {
    if (!selectedJob) return;
    setSyncingJobId(selectedJob.id);
    setError(null);

    const payload = {
      status,
      note: technicianNote || `Status updated to ${status} via technician checklist.`
    };

    if (isOffline) {
      // Buffer the job inside local offline outbox
      const outboxKey = 'hms_logistics_pending_outbox';
      const currentOutbox: Array<{ jobId: string; payload: unknown }> = JSON.parse(localStorage.getItem(outboxKey) || '[]');
      
      // Upsert existing item in outbox queue
      const existingIdx = currentOutbox.findIndex((item) => item.jobId === selectedJob.id);
      const outboxItem = { jobId: selectedJob.id, payload };
      
      if (existingIdx >= 0) {
        currentOutbox[existingIdx] = outboxItem;
      } else {
        currentOutbox.push(outboxItem);
      }
      
      localStorage.setItem(outboxKey, JSON.stringify(currentOutbox));
      
      // Optimistic visual feedback
      setSelectedJob({
        ...selectedJob,
        status
      });
      
      alert('Offline Outbox: Connection unavailable. Handover saved locally and queued for automatic sync!');
      setSyncingJobId(null);
      return;
    }

    // Connect immediately to the live backend
    try {
      const response = await apiClient.patch(`/v1/logistics/installations/${selectedJob.id}/status`, payload);
      const updatedJob = response.data;
      
      // Update local state list
      setJobs(prev => prev.map(j => j.id === selectedJob.id ? { ...j, status: updatedJob.status, asset: { ...j.asset, installationStatus: updatedJob.assetInstallStatus, warrantyStart: updatedJob.warrantyStart, warrantyEnd: updatedJob.warrantyEnd } } : j));
      setSelectedJob(prev => prev ? { ...prev, status: updatedJob.status, asset: { ...prev.asset, installationStatus: updatedJob.assetInstallStatus, warrantyStart: updatedJob.warrantyStart, warrantyEnd: updatedJob.warrantyEnd } } : null);
      
      // Clean local storage cache flags
      localStorage.removeItem(`hms_logistics_checklist_${selectedJob.id}`);
      localStorage.removeItem(`hms_logistics_note_${selectedJob.id}`);
      
      // Re-trigger live jobs list refresh
      await fetchJobs();
      alert(`Handover signed successfully! Warranty clocks started: ${new Date(updatedJob.warrantyStart).toLocaleDateString()}`);
    } catch (err) {
      const errorMsg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to dispatch status sync to the backend.';
      setError(errorMsg);
    } finally {
      setSyncingJobId(null);
    }
  };

  // Sync outbox when network connectivity returns
  const triggerOutboxSync = useCallback(async () => {
    const outboxKey = 'hms_logistics_pending_outbox';
    const outbox: Array<{ jobId: string; payload: unknown }> = JSON.parse(localStorage.getItem(outboxKey) || '[]');
    if (outbox.length === 0) return;

    logger.info(`Connection restored! Re-syncing ${outbox.length} pending logistics outbox jobs...`);
    let successfulCount = 0;

    for (const item of outbox) {
      try {
        await apiClient.patch(`/v1/logistics/installations/${item.jobId}/status`, item.payload);
        // Clean matching cached keys
        localStorage.removeItem(`hms_logistics_checklist_${item.jobId}`);
        localStorage.removeItem(`hms_logistics_note_${item.jobId}`);
        successfulCount++;
      } catch (err) {
        logger.error(`Failed to sync buffered job ${item.jobId}:`, err);
      }
    }

    // Clean resolved outbox items
    const remainingOutbox = outbox.slice(successfulCount);
    localStorage.setItem(outboxKey, JSON.stringify(remainingOutbox));
    
    if (successfulCount > 0) {
      await fetchJobs();
      alert(`Connection Restored: Automatically synchronized ${successfulCount} pending field handovers to EMR database!`);
    }
  }, [fetchJobs]);

  // Monitor network drops
  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      void triggerOutboxSync();
    };
    const handleOffline = () => setIsOffline(true);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [triggerOutboxSync]);

  // Math metrics for checklist completion ratios
  const phaseProgress = useMemo(() => {
    const counts = { readiness: 0, assembly: 0, commissioning: 0, handover: 0 };
    const totals = { readiness: 0, assembly: 0, commissioning: 0, handover: 0 };

    CHECKLIST_TEMPLATES.forEach(item => {
      totals[item.phase]++;
      if (checklistState[item.id]) {
        counts[item.phase]++;
      }
    });

    return { counts, totals };
  }, [checklistState]);

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* Premium Title Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-200/80 pb-5 space-y-4 md:space-y-0">
        <PageHeader 
          title="Field Service & Logistics" 
          description="Mobile-First Commissioning, Site Installation Checklists, & Handover Gates" 
        />

        {/* Offline / Online System Sync Indicator */}
        <div className="flex items-center space-x-3 self-start md:self-auto">
          {isOffline ? (
            <div className="flex items-center space-x-2 bg-amber-50 text-amber-700 border border-amber-200 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider shadow-sm animate-pulse">
              <CloudOff className="h-4 w-4" />
              <span>Offline Mode</span>
            </div>
          ) : (
            <div className="flex items-center space-x-2 bg-emerald-50 text-emerald-700 border border-emerald-200 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider shadow-sm">
              <CloudLightning className="h-4 w-4" />
              <span>Connected</span>
            </div>
          )}
          {lastSynced && (
            <span className="text-[10px] font-mono text-slate-400 uppercase">
              Synced: {lastSynced}
            </span>
          )}
          <button 
            onClick={fetchJobs}
            disabled={loading}
            className="p-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600 transition-colors shadow-sm cursor-pointer flex items-center justify-center min-h-[38px] min-w-[38px]"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin text-indigo-500' : ''}`} />
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl text-sm font-semibold flex items-center space-x-3 animate-fade-in">
          <AlertTriangle className="h-5 w-5 text-red-500" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Split Interface */}
      {loading && jobs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <RefreshCw className="h-10 w-10 text-indigo-600 animate-spin" />
          <span className="text-slate-400 text-sm font-bold uppercase tracking-widest animate-pulse">
            Loading assigned logistics jobs...
          </span>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left panel: assigned list (gloved hands compatible targets) */}
          <div className="lg:col-span-4 flex flex-col space-y-4">
            <h2 className="text-xs font-bold uppercase text-slate-400 tracking-wider">
              Assigned Installation Tasks ({jobs.length})
            </h2>

            <div className="space-y-3">
              {jobs.map((job) => (
                <button
                  key={job.id}
                  onClick={() => selectJob(job)}
                  className={`w-full p-5 rounded-2xl border transition-all duration-200 cursor-pointer text-left flex flex-col justify-between group min-h-[105px] ${
                    selectedJob?.id === job.id 
                      ? 'bg-indigo-50/60 border-indigo-200 shadow-sm shadow-indigo-100' 
                      : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50 shadow-sm'
                  }`}
                >
                  <div className="flex items-start justify-between w-full">
                    <span className="text-xs font-mono font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg">
                      ID: {job.id.substring(0, 8)}...
                    </span>
                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${
                      job.status === 'COMPLETED' 
                        ? 'bg-emerald-50 text-emerald-700' 
                        : job.status === 'IN_PROGRESS' 
                        ? 'bg-amber-50 text-amber-700' 
                        : 'bg-slate-100 text-slate-600'
                    }`}>
                      {job.status}
                    </span>
                  </div>
                  <div className="mt-3">
                    <h3 className="text-sm font-bold text-slate-800 leading-snug group-hover:text-indigo-900 transition-colors">
                      {job.asset.model}
                    </h3>
                    <p className="text-[10px] text-slate-400 font-mono mt-1 uppercase">
                      S/N: {job.asset.serialNumber}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Right panel: Active Checklist (Dynamic touch fields) */}
          {selectedJob ? (
            <div className="lg:col-span-8 card p-6 lg:p-8 space-y-8 bg-white border border-slate-200/80 shadow-sm flex flex-col">
              
              {/* Header Status Meta */}
              <div className="flex flex-col md:flex-row justify-between border-b border-slate-100 pb-5 space-y-4 md:space-y-0">
                <div>
                  <span className="text-slate-400 text-xs font-bold uppercase tracking-wider block">
                    Active Checklist View
                  </span>
                  <h2 className="text-xl font-bold text-slate-800 mt-1">
                    {selectedJob.asset.model}
                  </h2>
                  <p className="text-xs text-slate-400 font-mono mt-1 uppercase">
                    Asset Serial Code: <span className="text-slate-700 font-bold">{selectedJob.asset.serialNumber}</span>
                  </p>
                </div>

                <div className="flex flex-col items-start md:items-end justify-between">
                  <span className="text-slate-400 text-xs font-bold uppercase tracking-wider block">
                    Warranty Gating Status
                  </span>
                  {selectedJob.status === 'COMPLETED' ? (
                    <div className="flex items-center space-x-2 bg-emerald-50 text-emerald-700 border border-emerald-100 px-3 py-1.5 rounded-lg text-xs font-bold mt-1 uppercase shadow-sm">
                      <CheckCircle2 className="h-4 w-4" />
                      <span>Warranty Clock Active</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2 bg-amber-50 text-amber-700 border border-amber-100 px-3 py-1.5 rounded-lg text-xs font-bold mt-1 uppercase shadow-sm animate-pulse">
                      <Clock className="h-4 w-4" />
                      <span>Pending Handover Signature</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Dynamic Phases Group */}
              <div className="space-y-8">
                
                {/* Phase 1: Site Readiness */}
                <div>
                  <div className="text-xs font-extrabold uppercase text-indigo-600 tracking-widest border-b border-indigo-50 pb-2 mb-4 flex items-center justify-between">
                    <span>Phase 1: Site Readiness Assessment</span>
                    <span className="text-[10px] bg-indigo-50 px-2 py-0.5 rounded text-indigo-600 font-mono">
                      {phaseProgress.counts.readiness}/{phaseProgress.totals.readiness} Done
                    </span>
                  </div>
                  <div className="grid grid-cols-1 gap-3">
                    {CHECKLIST_TEMPLATES.filter(item => item.phase === 'readiness').map(item => (
                      <button
                        key={item.id}
                        onClick={() => handleToggleItem(item.id)}
                        disabled={selectedJob.status === 'COMPLETED'}
                        className={`w-full text-left p-4 border rounded-2xl transition-all duration-200 flex items-center justify-between min-h-[56px] group ${
                          selectedJob.status === 'COMPLETED' ? 'cursor-not-allowed opacity-80' : 'cursor-pointer'
                        } ${
                          checklistState[item.id] 
                            ? 'border-emerald-200 bg-emerald-50/20 hover:bg-emerald-50/30' 
                            : 'bg-slate-50 border-slate-200 hover:bg-slate-100/80 hover:border-slate-300'
                        }`}
                      >
                        <span className={`text-sm font-semibold transition-colors ${
                          checklistState[item.id] ? 'text-slate-800' : 'text-slate-600'
                        }`}>
                          {item.label}
                        </span>
                        {checklistState[item.id] ? (
                          <CheckSquare className="h-5 w-5 text-emerald-600 group-hover:scale-110 transition-transform" />
                        ) : (
                          <Square className="h-5 w-5 text-slate-400 group-hover:text-slate-600 group-hover:scale-110 transition-transform" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Phase 2: Hardware Assembly */}
                <div>
                  <div className="text-xs font-extrabold uppercase text-indigo-600 tracking-widest border-b border-indigo-50 pb-2 mb-4 flex items-center justify-between">
                    <span>Phase 2: Hardware Assembly &amp; Routing</span>
                    <span className="text-[10px] bg-indigo-50 px-2 py-0.5 rounded text-indigo-600 font-mono">
                      {phaseProgress.counts.assembly}/{phaseProgress.totals.assembly} Done
                    </span>
                  </div>
                  <div className="grid grid-cols-1 gap-3">
                    {CHECKLIST_TEMPLATES.filter(item => item.phase === 'assembly').map(item => (
                      <button
                        key={item.id}
                        onClick={() => handleToggleItem(item.id)}
                        disabled={selectedJob.status === 'COMPLETED'}
                        className={`w-full text-left p-4 border rounded-2xl transition-all duration-200 flex items-center justify-between min-h-[56px] group ${
                          selectedJob.status === 'COMPLETED' ? 'cursor-not-allowed opacity-80' : 'cursor-pointer'
                        } ${
                          checklistState[item.id] 
                            ? 'border-emerald-200 bg-emerald-50/20 hover:bg-emerald-50/30' 
                            : 'bg-slate-50 border-slate-200 hover:bg-slate-100/80 hover:border-slate-300'
                        }`}
                      >
                        <span className={`text-sm font-semibold transition-colors ${
                          checklistState[item.id] ? 'text-slate-800' : 'text-slate-600'
                        }`}>
                          {item.label}
                        </span>
                        {checklistState[item.id] ? (
                          <CheckSquare className="h-5 w-5 text-emerald-600 group-hover:scale-110 transition-transform" />
                        ) : (
                          <Square className="h-5 w-5 text-slate-400 group-hover:text-slate-600 group-hover:scale-110 transition-transform" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Phase 3: Operational Commissioning */}
                <div>
                  <div className="text-xs font-extrabold uppercase text-indigo-600 tracking-widest border-b border-indigo-50 pb-2 mb-4 flex items-center justify-between">
                    <span>Phase 3: Operational Commissioning</span>
                    <span className="text-[10px] bg-indigo-50 px-2 py-0.5 rounded text-indigo-600 font-mono">
                      {phaseProgress.counts.commissioning}/{phaseProgress.totals.commissioning} Done
                    </span>
                  </div>
                  <div className="grid grid-cols-1 gap-3">
                    {CHECKLIST_TEMPLATES.filter(item => item.phase === 'commissioning').map(item => (
                      <button
                        key={item.id}
                        onClick={() => handleToggleItem(item.id)}
                        disabled={selectedJob.status === 'COMPLETED'}
                        className={`w-full text-left p-4 border rounded-2xl transition-all duration-200 flex items-center justify-between min-h-[56px] group ${
                          selectedJob.status === 'COMPLETED' ? 'cursor-not-allowed opacity-80' : 'cursor-pointer'
                        } ${
                          checklistState[item.id] 
                            ? 'border-emerald-200 bg-emerald-50/20 hover:bg-emerald-50/30' 
                            : 'bg-slate-50 border-slate-200 hover:bg-slate-100/80 hover:border-slate-300'
                        }`}
                      >
                        <span className={`text-sm font-semibold transition-colors ${
                          checklistState[item.id] ? 'text-slate-800' : 'text-slate-600'
                        }`}>
                          {item.label}
                        </span>
                        {checklistState[item.id] ? (
                          <CheckSquare className="h-5 w-5 text-emerald-600 group-hover:scale-110 transition-transform" />
                        ) : (
                          <Square className="h-5 w-5 text-slate-400 group-hover:text-slate-600 group-hover:scale-110 transition-transform" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Phase 4: Customer Handover */}
                <div>
                  <div className="text-xs font-extrabold uppercase text-indigo-600 tracking-widest border-b border-indigo-50 pb-2 mb-4 flex items-center justify-between">
                    <span>Phase 4: Customer Handover Sign-off</span>
                    <span className="text-[10px] bg-indigo-50 px-2 py-0.5 rounded text-indigo-600 font-mono">
                      {phaseProgress.counts.handover}/{phaseProgress.totals.handover} Done
                    </span>
                  </div>
                  <div className="grid grid-cols-1 gap-3">
                    {CHECKLIST_TEMPLATES.filter(item => item.phase === 'handover').map(item => (
                      <button
                        key={item.id}
                        onClick={() => handleToggleItem(item.id)}
                        disabled={selectedJob.status === 'COMPLETED'}
                        className={`w-full text-left p-4 border rounded-2xl transition-all duration-200 flex items-center justify-between min-h-[56px] group ${
                          selectedJob.status === 'COMPLETED' ? 'cursor-not-allowed opacity-80' : 'cursor-pointer'
                        } ${
                          checklistState[item.id] 
                            ? 'border-emerald-200 bg-emerald-50/20 hover:bg-emerald-50/30' 
                            : 'bg-slate-50 border-slate-200 hover:bg-slate-100/80 hover:border-slate-300'
                        }`}
                      >
                        <span className={`text-sm font-semibold transition-colors ${
                          checklistState[item.id] ? 'text-slate-800' : 'text-slate-600'
                        }`}>
                          {item.label}
                        </span>
                        {checklistState[item.id] ? (
                          <CheckSquare className="h-5 w-5 text-emerald-600 group-hover:scale-110 transition-transform" />
                        ) : (
                          <Square className="h-5 w-5 text-slate-400 group-hover:text-slate-600 group-hover:scale-110 transition-transform" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

              </div>

              {/* Handover remarks section */}
              <div className="space-y-3 border-t border-slate-100 pt-6">
                <label className="text-slate-500 text-xs font-bold uppercase tracking-wider flex items-center space-x-2">
                  <Activity className="h-4 w-4 text-indigo-600" />
                  <span>Customer Handover Remarks &amp; Commissioning Notes</span>
                </label>
                <textarea
                  value={technicianNote}
                  onChange={handleNoteChange}
                  disabled={selectedJob.status === 'COMPLETED'}
                  rows={4}
                  placeholder={selectedJob.status === 'COMPLETED' ? "No remarks entered." : "Enter site checklist annotations, clearance logs, safety interlock logs, or department head remarks..."}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-slate-800 text-sm focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-300 focus:bg-white focus:outline-none transition-all duration-200 placeholder:text-slate-400 disabled:opacity-85 disabled:cursor-not-allowed"
                />
              </div>

              {/* Command Actions */}
              {selectedJob.status !== 'COMPLETED' && (
                <div className="flex flex-col md:flex-row gap-4 border-t border-slate-100 pt-6">
                  {selectedJob.status === 'ASSIGNED' && (
                    <button
                      onClick={() => handleSyncStatus('IN_PROGRESS')}
                      disabled={syncingJobId !== null}
                      className="flex-1 py-3 px-5 bg-slate-100 border border-slate-200 rounded-2xl text-xs font-bold text-slate-700 hover:bg-slate-200 transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer shadow-sm disabled:opacity-50"
                    >
                      <RefreshCw className={`h-4.5 w-4.5 ${syncingJobId !== null ? 'animate-spin' : ''}`} />
                      <span>Start Assembly (In Progress)</span>
                    </button>
                  )}
                  {selectedJob.status === 'IN_PROGRESS' && (
                    <button
                      onClick={() => handleSyncStatus('COMMISSIONED')}
                      disabled={syncingJobId !== null}
                      className="flex-1 py-3 px-5 bg-slate-100 border border-slate-200 rounded-2xl text-xs font-bold text-slate-700 hover:bg-slate-200 transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer shadow-sm disabled:opacity-50"
                    >
                      <ShieldCheck className={`h-4.5 w-4.5 ${syncingJobId !== null ? 'animate-spin' : ''}`} />
                      <span>Mark Commissioned</span>
                    </button>
                  )}
                  
                  <button
                    onClick={() => handleSyncStatus('COMPLETED')}
                    disabled={syncingJobId !== null}
                    className="flex-1 py-3.5 px-6 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-2xl text-sm font-bold hover:shadow-lg hover:shadow-emerald-200 hover:from-emerald-600 hover:to-teal-600 transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-emerald-100 disabled:opacity-50"
                  >
                    <UserCheck className={`h-5 w-5 ${syncingJobId !== null ? 'animate-spin' : ''}`} />
                    <span>Complete Handover &amp; Start Warranty</span>
                  </button>
                </div>
              )}

            </div>
          ) : (
            <div className="lg:col-span-8 card py-24 flex flex-col items-center justify-center space-y-3 bg-white border border-slate-200/80 shadow-sm text-center">
              <Wrench className="h-12 w-12 text-slate-300 animate-pulse" />
              <h3 className="text-base font-bold text-slate-800">No Task Selected</h3>
              <p className="text-xs text-slate-400 max-w-xs">
                Select an active installation job from the left panel to review field checklists and complete client handovers.
              </p>
            </div>
          )}

        </div>
      )}

    </div>
  );
};
