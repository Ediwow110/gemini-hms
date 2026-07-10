import { apiClient } from "../lib/api";

export type DeliveryJobStatus = "ASSIGNED" | "IN_PROGRESS" | "COMPLETED" | "FAILED";
export type InstallationJobStatus = "ASSIGNED" | "IN_PROGRESS" | "COMMISSIONED" | "COMPLETED" | "FAILED";
export type ShipmentStatus = "PENDING" | "PROCESSING" | "SHIPPED" | "IN_TRANSIT" | "DELIVERED" | "CANCELLED";

export interface TechnicianDeliveryDto {
  id: string;
  customer: string;
  address: string;
  status: DeliveryJobStatus;
  shipmentId: string;
  orderId: string;
}

export interface TechnicianInstallationDto {
  id: string;
  customer: string;
  address: string;
  status: InstallationJobStatus;
  assetId: string;
  assetModel: string;
}

export interface TechnicianJobsResponseDto {
  deliveries: TechnicianDeliveryDto[];
  installations: TechnicianInstallationDto[];
}

export interface InstallationJobDto {
  id: string;
  asset: {
    id: string;
    model: string;
    serialNumber: string;
    salesOrder?: {
      quote?: {
        rfq?: {
          title: string;
          branch?: { id: string; name: string };
        };
      };
    };
  };
  assignedUser?: { id: string; email: string };
  status: InstallationJobStatus;
}

export interface ShipmentDto {
  id: string;
  trackingNumber?: string;
  status: ShipmentStatus;
  carrier?: string;
  salesOrder: {
    id: string;
    quote?: {
      rfq?: {
        title: string;
        branch?: { id: string; name: string };
      };
    };
  };
  deliveryJobs?: Array<{
    id: string;
    status: DeliveryJobStatus;
    assignedUser?: { id: string; email: string };
  }>;
}

export interface EligibleTechnicianDto {
  id: string;
  email: string;
}

export interface CreateDeliveryJobDto {
  shipmentId: string;
  assignedUserId: string;
  notes?: string;
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
  getEligibleTechnicians: async (): Promise<EligibleTechnicianDto[]> => {
    const response = await apiClient.get("/v1/logistics/technicians");
    return response.data;
  },
  updateInstallationStatus: async (
    id: string,
    status: InstallationJobDto["status"],
  ): Promise<void> => {
    await apiClient.patch(`/v1/logistics/installations/${id}/status`, { status });
  },
  createDeliveryJob: async (dto: CreateDeliveryJobDto): Promise<void> => {
    await apiClient.post("/v1/logistics/delivery-jobs", dto);
  },
  updateShipmentStatus: async (
    id: string,
    status: ShipmentDto["status"],
  ): Promise<void> => {
    await apiClient.patch(`/v1/logistics/shipments/${id}/status`, { status });
  },
};
