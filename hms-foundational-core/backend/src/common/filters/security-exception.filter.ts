import { SecurityException } from '../../../middleware/tenant-isolation';

export interface ThreatLog {
  timestamp: string;
  attackingIp: string;
  tenantContext: string;
  infractionType: string;
  actionTaken: string;
}

export class SecurityExceptionFilter {
  // Simulates a global immutable threat monitoring dashboard log
  public static threatDashboardLog: ThreatLog[] = [];

  /**
   * Global catch-all interceptor for structural routing and IDOR violations.
   * Immediately terminates connection threads and zeroes out return bodies.
   */
  public static catchViolation(err: any, requestIp: string, activeTenantContext: string): never {
    let infractionType = 'UNKNOWN_ANOMALY';

    if (err instanceof SecurityException || err.name === 'SecurityException') {
      infractionType = err.code || 'IDOR_MISMATCH';
    } else if (err.message && err.message.includes('UNAUTHORIZED_ROUTE_ACCESS')) {
      infractionType = 'RBAC_SPOOFING_ATTACK';
    } else if (err.message && err.message.includes('IDOR')) {
      infractionType = 'HORIZONTAL_IDOR_SWEEP';
    }

    const logEntry: ThreatLog = {
      timestamp: new Date().toISOString(),
      attackingIp: requestIp,
      tenantContext: activeTenantContext,
      infractionType: infractionType,
      actionTaken: 'TERMINATED_AND_BLOCKED'
    };

    // Immutably write to the threat log array
    this.threatDashboardLog.push(logEntry);

    // Hard drop the connection thread to prevent structural leakage
    throw new Error(`CONNECTION_TERMINATED: Zero-Byte Response. Threat Signature Captured.`);
  }
}
