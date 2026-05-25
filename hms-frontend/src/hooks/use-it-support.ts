import { useState, useEffect, useCallback, useRef } from 'react';
import { itSupportService, SupportTicketDto, TicketStats } from '../services/it-support.service';

function getErrorMessage(err: unknown): string {
  if (err && typeof err === 'object' && 'response' in err) {
    const resp = (err as { response?: { data?: { message?: string } } }).response;
    if (resp?.data?.message) return resp.data.message;
  }
  if (err instanceof Error) return err.message;
  return 'An unexpected error occurred';
}

export function useSupportTickets(params?: {
  status?: string;
  priority?: string;
  issueType?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}) {
  const [tickets, setTickets] = useState<SupportTicketDto[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const paramsRef = useRef(params);
  useEffect(() => { paramsRef.current = params; });

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await itSupportService.getTickets(paramsRef.current);
      setTickets(res.data);
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

  return { tickets, total, loading, error, refetch: fetch };
}

export function useTicketStats() {
  const [stats, setStats] = useState<TicketStats>({ open: 0, inProgress: 0, urgent: 0, total: 0 });
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    try {
      const res = await itSupportService.getTicketStats();
      setStats(res);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { stats, loading, refetch: fetch };
}

export function useTicketDetail(id: string | undefined) {
  const [ticket, setTicket] = useState<SupportTicketDto | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const res = await itSupportService.getTicket(id);
      setTicket(res);
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { ticket, loading, error, refetch: fetch };
}

export function useUpdateTicket() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const update = useCallback(async (id: string, data: {
    status?: string;
    priority?: string;
    assignedToId?: string;
    resolution?: string;
  }) => {
    setLoading(true);
    setError(null);
    try {
      const res = await itSupportService.updateTicket(id, data);
      return res;
    } catch (err: unknown) {
      setError(getErrorMessage(err));
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { update, loading, error };
}
