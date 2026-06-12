import { useState, useEffect, useCallback } from 'react';
import { billingFrontendService, InvoiceDto, ActiveSessionDto, OpenSessionDto, CloseSessionDto, CreatePaymentDto } from '../services/billing-frontend.service';

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
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await billingFrontendService.getActiveSession();
      setSession(res);
    } catch (err: unknown) {
      setSession(null);
      const axiosErr = err as { response?: { data?: { message?: string } } } | null;
      setError(axiosErr?.response?.data?.message || 'Failed to load active session');
    } finally {
      setLoading(false);
    }
  }, []);

  const openSession = async (dto: OpenSessionDto) => {
    setLoading(true);
    setError(null);
    try {
      const newSession = await billingFrontendService.openSession(dto);
      setSession(newSession);
      return newSession;
    } catch (err) {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to open session';
      setError(message);
      throw new (Error as new (msg: string, opts?: { cause: unknown }) => Error)(message, { cause: err });
    } finally {
      setLoading(false);
    }
  };

  const closeSession = async (id: string, dto: CloseSessionDto) => {
    setLoading(true);
    setError(null);
    try {
      await billingFrontendService.closeSession(id, dto);
      setSession(null);
    } catch (err) {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to close session';
      setError(message);
      throw new (Error as new (msg: string, opts?: { cause: unknown }) => Error)(message, { cause: err });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetch(); }, [fetch]);
  return { session, loading, error, refetch: fetch, openSession, closeSession };
}

export function useCreatePayment() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const postPayment = async (dto: CreatePaymentDto, idempotencyKey: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await billingFrontendService.postPayment(dto, idempotencyKey);
      return res;
    } catch (err) {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to post payment';
      setError(message);
      throw new (Error as new (msg: string, opts?: { cause: unknown }) => Error)(message, { cause: err });
    } finally {
      setLoading(false);
    }
  };

  return { postPayment, loading, error };
}

export function usePaymentHistory() {
  const [payments, setPayments] = useState<unknown[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async (page?: number, pageSize?: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await billingFrontendService.getPaymentHistory(page, pageSize) as { payments?: unknown[] };
      setPayments(res.payments ?? []);
      return res;
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } } | null;
      setError(axiosErr?.response?.data?.message || 'Failed to load payment history');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { payments, loading, error, fetch };
}

export function useConfirmPayment() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const confirm = async (paymentId: string, dto: { gatewayReference: string; gatewayProvider?: string }) => {
    setLoading(true);
    setError(null);
    try {
      const res = await billingFrontendService.confirmPayment(paymentId, dto);
      return res;
    } catch (err) {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to confirm payment';
      setError(message);
      throw new (Error as new (msg: string, opts?: { cause: unknown }) => Error)(message, { cause: err });
    } finally {
      setLoading(false);
    }
  };

  return { confirm, loading, error };
}

export function useFailPayment() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fail = async (paymentId: string, dto: { reason: string; gatewayReference?: string }) => {
    setLoading(true);
    setError(null);
    try {
      const res = await billingFrontendService.failPayment(paymentId, dto);
      return res;
    } catch (err) {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to fail payment';
      setError(message);
      throw new (Error as new (msg: string, opts?: { cause: unknown }) => Error)(message, { cause: err });
    } finally {
      setLoading(false);
    }
  };

  return { fail, loading, error };
}

export function useExpirePayment() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const expire = async (paymentId: string, dto: { reason: string }) => {
    setLoading(true);
    setError(null);
    try {
      const res = await billingFrontendService.expirePayment(paymentId, dto);
      return res;
    } catch (err) {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to expire payment';
      setError(message);
      throw new (Error as new (msg: string, opts?: { cause: unknown }) => Error)(message, { cause: err });
    } finally {
      setLoading(false);
    }
  };

  return { expire, loading, error };
}

export function useRequestRefund() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<unknown>(null);

  const requestRefund = async (dto: { paymentId: string; amount: number; reason: string }) => {
    setLoading(true);
    setError(null);
    setData(null);
    try {
      const res = await billingFrontendService.requestRefund(dto);
      setData(res);
      return res;
    } catch (err) {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to request refund';
      setError(message);
      throw new (Error as new (msg: string, opts?: { cause: unknown }) => Error)(message, { cause: err });
    } finally {
      setLoading(false);
    }
  };

  return { requestRefund, loading, error, data };
}

export function useRequestVoid() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<unknown>(null);

  const requestVoid = async (dto: { paymentId: string; reason: string }) => {
    setLoading(true);
    setError(null);
    setData(null);
    try {
      const res = await billingFrontendService.requestVoid(dto);
      setData(res);
      return res;
    } catch (err) {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to request void';
      setError(message);
      throw new (Error as new (msg: string, opts?: { cause: unknown }) => Error)(message, { cause: err });
    } finally {
      setLoading(false);
    }
  };

  return { requestVoid, loading, error, data };
}

export function useApproveVoid() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const approveVoid = async (reversalId: string, remarks?: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await billingFrontendService.approveVoid(reversalId, remarks);
      return res;
    } catch (err) {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to approve void';
      setError(message);
      throw new (Error as new (msg: string, opts?: { cause: unknown }) => Error)(message, { cause: err });
    } finally {
      setLoading(false);
    }
  };

  return { approveVoid, loading, error };
}

export function useRejectVoid() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const rejectVoid = async (reversalId: string, remarks?: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await billingFrontendService.rejectVoid(reversalId, remarks);
      return res;
    } catch (err) {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to reject void';
      setError(message);
      throw new (Error as new (msg: string, opts?: { cause: unknown }) => Error)(message, { cause: err });
    } finally {
      setLoading(false);
    }
  };

  return { rejectVoid, loading, error };
}

export function useApproveRefund() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const approveRefund = async (reversalId: string, remarks?: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await billingFrontendService.approveRefund(reversalId, remarks);
      return res;
    } catch (err) {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to approve refund';
      setError(message);
      throw new (Error as new (msg: string, opts?: { cause: unknown }) => Error)(message, { cause: err });
    } finally {
      setLoading(false);
    }
  };

  return { approveRefund, loading, error };
}

export function useRejectRefund() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const rejectRefund = async (reversalId: string, remarks?: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await billingFrontendService.rejectRefund(reversalId, remarks);
      return res;
    } catch (err) {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to reject refund';
      setError(message);
      throw new (Error as new (msg: string, opts?: { cause: unknown }) => Error)(message, { cause: err });
    } finally {
      setLoading(false);
    }
  };

  return { rejectRefund, loading, error };
}

