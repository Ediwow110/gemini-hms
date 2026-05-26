import { useState, useEffect, useCallback } from 'react';
import { labService, PendingSpecimenDto, ReleasableResultDto } from '../services/lab.service';

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
