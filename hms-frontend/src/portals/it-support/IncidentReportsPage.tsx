import React from 'react';
import ITScopeFilter from './components/ITScopeFilter';
import IncidentTimeline, { IncidentEntry } from './components/IncidentTimeline';

export const IncidentReportsPage: React.FC = () => {
  const mockIncidents: IncidentEntry[] = [
    {
      id: 'INC-2026-001',
      title: 'FHIR R4 Bridge Connection Failure',
      severity: 'SEV1',
      status: 'INVESTIGATING',
      detectedAt: '2026-05-21 08:42',
      owner: 'IT Support Lead (Mark Reyes)',
      affectedServices: ['FHIR Bridge', 'EHR Sync', 'Patient Import'],
      summary: 'FHIR R4 interoperability connector lost connection to external EHR. All inbound patient data sync halted.',
      impactDescription: 'Outbound referral data and inbound patient demographic sync from partner hospital suspended. No data loss — queued for retry once connectivity restored.'
    },
    {
      id: 'INC-2026-002',
      title: 'Twilio SMS Provider Degradation',
      severity: 'SEV2',
      status: 'MITIGATED',
      detectedAt: '2026-05-21 13:02',
      owner: 'IT Support (Ana Cruz)',
      affectedServices: ['SMS Reminders', 'OTP Delivery'],
      summary: 'Twilio API returning 503 errors intermittently. Appointment reminders delayed for ~45 minutes.',
      impactDescription: 'Approximately 120 appointment reminders delayed. OTP delivery for MFA login may fail intermittently. Fallback email OTP activated.'
    },
    {
      id: 'INC-2026-003',
      title: 'Suspicious Login Attempts from External IP',
      severity: 'SEV3',
      status: 'INVESTIGATING',
      detectedAt: '2026-05-21 09:15',
      owner: 'Security Analyst (Kevin Tan)',
      affectedServices: ['Auth Service', 'Session Manager'],
      summary: '15 failed login attempts from IP 198.51.100.42 targeting admin accounts across 2 tenants.',
      impactDescription: 'IP has been automatically blocked by rate limiter. No successful breach detected. Affected accounts remain locked pending manual review.'
    },
    {
      id: 'INC-2026-004',
      title: 'Payment Webhook Signature Mismatch',
      severity: 'SEV3',
      status: 'RESOLVED',
      detectedAt: '2026-05-21 10:30',
      resolvedAt: '2026-05-21 11:15',
      owner: 'IT Support (Mark Reyes)',
      affectedServices: ['Payment Gateway', 'Billing Service'],
      summary: 'PayMaya webhook signatures failed HMAC validation. 3 payment confirmations queued but not processed.',
      impactDescription: 'Root cause: certificate rotation on PayMaya side. Signing secret updated and 3 pending payments reprocessed successfully.'
    },
    {
      id: 'INC-2026-005',
      title: 'Soft-Delete Cleanup Job Constraint Error',
      severity: 'SEV4',
      status: 'POSTMORTEM',
      detectedAt: '2026-05-18 03:02',
      resolvedAt: '2026-05-18 10:30',
      owner: 'DBA (Ryan Ong)',
      affectedServices: ['Database', 'Cleanup Worker'],
      summary: 'Weekly soft-delete cleanup job failed due to foreign key constraint on cascade-delete path.',
      impactDescription: 'No user impact. Stale records remain in database. Fix deployed: added deferred constraint handling to cleanup query.'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-800 tracking-tight" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Incident Reports & Postmortems
          </h2>
          <p className="text-xs text-slate-500 font-medium">System outages, security alerts, degradation events, and resolution tracking</p>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-1.5 text-[10px] text-amber-800 font-semibold max-w-md">
          <strong>Sandbox Notice:</strong> All incident records are simulated. No real escalation or alerting is triggered.
        </div>
      </div>

      <ITScopeFilter />

      <IncidentTimeline incidents={mockIncidents} />
    </div>
  );
};

export default IncidentReportsPage;
