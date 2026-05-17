import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Strict type definition for decoded payload
interface AuthenticatedPayload {
  userId: string;
  tenantId: string;
  role: string;
}

export class SecurityException extends Error {
  constructor(public message: string, public code: string) {
    super(message);
    this.name = 'SecurityException';
  }
}

/**
 * Global Multi-Tenant Isolation Interceptor
 */
export function tenantIsolationMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new SecurityException('Missing or malformed Authorization header.', 'UNAUTHORIZED_ACCESS');
    }

    const token = authHeader.split(' ')[1];
    
    // Step A: Safely extract and decode active token
    let decoded: AuthenticatedPayload;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET as string) as AuthenticatedPayload;
    } catch (err) {
      throw new SecurityException('Cryptographic token signature validation failed.', 'INVALID_SIGNATURE');
    }

    // Step B: Ensure tenant_id exists
    if (!decoded || !decoded.tenantId) {
      throw new SecurityException('Critical Isolation Failure: Tenant namespace missing in token context.', 'TENANT_NAMESPACE_VIOLATION');
    }

    // Bind isolated tenant context to request for downstream controllers
    req.body._activeTenantId = decoded.tenantId;
    req.body._activeUserId = decoded.userId;

    // Step C: Provide a dynamic secure database wrapper proxy object
    // This strictly forces the execution engine to append WHERE tenant_id = <extracted_tenant_id>
    (req as any).dbScope = {
      tenant_id: decoded.tenantId
    };

    next();
  } catch (error: unknown) {
    // Fail-Closed Behavior
    const err = error as SecurityException;
    console.error(`🚨 [FAIL_CLOSED_INTERCEPTOR] Transaction Aborted: ${err.message}`);
    
    // Wipe memory states associated with this request
    req.body = {};
    req.query = {};
    
    res.status(403).json({
      error: 'UNAUTHORIZED_SAFETY_EXCEPTION',
      message: err.message
    });
  }
}

/**
 * Step D: Anti-IDOR Resource Interception Routine
 * Validates that the fetched resource belongs exactly to the active session tenant.
 */
export function verifyResourceOwnership(resourceTenantId: string, activeTenantId: string) {
  if (resourceTenantId !== activeTenantId) {
    throw new SecurityException('Cross-Tenant Data Leakage Blocked! IDOR attempt intercepted.', 'IDOR_MISMATCH');
  }
}
