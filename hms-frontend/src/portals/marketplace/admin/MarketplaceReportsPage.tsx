import React from 'react';
import MarketplaceAdminShellNotice from './components/MarketplaceAdminShellNotice';
import { MarketplaceReportsPageShell } from './components/MarketplaceReportCard';

export const MarketplaceReportsPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <MarketplaceAdminShellNotice />
      <MarketplaceReportsPageShell />
    </div>
  );
};

export default MarketplaceReportsPage;
