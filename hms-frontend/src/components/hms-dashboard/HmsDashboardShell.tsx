import type { ReactNode } from 'react';

const WIDTH_TIERS: Record<string, string> = {
  compact: 'max-w-4xl',
  standard: 'max-w-6xl',
  wide: 'max-w-[1600px]',
  full: '',
};

interface HmsDashboardShellProps {
  toolbar?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  widthTier?: 'compact' | 'standard' | 'wide' | 'full';
}

export const HmsDashboardShell = ({ toolbar, children, footer, widthTier = 'wide' }: HmsDashboardShellProps) => (
  <div className={`mx-auto px-4 py-4 ${WIDTH_TIERS[widthTier]}`}>
    {toolbar && <div className="mb-3">{toolbar}</div>}
    <div className="flex flex-col gap-3">
      {children}
    </div>
    {footer && <div className="mt-2">{footer}</div>}
  </div>
);

export default HmsDashboardShell;
