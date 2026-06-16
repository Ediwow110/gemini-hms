import { apiClient } from '../lib/api';

export interface AdminUserRole {
  id: string;
  name: string;
  status: string;
}

export interface AdminUserBranch {
  id: string;
  name: string;
  isActive: boolean;
}

export interface AdminUserItem {
  id: string;
  email: string;
  tenantId: string;
  mfaEnabled: boolean;
  status: string;
  deactivatedAt: string | null;
  lockedUntil: string | null;
  isSystem: boolean;
  createdAt: string;
  updatedAt: string;
  roles: AdminUserRole[];
  branches: AdminUserBranch[];
}

export interface AdminUserListResponse {
  data: AdminUserItem[];
  total: number;
  page: number;
  limit: number;
}

export interface AdminRolePermissionSummary {
  id: string;
  name: string;
  scope: string | null;
  riskLevel: string;
}

export interface AdminRoleListItem {
  id: string;
  name: string;
  status: string;
  isSystem: boolean;
  permissions: AdminRolePermissionSummary[];
}

export interface AdminPermissionListItem {
  id: string;
  name: string;
  scope: string | null;
  riskLevel: string;
}

export interface AdminUserListParams {
  search?: string;
  status?: string;
  branchId?: string;
  page?: number;
  limit?: number;
}

export interface AdminBranchItem {
  id: string;
  name: string;
  code: string;
  createdAt: string;
  updatedAt: string;
}

export interface AdminBranchListResponse {
  data: AdminBranchItem[];
  total: number;
  page: number;
  limit: number;
}

export const adminService = {
  async listUsers(params?: AdminUserListParams): Promise<AdminUserListResponse> {
    const queryParams: Record<string, string> = {};
    if (params?.search) queryParams.search = params.search;
    if (params?.status) queryParams.status = params.status;
    if (params?.branchId) queryParams.branchId = params.branchId;
    if (params?.page) queryParams.page = String(params.page);
    if (params?.limit) queryParams.limit = String(params.limit);
    const response = await apiClient.get('/v1/admin/users', { params: queryParams });
    return response.data;
  },

  async getUser(id: string): Promise<AdminUserItem> {
    const response = await apiClient.get(`/v1/admin/users/${id}`);
    return response.data;
  },

  async forceLogout(id: string, reason: string): Promise<void> {
    await apiClient.post(`/v1/admin/users/${id}/force-logout`, { reason });
  },

  async resetPassword(id: string, reason: string): Promise<{ tempPassword: string }> {
    const response = await apiClient.post(`/v1/admin/users/${id}/reset-password`, { reason });
    return response.data;
  },

  async listRoles(): Promise<AdminRoleListItem[]> {
    const response = await apiClient.get('/v1/admin/roles');
    return response.data;
  },

  async listPermissions(): Promise<AdminPermissionListItem[]> {
    const response = await apiClient.get('/v1/admin/permissions');
    return response.data;
  },

  async listBranches(params?: { search?: string; page?: number; limit?: number }): Promise<AdminBranchListResponse> {
    const queryParams: Record<string, string> = {};
    if (params?.search) queryParams.search = params.search;
    if (params?.page) queryParams.page = String(params.page);
    if (params?.limit) queryParams.limit = String(params.limit);
    const response = await apiClient.get('/v1/admin/branches', { params: queryParams });
    return response.data;
  },

  async getBranch(id: string): Promise<AdminBranchItem> {
    const response = await apiClient.get(`/v1/admin/branches/${id}`);
    return response.data;
  },
};
