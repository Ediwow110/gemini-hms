import { apiClient } from "../lib/api";

export interface ApprovalRequest {
  id: string;
  type: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  requesterId: string;
  requester: {
    id: string;
    email: string;
  };
  recordId: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'APPLIED';
  reason?: string;
  remarks?: string;
  details?: any;
  createdAt: string;
  updatedAt: string;
}

export const approvalService = {
  getRequests: async (): Promise<ApprovalRequest[]> => {
    const response = await apiClient.get("/v1/approvals");
    return response.data;
  },

  approveRequest: async (id: string, type: string, remarks: string) => {
    // Specialized admin endpoint for role changes
    if (type === 'ADMIN_PRIVILEGED_ROLE_ASSIGN' || type === 'ADMIN_PRIVILEGED_ROLE_REVOKE') {
      return apiClient.post(`/v1/admin/role-change-requests/${id}/approve`, {
        reason: remarks,
      });
    }

    // Generic approval endpoint
    return apiClient.patch(`/v1/approvals/${id}/approve`, {
      remarks,
    });
  },

  rejectRequest: async (id: string, type: string, remarks: string) => {
    // Specialized admin endpoint for role changes
    if (type === 'ADMIN_PRIVILEGED_ROLE_ASSIGN' || type === 'ADMIN_PRIVILEGED_ROLE_REVOKE') {
      return apiClient.post(`/v1/admin/role-change-requests/${id}/reject`, {
        reason: remarks,
      });
    }

    // Generic rejection endpoint
    return apiClient.patch(`/v1/approvals/${id}/reject`, {
      remarks,
    });
  },
};
