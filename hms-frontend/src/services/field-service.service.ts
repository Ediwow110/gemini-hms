import { apiClient } from "../lib/api";

export interface TechnicianDeliveryDto {
  id: string;
  customer: string;
  address: string;
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED";
}

export interface TechnicianInstallationDto {
  id: string;
  customer: string;
  address: string;
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED";
}

export interface TechnicianJobsResponseDto {
  deliveries: TechnicianDeliveryDto[];
  installations: TechnicianInstallationDto[];
}

export interface InstallationJobDto {
  id: string;
  asset: {
    model: string;
    serialNumber: string;
  };
  status: "ASSIGNED" | "IN_PROGRESS" | "COMPLETED";
}

export interface ShipmentDto {
  id: string;
  trackingNumber?: string;
  salesOrder: {
    id: string;
  };
  status: "SHIPPED" | "IN_TRANSIT" | "DELIVERED";
  carrier?: string;
}

export const fieldServiceService = {
  getTechnicianJobs: async (): Promise<TechnicianJobsResponseDto> => {
    const response = await apiClient.get("/v1/logistics/technician/jobs");
    return response.data;
  },
  getInstallations: async (): Promise<InstallationJobDto[]> => {
    const response = await apiClient.get("/v1/logistics/installations");
    return response.data;
  },
  getShipments: async (): Promise<ShipmentDto[]> => {
    const response = await apiClient.get("/v1/logistics/shipments");
    return response.data;
  },
  updateInstallationStatus: async (id: string, status: InstallationJobDto["status"]): Promise<void> => {
    await apiClient.patch(`/v1/logistics/installations/${id}/status`, { status });
  },
  createDeliveryJob: async (dto: { customerOrderId: string; address: string; technicianId: string }): Promise<void> => {
    await apiClient.post("/v1/logistics/delivery-jobs", dto);
  },
  updateShipmentStatus: async (id: string, status: ShipmentDto["status"]): Promise<void> => {
    await apiClient.patch(`/v1/logistics/shipments/${id}/status`, { status });
  },
};
