import React from 'react';
import { useItSupport } from '../../hooks/use-it-support';
import { useUser } from '../../hooks/use-user';
import { IntegrationStatusCard, IntegrationItem } from './components/IntegrationStatusCard';
import { HmsPageHeader } from '../../components/hms-page';
import { HmsDashboardShell, HmsAuditFooter } from '../../components/hms-dashboard';

export const IntegrationsPage: React.FC = () => {
  const user = useUser();
  const branchId = (user as any)?.primaryBranchId;
  const { integrations, isLoading } = useItSupport(branchId);

  if (!branchId) return <div className="p-10 text-center text-slate-500">No primary branch assigned.</div>;
  if (isLoading) return <div className="p-10 text-center text-slate-400">Loading integrations...</div>;

  return (
    <HmsDashboardShell widthTier="full">
      <div className="space-y-6 pb-12">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <HmsPageHeader
            title="System Integrations"
            description="HL7, FHIR, DICOM, REST APIs, webhooks, and external connector health"
          />
        </div>

        <IntegrationStatusCard integrations={(integrations || []) as IntegrationItem[]} />
      </div>
      <HmsAuditFooter />
    </HmsDashboardShell>
  );
};

export default IntegrationsPage;
