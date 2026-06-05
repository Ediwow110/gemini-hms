import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ANALYTICS_SAFETY_CAP } from '../common/utils/pagination';

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async getRevenue(tenantId: string) {
    const payments = await this.prisma.payment.findMany({
      where: { tenantId },
      select: {
        amount: true,
        createdAt: true,
      },
      take: ANALYTICS_SAFETY_CAP,
    });

    const revenueByDay: Record<string, number> = {};
    for (const p of payments) {
      const day = p.createdAt.toISOString().substring(0, 10);
      revenueByDay[day] = (revenueByDay[day] || 0) + Number(p.amount);
    }

    return Object.entries(revenueByDay).map(([date, total]) => ({
      date,
      total: Number(total.toFixed(2)),
    }));
  }

  async getTopDiagnoses(tenantId: string) {
    const diagnoses = await this.prisma.encounterDiagnosis.findMany({
      where: {
        encounter: {
          tenantId,
        },
        deletedAt: null,
      },
      include: {
        icd10Code: true,
      },
      take: ANALYTICS_SAFETY_CAP,
    });

    const counts: Record<
      string,
      { code: string; name: string; count: number }
    > = {};
    for (const d of diagnoses) {
      if (!d.icd10Code) continue;
      const code = d.icd10Code.code;
      if (!counts[code]) {
        counts[code] = { code, name: d.icd10Code.description, count: 0 };
      }
      counts[code].count++;
    }

    return Object.values(counts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }

  async getBedOccupancy(tenantId: string) {
    // Bed utilization is mock analytics based on tenant scope
    return {
      tenantId,
      totalBeds: 150,
      occupiedBeds: 68,
      utilizationRate: 0.4533,
    };
  }

  async getWaitTime(tenantId: string) {
    const completedEntries = await this.prisma.queueEntry.findMany({
      where: {
        tenantId,
        status: { in: ['COMPLETED', 'SERVING'] },
      },
      select: {
        createdAt: true,
        updatedAt: true,
      },
      take: ANALYTICS_SAFETY_CAP,
    });

    if (completedEntries.length === 0) {
      return { averageWaitTimeMinutes: 12.5 };
    }

    let totalDiffMs = 0;
    for (const entry of completedEntries) {
      totalDiffMs += entry.updatedAt.getTime() - entry.createdAt.getTime();
    }
    const averageMinutes = totalDiffMs / completedEntries.length / 60000;
    return { averageWaitTimeMinutes: Number(averageMinutes.toFixed(2)) };
  }

  async getClaimRate(tenantId: string) {
    const claims = await this.prisma.insuranceClaim.findMany({
      where: {
        tenantId,
        status: { in: ['ACCEPTED', 'PAID', 'REJECTED'] },
      },
      select: {
        status: true,
      },
      take: ANALYTICS_SAFETY_CAP,
    });

    if (claims.length === 0) {
      return {
        totalClaims: 0,
        approvedClaims: 0,
        rejectedClaims: 0,
        approvalRate: 0.0,
        rejectionRate: 0.0,
      };
    }

    let approved = 0;
    let rejected = 0;

    for (const c of claims) {
      if (c.status === 'ACCEPTED' || c.status === 'PAID') {
        approved++;
      } else if (c.status === 'REJECTED') {
        rejected++;
      }
    }

    return {
      totalClaims: claims.length,
      approvedClaims: approved,
      rejectedClaims: rejected,
      approvalRate: Number((approved / claims.length).toFixed(4)),
      rejectionRate: Number((rejected / claims.length).toFixed(4)),
    };
  }
}
