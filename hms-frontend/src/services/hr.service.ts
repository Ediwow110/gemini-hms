import { apiClient } from '../lib/api';

export type HrEmployeeStatus =
  | 'ACTIVE'
  | 'ON_LEAVE'
  | 'SUSPENDED'
  | 'RESIGNED'
  | 'TERMINATED';

export interface HrEmployee {
  id: string;
  userId?: string | null;
  tenantId?: string;
  branchId: string;
  employeeNumber: string;
  department: string;
  position: string;
  hireDate: string;
  status: HrEmployeeStatus;
  createdAt: string;
  updatedAt: string;
  firstName?: string | null;
  lastName?: string | null;
  jobTitle?: string | null;
  salary?: number | string | null;
}

export interface CreateEmployeePayload {
  userId?: string;
  branchId: string;
  department: string;
  position: string;
  hireDate: string;
  firstName?: string;
  lastName?: string;
  salary?: number;
}

export interface HrEmployeeListResponse {
  data: HrEmployee[];
  total?: number;
}

export const hrService = {
  async listEmployees(): Promise<HrEmployee[]> {
    const response = await apiClient.get('/v1/hr/employees');
    const body = response.data;
    if (Array.isArray(body)) return body as HrEmployee[];
    if (body && Array.isArray((body as HrEmployeeListResponse).data)) {
      return (body as HrEmployeeListResponse).data as HrEmployee[];
    }
    return [];
  },

  async getEmployeeById(id: string): Promise<HrEmployee> {
    const response = await apiClient.get(`/v1/hr/employees/${id}`);
    return response.data as HrEmployee;
  },

  async createEmployee(payload: CreateEmployeePayload): Promise<HrEmployee> {
    const response = await apiClient.post('/v1/hr/employees', payload);
    return response.data as HrEmployee;
  },
};
