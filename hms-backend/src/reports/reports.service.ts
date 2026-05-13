import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateReportExportDto } from './dto/create-export.dto';
import { Prisma } from '@prisma/client';
import * as fs from 'node:fs';
import * as path from 'node:path';

@Injectable()
export class ReportsService {
  private readonly storageDir = path.join(process.cwd(), 'storage', 'exports');

  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
  ) {
    if (!fs.existsSync(this.storageDir)) {
      fs.mkdirSync(this.storageDir, { recursive: true });
    }
  }

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
      // 1. Create the placeholder record
      const reportExport = await tx.reportExport.create({
        data: {
          tenantId,
          branchId,
          reportType: dto.reportType,
          filters: dto.filters || {},
          reason: dto.reason,
          rowCount: 0,
          status: 'CREATED',
          requestedBy: userId,
        },
      });

      // 2. Fetch data based on report type
      let csvContent = '';
      let rowCount = 0;
      const appliedFilters = { ...dto.filters };

      // Scope validation for filters
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

        const data = await tx.paymentReversal.findMany({
          where,
          include: {
            payment: true,
            invoice: { include: { order: { include: { patient: true } } } },
          },
          orderBy: { createdAt: 'desc' },
        });

        rowCount = data.length;
        csvContent = 'ID,Type,Amount,Reason,Patient,Date,Status\n';
        csvContent += data
          .map(
            (r) =>
              `${r.id},${r.type},${String(r.amount)},"${r.reason}",${r.invoice.order.patient.firstName} ${r.invoice.order.patient.lastName},${r.createdAt.toISOString()},${r.status}`,
          )
          .join('\n');
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

        const data = await tx.auditLog.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          take: 1000, // Safety limit
        });

        rowCount = data.length;
        csvContent = 'ID,Event,Record Type,Record ID,User,Date\n';
        csvContent += data
          .map(
            (l) =>
              `${l.id},${l.eventKey},${l.recordType},${l.recordId},${l.userId},${l.createdAt.toISOString()}`,
          )
          .join('\n');
      } else {
        throw new BadRequestException('Unsupported report type');
      }

      // 3. Save to file
      const fileName = `export-${reportExport.id}.csv`;
      const filePath = path.join(this.storageDir, fileName);
      fs.writeFileSync(filePath, csvContent);

      // 4. Create File record
      const fileRecord = await tx.file.create({
        data: {
          tenantId,
          recordType: 'ReportExport',
          recordId: reportExport.id,
          fileName,
          fileSize: Buffer.byteLength(csvContent),
          mimeType: 'text/csv',
          storagePath: filePath,
          uploadedById: userId,
        },
      });

      // 5. Update ReportExport
      const updatedExport = await tx.reportExport.update({
        where: { id: reportExport.id },
        data: {
          status: 'COMPLETED',
          rowCount,
          fileId: fileRecord.id,
          completedAt: new Date(),
        },
      });

      // 6. Log Audit
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
            fileId: fileRecord.id,
          },
        },
        tx,
        branchId,
      );

      return updatedExport;
    });
  }

  async findAll(tenantId: string, branchId?: string) {
    return this.prisma.reportExport.findMany({
      where: {
        tenantId,
        branchId: branchId || null,
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async getExportFile(tenantId: string, id: string) {
    const reportExport = await this.prisma.reportExport.findFirst({
      where: { id, tenantId },
    });

    if (!reportExport || !reportExport.fileId) {
      throw new NotFoundException('Export not found or not completed');
    }

    const fileRecord = await this.prisma.file.findFirst({
      where: { id: reportExport.fileId, tenantId },
    });

    if (!fileRecord || !fs.existsSync(fileRecord.storagePath)) {
      throw new NotFoundException('Physical file not found');
    }

    return {
      path: fileRecord.storagePath,
      fileName: fileRecord.fileName,
      mimeType: fileRecord.mimeType,
    };
  }
}
