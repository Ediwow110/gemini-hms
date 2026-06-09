import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../lib/api';
import { labService, PendingSpecimenDto, CriticalResultDto, TurnaroundSummaryDto } from '../services/lab.service';

// ──── Pending Specimens ────

export interface UsePendingSpecimensReturn {
  specimens: PendingSpecimenDto[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  receiveSpecimen: (id: string) => Promise<void>;
}

export function usePendingSpecimens(): UsePendingSpecimensReturn {
  const [specimens, setSpecimens] = useState<PendingSpecimenDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await labService.getPendingSpecimens();
      setSpecimens(data);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } }; message?: string };
      setError(axiosErr?.response?.data?.message || axiosErr?.message || 'Failed to load pending specimens');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const receiveSpecimen = useCallback(async (id: string) => {
    await labService.receiveSpecimen(id);
    await fetch();
  }, [fetch]);

  return { specimens, isLoading, error, refetch: fetch, receiveSpecimen };
}

// ──── Releasable Results ────

export const useReleasableResults = () => {
  return useQuery({
    queryKey: ['lab', 'results', 'releasable'],
    queryFn: () => labService.getReleasableResults(),
  });
};

export const useReleaseResult = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (resultId: string) => apiClient.post(`/v1/lab/results/${resultId}/release`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['lab', 'results', 'releasable'] });
      void queryClient.invalidateQueries({ queryKey: ['lab', 'results', 'released'] });
    },
  });
};

// ──── Critical Results ────

export interface UseCriticalResultsReturn {
  criticalResults: CriticalResultDto[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  acknowledge: (id: string, notes?: string) => Promise<void>;
  escalate: (id: string, notes: string) => Promise<void>;
  resolve: (id: string, notes?: string) => Promise<void>;
  acknowledgingId: string | null;
  escalatingId: string | null;
  resolvingId: string | null;
}

export function useCriticalResults(statusFilter?: string): UseCriticalResultsReturn {
  const [criticalResults, setCriticalResults] = useState<CriticalResultDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [acknowledgingId, setAcknowledgingId] = useState<string | null>(null);
  const [escalatingId, setEscalatingId] = useState<string | null>(null);
  const [resolvingId, setResolvingId] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await labService.getCriticalResults(statusFilter);
      setCriticalResults(data);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } }; message?: string };
      setError(axiosErr?.response?.data?.message || axiosErr?.message || 'Failed to load critical results');
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => { fetch(); }, [fetch]);

  const acknowledge = useCallback(async (id: string, notes?: string) => {
    setAcknowledgingId(id);
    try {
      await labService.acknowledgeCriticalResult(id, notes);
      await fetch();
    } finally {
      setAcknowledgingId(null);
    }
  }, [fetch]);

  const escalate = useCallback(async (id: string, notes: string) => {
    setEscalatingId(id);
    try {
      await labService.escalateCriticalResult(id, notes);
      await fetch();
    } finally {
      setEscalatingId(null);
    }
  }, [fetch]);

  const resolve = useCallback(async (id: string, notes?: string) => {
    setResolvingId(id);
    try {
      await labService.resolveCriticalResult(id, notes);
      await fetch();
    } finally {
      setResolvingId(null);
    }
  }, [fetch]);

  return {
    criticalResults, isLoading, error, refetch: fetch,
    acknowledge, escalate, resolve,
    acknowledgingId, escalatingId, resolvingId,
  };
}

// ──── Turnaround Time Metrics ────

export interface UseTurnaroundMetricsReturn {
  data: TurnaroundSummaryDto | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useTurnaroundMetrics(): UseTurnaroundMetricsReturn {
  const [data, setData] = useState<TurnaroundSummaryDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await labService.getTurnaroundMetrics();
      setData(result);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } }; message?: string };
      setError(axiosErr?.response?.data?.message || axiosErr?.message || 'Failed to load turnaround metrics');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  return { data, isLoading, error, refetch: fetch };
}
