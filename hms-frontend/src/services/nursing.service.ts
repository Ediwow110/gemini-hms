import { apiClient } from '../lib/api';
import type { AxiosResponse } from 'axios';

export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
export type TaskStatus = 'OPEN' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export interface NurseTaskDto {
  id: string;
  tenantId: string;
  branchId: string;
  title: string;
  description?: string | null;
  priority: TaskPriority;
  status: TaskStatus;
  patientId?: string | null;
  patientName?: string | null;
  patientMrn?: string | null;
  assignedUserId?: string | null;
  assignedUserName?: string | null;
  createdById: string;
  createdByName?: string | null;
  dueAt?: string | null;
  completedAt?: string | null;
  completedById?: string | null;
  completedByName?: string | null;
  cancelledAt?: string | null;
  cancelledById?: string | null;
  cancellationReason?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateNurseTaskPayload {
  title: string;
  description?: string;
  priority?: TaskPriority;
  patientId?: string;
  assignedUserId?: string;
  dueAt?: string;
}

export interface UpdateNurseTaskPayload {
  title?: string;
  description?: string;
  priority?: TaskPriority;
  assignedUserId?: string;
  patientId?: string;
  dueAt?: string;
  cancellationReason?: string;
}

export interface QueryNurseTaskParams {
  status?: TaskStatus;
  priority?: TaskPriority;
  patientId?: string;
  assignedToMe?: boolean;
  search?: string;
}

export const nursingService = {
  listTasks: async (params?: QueryNurseTaskParams): Promise<NurseTaskDto[]> => {
    const query = new URLSearchParams();
    if (params?.status) query.set('status', params.status);
    if (params?.priority) query.set('priority', params.priority);
    if (params?.patientId) query.set('patientId', params.patientId);
    if (params?.assignedToMe) query.set('assignedToMe', 'true');
    if (params?.search) query.set('search', params.search);
    const qs = query.toString();
    const response: AxiosResponse<NurseTaskDto[]> = await apiClient.get(
      `/v1/nursing/tasks${qs ? `?${qs}` : ''}`,
    );
    return response.data;
  },

  getTask: async (id: string): Promise<NurseTaskDto> => {
    const response: AxiosResponse<NurseTaskDto> = await apiClient.get(
      `/v1/nursing/tasks/${id}`,
    );
    return response.data;
  },

  createTask: async (data: CreateNurseTaskPayload): Promise<NurseTaskDto> => {
    const response: AxiosResponse<NurseTaskDto> = await apiClient.post(
      '/v1/nursing/tasks',
      data,
    );
    return response.data;
  },

  updateTask: async (id: string, data: UpdateNurseTaskPayload): Promise<NurseTaskDto> => {
    const response: AxiosResponse<NurseTaskDto> = await apiClient.patch(
      `/v1/nursing/tasks/${id}`,
      data,
    );
    return response.data;
  },

  startTask: async (id: string): Promise<NurseTaskDto> => {
    const response: AxiosResponse<NurseTaskDto> = await apiClient.patch(
      `/v1/nursing/tasks/${id}/start`,
    );
    return response.data;
  },

  completeTask: async (id: string): Promise<NurseTaskDto> => {
    const response: AxiosResponse<NurseTaskDto> = await apiClient.patch(
      `/v1/nursing/tasks/${id}/complete`,
    );
    return response.data;
  },

  cancelTask: async (id: string, reason?: string): Promise<NurseTaskDto> => {
    const response: AxiosResponse<NurseTaskDto> = await apiClient.patch(
      `/v1/nursing/tasks/${id}/cancel`,
      reason ? { reason } : undefined,
    );
    return response.data;
  },

  reopenTask: async (id: string): Promise<NurseTaskDto> => {
    const response: AxiosResponse<NurseTaskDto> = await apiClient.patch(
      `/v1/nursing/tasks/${id}/reopen`,
    );
    return response.data;
  },
};
