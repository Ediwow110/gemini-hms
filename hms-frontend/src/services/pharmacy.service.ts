import { apiClient } from '../lib/api';
import type { AxiosResponse } from 'axios';

export interface PharmacyPrescriptionQueueDto {
  id: string;
  encounterId: string;
  patientId: string;
  patientName: string;
  patientNumber: string;
  medicationName: string;
  dosage: string;
  frequency: string;
  duration: string;
  notes?: string;
  status: string;
  version: number;
  prescribedAt: Date;
  prescribedBy: string;
  prescribedByName?: string;
  timestamp: Date;
  accessLabel: string;
  isReadOnly: boolean;
}

export interface DispenseResultDto {
  id: string;
  status: string;
  version: number;
  dispensedById?: string;
  dispensedAt?: Date;
  medicationName: string;
  dosage: string;
  inventoryItemId?: string;
  quantity: number;
  timestamp: Date;
  accessLabel: string;
  isReadOnly: boolean;
}

export interface DispensePrescriptionPayload {
  version: number;
  inventoryItemId: string;
  quantity: number;
  notes?: string;
}

export interface DrugStockDto {
  id: string;
  name: string;
  sku: string;
  type: string;
  quantity: number;
  reorderLevel: number;
  unit: string;
}

export interface StockLogDto {
  id: string;
  inventoryItemId: string;
  type: string; // IN, OUT, ADJUSTMENT, RETURN
  quantity: number;
  previousStock: number;
  newStock: number;
  referenceType?: string;
  referenceId?: string;
  remarks?: string;
  createdAt: string;
}

export interface LowStockAlertDto {
  id: string;
  inventoryItemId: string;
  quantity: number;
  reorderLevel: number;
  inventoryItem: {
    name: string;
    sku?: string;
    unit: string;
  };
}

export const pharmacyService = {
  getPrescriptionQueue: async (
    status?: string,
  ): Promise<PharmacyPrescriptionQueueDto[]> => {
    const params = status ? `?status=${status}` : '';
    const response: AxiosResponse<PharmacyPrescriptionQueueDto[]> =
      await apiClient.get(`/v1/pharmacy/prescriptions${params}`);
    return response.data;
  },

  dispenseMedication: async (
    prescriptionId: string,
    data: DispensePrescriptionPayload,
  ): Promise<DispenseResultDto> => {
    const response: AxiosResponse<DispenseResultDto> = await apiClient.post(
      `/v1/pharmacy/prescriptions/${prescriptionId}/dispense`,
      data,
    );
    return response.data;
  },

  getDrugCatalog: async (): Promise<DrugStockDto[]> => {
    const response: AxiosResponse<DrugStockDto[]> = await apiClient.get(
      '/v1/pharmacy/drugs',
    );
    return response.data;
  },

  // ──── Sprint 2B additions ────

  getStockMovements: async (itemId: string): Promise<StockLogDto[]> => {
    const response: AxiosResponse<StockLogDto[]> = await apiClient.get(
      `/v1/inventory/items/${itemId}/logs`,
    );
    return response.data;
  },

  getLowStockAlerts: async (): Promise<LowStockAlertDto[]> => {
    const response: AxiosResponse<LowStockAlertDto[]> = await apiClient.get(
      '/v1/inventory/alerts/low-stock',
    );
    return response.data;
  },

  adjustStock: async (
    itemId: string,
    newQuantity: number,
    reason: string,
  ): Promise<unknown> => {
    const response = await apiClient.patch(`/v1/inventory/stock/${itemId}/adjust`, {
      newQuantity,
      reason,
    });
    return response.data;
  },
};
