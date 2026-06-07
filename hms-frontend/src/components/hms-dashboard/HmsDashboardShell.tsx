import type { ReactNode } from 'react';

interface HmsDashboardShellProps {
  toolbar?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  maxWidth?: 'full' | '1440';
}

export const HmsDashboardShell = ({ toolbar, children, footer, maxWidth = '1440' }: HmsDashboardShellProps) => (
  <div className={`mx-auto px-4 py-4 ${maxWidth === '1440' ? 'max-w-[1440px]' : ''}`}>
    {toolbar && <div className="mb-3">{toolbar}</div>}
    <div className="flex flex-col gap-3">
      {children}
    </div>
    {footer && <div className="mt-2">{footer}</div>}
  </div>
);

export default HmsDashboardShell;
