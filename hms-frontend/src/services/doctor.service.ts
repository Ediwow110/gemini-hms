import { apiClient } from '../lib/api';
import type { AxiosResponse } from 'axios';

export interface PatientSummaryDto {
  id: string;
  patientNumber: string;
  firstName: string;
  lastName: string;
  dob: string;
  status: string;
}

export interface PrescriptionDto {
  id: string;
  patientId: string;
  encounterId: string;
  medicationName: string;
  dosage: string;
  frequency: string;
  duration: string;
  notes?: string;
  status: string;
  prescribedById?: string;
  prescribedByName?: string;
  createdAt: string;
}

export interface CreatePrescriptionPayload {
  patientId: string;
  encounterId: string;
  medicationName: string;
  dosage: string;
  frequency: string;
  duration: string;
  notes?: string;
}

export interface PatientDetailDto {
  id: string;
  patientNumber: string;
  firstName: string;
  lastName: string;
  dob: string;
  status: string;
  createdAt: string;
}

export const doctorService = {
  getPatients: async (search?: string): Promise<PatientSummaryDto[]> => {
    const params = search ? `?search=${encodeURIComponent(search)}` : '';
    const response: AxiosResponse<PatientSummaryDto[]> = await apiClient.get(
      `/v1/patients${params}`,
    );
    return response.data;
  },

  getPatient: async (id: string): Promise<PatientDetailDto> => {
    const response: AxiosResponse<PatientDetailDto> = await apiClient.get(`/v1/patients/${id}`);
    return response.data;
  },

  getPatientPrescriptions: async (patientId: string): Promise<PrescriptionDto[]> => {
    const response: AxiosResponse<PrescriptionDto[]> = await apiClient.get(
      `/v1/prescriptions?patientId=${patientId}`,
    );
    return response.data;
  },

  createPrescription: async (data: CreatePrescriptionPayload): Promise<PrescriptionDto> => {
    const response: AxiosResponse<PrescriptionDto> = await apiClient.post(
      '/v1/prescriptions',
      data,
    );
    return response.data;
  },
};
