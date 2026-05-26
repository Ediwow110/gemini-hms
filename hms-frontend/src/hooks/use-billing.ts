import { useState, useEffect, useCallback } from 'react';
import { billingFrontendService, InvoiceDto, ActiveSessionDto } from '../services/billing-frontend.service';

export function useInvoices() {
  const [invoices, setInvoices] = useState<InvoiceDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await billingFrontendService.getInvoices();
      setInvoices(res);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } } | null;
      setError(axiosErr?.response?.data?.message || 'Failed to load invoices');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);
  return { invoices, loading, error, refetch: fetch };
}

export function useActiveSession() {
  const [session, setSession] = useState<ActiveSessionDto | null>(null);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const res = await billingFrontendService.getActiveSession();
      setSession(res);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);
  return { session, loading, refetch: fetch };
}
