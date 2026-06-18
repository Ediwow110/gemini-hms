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
};
