import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../lib/api';

export interface QueueEntry {
  id: string;
  patientId: string;
  patientName: string;
  queueNumber: string;
  category: string;
  serviceType: string;
  status: string;
  counterNumber: string;
  createdAt: string;
}

export interface QueueStats {
  waiting: number;
  calling: number;
  served: number;
  skipped: number;
}

export const useQueue = (branchId: string) => {
  const queryClient = useQueryClient();

  const { data: queue, isLoading: queueLoading, error: queueError } = useQuery({
    queryKey: ['queue', branchId],
    queryFn: async () => {
      const res = await apiClient.get(`/v1/queue?branchId=${branchId}`);
      return res.data as QueueEntry[];
    },
  });

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['queue-stats', branchId],
    queryFn: async () => {
      const res = await apiClient.get(`/v1/queue/stats?branchId=${branchId}`);
      return res.data as QueueStats;
    },
  });

  const joinMutation = useMutation({
    mutationFn: async (data: { patientId: string; serviceType: string; category: string; branchId: string }) => {
      const res = await apiClient.post('/v1/queue/join', data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['queue', branchId] });
      queryClient.invalidateQueries({ queryKey: ['queue-stats', branchId] });
    },
  });

  const callNextMutation = useMutation({
    mutationFn: async (serviceType: string) => {
      const res = await apiClient.patch(`/v1/queue/call-next?branchId=${branchId}&serviceType=${serviceType}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['queue', branchId] });
      queryClient.invalidateQueries({ queryKey: ['queue-stats', branchId] });
    },
  });

  const completeMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiClient.patch(`/v1/queue/${id}/complete?branchId=${branchId}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['queue', branchId] });
      queryClient.invalidateQueries({ queryKey: ['queue-stats', branchId] });
    },
  });

  return {
    queue,
    stats,
    isLoading: queueLoading || statsLoading,
    error: queueError,
    joinQueue: joinMutation.mutateAsync,
    callNext: callNextMutation.mutateAsync,
    completeEntry: completeMutation.mutateAsync,
    isUpdating: joinMutation.isPending || callNextMutation.isPending || completeMutation.isPending,
  };
};
