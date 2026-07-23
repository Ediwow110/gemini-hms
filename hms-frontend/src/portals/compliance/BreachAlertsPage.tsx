import React, { useState, useEffect } from 'react';
import { RefreshCw, AlertCircle } from 'lucide-react';
import { BreachAlertPanel, BreachIncident } from './components/BreachAlertPanel';
import { useBreachIncidents } from '../../hooks/use-compliance';
import { complianceService } from '../../services/compliance.service';
import { HmsDashboardShell } from '../../components/hms-dashboard';
import { HmsPageHeader } from '../../components/hms-page';

function severityToStatus(severity: string): BreachIncident['status'] {
  switch (severity) {
    case 'CRITICAL': return 'INVESTIGATING';
    case 'HIGH': return 'INVESTIGATING';
    default: return 'CONTAINED';
  }
}

export const BreachAlertsPage: React.FC = () => {
  const { incidents: hookIncidents, loading, error, refetch } = useBreachIncidents();
  const [incidents, setIncidents] = useState<BreachIncident[]>([]);
  const [breachReport, setBreachReport] = useState<Record<string, unknown> | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    if (hookIncidents.length > 0) {
      const mapped: BreachIncident[] = hookIncidents.map((h, i) => {
        const stableId = h.id || `ephi-${i}-${h.timestamp || 'unknown'}`;
        return {
          id: stableId,
          timestamp: h.timestamp,
          severity: (h.severity as BreachIncident['severity']) || 'MEDIUM',
          source: h.source || 'Audit System',
          tenantName: 'Current Tenant',
          branchName: '—',
          dataCategory: 'Audit Event',
          status: severityToStatus(h.severity),
          description: h.description,
          timeline: [{ time: h.timestamp, event: h.description }],
        };
      });
      setIncidents(mapped);
    }
  }, [hookIncidents]);

  const handleViewReport = async (id: string) => {
    setSelectedId(id);
    try {
      const report = await complianceService.getBreachReport(id);
      setBreachReport(report as Record<string, unknown>);
    } catch (err) {
      console.error('[BreachAlerts] Failed to load breach report:', err);
      setBreachReport({ error: 'Failed to load breach report' });
    }
  };

  const handleIncidentUpdate = (id: string, action: 'ESCALATE' | 'CONTAIN') => {
    setIncidents(prev => prev.map(inc => {
      if (inc.id === id) {
        return {
          ...inc,
          status: action === 'ESCALATE' ? 'ESCALATED' as const : 'CONTAINED' as const,
          timeline: [
            ...inc.timeline,
            {
              time: new Date().toLocaleTimeString(),
              event: action === 'ESCALATE' ? 'Escalated to CISO response chain' : 'Marked as contained',
            },
          ],
        };
      }
      return inc;
    }));
  };

  const activeCritical = incidents.filter(i => i.severity === 'CRITICAL' && i.status !== 'CONTAINED').length;
  const activeHigh = incidents.filter(i => i.severity === 'HIGH' && i.status !== 'CONTAINED').length;
  const totalContained = incidents.filter(i => i.status === 'CONTAINED').length;

  return (
    <HmsDashboardShell widthTier="full">
      <HmsPageHeader
        title="Breach & Incident Management"
        description="Security events detected by real-time audit analysis and HIPAA breach reporting"
        actions={(
          <button
            onClick={refetch}
            className="py-1.5 px-3 border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl flex items-center gap-1.5"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </button>
        )}
      />

      {error && (
        <div
          role="alert"
          className="card p-4 bg-rose-50 border border-rose-200 shadow-sm rounded-2xl flex items-start gap-3"
          data-testid="breach-error-banner"
        >
          <AlertCircle className="h-5 w-5 text-rose-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-rose-800">
              Failed to load breach incidents
            </p>
            <p className="text-xs text-rose-700 mt-0.5 break-words">
              {error}
            </p>
            <button
              onClick={refetch}
              className="mt-2 inline-flex items-center gap-1.5 text-xs font-bold text-rose-700 hover:text-rose-900 px-2.5 py-1 rounded-lg border border-rose-200 hover:bg-rose-100 transition-colors"
            >
              <RefreshCw className="h-3 w-3" />
              Retry
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card p-4 bg-white border border-slate-200/80 shadow-sm rounded-2xl text-center">
          <div className="text-2xl font-extrabold text-slate-900">{incidents.length}</div>
          <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mt-1">Total Events</div>
        </div>
        <div className="card p-4 bg-white border border-rose-200/80 shadow-sm rounded-2xl text-center">
          <div className="text-2xl font-extrabold text-rose-600">{activeCritical}</div>
          <div className="text-[10px] text-rose-500 uppercase font-bold tracking-wider mt-1">Active Critical</div>
        </div>
        <div className="card p-4 bg-white border border-amber-200/80 shadow-sm rounded-2xl text-center">
          <div className="text-2xl font-extrabold text-amber-600">{activeHigh}</div>
          <div className="text-[10px] text-amber-500 uppercase font-bold tracking-wider mt-1">Active High</div>
        </div>
        <div className="card p-4 bg-white border border-emerald-200/80 shadow-sm rounded-2xl text-center">
          <div className="text-2xl font-extrabold text-emerald-600">{totalContained}</div>
          <div className="text-[10px] text-emerald-500 uppercase font-bold tracking-wider mt-1">Contained</div>
        </div>
      </div>

      {loading ? (
        <div className="card p-8 bg-white border border-slate-200/80 shadow-sm rounded-2xl text-center">
          <div className="animate-pulse space-y-3">
            {[1,2,3].map(i => <div key={i} className="h-12 bg-slate-100 rounded-xl" />)}
          </div>
        </div>
      ) : (
        <BreachAlertPanel
          incidents={incidents}
          onIncidentUpdate={handleIncidentUpdate}
          onViewReport={handleViewReport}
        />
      )}

      {breachReport && selectedId && (
        <div className="card p-6 bg-white border border-slate-200/80 shadow-sm rounded-2xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800">HIPAA Breach Report — {selectedId}</h3>
            <button
              onClick={() => { setBreachReport(null); setSelectedId(null); }}
              className="text-xs text-slate-400 hover:text-slate-600"
            >
              Close
            </button>
          </div>
          <pre className="text-xs font-mono bg-slate-50 p-4 rounded-xl border border-slate-100 overflow-auto max-h-96">
            {JSON.stringify(breachReport, null, 2)}
          </pre>
        </div>
      )}
    </HmsDashboardShell>
  );
};

export default BreachAlertsPage;
