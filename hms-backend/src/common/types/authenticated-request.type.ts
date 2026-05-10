export interface RequestUser {
  userId?: string;
  tenantId: string;
  branchId?: string;
  roles?: string[];
  permissions?: string[];
}

export interface AuthenticatedRequest {
  user: RequestUser;
}
