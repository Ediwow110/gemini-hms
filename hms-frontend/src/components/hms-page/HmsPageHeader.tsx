import { ReactNode } from 'react';
import { ArrowLeft } from 'lucide-react';

interface HmsPageHeaderProps {
  title: string;
  description?: string;
  badge?: string;
  onBack?: () => void;
  actions?: ReactNode;
}

export const HmsPageHeader = ({ title, description, badge, onBack, actions }: HmsPageHeaderProps) => {
  return (
    <div className="flex items-start justify-between border-b border-slate-200 pb-3 mb-3">
      <div className="flex items-start gap-3">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="mt-0.5 p-1 border border-slate-200 hover:bg-slate-50 text-slate-500 hover:text-slate-800 rounded-lg transition-all animate-fade-in"
            aria-label="Go back"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
        )}
        <div className="space-y-0.5">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-base font-bold text-slate-900 tracking-tight font-sans">{title}</h1>
            {badge && (
              <span className="inline-flex items-center rounded-lg border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-bold text-slate-600 uppercase tracking-wide font-sans">
                {badge}
              </span>
            )}
          </div>
          {description && (
            <p className="text-[12px] text-slate-500 font-normal leading-normal font-sans">{description}</p>
          )}
        </div>
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </div>
  );
};

export default HmsPageHeader;
