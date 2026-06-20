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

export interface CreateAdminUserPayload {
  email: string;
  password: string;
  mfaEnabled?: boolean;
  branchIds: string[];
  roleIds?: string[];
  reason: string;
}

export interface CreateAdminUserResponse {
  userId: string;
  email: string;
  status: string;
  branchIds: string[];
  roleIds: string[];
}

export interface AdminUserLifecycleResponse {
  userId: string;
  email: string;
  status: string;
  mfaEnabled: boolean;
  tokenVersion: number;
  deactivatedAt: string | null;
  previousStatus?: string;
}

export interface AdminUserRoleMutationResponse {
  userId: string;
  roleId: string;
  roleName: string;
  status: string;
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

  async createUser(payload: CreateAdminUserPayload): Promise<CreateAdminUserResponse> {
    const response = await apiClient.post('/v1/admin/users', payload);
    return response.data;
  },

  async activateUser(id: string, reason: string): Promise<AdminUserLifecycleResponse> {
    const response = await apiClient.post(`/v1/admin/users/${id}/activate`, { reason });
    return response.data;
  },

  async deactivateUser(id: string, reason: string): Promise<AdminUserLifecycleResponse> {
    const response = await apiClient.post(`/v1/admin/users/${id}/deactivate`, { reason });
    return response.data;
  },

  async forceLogout(id: string, reason: string): Promise<void> {
    await apiClient.post(`/v1/admin/users/${id}/force-logout`, { reason });
  },

  async resetPassword(id: string, reason: string): Promise<{ tempPassword: string }> {
    const response = await apiClient.post(`/v1/admin/users/${id}/reset-password`, { reason });
    return response.data;
  },

  async assignUserRole(
    id: string,
    roleId: string,
    reason: string,
  ): Promise<AdminUserRoleMutationResponse> {
    const response = await apiClient.post(`/v1/admin/users/${id}/roles`, {
      roleId,
      reason,
    });
    return response.data;
  },

  async revokeUserRole(
    id: string,
    roleId: string,
    reason: string,
  ): Promise<AdminUserRoleMutationResponse> {
    const response = await apiClient.post(`/v1/admin/users/${id}/roles/${roleId}/revoke`, {
      reason,
    });
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
