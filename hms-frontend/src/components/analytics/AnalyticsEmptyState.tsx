import { Inbox } from 'lucide-react';

interface AnalyticsEmptyStateProps {
  title?: string;
  description?: string;
}

export const AnalyticsEmptyState = ({
  title = 'No analytics data available',
  description = 'Adjust filters or refresh when source data becomes available.',
}: AnalyticsEmptyStateProps) => (
  <div className="flex min-h-40 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 p-6 text-center">
    <Inbox className="mb-3 h-7 w-7 text-slate-300" aria-hidden="true" />
    <p className="text-sm font-black text-slate-700">{title}</p>
    <p className="mt-1 max-w-sm text-xs font-medium text-slate-500">{description}</p>
  </div>
);

export default AnalyticsEmptyState;
