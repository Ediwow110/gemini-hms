import { SecurityExceptionFilter } from '../../src/common/filters/security-exception.filter';
import { SecurityException } from '../../middleware/tenant-isolation';

export class IngressGuardSuite {
  /**
   * Simulates a horizontal IDOR array sweep
   */
  public static simulateHorizontalIdorSweep(activeTenantId: string, requestIp: string): number {
    let blockedCount = 0;
    
    // Attempting to sweep 50 sequential IDs
    for (let i = 1; i <= 50; i++) {
      try {
        // Native simulated IDOR interception throw
        throw new SecurityException('Cross-Tenant Data Leakage Blocked! IDOR detected.', 'IDOR_MISMATCH');
      } catch (err: unknown) {
        try {
          SecurityExceptionFilter.catchViolation(err, requestIp, activeTenantId);
        } catch (termErr: unknown) {
          if (termErr instanceof Error && termErr.message.includes('CONNECTION_TERMINATED')) {
            blockedCount++;
          }
        }
      }
    }
    
    return blockedCount;
  }

  /**
   * Simulates an RBAC spoofing routing attack
   */
  public static simulateRbacSpoofing(activeTenantId: string, requestIp: string, role: string): boolean {
    try {
      // Simulate app shell throwing an explicit UNAUTHORIZED_ROUTE_ACCESS for a 'nurse' hitting admin routes
      if (role === 'nurse') {
        throw new Error('UNAUTHORIZED_ROUTE_ACCESS: Role blocked from mounting view.');
      }
      return false; // Attack succeeded unexpectedly
    } catch (err: unknown) {
       try {
         SecurityExceptionFilter.catchViolation(err, requestIp, activeTenantId);
         return false; // Should not reach here
       } catch (termErr: unknown) {
         if (termErr instanceof Error && termErr.message.includes('CONNECTION_TERMINATED')) {
           return true; // Attack successfully blocked
         }
         return false;
       }
    }
  }
}
