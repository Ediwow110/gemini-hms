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

export interface CriticalResultDto {
  id: string;
  orderId: string;
  orderNumber: string;
  patientId: string;
  patientName: string;
  patientMrn: string;
  testNames?: string[];
  results?: Record<string, unknown>;
  status: string;
  isCritical: boolean;
  criticalStatus: string | null;
  criticalAcknowledgedAt?: string | null;
  criticalAcknowledgedById?: string | null;
  criticalAcknowledgedByName?: string | null;
  criticalEscalatedAt?: string | null;
  criticalEscalatedById?: string | null;
  criticalEscalationNotes?: string | null;
  criticalResolvedAt?: string | null;
  criticalResolvedById?: string | null;
  criticalResolvedNotes?: string | null;
  encodedAt?: string | null;
  validatedAt?: string | null;
  releasedAt?: string | null;
  createdAt: string;
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

  // ──── Phase 4E: Critical Results ────

  /** Fetch critical results */
  getCriticalResults: async (status?: string): Promise<CriticalResultDto[]> => {
    const params = status ? { status } : {};
    const response: AxiosResponse<CriticalResultDto[]> = await apiClient.get(
      '/v1/lab/critical-results',
      { params },
    );
    return response.data;
  },

  /** Mark a result as critical */
  markResultAsCritical: async (id: string, isCritical: boolean, reason?: string): Promise<CriticalResultDto[]> => {
    const response = await apiClient.patch(`/v1/lab/results/${id}/mark-critical`, { isCritical, reason });
    return response.data;
  },

  /** Acknowledge a critical result */
  acknowledgeCriticalResult: async (id: string, notes?: string): Promise<CriticalResultDto[]> => {
    const response = await apiClient.patch(`/v1/lab/critical-results/${id}/acknowledge`, { notes });
    return response.data;
  },

  /** Escalate a critical result */
  escalateCriticalResult: async (id: string, notes: string): Promise<CriticalResultDto[]> => {
    const response = await apiClient.patch(`/v1/lab/critical-results/${id}/escalate`, { notes });
    return response.data;
  },

  /** Resolve a critical result */
  resolveCriticalResult: async (id: string, notes?: string): Promise<CriticalResultDto[]> => {
    const response = await apiClient.patch(`/v1/lab/critical-results/${id}/resolve`, { notes });
    return response.data;
  },
};
