export interface RequestUser {
  userId?: string;
  sessionId?: string;
  email?: string;
  tenantId: string;
  branchId?: string;
  supplierId?: string | null;
  roles?: string[];
  permissions?: string[];
  tokenVersion?: number;
  mfaVerified?: boolean;
  scope?: string;
  challenge?: string;
}

export interface AuthenticatedRequest {
  user: RequestUser;
}
