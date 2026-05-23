import React from 'react';
import ITScopeFilter from './components/ITScopeFilter';
import LogStreamPanel, { LogEntry } from './components/LogStreamPanel';

export const LogsPage: React.FC = () => {
  const mockLogs: LogEntry[] = [
    { id: 'LOG-001', timestamp: '14:15:02.331', severity: 'INFO', service: 'api-gateway', message: 'Request processed: GET /v1/patients (200) 42ms', traceId: 'abc12' },
    { id: 'LOG-002', timestamp: '14:14:58.112', severity: 'WARN', service: 'twilio-adapter', message: 'SMS delivery timeout for reminder job JOB-003 — provider latency 5200ms', traceId: 'def34' },
    { id: 'LOG-003', timestamp: '14:14:55.890', severity: 'ERROR', service: 'twilio-adapter', message: 'Failed to send SMS: Twilio API returned 503 Service Unavailable after 3 retries', traceId: 'def34' },
    { id: 'LOG-004', timestamp: '14:14:50.445', severity: 'INFO', service: 'auth-service', message: 'User login: sarah.chen@stjude.org from 192.168.1.45 (role: Doctor)', traceId: 'ghi56' },
    { id: 'LOG-005', timestamp: '14:14:45.221', severity: 'DEBUG', service: 'cache-layer', message: 'Cache HIT for key: session:USR-101 (TTL: 1800s remaining)', traceId: 'jkl78' },
    { id: 'LOG-006', timestamp: '14:14:40.998', severity: 'INFO', service: 'lab-adapter', message: 'HL7 ACK received for result ORD-7823 from external LIS', traceId: 'mno90' },
    { id: 'LOG-007', timestamp: '14:14:35.776', severity: 'CRITICAL', service: 'fhir-bridge', message: 'FHIR R4 connection refused: Connection reset by peer (https://fhir.external-ehr.com/r4)', traceId: 'pqr12' },
    { id: 'LOG-008', timestamp: '14:14:30.554', severity: 'INFO', service: 'billing-service', message: 'Invoice INV-2026-0542 created: ₱12,500.00 for patient PAT-XXXX', traceId: 'stu34' },
    { id: 'LOG-009', timestamp: '14:14:25.332', severity: 'WARN', service: 'auth-service', message: 'Failed login attempt #4 for admin@external-ip.net from 198.51.100.42', traceId: 'vwx56' },
    { id: 'LOG-010', timestamp: '14:14:20.110', severity: 'INFO', service: 'queue-worker', message: 'Job JOB-004 completed: Lab result sync for 3 pending orders (2.1s)', traceId: 'yza78' },
    { id: 'LOG-011', timestamp: '14:14:15.888', severity: 'DEBUG', service: 'db-primary', message: 'Query executed: SELECT * FROM audit_logs WHERE tenant_id = $1 ORDER BY created_at DESC LIMIT 50 (8ms)', traceId: 'bcd90' },
    { id: 'LOG-012', timestamp: '14:14:10.666', severity: 'INFO', service: 'email-service', message: 'Email sent via SendGrid: Weekly digest to petra.lim@apex.health (template: admin_digest)', traceId: 'efg12' },
    { id: 'LOG-013', timestamp: '14:14:05.444', severity: 'ERROR', service: 'payment-gateway', message: 'Webhook signature mismatch for event EVT-PAY-9912 — payload rejected', traceId: 'hij34' },
    { id: 'LOG-014', timestamp: '14:14:00.222', severity: 'INFO', service: 'api-gateway', message: 'Health check: All 8 services responding (p99: 45ms)', traceId: 'klm56' },
    { id: 'LOG-015', timestamp: '14:13:55.001', severity: 'WARN', service: 'backup-agent', message: 'Incremental backup skipped: No changes detected since last full backup', traceId: 'nop78' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-800 tracking-tight" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            System Audit Logs
          </h2>
          <p className="text-xs text-slate-500 font-medium">Filterable log stream with severity classification and service grouping</p>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-1.5 text-[10px] text-amber-800 font-semibold max-w-md">
          <strong>Sandbox Notice:</strong> All log entries are simulated. No real system logs are exposed. Sensitive values are redacted.
        </div>
      </div>

      <ITScopeFilter />

      <LogStreamPanel logs={mockLogs} />
    </div>
  );
};

export default LogsPage;
