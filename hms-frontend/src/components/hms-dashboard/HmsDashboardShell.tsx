import type { ReactNode } from 'react';

const WIDTH_TIERS: Record<string, string> = {
  compact: 'max-w-5xl',
  standard: 'max-w-7xl',
  wide: 'max-w-[1680px]',
  full: 'max-w-none',
};

interface HmsDashboardShellProps {
  toolbar?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  widthTier?: 'compact' | 'standard' | 'wide' | 'full';
  className?: string;
}

export const HmsDashboardShell = ({
  toolbar,
  children,
  footer,
  widthTier = 'wide',
  className = '',
}: HmsDashboardShellProps) => (
  <div className={`mx-auto w-full px-1 ${WIDTH_TIERS[widthTier]} ${className}`}>
    {toolbar && <div className="mb-4">{toolbar}</div>}
    <div className="flex min-w-0 flex-col gap-5">{children}</div>
    {footer && <div className="mt-5 border-t border-slate-200 pt-4">{footer}</div>}
  </div>
);

export default HmsDashboardShell;
