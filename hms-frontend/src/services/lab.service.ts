import { apiClient } from '../lib/api';
import type { AxiosResponse } from 'axios';

// ──── DTOs ────

export interface PendingSpecimenDto {
  id: string;
  orderId: string;
  orderNumber: string;
  patientId: string;
  patientName: string;
  patientMrn: string;
  specimenType: string;
  collectionMode: string;
  collectedAt: string | null;
  status: string;
  createdAt: string;
  testNames?: string[];
}

export interface ReleasableResultDto {
  id: string;
  orderId: string;
  orderNumber: string;
  patientId: string;
  patientName: string;
  patientMrn: string;
  status: string;
  encodedById: string | null;
  encodedAt: string | null;
  validatedById: string | null;
  validatedAt: string | null;
  results?: Record<string, unknown>;
  remarks?: string | null;
  createdAt: string;
  testNames?: string[];
}

// ──── Service ────

export const labService = {
  /** Fetch specimens awaiting receiving */
  getPendingSpecimens: async (): Promise<PendingSpecimenDto[]> => {
    const response: AxiosResponse<PendingSpecimenDto[]> = await apiClient.get(
      '/v1/lab/specimens/pending',
    );
    return response.data;
  },

  /** Mark a specimen as received */
  receiveSpecimen: async (id: string): Promise<Record<string, unknown>> => {
    const response = await apiClient.patch(`/v1/lab/specimens/${id}/receive`);
    return response.data;
  },

  /** Fetch APPROVED results awaiting release */
  getReleasableResults: async (): Promise<ReleasableResultDto[]> => {
    const response: AxiosResponse<ReleasableResultDto[]> = await apiClient.get(
      '/v1/lab/results/releasable',
    );
    return response.data;
  },
};
