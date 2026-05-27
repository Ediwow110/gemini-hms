import AnalyticsEmptyState from '../AnalyticsEmptyState';
import AnalyticsSkeleton from '../AnalyticsSkeleton';
import type { FunnelStep } from '../../../types/analytics';

interface FunnelStepsProps {
  data: FunnelStep[];
  title?: string;
  description?: string;
  loading?: boolean;
}

export const FunnelSteps = ({ data, title = 'Workflow funnel', description, loading }: FunnelStepsProps) => {
  if (loading) return <AnalyticsSkeleton cards={0} charts={1} tableRows={0} />;
  if (data.length === 0) return <AnalyticsEmptyState title="No funnel data" />;

  const max = Math.max(...data.map(step => step.value), 1);

  return (
    <div role="img" aria-label={`${title}${description ? `. ${description}` : ''}`} className="space-y-3">
      {data.map((step, index) => {
        const width = Math.max(12, (step.value / max) * 100);
        return (
          <div key={step.label} className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
            <div className="mb-2 flex items-center justify-between gap-3 text-xs">
              <span className="font-black text-slate-800">{index + 1}. {step.label}</span>
              <span className="font-black text-indigo-700">{step.value}</span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-white">
              <div className="h-full rounded-full bg-indigo-600" style={{ width: `${width}%` }} />
            </div>
            {step.description && <p className="mt-2 text-[11px] font-medium text-slate-500">{step.description}</p>}
          </div>
        );
      })}
    </div>
  );
};

export default FunnelSteps;
