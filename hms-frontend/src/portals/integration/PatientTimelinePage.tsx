import React, { useState } from 'react';
import { Stethoscope, Activity, FlaskConical, Pill, DollarSign, MessageSquare, AlertTriangle, UserSearch } from 'lucide-react';
import IntegrationShellNotice from './components/IntegrationShellNotice';
import PatientTimelineEvent from './components/PatientTimelineEvent';
import { useIntegrationPatientTimeline } from '../../hooks/use-integration';

export const PatientTimelinePage: React.FC = () => {
  const [patientId, setPatientId] = useState('PAT-123'); // Default mock ID
  const { data: events, isLoading, error } = useIntegrationPatientTimeline(patientId);

  // Explicitly filter out restricted events (Defense in depth)
  const safeEvents = (events || []).filter(e => !e.isRestricted);
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-800 tracking-tight">Patient Timeline</h2>
          <p className="text-xs text-slate-500 font-medium">Cross-domain patient event aggregation (shell)</p>
        </div>
      </div>

      <IntegrationShellNotice />

      <div className="bg-white border border-slate-200 rounded-3xl p-5 flex items-center gap-4">
        <UserSearch className="h-5 w-5 text-slate-400" />
        <input 
          type="text" 
          placeholder="Select patient (shell placeholder)..." 
          value={patientId}
          onChange={(e) => setPatientId(e.target.value)}
          className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none" 
        />
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex gap-3 items-start">
        <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
        <div>
          <p className="text-xs font-bold text-amber-900">Released-Only Patient-Facing Notice</p>
          <p className="text-[10px] text-amber-700 font-medium mt-0.5">Patient-facing views show only released lab results. Internal clinical notes, SOAP notes, unreleased results, and staff actions are not exposed. No real aggregation is performed in this phase.</p>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-2">
        <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest mb-6">Patient Timeline Events</h3>
        
        {isLoading && patientId ? (
          <div className="p-10 text-center text-sm font-medium text-slate-500">Loading patient timeline...</div>
        ) : error ? (
          <div className="p-10 text-center text-sm font-bold text-rose-500">
            {(error as { response?: { status: number } })?.response?.status === 401 || (error as { response?: { status: number } })?.response?.status === 403 
              ? 'Unauthorized to view patient timeline.' 
              : 'Failed to load patient timeline.'}
          </div>
        ) : patientId && safeEvents.length === 0 ? (
          <div className="p-10 text-center text-sm font-medium text-slate-500">No public events found for patient.</div>
        ) : (
          safeEvents.map(e => (
            <PatientTimelineEvent 
              key={e.id}
              type={e.eventType} 
              title={e.title} 
              timestamp={new Date(e.timestamp).toLocaleString()} 
              details={e.summary} 
              icon={e.eventType === 'ENCOUNTER' ? Stethoscope : e.eventType === 'VITALS' ? Activity : e.eventType === 'LAB' ? FlaskConical : e.eventType === 'PRESCRIPTION' ? Pill : e.eventType === 'BILLING' ? DollarSign : MessageSquare} 
              color={e.eventType === 'ENCOUNTER' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : e.eventType === 'VITALS' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-blue-50 text-blue-600 border-blue-100'} 
              restricted={e.isRestricted}
              isMock={e.isMock}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default PatientTimelinePage;
