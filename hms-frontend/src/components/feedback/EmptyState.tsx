import React from 'react';
import { Inbox } from 'lucide-react';

interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: React.ElementType;
  action?: React.ReactNode;
}

export const EmptyState = ({
  title = 'No records found',
  description = 'There are no items matching this criteria currently.',
  icon: Icon = Inbox,
  action,
}: EmptyStateProps) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center max-w-sm mx-auto my-6 animate-fade-in">
      <div className="h-14 w-14 rounded-2xl bg-slate-50 border border-slate-200/60 flex items-center justify-center text-slate-400 mb-4 shadow-sm animate-float">
        <Icon className="h-7 w-7" />
      </div>
      <h4 className="text-base font-bold text-slate-800 tracking-tight" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
        {title}
      </h4>
      <p className="text-xs text-slate-500 font-medium mt-1 leading-relaxed">
        {description}
      </p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
};
