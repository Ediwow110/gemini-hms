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

export interface HrDepartment {
  id: string;
  tenantId?: string;
  name: string;
  code: string;
  createdAt: string;
  updatedAt: string;
  _count?: {
    employees?: number;
  };
}

export interface CreateDepartmentPayload {
  name: string;
  code: string;
}

export interface HrDepartmentListResponse {
  data: HrDepartment[];
  total?: number;
}

export type LeaveRequestStatus =
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED'
  | 'CANCELLED';

export type LeaveRequestType =
  | 'ANNUAL'
  | 'SICK'
  | 'MATERNITY'
  | 'EMERGENCY';

export interface HrLeaveRequest {
  id: string;
  employeeId: string;
  tenantId?: string;
  type: string;
  startDate: string;
  endDate: string;
  status: LeaveRequestStatus;
  reason: string;
  approvedById?: string | null;
  createdAt?: string;
  updatedAt?: string;
  employee?: {
    id: string;
    employeeNumber: string;
    firstName: string;
    lastName: string;
    branchId: string;
  } | null;
}

export interface CreateLeaveRequestPayload {
  employeeId: string;
  type: string;
  startDate: string;
  endDate: string;
  reason: string;
}

export interface ListLeaveRequestsFilters {
  status?: LeaveRequestStatus | string;
  employeeId?: string;
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

  async listDepartments(): Promise<HrDepartment[]> {
    const response = await apiClient.get('/v1/hr/departments');
    const body = response.data;
    if (Array.isArray(body)) return body as HrDepartment[];
    if (body && Array.isArray((body as HrDepartmentListResponse).data)) {
      return (body as HrDepartmentListResponse).data as HrDepartment[];
    }
    return [];
  },

  async createDepartment(payload: CreateDepartmentPayload): Promise<HrDepartment> {
    const response = await apiClient.post('/v1/hr/departments', payload);
    return response.data as HrDepartment;
  },

  async listLeaveRequests(
    filters: ListLeaveRequestsFilters = {},
  ): Promise<HrLeaveRequest[]> {
    const response = await apiClient.get('/v1/hr/leave-requests', {
      params: {
        ...(filters.status ? { status: filters.status } : {}),
        ...(filters.employeeId ? { employeeId: filters.employeeId } : {}),
      },
    });
    const body = response.data;
    if (Array.isArray(body)) return body as HrLeaveRequest[];
    if (body && Array.isArray((body as { data?: HrLeaveRequest[] }).data)) {
      return (body as { data: HrLeaveRequest[] }).data;
    }
    return [];
  },

  async createLeaveRequest(
    payload: CreateLeaveRequestPayload,
  ): Promise<HrLeaveRequest> {
    const response = await apiClient.post('/v1/hr/leave-requests', payload);
    return response.data as HrLeaveRequest;
  },

  async approveLeaveRequest(id: string): Promise<HrLeaveRequest> {
    const response = await apiClient.patch(
      `/v1/hr/leave-requests/${id}/approve`,
    );
    return response.data as HrLeaveRequest;
  },

  async rejectLeaveRequest(id: string): Promise<HrLeaveRequest> {
    const response = await apiClient.patch(
      `/v1/hr/leave-requests/${id}/reject`,
    );
    return response.data as HrLeaveRequest;
  },
};
