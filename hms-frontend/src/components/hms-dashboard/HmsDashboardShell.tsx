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
  <div className={`mx-auto w-full ${WIDTH_TIERS[widthTier]} ${className}`}>
    {toolbar && <div className="mb-5">{toolbar}</div>}
    <div className="flex min-w-0 flex-col gap-6">{children}</div>
    {footer && <div className="mt-6">{footer}</div>}
  </div>
);

export default HmsDashboardShell;
