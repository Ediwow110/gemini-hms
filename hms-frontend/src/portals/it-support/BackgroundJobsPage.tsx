import React from 'react';
import ITScopeFilter from './components/ITScopeFilter';
import BackgroundJobTable, { BackgroundJob } from './components/BackgroundJobTable';
import { HmsPageHeader } from '../../components/hms-page';
import { HmsDashboardShell, HmsAuditFooter } from '../../components/hms-dashboard';

export const BackgroundJobsPage: React.FC = () => {
  const mockJobs: BackgroundJob[] = [
    {
      id: 'JOB-001', name: 'Nightly Database Backup', type: 'CRON', status: 'COMPLETED',
      schedule: '0 2 * * *', lastRun: '2026-05-21 02:00', nextRun: '2026-05-22 02:00',
      duration: '14m 32s', retryCount: 0, description: 'Full PostgreSQL dump with AES-256 encryption'
    },
    {
      id: 'JOB-002', name: 'Audit Log Archival', type: 'CRON', status: 'COMPLETED',
      schedule: '0 4 * * *', lastRun: '2026-05-21 04:00', nextRun: '2026-05-22 04:00',
      duration: '8m 15s', retryCount: 0, description: 'Archive audit entries older than 90 days to cold storage'
    },
    {
      id: 'JOB-003', name: 'SMS Reminder Queue', type: 'QUEUE', status: 'FAILED',
      lastRun: '2026-05-21 13:00', duration: '0.3s', retryCount: 3,
      description: 'Appointment reminder push via Twilio — provider timeout'
    },
    {
      id: 'JOB-004', name: 'Lab Result Sync Worker', type: 'TRIGGER', status: 'COMPLETED',
      lastRun: '2026-05-21 13:15', duration: '2.1s', retryCount: 0,
      description: 'HL7 result ingest from external LIS system'
    },
    {
      id: 'JOB-005', name: 'Email Digest Processor', type: 'CRON', status: 'RUNNING',
      schedule: '0 6 * * 1', lastRun: '2026-05-21 06:00',
      duration: '~5m', retryCount: 0, description: 'Weekly digest email generation for branch admins'
    },
    {
      id: 'JOB-006', name: 'Patient Index Reindex', type: 'BATCH', status: 'SCHEDULED',
      schedule: '0 0 1 * *', lastRun: '2026-04-01 00:00', nextRun: '2026-06-01 00:00',
      duration: '45m', retryCount: 0, description: 'Monthly Elasticsearch reindex for patient master index'
    },
    {
      id: 'JOB-007', name: 'HMO Claims Batch Submit', type: 'CRON', status: 'COMPLETED',
      schedule: '0 22 * * *', lastRun: '2026-05-20 22:00', nextRun: '2026-05-21 22:00',
      duration: '3m 10s', retryCount: 0, description: 'Batch upload of pending HMO claims to insurer APIs'
    },
    {
      id: 'JOB-008', name: 'Soft-Delete Cleanup', type: 'CRON', status: 'FAILED',
      schedule: '0 3 * * 0', lastRun: '2026-05-18 03:00', nextRun: '2026-05-25 03:00',
      duration: '0.8s', retryCount: 1, description: 'Permanently remove soft-deleted records past retention — constraint error'
    }
  ];

  return (
    <HmsDashboardShell>
      <div className="space-y-6 pb-12">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <HmsPageHeader
            title="Background Job Monitor"
            description="Scheduled tasks, async workers, cron jobs, and queue processing"
          />
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-1.5 text-[10px] text-amber-800 font-semibold max-w-md">
            <strong>Sandbox Notice:</strong> All job data is simulated. Retry actions affect UI state only and do not trigger real workers.
          </div>
        </div>

        <ITScopeFilter />

        <BackgroundJobTable jobs={mockJobs} />
      </div>
      <HmsAuditFooter />
    </HmsDashboardShell>
  );
};

export default BackgroundJobsPage;
