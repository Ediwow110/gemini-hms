export interface RequestUser {
  userId?: string;
  email?: string;
  tenantId: string;
  branchId?: string;
  roles?: string[];
  permissions?: string[];
}

export interface AuthenticatedRequest {
  user: RequestUser;
}
