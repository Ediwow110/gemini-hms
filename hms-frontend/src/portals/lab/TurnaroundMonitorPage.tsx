import { useState } from 'react';
import { PageHeader } from '../../components/ui/page-header';
import { useTurnaroundMetrics } from '../../hooks/use-lab';
import {
  TrendingUp,
  Clock,
  AlertTriangle,
  BarChart3,
  ClipboardList,
  Loader2,
  XCircle,
} from 'lucide-react';

export const TurnaroundMonitorPage = () => {
  const { data, isLoading, error } = useTurnaroundMetrics();
  const [showDetail, setShowDetail] = useState(false);

  const overallAvgMinutes = data
    ? data.metrics
        .filter((m) => m.field === 'specimenToRelease' && m.averageMinutes !== null)
        .reduce((_, m) => m.averageMinutes || 0, 0)
    : null;

  return (
    <div className="space-y-6 animate-fade-in">
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

      <PageHeader
        title="Lab Turnaround Time (TAT) Monitor"
        description="Real TAT metrics computed from lab order, specimen, and result lifecycle timestamps."
      />

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-semibold flex items-center gap-2">
          <XCircle className="h-4 w-4 text-rose-600" />
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="card p-12 bg-white border border-slate-200/80 shadow-sm rounded-2xl text-center space-y-3">
          <Loader2 className="h-8 w-8 text-indigo-500 mx-auto animate-spin" />
          <p className="text-sm font-semibold text-slate-500 animate-pulse">Computing turnaround metrics...</p>
        </div>
      ) : !data ? (
        <div className="card p-12 bg-white border border-slate-200/80 shadow-sm rounded-2xl text-center space-y-3">
          <XCircle className="h-8 w-8 text-slate-400 mx-auto" />
          <p className="text-sm font-semibold text-slate-600">No TAT data available</p>
          <p className="text-xs text-slate-400">Unable to load turnaround metrics from the backend.</p>
        </div>
      ) : data.totalResults === 0 ? (
        <div className="card p-12 bg-white border border-slate-200/80 shadow-sm rounded-2xl text-center space-y-3">
          <Clock className="h-8 w-8 text-slate-400 mx-auto" />
          <p className="text-sm font-semibold text-slate-600">No lab results yet</p>
          <p className="text-xs text-slate-400">No lab results exist for this branch. TAT metrics will become available once results are processed.</p>
        </div>
      ) : (
        <>
          {/* High-level TAT overview cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="card p-5 bg-white border border-slate-200/80 shadow-sm rounded-2xl flex items-center gap-4">
              <div className="p-3.5 bg-indigo-50 text-indigo-700 rounded-2xl border border-indigo-100">
                <TrendingUp className="h-6 w-6" />
              </div>
              <div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Results Analyzed</span>
                <span className="text-xl font-black text-slate-800">{data.totalResults}</span>
                <p className="text-[9px] text-slate-400 font-semibold mt-0.5">
                  {data.releasedCount} released, {data.pendingCount} in progress
                </p>
              </div>
            </div>

            <div className="card p-5 bg-white border border-slate-200/80 shadow-sm rounded-2xl flex items-center gap-4">
              <div className="p-3.5 bg-blue-50 text-blue-700 rounded-2xl border border-blue-100">
                <Clock className="h-6 w-6" />
              </div>
              <div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Avg Specimen → Release</span>
                <span className="text-xl font-black text-slate-800">
                  {overallAvgMinutes !== null ? `${overallAvgMinutes} min` : 'N/A'}
                </span>
                <p className="text-[9px] text-slate-400 font-semibold mt-0.5">Core lab processing TAT</p>
              </div>
            </div>

            <div className="card p-5 bg-slate-50 border border-slate-200/60 shadow-sm rounded-2xl flex items-center gap-4">
              <div className="p-3.5 bg-slate-100 text-slate-600 rounded-2xl border border-slate-200">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Missing Timestamps</span>
                <span className="text-xl font-black text-slate-800">
                  {data.metrics.reduce((s, m) => s + m.missingTimestampCount, 0)}
                </span>
                <p className="text-[9px] text-slate-400 font-semibold mt-0.5">Entries with incomplete data</p>
              </div>
            </div>
          </div>

          {/* Detail metrics */}
          <div className="card overflow-hidden bg-white border border-slate-200/80 shadow-sm rounded-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 text-slate-455 font-black uppercase tracking-wider border-b border-slate-150">
                    <th className="px-6 py-4">Metric</th>
                    <th className="px-6 py-4">Count</th>
                    <th className="px-6 py-4">Avg (min)</th>
                    <th className="px-6 py-4">Min (min)</th>
                    <th className="px-6 py-4">Max (min)</th>
                    <th className="px-6 py-4">Missing</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-semibold text-slate-655">
                  {data.metrics.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-slate-400 text-xs font-bold">
                        No metrics available — insufficient lifecycle data.
                      </td>
                    </tr>
                  ) : (
                    data.metrics.map((m) => (
                      <tr key={m.field} className="hover:bg-slate-50/30">
                        <td className="px-6 py-4 font-bold text-slate-800">{m.label}</td>
                        <td className="px-6 py-4">{m.count}</td>
                        <td className="px-6 py-4 font-mono">
                          {m.averageMinutes !== null ? `${m.averageMinutes}` : '—'}
                        </td>
                        <td className="px-6 py-4 font-mono">
                          {m.minMinutes !== null ? `${m.minMinutes}` : '—'}
                        </td>
                        <td className="px-6 py-4 font-mono">
                          {m.maxMinutes !== null ? `${m.maxMinutes}` : '—'}
                        </td>
                        <td className="px-6 py-4">
                          {m.missingTimestampCount > 0 ? (
                            <span className="text-amber-600 font-bold">{m.missingTimestampCount}</span>
                          ) : (
                            <span className="text-slate-300">0</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Detail rows toggle */}
          {data.detailRows.length > 0 && (
            <>
              <button
                onClick={() => setShowDetail(!showDetail)}
                className="btn border border-slate-200 text-slate-650 hover:bg-slate-50 text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-2"
              >
                <BarChart3 className="h-3.5 w-3.5" />
                {showDetail ? 'Hide' : 'Show'} Recent Results ({data.detailRows.length})
              </button>

              {showDetail && (
                <div className="card overflow-hidden bg-white border border-slate-200/80 shadow-sm rounded-2xl">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-50/80 text-slate-455 font-black uppercase tracking-wider border-b border-slate-150">
                          <th className="px-4 py-3">Order</th>
                          <th className="px-4 py-3">Patient</th>
                          <th className="px-4 py-3">Status</th>
                          <th className="px-4 py-3">Specimen→Release</th>
                          <th className="px-4 py-3">Missing Fields</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-semibold text-slate-655">
                        {data.detailRows.map((r) => {
                          const missingFields = [];
                          if (!r.specimenReceivedAt) missingFields.push('Specimen');
                          if (!r.encodedAt) missingFields.push('Encoded');
                          if (!r.validatedAt) missingFields.push('Validated');
                          if (!r.releasedAt) missingFields.push('Released');

                          return (
                            <tr key={r.resultId} className="hover:bg-slate-50/30">
                              <td className="px-4 py-3 font-mono text-[10px] text-indigo-600">{r.orderNumber}</td>
                              <td className="px-4 py-3">
                                <span className="font-bold text-slate-800">{r.patientName}</span>
                                {r.testNames && r.testNames.length > 0 && (
                                  <p className="text-[10px] text-slate-400 font-medium">{r.testNames.slice(0, 2).join(', ')}{r.testNames.length > 2 ? '...' : ''}</p>
                                )}
                              </td>
                              <td className="px-4 py-3">
                                <span className="text-[10px] font-bold uppercase">{r.status}</span>
                              </td>
                              <td className="px-4 py-3 font-mono">
                                {r.specimenToReleaseMinutes !== null
                                  ? `${r.specimenToReleaseMinutes} min`
                                  : '—'}
                              </td>
                              <td className="px-4 py-3">
                                {missingFields.length > 0 ? (
                                  <span className="text-[10px] text-amber-600 font-medium">
                                    {missingFields.join(', ')}
                                  </span>
                                ) : (
                                  <span className="text-[10px] text-emerald-600">Complete</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Info box */}
          <div className="p-4 bg-indigo-50/20 border border-indigo-100/60 rounded-2xl text-xs text-indigo-800 font-semibold space-y-1">
            <h4 className="font-bold text-indigo-900 uppercase tracking-wider text-[10px] flex items-center gap-1">
              <ClipboardList className="h-3.5 w-3.5" />
              TAT Metric Sources
            </h4>
            <p className="text-[10.5px] leading-relaxed">
              Metrics are computed from real lifecycle timestamps only. <strong>Specimen→Release</strong> uses LabSpecimen.receivedAt to LabResult.releasedAt. <strong>Order→Release</strong> uses Order.createdAt to LabResult.releasedAt. Missing timestamps are represented honestly — no fabricated data.
            </p>
            <p className="text-[10px] text-indigo-600 font-bold mt-1">
              Full LIS analytics, SLA policy engine, predictive analytics, and analyzer integration remain out of scope.
            </p>
          </div>
        </>
      )}
    </div>
  );
};

export default TurnaroundMonitorPage;
