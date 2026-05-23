
import { Loader2 } from 'lucide-react';

interface LoadingStateProps {
  fullPage?: boolean;
  message?: string;
}

export const LoadingState = ({ fullPage = false, message = 'Loading resources...' }: LoadingStateProps) => {
  const content = (
    <div className="flex flex-col items-center justify-center p-8 text-center animate-fade-in">
      <div className="relative flex items-center justify-center">
        <Loader2 className="h-10 w-10 text-indigo-600 animate-spin" />
        <div className="absolute h-14 w-14 rounded-full border-2 border-indigo-500/10 border-t-indigo-500/30 animate-ping opacity-75" />
      </div>
      <p className="text-sm font-semibold text-slate-600 mt-5 tracking-wide uppercase text-[11px]">
        {message}
      </p>
    </div>
  );

  if (fullPage) {
    return (
      <div className="min-h-screen w-screen bg-[#f0f2f7] flex items-center justify-center">
        {content}
      </div>
    );
  }

  return (
    <div className="card p-12 min-h-[250px] flex items-center justify-center">
      {content}
    </div>
  );
};
