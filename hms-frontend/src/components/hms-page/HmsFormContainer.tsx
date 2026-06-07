import { ReactNode } from 'react';

interface HmsFormContainerProps {
  title?: string;
  description?: string;
  onSubmit?: (e: React.FormEvent) => void;
  children: ReactNode;
  actions?: ReactNode;
  error?: string | null;
  success?: string | null;
  columns?: 1 | 2 | 3 | 4;
}

export const HmsFormContainer = ({
  title,
  description,
  onSubmit,
  children,
  actions,
  error,
  success,
  columns = 2,
}: HmsFormContainerProps) => {
  const colClasses = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
  };

  const formContent = (
    <div className="space-y-4">
      {(title || description) && (
        <div className="border-b border-slate-200 pb-2.5 mb-2.5">
          {title && <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider font-sans">{title}</h3>}
          {description && <p className="text-[11px] text-slate-500 mt-0.5 font-sans">{description}</p>}
        </div>
      )}
      <div className={`grid gap-3 ${colClasses[columns]}`}>
        {children}
      </div>
      
      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs font-semibold uppercase tracking-wide font-sans">
          {error}
        </div>
      )}

      {success && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-700 text-xs font-semibold uppercase tracking-wide font-sans">
          {success}
        </div>
      )}

      {actions && (
        <div className="flex items-center justify-between border-t border-slate-100 pt-3 mt-3">
          {actions}
        </div>
      )}
    </div>
  );

  if (onSubmit) {
    return (
      <form onSubmit={onSubmit} className="bg-white border border-slate-200 p-4 rounded-lg shadow-sm space-y-4">
        {formContent}
      </form>
    );
  }

  return (
    <div className="bg-white border border-slate-200 p-4 rounded-lg shadow-sm space-y-4">
      {formContent}
    </div>
  );
};

export default HmsFormContainer;
