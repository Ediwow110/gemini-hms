import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateReportExportDto } from './dto/create-export.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class ReportsService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
  ) {}

  async createExport(
    tenantId: string,
    branchId: string | undefined,
    userId: string,
    dto: CreateReportExportDto,
  ) {
    if (dto.reason.trim().length === 0) {
      throw new BadRequestException('Reason is required for export');
    }

    return this.prisma.$transaction(async (tx) => {
      let rowCount = 0;

      // Scope validation for filters
      const appliedFilters = { ...dto.filters };
      if (
        appliedFilters.branchId &&
        branchId &&
        appliedFilters.branchId !== branchId
      ) {
        throw new BadRequestException('Cannot export data from another branch');
      }

      const branchScope = branchId ? { branchId } : {};

      if (dto.reportType === 'CASHIER_REVERSAL_RECONCILIATION') {
        const where: Prisma.PaymentReversalWhereInput = {
          tenantId,
          ...branchScope,
        };
        if (appliedFilters.startDate) {
          where.createdAt = {
            gte: new Date(appliedFilters.startDate as string),
          };
        }
        rowCount = await tx.paymentReversal.count({ where });
      } else if (dto.reportType === 'AUDIT_EVENTS_SUMMARY') {
        const where: Prisma.AuditLogWhereInput = {
          tenantId,
          ...branchScope,
        };
        if (appliedFilters.startDate) {
          where.createdAt = {
            gte: new Date(appliedFilters.startDate as string),
          };
        }
        rowCount = await tx.auditLog.count({ where });
      } else {
        throw new BadRequestException('Unsupported report type');
      }

      const reportExport = await tx.reportExport.create({
        data: {
          tenantId,
          branchId,
          reportType: dto.reportType,
          filters: appliedFilters,
          reason: dto.reason,
          rowCount,
          status: 'CREATED',
          requestedBy: userId,
        },
      });

      await this.audit.log(
        {
          tenantId,
          userId,
          eventKey: 'REPORT_EXPORTED',
          recordType: 'ReportExport',
          recordId: reportExport.id,
          newValues: {
            reportExportId: reportExport.id,
            reportType: dto.reportType,
            rowCount,
            reason: dto.reason,
          },
        },
        tx,
        branchId,
      );

      return reportExport;
    });
  }
}
