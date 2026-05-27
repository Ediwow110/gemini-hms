import { AlertTriangle, RefreshCw } from 'lucide-react';

interface AnalyticsErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
}

export const AnalyticsErrorState = ({
  title = 'Unable to load analytics',
  description = 'The dashboard data source did not respond. Refresh or try again later.',
  onRetry,
}: AnalyticsErrorStateProps) => (
  <div role="alert" className="rounded-2xl border border-rose-100 bg-rose-50 p-6 text-center text-rose-800">
    <AlertTriangle className="mx-auto mb-3 h-7 w-7 text-rose-600" aria-hidden="true" />
    <p className="text-sm font-black">{title}</p>
    <p className="mx-auto mt-1 max-w-md text-xs font-medium text-rose-700">{description}</p>
    {onRetry && (
      <button
        type="button"
        onClick={onRetry}
        className="mt-4 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-rose-200 bg-white px-4 py-2 text-xs font-black text-rose-700 hover:bg-rose-50"
      >
        <RefreshCw className="h-4 w-4" aria-hidden="true" />
        Retry
      </button>
    )}
  </div>
);

export default AnalyticsErrorState;
