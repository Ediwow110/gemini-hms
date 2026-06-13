import React from 'react';
import ITScopeFilter from './components/ITScopeFilter';
import IntegrationStatusCard, { IntegrationItem } from './components/IntegrationStatusCard';
import { HmsPageHeader } from '../../components/hms-page';
import { HmsDashboardShell, HmsAuditFooter } from '../../components/hms-dashboard';

export const IntegrationsPage: React.FC = () => {
  const mockIntegrations: IntegrationItem[] = [
    {
      id: 'INT-001', name: 'HL7v2 Lab Adapter', protocol: 'HL7', direction: 'INBOUND',
      status: 'CONNECTED', lastSync: '2026-05-21 13:15', errorCount: 0,
      description: 'Ingest lab orders and results from external LIS via MLLP',
      endpoint: 'mllp://lis.stjude.local:2575'
    },
    {
      id: 'INT-002', name: 'FHIR R4 Bridge', protocol: 'FHIR', direction: 'BIDIRECTIONAL',
      status: 'ERROR', lastSync: '2026-05-21 08:40', errorCount: 12,
      description: 'Interoperability connector for external EHR data exchange',
      endpoint: 'https://fhir.external-ehr.com/r4'
    },
    {
      id: 'INT-003', name: 'PACS/DICOM Gateway', protocol: 'DICOM', direction: 'INBOUND',
      status: 'CONNECTED', lastSync: '2026-05-21 12:30', errorCount: 0,
      description: 'Radiology imaging storage and retrieval',
      endpoint: 'dicom://pacs.stjude.local:11112'
    },
    {
      id: 'INT-004', name: 'HMO Claims API', protocol: 'REST', direction: 'OUTBOUND',
      status: 'CONNECTED', lastSync: '2026-05-20 22:00', errorCount: 1,
      description: 'Batch claims submission to PhilHealth / Maxicare',
      endpoint: 'https://api.hmo-gateway.ph/v2/claims'
    },
    {
      id: 'INT-005', name: 'Payment Webhook', protocol: 'WEBHOOK', direction: 'INBOUND',
      status: 'CONNECTED', lastSync: '2026-05-21 14:01', errorCount: 0,
      description: 'PayMaya and GCash payment confirmation webhooks',
      endpoint: 'https://hms.example.com/webhooks/payments'
    },
    {
      id: 'INT-006', name: 'SMS Provider (Twilio)', protocol: 'REST', direction: 'OUTBOUND',
      status: 'DISCONNECTED', lastSync: '2026-05-21 13:00', errorCount: 5,
      description: 'Appointment reminders and OTP delivery via Twilio',
      endpoint: 'https://api.twilio.com/2010-04-01/Accounts/...'
    },
    {
      id: 'INT-007', name: 'Email Delivery (SendGrid)', protocol: 'REST', direction: 'OUTBOUND',
      status: 'SYNCING', lastSync: '2026-05-21 13:55', errorCount: 0,
      description: 'Transactional email delivery for notifications and reports',
      endpoint: 'https://api.sendgrid.com/v3/mail/send'
    }
  ];

  return (
    <HmsDashboardShell widthTier="full">
      <div className="space-y-6 pb-12">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <HmsPageHeader
            title="System Integrations"
            description="HL7, FHIR, DICOM, REST APIs, webhooks, and external connector health"
          />
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-1.5 text-[10px] text-amber-800 font-semibold max-w-md">
            <strong>Sandbox Notice:</strong> Integration data is simulated. No real HL7/FHIR messages or API calls are sent.
          </div>
        </div>

        <ITScopeFilter />

        <IntegrationStatusCard integrations={mockIntegrations} />
      </div>
      <HmsAuditFooter />
    </HmsDashboardShell>
  );
};

export default IntegrationsPage;
