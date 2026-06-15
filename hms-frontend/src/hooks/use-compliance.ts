import { useState, useEffect, useCallback } from 'react';
import { complianceService, AuditLogEntry } from '../services/compliance.service';

function getErrorMessage(err: unknown): string {
  if (err && typeof err === 'object' && 'response' in err) {
    const resp = (err as { response?: { data?: { message?: string } } }).response;
    if (resp?.data?.message) return resp.data.message;
  }
  if (err instanceof Error) return err.message;
  return 'An unexpected error occurred';
}

export function useMyAuditEvents(params?: {
  eventKey?: string;
  recordType?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  pageSize?: number;
}) {
  const [events, setEvents] = useState<AuditLogEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const paramsKey = JSON.stringify(params);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await complianceService.getMyAuditEvents(params);
      setEvents(res.data);
      setTotal(res.total);
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paramsKey]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { events, total, loading, error, refetch: fetch };
}

export function useEntityAuditTimeline(recordType: string, recordId: string, params?: {
  eventKey?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  pageSize?: number;
}) {
  const [events, setEvents] = useState<AuditLogEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const paramsKey = JSON.stringify(params);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await complianceService.getEntityAuditEvents(recordType, recordId, params);
      setEvents(res.data);
      setTotal(res.total);
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recordType, recordId, paramsKey]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { events, total, loading, error, refetch: fetch };
}

export function useAuditEvents(params?: {
  eventKey?: string;
  recordType?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  pageSize?: number;
}) {
  const [events, setEvents] = useState<AuditLogEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const paramsKey = JSON.stringify(params);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await complianceService.getAuditEvents(params);
      setEvents(res.data);
      setTotal(res.total);
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paramsKey]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { events, total, loading, error, refetch: fetch };
}

export function useEphiAudit(from?: string, to?: string) {
  const [events, setEvents] = useState<unknown[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await complianceService.getEphiAudit(from, to);
      setEvents(res);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load PHI access audit';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [from, to]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { events, loading, error, refetch: fetch };
}

export interface AccessReviewReport {
  complianceStatus: string;
  staleAccountsCount: number;
  privilegeEscalationsCount: number;
  staleAccounts: unknown[];
  accessReport: unknown[];
  privilegeEscalations: unknown[];
  reviewTimestamp: string;
}

export function useAccessReview() {
  const [report, setReport] = useState<AccessReviewReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await complianceService.getAccessReviewReport();
      setReport(res as unknown as AccessReviewReport);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load access review';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { report, loading, error, refetch: fetch };
}

export interface ChainVerificationResult {
  isValid: boolean;
  hasLegacyRows?: boolean;
  legacyUnverifiableCount?: number;
  truncated: boolean;
  verificationCount: number;
  totalLogs?: number;
  corruptedLogIds?: string[];
  signatureErrors?: string[];
}

export function useChainVerification() {
  const [result, setResult] = useState<ChainVerificationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const verifyChain = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await complianceService.verifyAuditChain();
      setResult({ ...res, truncated: false, verificationCount: 0 });
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  const verifyChainWithSignatures = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await complianceService.verifyAuditChainWithSignatures();
      setResult(res);
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  return { result, loading, error, verifyChain, verifyChainWithSignatures };
}

export interface BreachIncident {
  id: string;
  timestamp: string;
  severity: string;
  source: string;
  description: string;
}

export function useBreachIncidents() {
  const [incidents, setIncidents] = useState<BreachIncident[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [ephiEvents, anomalies] = await Promise.all([
        complianceService.getEphiAudit(),
        complianceService.getUnauthorizedAccessDetections(),
      ]);
      const mapped: BreachIncident[] = [];
      if (Array.isArray(anomalies)) {
        for (const a of anomalies) {
          const stableId =
            a.logId ||
            a.id ||
            `anomaly-${a.timestamp || 'unknown'}-${a.description?.slice(0, 20) || 'no-desc'}`;
          mapped.push({
            id: stableId.replace(/[^a-zA-Z0-9-_]/g, '-'),
            timestamp: a.timestamp || new Date().toISOString(),
            severity: a.severity || 'MEDIUM',
            source: a.source || a.description?.substring(0, 40) || 'Anomaly Detection',
            description: a.description || 'Unauthorized access pattern detected',
          });
        }
      }
      if (Array.isArray(ephiEvents)) {
        for (const e of ephiEvents.slice(0, 20)) {
          if (!mapped.find(m => m.id === e.id)) {
            mapped.push({
              id: e.id,
              timestamp: e.createdAt,
              severity: 'MEDIUM',
              source: `ePHI Access: ${e.recordType}`,
              description: `${e.eventKey} on ${e.recordType} (${e.recordId?.substring(0, 8)}...)`,
            });
          }
        }
      }
      setIncidents(mapped);
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { incidents, loading, error, refetch: fetch };
}

export function useRetentionStatus() {
  const [status, setStatus] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await complianceService.getRetentionStatus();
      setStatus(res as Record<string, unknown>);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load retention status';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { status, loading, error, refetch: fetch };
}
