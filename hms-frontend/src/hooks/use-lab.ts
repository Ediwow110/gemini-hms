import { useState, useEffect, useCallback } from 'react';
import { labService, PendingSpecimenDto, ReleasableResultDto, CriticalResultDto } from '../services/lab.service';

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

export interface UseReleasableResultsReturn {
  results: ReleasableResultDto[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useReleasableResults(): UseReleasableResultsReturn {
  const [results, setResults] = useState<ReleasableResultDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await labService.getReleasableResults();
      setResults(data);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } }; message?: string };
      setError(axiosErr?.response?.data?.message || axiosErr?.message || 'Failed to load releasable results');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  return { results, isLoading, error, refetch: fetch };
}

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
