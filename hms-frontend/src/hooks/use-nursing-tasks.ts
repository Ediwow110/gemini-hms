import { useState, useEffect, useCallback } from 'react';
import { nursingService, NurseTaskDto, QueryNurseTaskParams, CreateNurseTaskPayload } from '../services/nursing.service';

export interface UseNursingTasksReturn {
  tasks: NurseTaskDto[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  createTask: (data: CreateNurseTaskPayload) => Promise<NurseTaskDto>;
  startTask: (id: string) => Promise<void>;
  completeTask: (id: string) => Promise<void>;
  cancelTask: (id: string, reason?: string) => Promise<void>;
  reopenTask: (id: string) => Promise<void>;
}

interface AxiosLikeError {
  response?: { data?: { message?: string } };
  message?: string;
}

function extractErrorMessage(err: unknown, fallback: string): string {
  const axiosErr = err as AxiosLikeError;
  return axiosErr?.response?.data?.message || axiosErr?.message || fallback;
}

export function useNursingTasks(params?: QueryNurseTaskParams): UseNursingTasksReturn {
  const [tasks, setTasks] = useState<NurseTaskDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const paramsKey = JSON.stringify(params);

  const fetchTasks = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await nursingService.listTasks(params);
      setTasks(data);
    } catch (err: unknown) {
      setError(extractErrorMessage(err, 'Failed to load nursing tasks'));
    } finally {
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paramsKey]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const createTask = useCallback(async (data: CreateNurseTaskPayload): Promise<NurseTaskDto> => {
    const created = await nursingService.createTask(data);
    await fetchTasks();
    return created;
  }, [fetchTasks]);

  const startTask = useCallback(async (id: string) => {
    await nursingService.startTask(id);
    await fetchTasks();
  }, [fetchTasks]);

  const completeTask = useCallback(async (id: string) => {
    await nursingService.completeTask(id);
    await fetchTasks();
  }, [fetchTasks]);

  const cancelTask = useCallback(async (id: string, reason?: string) => {
    await nursingService.cancelTask(id, reason);
    await fetchTasks();
  }, [fetchTasks]);

  const reopenTask = useCallback(async (id: string) => {
    await nursingService.reopenTask(id);
    await fetchTasks();
  }, [fetchTasks]);

  return {
    tasks,
    isLoading,
    error,
    refetch: fetchTasks,
    createTask,
    startTask,
    completeTask,
    cancelTask,
    reopenTask,
  };
}

export function useNursingTask(id: string | undefined) {
  const [task, setTask] = useState<NurseTaskDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await nursingService.getTask(id);
      setTask(data);
    } catch (err: unknown) {
      setError(extractErrorMessage(err, 'Failed to load task'));
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { task, isLoading, error, refetch: fetch };
}
