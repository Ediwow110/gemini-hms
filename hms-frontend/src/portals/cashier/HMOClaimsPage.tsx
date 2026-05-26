import { PageHeader } from '../../components/ui/page-header';
import { AlertTriangle } from 'lucide-react';

export const HMOClaimsPage = () => {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-start justify-between">
        <PageHeader
          title="HMO Claims (WIP)"
          description="Insurance claims management for health maintenance organization billing"
        />
      </div>

      {/* WIP Banner */}
      <div className="p-4 bg-amber-50 border border-amber-150 rounded-2xl flex gap-3 text-xs text-amber-800">
        <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
        <div>
          <h5 className="font-extrabold uppercase text-[10px] tracking-wider">HMO Claims (WIP)</h5>
          <p className="font-medium mt-0.5">
            HMO/insurance claims processing is currently under development. Claims submission, LOA tracking, and PhilHealth/ HMO integrations are not yet available. Please process claims through your external HMO portal.
          </p>
        </div>
      </div>

      {/* Empty state */}
      <div className="card bg-white border border-slate-200/80 shadow-sm rounded-2xl p-12 text-center text-slate-400 space-y-3">
        <AlertTriangle className="h-10 w-10 mx-auto text-slate-300" />
        <p className="text-sm font-bold text-slate-600">HMO claims not yet available</p>
        <p className="text-xs text-slate-450 max-w-md mx-auto leading-relaxed">
          Insurance claims management is under development. Please use external HMO portals for claim submission and tracking.
        </p>
      </div>
    </div>
  );
};

export default HMOClaimsPage;
