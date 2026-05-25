import { useState, useEffect, useCallback, useRef } from 'react';
import { complianceService, AuditLogEntry } from '../services/compliance.service';

function getErrorMessage(err: unknown): string {
  if (err && typeof err === 'object' && 'response' in err) {
    const resp = (err as { response?: { data?: { message?: string } } }).response;
    if (resp?.data?.message) return resp.data.message;
  }
  if (err instanceof Error) return err.message;
  return 'An unexpected error occurred';
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
  const paramsRef = useRef(params);
  useEffect(() => { paramsRef.current = params; });

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await complianceService.getAuditEvents(paramsRef.current);
      setEvents(res.data);
      setTotal(res.total);
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { events, total, loading, error, refetch: fetch };
}

export function useEphiAudit(from?: string, to?: string) {
  const [events, setEvents] = useState<unknown[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const res = await complianceService.getEphiAudit(from, to);
      setEvents(res);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, [from, to]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { events, loading, refetch: fetch };
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

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const res = await complianceService.getAccessReviewReport();
      setReport(res as unknown as AccessReviewReport);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { report, loading, refetch: fetch };
}

export function useRetentionStatus() {
  const [status, setStatus] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const res = await complianceService.getRetentionStatus();
      setStatus(res as Record<string, unknown>);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { status, loading, refetch: fetch };
}
