import { apiClient } from '../lib/api';

export type SupplierStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | string;

export interface Supplier {
  id: string;
  tenantId?: string;
  name: string;
  contactName?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  address?: string | null;
  status: SupplierStatus;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateSupplierPayload {
  name: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  address?: string;
}

export interface ListSuppliersFilters {
  search?: string;
  status?: SupplierStatus;
}

export interface SupplierListResponse {
  data?: Supplier[];
  total?: number;
}

export type PurchaseRequestStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'APPROVED'
  | 'REJECTED'
  | 'ORDERED'
  | string;

export interface PurchaseRequestItem {
  sku: string;
  quantity: number;
  unitPrice: number;
}

export interface PurchaseRequest {
  id: string;
  tenantId?: string;
  branchId: string;
  requestedById: string;
  items: PurchaseRequestItem[];
  status: PurchaseRequestStatus;
  reason?: string | null;
  approvedById?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreatePurchaseRequestPayload {
  branchId: string;
  items: PurchaseRequestItem[];
  reason?: string;
}

export interface ListPurchaseRequestsFilters {
  status?: PurchaseRequestStatus;
  branchId?: string;
}

export interface PurchaseRequestListResponse {
  data?: PurchaseRequest[];
  total?: number;
}

const extractArray = (body: unknown): Supplier[] => {
  if (Array.isArray(body)) return body as Supplier[];
  if (body && typeof body === 'object') {
    const data = (body as SupplierListResponse).data;
    if (Array.isArray(data)) return data as Supplier[];
  }
  return [];
};

export const procurementService = {
  async listSuppliers(
    filters: ListSuppliersFilters = {},
  ): Promise<Supplier[]> {
    const response = await apiClient.get('/v1/procurement/suppliers', {
      params: {
        ...(filters.search ? { search: filters.search } : {}),
        ...(filters.status ? { status: filters.status } : {}),
      },
    });
    return extractArray(response.data);
  },

  async createSupplier(payload: CreateSupplierPayload): Promise<Supplier> {
    const response = await apiClient.post(
      '/v1/procurement/suppliers',
      payload,
    );
    return response.data as Supplier;
  },

  async listPurchaseRequests(
    filters: ListPurchaseRequestsFilters = {},
  ): Promise<PurchaseRequest[]> {
    const response = await apiClient.get(
      '/v1/procurement/purchase-requests',
      {
        params: {
          ...(filters.status ? { status: filters.status } : {}),
          ...(filters.branchId ? { branchId: filters.branchId } : {}),
        },
      },
    );
    const body = response.data;
    if (Array.isArray(body)) return body as PurchaseRequest[];
    if (body && typeof body === 'object') {
      const data = (body as PurchaseRequestListResponse).data;
      if (Array.isArray(data)) return data as PurchaseRequest[];
    }
    return [];
  },

  async createPurchaseRequest(
    payload: CreatePurchaseRequestPayload,
  ): Promise<PurchaseRequest> {
    const response = await apiClient.post(
      '/v1/procurement/purchase-requests',
      payload,
    );
    return response.data as PurchaseRequest;
  },

  async approvePurchaseRequest(id: string): Promise<PurchaseRequest> {
    const response = await apiClient.patch(
      `/v1/procurement/purchase-requests/${id}/approve`,
    );
    return response.data as PurchaseRequest;
  },
};
