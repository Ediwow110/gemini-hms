import { Injectable, NotImplementedException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async getRevenue(tenantId: string) {
    const rows = await this.prisma.$queryRaw<
      Array<{ day: Date; total: Prisma.Decimal }>
    >`
      SELECT DATE_TRUNC('day', created_at) AS day, SUM(amount) AS total
      FROM payments
      WHERE tenant_id = ${tenantId}::uuid AND status = 'POSTED'
      GROUP BY day
      ORDER BY day
    `;

    return rows.map((row) => ({
      date: row.day.toISOString().substring(0, 10),
      total: Number(Number(row.total).toFixed(2)),
    }));
  }

  async getHrMetrics(tenantId: string) {
    const totalEmployees = await this.prisma.employee.count({
      where: { tenantId, status: 'ACTIVE' },
    });

    const activeLeaveRequests = await this.prisma.leaveRequest.count({
      where: { tenantId, status: 'PENDING' },
    });

    const expiredLicenses = await this.prisma.licenseRecord.count({
      where: { tenantId, status: 'EXPIRED' },
    });

    return {
      headcount: totalEmployees,
      pendingLeave: activeLeaveRequests,
      expiredLicenses,
      staffingGap: 0, // Honest: requires target headcount in schema
    };
  }

  async getItMetrics(tenantId: string) {
    const totalSessions = await this.prisma.session.count({
      where: { tenantId },
    });

    const activeIntegrations = await this.prisma.integration.count({
      where: { tenantId, status: 'ACTIVE' },
    });

    const backupFailures = await this.prisma.backupRecord.count({
      where: { tenantId, status: 'FAILED' },
    });

    return {
      activeSessions: totalSessions,
      healthyIntegrations: activeIntegrations,
      backupFailures,
      systemLatencyMs: 0, // Honest: requires telemetry logs in schema
    };
  }

  async getMarketplaceMetrics(tenantId: string) {
    const totalGMV = await this.prisma.marketplaceOrder.aggregate({
      where: { tenantId },
      _sum: { totalAmount: true },
    });

    const totalOrders = await this.prisma.marketplaceOrder.count({
      where: { tenantId },
    });

    const approvedListings = await this.prisma.marketplaceListing.count({
      where: { tenantId, status: 'APPROVED' },
    });

    return {
      gmv: Number(totalGMV._sum.totalAmount || 0),
      totalOrders,
      approvedListings,
      revenue: 0, // Honest: requires commission fee model in schema
    };
  }

  async getComplianceMetrics(tenantId: string) {
    const totalAuditEvents = await this.prisma.auditLog.count({
      where: { tenantId },
    });

    const breachAlerts = await this.prisma.auditLog.count({
      where: { tenantId, eventKey: 'SECURITY_BREACH' },
    });

    return {
      totalAuditEvents,
      securityAlerts: breachAlerts,
      complianceScore: 100 - (breachAlerts * 5), // Simple synthetic score
    };
  }

  async getTopDiagnoses(tenantId: string) {
    // Use groupBy to get diagnosis counts by icd10CodeId
    const grouped = await this.prisma.encounterDiagnosis.groupBy({
      by: ['icd10CodeId'],
      where: {
        encounter: { tenantId },
        deletedAt: null,
      },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 10,
    });

    // Fetch the top 10 codes' details
    const codeIds = grouped.map((g) => g.icd10CodeId);
    if (codeIds.length === 0) return [];

    const codes = await this.prisma.icd10Code.findMany({
      where: { id: { in: codeIds } },
      select: { id: true, code: true, description: true },
    });
    const codeMap = new Map(codes.map((c) => [c.id, c]));

    return grouped.map((g) => {
      const code = codeMap.get(g.icd10CodeId);
      return {
        code: code?.code ?? 'UNKNOWN',
        name: code?.description ?? 'Unknown',
        count: g._count.id,
      };
    });
  }

  async getBedOccupancy(tenantId: string) {
    // Honest stub: no real bed occupancy data is stored or computable from the current schema
    // (Branch model has no beds field; clinical bed allocation is in-memory only and disabled in prod).
    // Returning fabricated numbers would be deceptive on the live /api/v1/analytics/occupancy contract.
    throw new NotImplementedException(
      'Bed occupancy analytics is not yet implemented with real data. ' +
        'No branch bed counts or live occupancy tracking exist in the current schema. ' +
        'Do not rely on this endpoint until real data sources are wired.',
    );
  }

  async getWaitTime(tenantId: string) {
    const result = await this.prisma.$queryRaw<
      Array<{ avg_minutes: number | null }>
    >`
      SELECT AVG(EXTRACT(EPOCH FROM (updated_at - created_at)) / 60) AS avg_minutes
      FROM queue_entries
      WHERE tenant_id = ${tenantId}::uuid AND status IN ('COMPLETED', 'SERVING')
    `;

    const avgMinutes = result[0]?.avg_minutes;
    if (avgMinutes == null) {
      return { averageWaitTimeMinutes: 0 };
    }
    return { averageWaitTimeMinutes: Number(Number(avgMinutes).toFixed(2)) };
  }

  async getClaimRate(tenantId: string) {
    const grouped = await this.prisma.insuranceClaim.groupBy({
      by: ['status'],
      where: {
        tenantId,
        status: { in: ['ACCEPTED', 'PAID', 'REJECTED'] },
      },
      _count: { id: true },
    });

    const counts = {
      accepted: 0,
      paid: 0,
      rejected: 0,
    };

    for (const g of grouped) {
      if (g.status === 'ACCEPTED') counts.accepted = g._count.id;
      else if (g.status === 'PAID') counts.paid = g._count.id;
      else if (g.status === 'REJECTED') counts.rejected = g._count.id;
    }

    const totalAccepted = counts.accepted + counts.paid;
    const total = totalAccepted + counts.rejected;

    if (total === 0) {
      return {
        totalClaims: 0,
        approvedClaims: 0,
        rejectedClaims: 0,
        approvalRate: 0.0,
        rejectionRate: 0.0,
      };
    }

    return {
      totalClaims: total,
      approvedClaims: totalAccepted,
      rejectedClaims: counts.rejected,
      approvalRate: Number((totalAccepted / total).toFixed(4)),
      rejectionRate: Number((counts.rejected / total).toFixed(4)),
    };
  }
}
