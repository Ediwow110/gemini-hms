import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { billingFrontendService, InvoiceDto, OpenSessionDto, CloseSessionDto, CreatePaymentDto, MyReversalDto } from '../services/billing-frontend.service';
import { useUser } from './use-user';
import { createError } from '../lib/error-utils';

// ─── Query Keys ──────────────────────────────────────────────────────────────
const billingKeys = {
  invoices: (tenantId?: string, branchId?: string) =>
    ['billing', 'invoices', tenantId, branchId] as const,
  myReversals: (tenantId?: string, userId?: string, branchId?: string) =>
    ['billing', 'reversals', 'my', tenantId, userId, branchId] as const,
  activeSession: (tenantId?: string, userId?: string, branchId?: string) =>
    ['billing', 'session', 'active', tenantId, userId, branchId] as const,
  paymentHistory: (tenantId?: string, branchId?: string, page?: number, pageSize?: number) =>
    ['billing', 'payments', 'history', tenantId, branchId, page, pageSize] as const,
};

// ─── Read Hooks ──────────────────────────────────────────────────────────────

export function useInvoices() {
  const user = useUser();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: billingKeys.invoices(user?.tenantId, user?.branchId),
    queryFn: () => billingFrontendService.getInvoices(),
    enabled: !!user?.tenantId,
  });

  return {
    invoices: query.data ?? ([] as InvoiceDto[]),
    loading: query.isLoading,
    error: query.error ? extractMessage(query.error, 'Failed to load invoices') : null,
    refetch: () => queryClient.invalidateQueries({ queryKey: billingKeys.invoices(user?.tenantId, user?.branchId) }),
  };
}

export function useMyReversals() {
  const user = useUser();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: billingKeys.myReversals(user?.tenantId, user?.id, user?.branchId),
    queryFn: () => billingFrontendService.getMyReversals(),
    enabled: !!user?.tenantId,
  });

  return {
    reversals: query.data ?? ([] as MyReversalDto[]),
    loading: query.isLoading,
    error: query.error ? extractMessage(query.error, 'Failed to load reversals') : null,
    refetch: () => queryClient.invalidateQueries({ queryKey: billingKeys.myReversals(user?.tenantId, user?.id, user?.branchId) }),
  };
}

export function useActiveSession() {
  const user = useUser();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: billingKeys.activeSession(user?.tenantId, user?.id, user?.branchId),
    queryFn: () => billingFrontendService.getActiveSession(),
    enabled: !!user?.tenantId,
  });

  const openSessionMutation = useMutation({
    mutationFn: (dto: OpenSessionDto) => billingFrontendService.openSession(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: billingKeys.activeSession(user?.tenantId, user?.id, user?.branchId) });
    },
  });

  const closeSessionMutation = useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: CloseSessionDto }) =>
      billingFrontendService.closeSession(id, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: billingKeys.activeSession(user?.tenantId, user?.id, user?.branchId) });
      queryClient.invalidateQueries({ queryKey: billingKeys.invoices(user?.tenantId, user?.branchId) });
      queryClient.invalidateQueries({ queryKey: billingKeys.paymentHistory(user?.tenantId, user?.branchId) });
    },
  });

  const openSession = async (dto: OpenSessionDto) => {
    try {
      const result = await openSessionMutation.mutateAsync(dto);
      return result;
    } catch (err) {
      throw createError(extractMessage(err, 'Failed to open session'), err);
    }
  };

  const closeSession = async (id: string, dto: CloseSessionDto) => {
    try {
      await closeSessionMutation.mutateAsync({ id, dto });
    } catch (err) {
      throw createError(extractMessage(err, 'Failed to close session'), err);
    }
  };

  const isLoading =
    query.isLoading ||
    openSessionMutation.isPending ||
    closeSessionMutation.isPending;

  const error =
    query.error
      ? extractMessage(query.error, 'Failed to load active session')
      : openSessionMutation.error
        ? extractMessage(openSessionMutation.error, 'Failed to open session')
        : closeSessionMutation.error
          ? extractMessage(closeSessionMutation.error, 'Failed to close session')
          : null;

  return {
    session: query.data ?? null,
    loading: isLoading,
    error,
    refetch: () => query.refetch(),
    openSession,
    closeSession,
  };
}

export function usePaymentHistory() {
  const user = useUser();
  const queryClient = useQueryClient();

  // Similar to the original: fetch is called with params, so we use a manual pattern
  // with a mutable page/pageSize tracked via query keys
  const fetch = async (page?: number, pageSize?: number) => {
    try {
      const res = await queryClient.fetchQuery({
        queryKey: billingKeys.paymentHistory(user?.tenantId, user?.branchId, page, pageSize),
        queryFn: () => billingFrontendService.getPaymentHistory(page, pageSize),
      });
      return res as { payments?: unknown[] };
    } catch {
      return null;
    }
  };

  const query = useQuery({
    queryKey: billingKeys.paymentHistory(user?.tenantId, user?.branchId),
    queryFn: () => billingFrontendService.getPaymentHistory(),
    enabled: !!user?.tenantId,
    staleTime: 30_000,
  });

  return {
    payments: (query.data as { payments?: unknown[] })?.payments ?? [],
    loading: query.isLoading,
    error: query.error ? extractMessage(query.error, 'Failed to load payment history') : null,
    fetch,
  };
}

// ─── Mutation Hooks ──────────────────────────────────────────────────────────

export function useCreatePayment() {
  const user = useUser();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: ({ dto, idempotencyKey }: { dto: CreatePaymentDto; idempotencyKey: string }) =>
      billingFrontendService.postPayment(dto, idempotencyKey),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: billingKeys.invoices(user?.tenantId, user?.branchId) });
      queryClient.invalidateQueries({ queryKey: billingKeys.activeSession(user?.tenantId, user?.id, user?.branchId) });
      queryClient.invalidateQueries({ queryKey: billingKeys.paymentHistory(user?.tenantId, user?.branchId) });
    },
  });

  const postPayment = async (dto: CreatePaymentDto, idempotencyKey: string) => {
    try {
      return await mutation.mutateAsync({ dto, idempotencyKey });
    } catch (err) {
      throw createError(extractMessage(err, 'Failed to post payment'), err);
    }
  };

  return { postPayment, loading: mutation.isPending, error: mutation.error ? extractMessage(mutation.error, 'Failed to post payment') : null };
}

export function useConfirmPayment() {
  const user = useUser();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: ({ paymentId, dto }: { paymentId: string; dto: { gatewayReference: string; gatewayProvider?: string } }) =>
      billingFrontendService.confirmPayment(paymentId, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: billingKeys.activeSession(user?.tenantId, user?.id, user?.branchId) });
      queryClient.invalidateQueries({ queryKey: billingKeys.paymentHistory(user?.tenantId, user?.branchId) });
    },
  });

  const confirm = async (paymentId: string, dto: { gatewayReference: string; gatewayProvider?: string }) => {
    try {
      return await mutation.mutateAsync({ paymentId, dto });
    } catch (err) {
      throw createError(extractMessage(err, 'Failed to confirm payment'), err);
    }
  };

  return { confirm, loading: mutation.isPending, error: mutation.error ? extractMessage(mutation.error, 'Failed to confirm payment') : null };
}

export function useFailPayment() {
  const user = useUser();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: ({ paymentId, dto }: { paymentId: string; dto: { reason: string; gatewayReference?: string } }) =>
      billingFrontendService.failPayment(paymentId, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: billingKeys.activeSession(user?.tenantId, user?.id, user?.branchId) });
      queryClient.invalidateQueries({ queryKey: billingKeys.paymentHistory(user?.tenantId, user?.branchId) });
    },
  });

  const fail = async (paymentId: string, dto: { reason: string; gatewayReference?: string }) => {
    try {
      return await mutation.mutateAsync({ paymentId, dto });
    } catch (err) {
      throw createError(extractMessage(err, 'Failed to fail payment'), err);
    }
  };

  return { fail, loading: mutation.isPending, error: mutation.error ? extractMessage(mutation.error, 'Failed to fail payment') : null };
}

export function useExpirePayment() {
  const user = useUser();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: ({ paymentId, dto }: { paymentId: string; dto: { reason: string } }) =>
      billingFrontendService.expirePayment(paymentId, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: billingKeys.activeSession(user?.tenantId, user?.id, user?.branchId) });
      queryClient.invalidateQueries({ queryKey: billingKeys.paymentHistory(user?.tenantId, user?.branchId) });
    },
  });

  const expire = async (paymentId: string, dto: { reason: string }) => {
    try {
      return await mutation.mutateAsync({ paymentId, dto });
    } catch (err) {
      throw createError(extractMessage(err, 'Failed to expire payment'), err);
    }
  };

  return { expire, loading: mutation.isPending, error: mutation.error ? extractMessage(mutation.error, 'Failed to expire payment') : null };
}

export function useRequestRefund() {
  const user = useUser();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (dto: { paymentId: string; amount: number; reason: string }) =>
      billingFrontendService.requestRefund(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: billingKeys.myReversals(user?.tenantId, user?.id, user?.branchId) });
    },
  });

  const requestRefund = async (dto: { paymentId: string; amount: number; reason: string }) => {
    try {
      return await mutation.mutateAsync(dto);
    } catch (err) {
      throw createError(extractMessage(err, 'Failed to request refund'), err);
    }
  };

  return {
    requestRefund,
    loading: mutation.isPending,
    error: mutation.error ? extractMessage(mutation.error, 'Failed to request refund') : null,
    data: mutation.data ?? null,
  };
}

export function useRequestVoid() {
  const user = useUser();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (dto: { paymentId: string; reason: string }) =>
      billingFrontendService.requestVoid(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: billingKeys.myReversals(user?.tenantId, user?.id, user?.branchId) });
    },
  });

  const requestVoid = async (dto: { paymentId: string; reason: string }) => {
    try {
      return await mutation.mutateAsync(dto);
    } catch (err) {
      throw createError(extractMessage(err, 'Failed to request void'), err);
    }
  };

  return {
    requestVoid,
    loading: mutation.isPending,
    error: mutation.error ? extractMessage(mutation.error, 'Failed to request void') : null,
    data: mutation.data ?? null,
  };
}

export function useApproveVoid() {
  const user = useUser();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: ({ reversalId, remarks }: { reversalId: string; remarks?: string }) =>
      billingFrontendService.approveVoid(reversalId, remarks),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: billingKeys.myReversals(user?.tenantId, user?.id, user?.branchId) });
      queryClient.invalidateQueries({ queryKey: billingKeys.activeSession(user?.tenantId, user?.id, user?.branchId) });
    },
  });

  const approveVoid = async (reversalId: string, remarks?: string) => {
    try {
      return await mutation.mutateAsync({ reversalId, remarks });
    } catch (err) {
      throw createError(extractMessage(err, 'Failed to approve void'), err);
    }
  };

  return { approveVoid, loading: mutation.isPending, error: mutation.error ? extractMessage(mutation.error, 'Failed to approve void') : null };
}

export function useRejectVoid() {
  const user = useUser();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: ({ reversalId, remarks }: { reversalId: string; remarks?: string }) =>
      billingFrontendService.rejectVoid(reversalId, remarks),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: billingKeys.myReversals(user?.tenantId, user?.id, user?.branchId) });
    },
  });

  const rejectVoid = async (reversalId: string, remarks?: string) => {
    try {
      return await mutation.mutateAsync({ reversalId, remarks });
    } catch (err) {
      throw createError(extractMessage(err, 'Failed to reject void'), err);
    }
  };

  return { rejectVoid, loading: mutation.isPending, error: mutation.error ? extractMessage(mutation.error, 'Failed to reject void') : null };
}

export function useApproveRefund() {
  const user = useUser();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: ({ reversalId, remarks }: { reversalId: string; remarks?: string }) =>
      billingFrontendService.approveRefund(reversalId, remarks),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: billingKeys.myReversals(user?.tenantId, user?.id, user?.branchId) });
      queryClient.invalidateQueries({ queryKey: billingKeys.activeSession(user?.tenantId, user?.id, user?.branchId) });
    },
  });

  const approveRefund = async (reversalId: string, remarks?: string) => {
    try {
      return await mutation.mutateAsync({ reversalId, remarks });
    } catch (err) {
      throw createError(extractMessage(err, 'Failed to approve refund'), err);
    }
  };

  return { approveRefund, loading: mutation.isPending, error: mutation.error ? extractMessage(mutation.error, 'Failed to approve refund') : null };
}

export function useRejectRefund() {
  const user = useUser();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: ({ reversalId, remarks }: { reversalId: string; remarks?: string }) =>
      billingFrontendService.rejectRefund(reversalId, remarks),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: billingKeys.myReversals(user?.tenantId, user?.id, user?.branchId) });
    },
  });

  const rejectRefund = async (reversalId: string, remarks?: string) => {
    try {
      return await mutation.mutateAsync({ reversalId, remarks });
    } catch (err) {
      throw createError(extractMessage(err, 'Failed to reject refund'), err);
    }
  };

  return { rejectRefund, loading: mutation.isPending, error: mutation.error ? extractMessage(mutation.error, 'Failed to reject refund') : null };
}

// ─── Error Extraction Helper ────────────────────────────────────────────────

function extractMessage(err: unknown, fallback: string): string {
  const axiosErr = err as { response?: { data?: { message?: string } } } | null;
  return axiosErr?.response?.data?.message
    || (err as { message?: string })?.message
    || fallback;
}
