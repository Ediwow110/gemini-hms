import { Injectable } from '@nestjs/common';

@Injectable()
export class MetricsService {
  private requestCount = 0;
  private errorCount = 0;
  private loginCount = 0;
  private mfaFailureCount = 0;
  private endpointHits: Record<string, number> = {};

  incrementRequestCount(method: string, path: string) {
    this.requestCount++;
    const key = `${method} ${path}`;
    this.endpointHits[key] = (this.endpointHits[key] || 0) + 1;
  }

  incrementErrorCount() {
    this.errorCount++;
  }

  incrementLoginCount() {
    this.loginCount++;
  }

  incrementMfaFailure() {
    this.mfaFailureCount++;
  }

  getMetrics() {
    return {
      totalRequests: this.requestCount,
      totalErrors: this.errorCount,
      totalLogins: this.loginCount,
      mfaFailures: this.mfaFailureCount,
      endpointHits: this.endpointHits,
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
    };
  }

  getPrometheusFormat() {
    let output = '';
    output += `# HELP hms_requests_total Total number of requests\n`;
    output += `# TYPE hms_requests_total counter\n`;
    output += `hms_requests_total ${this.requestCount}\n\n`;

    output += `# HELP hms_errors_total Total number of errors\n`;
    output += `# TYPE hms_errors_total counter\n`;
    output += `hms_errors_total ${this.errorCount}\n\n`;

    output += `# HELP hms_logins_total Total successful logins\n`;
    output += `# TYPE hms_logins_total counter\n`;
    output += `hms_logins_total ${this.loginCount}\n\n`;

    output += `# HELP hms_mfa_failures_total Total MFA verification failures\n`;
    output += `# TYPE hms_mfa_failures_total counter\n`;
    output += `hms_mfa_failures_total ${this.mfaFailureCount}\n\n`;

    return output;
  }
}
