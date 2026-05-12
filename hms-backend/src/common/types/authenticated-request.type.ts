export interface RequestUser {
  userId?: string;
  email?: string;
  tenantId: string;
  branchId?: string;
  roles?: string[];
  permissions?: string[];
  tokenVersion?: number;
}

export interface AuthenticatedRequest {
  user: RequestUser;
}
