import { apiClient } from "../lib/api";
import { billingFrontendService } from "./billing-frontend.service";

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
  details?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface ApprovalListParams {
  page?: number;
  pageSize?: number;
}

export const approvalService = {
  getRequests: async (params?: ApprovalListParams): Promise<ApprovalRequest[]> => {
    const response = await apiClient.get("/v1/approvals", {
      params: {
        page: params?.page ?? 1,
        pageSize: params?.pageSize ?? 50,
      },
    });
    return response.data;
  },

  approveRequest: async (id: string, type: string, remarks: string, details?: Record<string, unknown>) => {
    // Billing reversal endpoints
    if (type === 'REFUND') {
      const reversalId = details?.reversalId;
      if (!reversalId) throw new Error('Missing reversalId in approval request details');
      return billingFrontendService.approveRefund(reversalId as string, remarks);
    }

    if (type === 'PAYMENT_VOID') {
      const reversalId = details?.reversalId;
      if (!reversalId) throw new Error('Missing reversalId in approval request details');
      return billingFrontendService.approveVoid(reversalId as string, remarks);
    }

    // Specialized admin endpoints for role/permission/user changes
    if (type === 'ADMIN_PRIVILEGED_ROLE_ASSIGN' || type === 'ADMIN_PRIVILEGED_ROLE_REVOKE') {
      return apiClient.post(`/v1/admin/role-change-requests/${id}/approve`, {
        reason: remarks,
      });
    }

    if (type === 'ADMIN_PRIVILEGED_PERMISSION_GRANT' || type === 'ADMIN_PRIVILEGED_PERMISSION_REVOKE') {
      return apiClient.post(`/v1/admin/role-permission-change-requests/${id}/approve`, {
        reason: remarks,
      });
    }

    if (
      type === 'ADMIN_PRIVILEGED_USER_DEACTIVATE' || 
      type === 'ADMIN_PRIVILEGED_USER_ACTIVATE' || 
      type === 'ADMIN_PRIVILEGED_USER_PROFILE_UPDATE'
    ) {
      return apiClient.post(`/v1/admin/privileged-user-change-requests/${id}/approve`, {
        reason: remarks,
      });
    }

    // Generic approval endpoint
    return apiClient.patch(`/v1/approvals/${id}/approve`, {
      remarks,
    });
  },

  rejectRequest: async (id: string, type: string, remarks: string, details?: Record<string, unknown>) => {
    // Billing reversal endpoints
    if (type === 'REFUND') {
      const reversalId = details?.reversalId;
      if (!reversalId) throw new Error('Missing reversalId in approval request details');
      return billingFrontendService.rejectRefund(reversalId as string, remarks);
    }

    if (type === 'PAYMENT_VOID') {
      const reversalId = details?.reversalId;
      if (!reversalId) throw new Error('Missing reversalId in approval request details');
      return billingFrontendService.rejectVoid(reversalId as string, remarks);
    }

    // Specialized admin endpoints for role/permission/user changes
    if (type === 'ADMIN_PRIVILEGED_ROLE_ASSIGN' || type === 'ADMIN_PRIVILEGED_ROLE_REVOKE') {
      return apiClient.post(`/v1/admin/role-change-requests/${id}/reject`, {
        reason: remarks,
      });
    }

    if (type === 'ADMIN_PRIVILEGED_PERMISSION_GRANT' || type === 'ADMIN_PRIVILEGED_PERMISSION_REVOKE') {
      return apiClient.post(`/v1/admin/role-permission-change-requests/${id}/reject`, {
        reason: remarks,
      });
    }

    if (
      type === 'ADMIN_PRIVILEGED_USER_DEACTIVATE' || 
      type === 'ADMIN_PRIVILEGED_USER_ACTIVATE' || 
      type === 'ADMIN_PRIVILEGED_USER_PROFILE_UPDATE'
    ) {
      return apiClient.post(`/v1/admin/privileged-user-change-requests/${id}/reject`, {
        reason: remarks,
      });
    }

    // Generic rejection endpoint
    return apiClient.patch(`/v1/approvals/${id}/reject`, {
      remarks,
    });
  },
};
