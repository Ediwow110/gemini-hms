import {
  Injectable,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import {
  ExportReportDto,
  ReportType,
  SalesSummaryQueryDto,
} from './dto/reports.dto';

@Injectable()
export class ReportsService {
  private readonly EXPORT_THRESHOLD = 1000;

  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
  ) {}

  async getSalesSummary(
    tenantId: string,
    branchId: string,
    query: SalesSummaryQueryDto,
  ) {
    const { startDate, endDate } = query;
    const where: any = {
      tenantId,
      cashierSession: {
        branchId,
      },
      status: 'POSTED',
    };

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const payments = await this.prisma.payment.findMany({
      where,
      select: {
        amount: true,
        paymentMethod: true,
        createdAt: true,
      },
    });

    const totalSales = payments.reduce(
      (acc, curr) => acc + Number(curr.amount),
      0,
    );
    const byMethod = payments.reduce(
      (acc, curr) => {
        acc[curr.paymentMethod] =
          (acc[curr.paymentMethod] || 0) + Number(curr.amount);
        return acc;
      },
      {} as Record<string, number>,
    );

    return {
      totalSales,
      byMethod,
      count: payments.length,
    };
  }

  async exportReport(
    tenantId: string,
    branchId: string,
    userId: string,
    dto: ExportReportDto,
    hasUnmaskedAccess: boolean,
  ) {
    const { reportType, format, filters, reason } = dto;

    // 1. Execute Query (scoped by tenant) and Count Rows
    let rowCount = 0;
    let data: any[] = [];

    switch (reportType) {
      case ReportType.SALES:
        data = await this.prisma.payment.findMany({
          where: { ...filters, tenantId, cashierSession: { branchId } },
        });
        rowCount = data.length;
        break;
      case ReportType.INVENTORY:
        data = await this.prisma.inventoryItem.findMany({
          where: { ...filters, tenantId, branchId },
        });
        rowCount = data.length;
        break;
      case ReportType.PATIENT_LIST:
        data = await this.prisma.patient.findMany({
          where: { ...filters, tenantId },
        });
        rowCount = data.length;
        break;
      default:
        throw new BadRequestException('Invalid report type');
    }

    // 2. Export Governance: Threshold Check
    if (rowCount > this.EXPORT_THRESHOLD && !reason) {
      throw new BadRequestException(
        `Reason is required for large exports (over ${this.EXPORT_THRESHOLD} rows)`,
      );
    }

    // 3. Data Masking
    const maskedData = this.maskSensitiveData(data, hasUnmaskedAccess);

    // 4. Create ReportExportLog and Audit (Transactional)
    return this.prisma.$transaction(async (tx) => {
      const log = await tx.reportExportLog.create({
        data: {
          tenantId,
          branchId,
          userId,
          reportType,
          format,
          rowCount,
          filtersApplied: filters || {},
          reason,
        },
      });

      await this.audit.log(
        {
          tenantId,
          userId,
          eventKey: 'REPORT_EXPORTED',
          recordType: 'ReportExportLog',
          recordId: log.id,
          newValues: {
            reportType,
            format,
            rowCount,
            reason,
          },
        },
        tx,
        branchId,
      );

      return {
        logId: log.id,
        rowCount,
        data: maskedData, // In a real scenario, this might return a download URL
      };
    });
  }

  private maskSensitiveData(data: any[], hasUnmaskedAccess: boolean) {
    if (hasUnmaskedAccess) return data;

    return data.map((item) => {
      const masked = { ...item };
      // Example of sensitive data masking
      if ('ssn' in masked) masked.ssn = '***-**-****';
      if ('patientNumber' in masked) {
        // Maybe patient number is semi-sensitive
        masked.patientNumber = masked.patientNumber.substring(0, 3) + '****';
      }
      // Mask clinical notes if they exist in some report data
      if ('notes' in masked) masked.notes = '[MASKED]';
      return masked;
    });
  }
}
