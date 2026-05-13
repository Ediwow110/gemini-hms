import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateReportExportDto } from './dto/create-export.dto';
import { Prisma } from '@prisma/client';
import { ReportPolicyService } from './report-policy.service';

@Injectable()
export class ReportsService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
    private reportPolicy: ReportPolicyService,
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

    const policyResult = this.reportPolicy.getPolicyForExport(
      dto.reportType,
      dto.requestedFields,
    );

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
      }

      const reportExport = await tx.reportExport.create({
        data: {
          tenantId,
          branchId,
          reportType: dto.reportType,
          filters: appliedFilters,
          reason: dto.reason,
          rowCount,
          status: 'REQUESTED',
          requestedBy: userId,
          riskLevel: policyResult.riskLevel,
          filtersSnapshot: appliedFilters,
          fieldPolicySnapshot: policyResult.fieldPolicySnapshot as any,
          requestedFields: dto.requestedFields as any,
          allowedFields: policyResult.allowedFields,
          maskedFields: policyResult.maskedFields,
          format: 'CSV', // Deferred file generation
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
            riskLevel: policyResult.riskLevel,
            requestedFields: dto.requestedFields,
            allowedFields: policyResult.allowedFields,
            fileGenerationAvailable: false,
            storageKey: null,
          },
        },
        tx,
        branchId,
      );

      return {
        id: reportExport.id,
        status: reportExport.status,
        reportType: reportExport.reportType,
        riskLevel: reportExport.riskLevel,
        rowCount: reportExport.rowCount,
        createdAt: reportExport.createdAt,
        approvalRequired: policyResult.riskLevel === 'HIGH' || policyResult.riskLevel === 'PRIVILEGED',
        fileGenerationAvailable: false,
      };
    });
  }
}
