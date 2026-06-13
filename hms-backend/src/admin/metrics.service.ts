import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MetricsService {
  private requestCount = 0;
  private errorCount = 0;
  private loginCount = 0;
  private mfaFailureCount = 0;
  private endpointHits: Record<string, number> = {};

  constructor(private readonly prisma: PrismaService) {}

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

  async getMetrics() {
    let dbStatus = 'HEALTHY';
    try {
      await this.prisma.$queryRaw`SELECT 1`;
    } catch {
      dbStatus = 'UNHEALTHY';
    }

    let triggeredSlaAlertsCount = 0;
    try {
      triggeredSlaAlertsCount = await this.prisma.slaAlert.count({
        where: { status: 'TRIGGERED' },
      });
    } catch {
      // Fallback if table not initialized in migrations/unit tests
    }

    return {
      totalRequests: this.requestCount,
      totalErrors: this.errorCount,
      totalLogins: this.loginCount,
      mfaFailures: this.mfaFailureCount,
      endpointHits: this.endpointHits,
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
      cpuUsage: process.cpuUsage(),
      databaseStatus: dbStatus,
      activeUserSessions: await this.prisma.session
        .count({
          where: { expiresAt: { gt: new Date() } },
        })
        .catch(() => -1),
      triggeredSlaAlerts: triggeredSlaAlertsCount,
    };
  }

  async getPrometheusFormat() {
    const metrics = await this.getMetrics();
    let output = '';

    output += `# HELP hms_requests_total Total number of requests\n`;
    output += `# TYPE hms_requests_total counter\n`;
    output += `hms_requests_total ${metrics.totalRequests}\n\n`;

    output += `# HELP hms_errors_total Total number of errors\n`;
    output += `# TYPE hms_errors_total counter\n`;
    output += `hms_errors_total ${metrics.totalErrors}\n\n`;

    output += `# HELP hms_logins_total Total successful logins\n`;
    output += `# TYPE hms_logins_total counter\n`;
    output += `hms_logins_total ${metrics.totalLogins}\n\n`;

    output += `# HELP hms_mfa_failures_total Total MFA verification failures\n`;
    output += `# TYPE hms_mfa_failures_total counter\n`;
    output += `hms_mfa_failures_total ${metrics.mfaFailures}\n\n`;

    output += `# HELP hms_database_healthy Database connection status (1 = healthy, 0 = unhealthy)\n`;
    output += `# TYPE hms_database_healthy gauge\n`;
    output += `hms_database_healthy ${metrics.databaseStatus === 'HEALTHY' ? 1 : 0}\n\n`;

    output += `# HELP hms_sla_triggered_alerts_total Total triggered SLA alerts\n`;
    output += `# TYPE hms_sla_triggered_alerts_total gauge\n`;
    output += `hms_sla_triggered_alerts_total ${metrics.triggeredSlaAlerts}\n\n`;

    output += `# HELP hms_memory_rss_bytes Resident set size memory usage in bytes\n`;
    output += `# TYPE hms_memory_rss_bytes gauge\n`;
    output += `hms_memory_rss_bytes ${metrics.memoryUsage.rss}\n\n`;

    return output;
  }
}
