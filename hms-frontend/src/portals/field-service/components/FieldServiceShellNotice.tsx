import React from 'react';
import { Info } from 'lucide-react';

/**
 * Field Service portal notice.
 *
 * Truthful for the current state: this portal mixes live and WIP areas.
 * - LIVE: technician job assignments, job queue counts, in-progress and
 *   completed counts, and per-job status come from the live logistics
 *   backend (useFieldServiceJobs → /v1/logistics/technician/jobs).
 * - WIP / NOT YET IMPLEMENTED: GPS tracking, offline sync, signature
 *   capture, and the demo charts on the dashboard (each chart card
 *   already carries its own "DEMO" badge).
 *
 * The page-level badge and footer carry the per-page state. This notice
 * does NOT claim that all field-service data is mock — that would be
 * materially false on the live parts of the dashboard.
 */
export const FieldServiceShellNotice: React.FC = () => {
  return (
    <div
      role="status"
      data-testid="field-service-shell-notice"
      className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex gap-4 items-start shadow-sm"
    >
      <div className="p-2 bg-slate-100 rounded-xl">
        <Info className="h-5 w-5 text-slate-500" aria-hidden="true" />
      </div>
      <div>
        <h4 className="text-sm font-black text-slate-800 tracking-tight">
          Field Service Console — mixed availability
        </h4>
        <p className="text-xs text-slate-600 font-medium leading-relaxed mt-0.5">
          Some field-service areas are live-wired to the logistics backend
          (technician job assignments, job queue counts, in-progress and
          completed counts, job status, technician schedule). Other areas
          are still in progress and will be available in a future release
          (GPS tracking, offline sync, signature capture). The dashboard
          chart cards carry a per-card "DEMO" badge where data is
          placeholder. The page-level badge and footer reflect the current
          state of each specific area.
        </p>
      </div>
    </div>
  );
};

export default FieldServiceShellNotice;
