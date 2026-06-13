import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { DashboardQueryDto } from '../dto/dashboard-query.dto';

@Injectable()
export class DashboardService {
  private readonly logger = new Logger(DashboardService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getAdminSummary(
    query: DashboardQueryDto,
    userId: string,
    tenantId: string,
  ) {
    const { branchId, dateFrom, dateTo } = query;
    const start = dateFrom ? new Date(dateFrom) : new Date();
    start.setHours(0, 0, 0, 0);
    const end = dateTo ? new Date(dateTo) : new Date();
    end.setHours(23, 59, 59, 999);

    const [
      activePatients,
      todaysAppts,
      pendingLabs,
      lowStock,
      revenue,
      alerts,
    ] = await Promise.all([
      // Active Patients: encounter in last 30 days
      this.prisma.patient.count({
        where: {
          tenantId,
          encounters: {
            some: {
              encounteredAt: {
                gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
              },
            },
          },
        },
      }),
      // Today's Appointments (approximate as encounters today)
      this.prisma.encounter.count({
        where: {
          tenantId,
          branchId,
          encounteredAt: { gte: start, lte: end },
        },
      }),
      // Pending Labs
      this.prisma.labResult.count({
        where: {
          tenantId,
          status: 'PENDING',
        },
      }),
      // Low Stock (BranchStock quantity < reorderLevel)
      this.prisma.branchStock
        .findMany({
          where: { tenantId, branchId },
          select: { quantity: true, reorderLevel: true },
        })
        .then(
          (stocks) => stocks.filter((s) => s.quantity < s.reorderLevel).length,
        ),
      // Revenue Today
      this.prisma.payment.aggregate({
        _sum: { amount: true },
        where: {
          tenantId,
          createdAt: { gte: start, lte: end },
        },
      }),
      // Security Alerts (Audit logs with high risk - simplified)
      this.prisma.auditLog.count({
        where: {
          tenantId,
          // We'll simulate risk by checking specific event keys
          eventKey: { in: ['UNAUTHORIZED_ACCESS', 'SENSITIVE_DATA_EXPORT'] },
        },
      }),
    ]);
    return {
      activePatients,
      todaysAppointments: todaysAppts,
      pendingLabs,
      lowStock,
      revenue: revenue._sum.amount || 0,
      securityAlerts: alerts,
    };
  }

  async getAdminTrends(_query: DashboardQueryDto, tenantId: string) {
    // Daily encounter count using DB-native date truncation
    const rows = await this.prisma.$queryRaw<
      Array<{ day: Date; count: bigint }>
    >`
      SELECT DATE_TRUNC('day', encountered_at) AS day, COUNT(*) AS count
      FROM encounters
      WHERE tenant_id = ${tenantId}::uuid
      GROUP BY day
      ORDER BY day DESC
      LIMIT 90
    `;

    return rows.map((row) => ({
      label: row.day.toISOString().split('T')[0],
      value: Number(row.count),
    }));
  }

  async getAdminAlerts(tenantId: string) {
    // 1. Low stock
    const lowStock = await this.prisma.branchStock.findMany({
      where: { tenantId },
      take: 5,
      include: { inventoryItem: true },
    });

    // 2. Critical Labs
    const criticalLabs = await this.prisma.labResult.findMany({
      where: { tenantId, isCritical: true },
      take: 5,
      include: { order: { include: { patient: true } } },
    });

    return {
      lowStock: lowStock.map((s: any) => ({
        title: 'Low Stock',
        message: `${s.inventoryItem.name} is low in ${s.branchId}`,
        severity: 'critical',
      })),
      criticalLabs: criticalLabs.map((l: any) => ({
        title: 'Critical Lab',
        message: `Patient ${l.order.patient.lastName} has critical result`,
        severity: 'critical',
      })),
    };
  }

  async getAdminTopLists(tenantId: string) {
    // Busiest Departments
    const depts = await this.prisma.encounter.groupBy({
      by: ['branchId'], // Simplified as we don't have deptId on Encounter in schema
      where: { tenantId },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 5,
    });

    // Unpaid Bills
    const bills = await this.prisma.invoice.findMany({
      where: { tenantId, status: 'UNPAID' },
      orderBy: { totalAmount: 'desc' },
      take: 5,
    });

    return {
      busiestDepts: depts.map((d: any) => ({
        label: d.branchId,
        value: d._count.id,
      })),
      unpaidBills: bills.map((b: any) => ({
        label: b.invoiceNumber || 'Unknown',
        value: b.totalAmount.toString(),
      })),
    };
  }
}
