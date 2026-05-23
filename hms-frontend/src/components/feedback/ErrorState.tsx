
import { AlertCircle, RotateCcw } from 'lucide-react';

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export const ErrorState = ({
  title = 'An error occurred',
  message = 'We encountered an issue retrieving this data. Please verify your connection and try again.',
  onRetry,
}: ErrorStateProps) => {
  return (
    <div className="card p-8 border-rose-200/80 bg-rose-50/20 backdrop-blur-sm max-w-md mx-auto my-6 text-center animate-fade-in flex flex-col items-center justify-center">
      <div className="h-12 w-12 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 mb-4 shadow-sm animate-alert-pulse">
        <AlertCircle className="h-6 w-6" />
      </div>
      
      <h4 className="text-base font-bold text-slate-800 tracking-tight" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
        {title}
      </h4>
      <p className="text-xs text-slate-500 font-medium mt-1.5 leading-relaxed max-w-sm">
        {message}
      </p>

      {onRetry && (
        <button
          onClick={onRetry}
          className="btn btn-danger mt-5 h-10 px-4 py-2 text-xs uppercase tracking-wider gap-2 shadow-md shadow-rose-200"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          <span>Retry Operation</span>
        </button>
      )}
    </div>
  );
};
