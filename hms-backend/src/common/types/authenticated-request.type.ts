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

/**
 * Payload shape from MFA challenge JWT tokens issued by AuthService.
 * Guard: MfaChallengeGuard decodes and sets this on request.user.
 */
export interface MfaChallengePayload {
  sub: string;
  sid: string;
  tenantId: string;
  email?: string;
  tokenVersion?: number;
  roles?: string[];
  scope: string;
  challenge?: string;
}
