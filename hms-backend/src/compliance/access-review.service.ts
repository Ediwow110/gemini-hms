import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
  clampTake,
} from '../common/utils/pagination';

@Injectable()
export class AccessReviewService {
  constructor(private readonly prisma: PrismaService) {}

  async generateAccessReport(tenantId: string) {
    const users = await this.prisma.user.findMany({
      where: { tenantId },
      include: {
        userRoles: {
          where: { status: 'ACTIVE' },
          include: { role: true },
        },
      },
      take: MAX_PAGE_SIZE,
    });

    const report = [];

    for (const user of users) {
      const latestSession = await this.prisma.session.findFirst({
        where: { userId: user.id },
        orderBy: { lastRotatedAt: 'desc' },
      });

      const roles = user.userRoles.map((ur) => ur.role.name);

      report.push({
        userId: user.id,
        email: user.email,
        roles,
        lastLogin: latestSession
          ? latestSession.lastRotatedAt.toISOString()
          : null,
        mfaEnabled: user.mfaEnabled,
        status: user.status,
        createdAt: user.createdAt.toISOString(),
      });
    }

    return report;
  }

  async detectStaleAccounts(tenantId: string, daysThreshold = 90) {
    const report = await this.generateAccessReport(tenantId);
    const thresholdDate = new Date();
    thresholdDate.setDate(thresholdDate.getDate() - daysThreshold);

    return report.filter((user) => {
      if (!user.lastLogin) {
        // If they never logged in, check if their account was created before the threshold
        return new Date(user.createdAt) < thresholdDate;
      }
      return new Date(user.lastLogin) < thresholdDate;
    });
  }

  async detectPrivilegeEscalation(tenantId: string) {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Query audit logs representing privilege changes or role mutations
    const MAX_ESCALATION_LOGS = 1000;
    const escalationLogs = await this.prisma.auditLog.findMany({
      where: {
        tenantId,
        createdAt: { gte: thirtyDaysAgo },
        eventKey: {
          in: [
            'ROLE_PERMISSION_CHANGE_APPROVED',
            'PRIVILEGED_USER_CHANGE_APPROVED',
            'USER_ROLE_ASSIGNED',
          ],
        },
      },
      orderBy: { createdAt: 'desc' },
      take: MAX_ESCALATION_LOGS,
    });

    return escalationLogs.map((log) => ({
      logId: log.id,
      userId: log.userId,
      eventKey: log.eventKey,
      recordType: log.recordType,
      recordId: log.recordId,
      details: log.newValues,
      timestamp: log.createdAt.toISOString(),
    }));
  }

  async generateAccessReviewReport(tenantId: string) {
    const [accessReport, staleAccounts, privilegeEscalations] =
      await Promise.all([
        this.generateAccessReport(tenantId),
        this.detectStaleAccounts(tenantId, 90),
        this.detectPrivilegeEscalation(tenantId),
      ]);

    return {
      reviewTimestamp: new Date().toISOString(),
      soc2ControlReference: 'SOC2 CC6.1 - Access Rights Management',
      accessReport,
      staleAccountsCount: staleAccounts.length,
      staleAccounts,
      privilegeEscalationsCount: privilegeEscalations.length,
      privilegeEscalations,
      complianceStatus:
        staleAccounts.length > 0 ? 'NEEDS_ATTENTION' : 'COMPLIANT',
    };
  }
}
