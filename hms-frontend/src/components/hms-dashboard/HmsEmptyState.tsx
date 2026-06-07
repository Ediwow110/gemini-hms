import type { ReactNode } from 'react';

interface HmsEmptyStateProps {
  title?: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
}

export const HmsEmptyState = ({
  title = 'No items',
  description = 'There are no items to display.',
  icon,
  action,
}: HmsEmptyStateProps) => (
  <div className="flex flex-col items-center justify-center p-4 text-center">
    {icon && <div className="mb-2 text-slate-300">{icon}</div>}
    <p className="text-[13px] font-semibold text-slate-500">{title}</p>
    <p className="mt-0.5 text-[12px] text-slate-400">{description}</p>
    {action && <div className="mt-3">{action}</div>}
  </div>
);

export default HmsEmptyState;
