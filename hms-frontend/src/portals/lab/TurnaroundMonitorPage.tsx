import { useState } from 'react';
import { 
  HmsDashboardShell, 
  HmsToolbar, 
  HmsAuditFooter, 
  HmsKpiStrip, 
  HmsDrilldownTable, 
  HmsLoadingSkeleton,
  HmsDataUnavailable
} from '../../components/hms-dashboard';
import { HmsPageHeader } from '../../components/hms-page';
import { useTurnaroundMetrics } from '../../hooks/use-lab';
import {
  Clock,
  AlertTriangle,
  BarChart3,
  ClipboardList,
} from 'lucide-react';

export const TurnaroundMonitorPage = () => {
  const { data, isLoading, error, refetch } = useTurnaroundMetrics();
  const [showDetail, setShowDetail] = useState(false);

  const overallAvgMinutes = data
    ? data.metrics.find((m) => m.field === 'specimenToRelease')?.averageMinutes ?? null
    : null;

  if (error) {
    return (
      <HmsDashboardShell>
        <HmsPageHeader
          title="Lab Turnaround Time (TAT) Monitor"
          description="Real TAT metrics computed from lab order, specimen, and result lifecycle timestamps."
          badge="Operational Audit"
        />
        <HmsDataUnavailable
          sectionName="TAT Monitor"
          expectedApi="GET /api/v1/lab/turnaround"
        />
      </HmsDashboardShell>
    );
  }

  return (
    <HmsDashboardShell
      toolbar={
        <HmsToolbar>
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-black uppercase text-indigo-700 bg-indigo-50 border border-indigo-150 px-2 py-0.5 rounded-md">
              Real-Time LIS Analytics
            </span>
            <div className="flex-grow" />
            <button
              type="button"
              onClick={() => void refetch()}
              disabled={isLoading}
              className="min-h-9 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoading ? 'Recalculating…' : 'Recalculate metrics'}
            </button>
          </div>
        </HmsToolbar>
      }
      footer={<HmsAuditFooter dataSource="useTurnaroundMetrics → GET /api/v1/lab/turnaround" />}
    >
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <HmsPageHeader
          title="Lab Turnaround Time (TAT) Monitor"
          description="Real TAT metrics computed from lab order, specimen, and result lifecycle timestamps."
        />
        <div className="flex items-center gap-2">
           <span className="text-[10px] font-black uppercase text-amber-700 bg-amber-50 border border-amber-150 px-3 py-1 rounded-full">
            Clinical Efficiency Audit
          </span>
        </div>
      </div>

      {/* Mock/WIP Warning Banner */}
      <div className="p-4 bg-amber-50 border border-amber-150 rounded-2xl flex gap-3 text-xs text-amber-800">
        <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
        <div>
          <h5 className="font-extrabold uppercase text-[10px] tracking-wider">Lab Turnaround Time Monitor (Real — Partial)</h5>
          <p className="font-medium mt-0.5">
            TAT metrics are computed from real lifecycle timestamps. No SLA targets, no predictive analytics, no policy engine. Missing timestamps are shown honestly.
          </p>
        </div>
      </div>

      {isLoading ? (
        <HmsLoadingSkeleton rows={8} />
      ) : !data || data.totalResults === 0 ? (
        <div className="card p-12 bg-white border border-slate-200/80 shadow-sm rounded-2xl text-center space-y-3">
          <Clock className="h-8 w-8 text-slate-400 mx-auto" />
          <p className="text-sm font-semibold text-slate-600">No lab results yet</p>
          <p className="text-xs text-slate-400">No lab results exist for this branch. TAT metrics will become available once results are processed.</p>
        </div>
      ) : (
        <>
          <HmsKpiStrip
            metrics={[
              {
                id: 'results-analyzed',
                label: "Results Analyzed",
                value: data.totalResults.toString(),
                trend: { direction: "flat", value: "Current" },
                severity: "info"
              },
              {
                id: 'avg-tat',
                label: "Avg Specimen → Release",
                value: overallAvgMinutes !== null ? `${overallAvgMinutes} min` : 'N/A',
                trend: { direction: "flat", value: "Avg" },
                severity: "info"
              },
              {
                id: 'missing-timestamps',
                label: "Missing Timestamps",
                value: data.metrics.reduce((s, m) => s + m.missingTimestampCount, 0).toString(),
                trend: { direction: "up", value: "Data Gaps" },
                severity: "warning"
              }
            ]}
          />

          <HmsDrilldownTable
            title="Operational Performance Metrics"
            description="Breakdown of turnaround time by lifecycle stage"
            keyExtractor={(m) => m.field}
            data={data.metrics}
            columns={[
              {
                key: 'label',
                header: 'Metric Stage',
                render: (m) => <span className="font-bold text-slate-800">{m.label}</span>
              },
              {
                key: 'count',
                header: 'Sample Size',
                render: (m) => m.count
              },
              {
                key: 'avg',
                header: 'Avg (min)',
                render: (m) => <span className="font-mono font-bold text-indigo-600">{m.averageMinutes !== null ? m.averageMinutes : '—'}</span>
              },
              {
                key: 'min',
                header: 'Min (min)',
                render: (m) => <span className="font-mono text-slate-500">{m.minMinutes !== null ? m.minMinutes : '—'}</span>
              },
              {
                key: 'max',
                header: 'Max (min)',
                render: (m) => <span className="font-mono text-slate-500">{m.maxMinutes !== null ? m.maxMinutes : '—'}</span>
              },
              {
                key: 'missing',
                header: 'Incomplete',
                render: (m) => (
                  m.missingTimestampCount > 0 ? (
                    <span className="text-amber-600 font-black">{m.missingTimestampCount}</span>
                  ) : (
                    <span className="text-slate-300">0</span>
                  )
                )
              }
            ]}
          />

          {data.detailRows.length > 0 && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                 <button
                  onClick={() => setShowDetail(!showDetail)}
                  className="btn bg-white border border-slate-200 text-slate-650 hover:bg-slate-50 text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-2 shadow-sm transition-all"
                >
                  <BarChart3 className="h-3.5 w-3.5" />
                  {showDetail ? 'Collapse Detail Registry' : `Show Detail Registry (${data.detailRows.length} rows)`}
                </button>
              </div>

              {showDetail && (
                <HmsDrilldownTable
                  title="Raw TAT Registry"
                  description="Individual order lifecycle analysis"
                  keyExtractor={(r) => r.resultId}
                  data={data.detailRows}
                  columns={[
                    {
                      key: 'order',
                      header: 'Order Ref',
                      render: (r) => <span className="font-mono text-[10px] text-indigo-600 font-black">{r.orderNumber}</span>
                    },
                    {
                      key: 'patient',
                      header: 'Patient Profile',
                      render: (r) => (
                        <div className="space-y-0.5">
                          <p className="font-black text-slate-800">{r.patientName}</p>
                          {r.testNames && r.testNames.length > 0 && (
                            <p className="text-[10px] text-slate-400 font-medium truncate max-w-[150px]">
                              {r.testNames.join(', ')}
                            </p>
                          )}
                        </div>
                      )
                    },
                    {
                      key: 'status',
                      header: 'Status',
                      render: (r) => <span className="text-[10px] font-black uppercase text-slate-500">{r.status}</span>
                    },
                    {
                      key: 'tat',
                      header: 'Proc. TAT',
                      render: (r) => (
                        <span className="font-mono font-bold text-slate-700">
                          {r.specimenToReleaseMinutes !== null ? `${r.specimenToReleaseMinutes}m` : '—'}
                        </span>
                      )
                    },
                    {
                      key: 'missing',
                      header: 'Data Health',
                      render: (r) => {
                        const missingFields = [];
                        if (!r.specimenReceivedAt) missingFields.push('Specimen');
                        if (!r.encodedAt) missingFields.push('Encoded');
                        if (!r.validatedAt) missingFields.push('Validated');
                        if (!r.releasedAt) missingFields.push('Released');
                        
                        return missingFields.length > 0 ? (
                          <span className="text-[9px] text-amber-600 font-black uppercase bg-amber-50 px-1.5 py-0.5 rounded border border-amber-100">
                            Missing: {missingFields.join(', ')}
                          </span>
                        ) : (
                          <span className="text-[9px] text-emerald-600 font-black uppercase bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">
                            Complete
                          </span>
                        );
                      }
                    }
                  ]}
                />
              )}
            </div>
          )}

          {/* Info box */}
          <div className="p-5 bg-indigo-50/20 border border-indigo-100/60 rounded-3xl text-xs text-indigo-800 font-semibold space-y-2">
            <h4 className="font-black text-indigo-900 uppercase tracking-wider text-[10px] flex items-center gap-1.5">
              <ClipboardList className="h-4 w-4" />
              TAT Metric Sources & Limitations
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <p className="text-[10.5px] leading-relaxed">
                Metrics are computed from real lifecycle timestamps only. <strong>Specimen→Release</strong> uses LabSpecimen.receivedAt to LabResult.releasedAt. <strong>Order→Release</strong> uses Order.createdAt to LabResult.releasedAt.
              </p>
              <p className="text-[10.5px] leading-relaxed text-indigo-600/80">
                Full LIS analytics, SLA policy engine, predictive analytics, and analyzer integration remain out of scope. Missing timestamps are represented honestly — no fabricated data.
              </p>
            </div>
          </div>
        </>
      )}
    </HmsDashboardShell>
  );
};

export default TurnaroundMonitorPage;
